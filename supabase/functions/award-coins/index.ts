// supabase/functions/award-coins/index.ts
// Edge Function: processes a study session and awards coins server-side.
//
// Expects POST with JSON body:
//   { results: [{ card_id: string, was_correct: boolean }, ...] }
//
// Coin formula (computed here, never trusted from client):
//   correct = +2, wrong = +1
//   Only the FIRST review of each card per day earns coins (dedup).

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface CardResult {
  card_id: string;
  was_correct: boolean;
}

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS_HEADERS });
  }

  try {
    // ─── Auth: get user from JWT ────────────────────────────
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        { status: 401, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } },
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const {
      data: { user },
      error: userError,
    } = await userClient.auth.getUser();

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Invalid or expired token" }),
        { status: 401, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } },
      );
    }

    // User identity comes ONLY from the verified JWT — never from the request body
    const userId = user.id;
    console.log("award-coins: user from JWT", { userId });

    // ─── Parse body ─────────────────────────────────────────
    const { results } = (await req.json()) as { results: CardResult[] };
    console.log("award-coins: parsed body", { cardCount: results?.length, results });

    if (!Array.isArray(results) || results.length === 0) {
      return new Response(
        JSON.stringify({ error: "results must be a non-empty array" }),
        { status: 400, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } },
      );
    }

    // ─── Service-role client for privileged writes ──────────
    const admin = createClient(supabaseUrl, supabaseServiceKey);

    // Today's date boundaries (UTC)
    const todayStart = new Date();
    todayStart.setUTCHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setUTCHours(23, 59, 59, 999);

    // Fetch all of this user's reviews from today in one query for dedup
    const cardIds = results.map((r) => r.card_id);
    const { data: existingReviews, error: existingError } = await admin
      .from("card_reviews")
      .select("card_id")
      .eq("user_id", userId)
      .in("card_id", cardIds)
      .gte("reviewed_at", todayStart.toISOString())
      .lte("reviewed_at", todayEnd.toISOString());

    if (existingError) {
      console.error("award-coins: dedup check failed", {
        message: existingError.message,
        details: existingError.details,
        hint: existingError.hint,
        code: existingError.code,
      });
      return new Response(
        JSON.stringify({ error: "Failed to check existing reviews: " + existingError.message }),
        { status: 500, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } },
      );
    }

    const alreadyReviewedToday = new Set(
      (existingReviews ?? []).map((r) => r.card_id),
    );

    // ─── Verify card ownership & compute coins ──────────────
    const { data: cardsData, error: cardsError } = await admin
      .from("cards")
      .select("id, reviewer_id, reviewers!inner(user_id)")
      .in("id", cardIds);

    if (cardsError) {
      console.error("award-coins: card ownership query failed", {
        message: cardsError.message,
        details: cardsError.details,
        hint: cardsError.hint,
        code: cardsError.code,
      });
      return new Response(
        JSON.stringify({ error: "Failed to verify cards: " + cardsError.message }),
        { status: 500, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } },
      );
    }

    // Build a set of valid card IDs that this user owns
    const ownedCardIds = new Set(
      (cardsData ?? [])
        .filter((c) => {
          const reviewer = c.reviewers as unknown as { user_id: string };
          return reviewer.user_id === userId;
        })
        .map((c) => c.id),
    );

    console.log("award-coins: ownership ok", {
      submitted: cardIds.length,
      owned: ownedCardIds.size,
      alreadyToday: alreadyReviewedToday.size,
    });

    // Build review rows and compute total coins
    let totalCoins = 0;
    const reviewRows: {
      user_id: string;
      card_id: string;
      was_correct: boolean;
      coins_awarded: number;
    }[] = [];

    for (const { card_id, was_correct } of results) {
      if (!ownedCardIds.has(card_id)) continue;

      const isDuplicate = alreadyReviewedToday.has(card_id);
      const coins = isDuplicate ? 0 : was_correct ? 2 : 1;
      totalCoins += coins;

      alreadyReviewedToday.add(card_id);

      reviewRows.push({
        user_id: userId,
        card_id,
        was_correct,
        coins_awarded: coins,
      });
    }

    if (reviewRows.length === 0) {
      return new Response(
        JSON.stringify({ error: "No valid cards to review" }),
        { status: 400, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } },
      );
    }

    // ─── Write reviews ──────────────────────────────────────
    const { error: insertError } = await admin
      .from("card_reviews")
      .insert(reviewRows);

    if (insertError) {
      console.error("award-coins: insert card_reviews failed", {
        message: insertError.message,
        details: insertError.details,
        hint: insertError.hint,
        code: insertError.code,
      });
      return new Response(
        JSON.stringify({ error: "Failed to save reviews: " + insertError.message }),
        { status: 500, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } },
      );
    }

    console.log("award-coins: reviews inserted", { count: reviewRows.length });

    // ─── Update wallet balance ──────────────────────────────
    if (totalCoins > 0) {
      const { error: walletFetchError, data: wallet } = await admin
        .from("wallets")
        .select("balance")
        .eq("user_id", userId)
        .single();

      if (walletFetchError || !wallet) {
        console.error("award-coins: wallet read failed", {
          message: walletFetchError?.message,
          details: walletFetchError?.details,
          hint: walletFetchError?.hint,
          code: walletFetchError?.code,
        });
        return new Response(
          JSON.stringify({ error: "Failed to read wallet: " + (walletFetchError?.message ?? "not found") }),
          { status: 500, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } },
        );
      }

      const newBalance = wallet.balance + totalCoins;

      const { error: walletUpdateError } = await admin
        .from("wallets")
        .update({ balance: newBalance, updated_at: new Date().toISOString() })
        .eq("user_id", userId);

      if (walletUpdateError) {
        console.error("award-coins: wallet update failed", {
          message: walletUpdateError.message,
          details: walletUpdateError.details,
          hint: walletUpdateError.hint,
          code: walletUpdateError.code,
        });
        return new Response(
          JSON.stringify({ error: "Failed to update wallet: " + walletUpdateError.message }),
          { status: 500, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } },
        );
      }

      console.log("award-coins: wallet updated", { totalCoins, newBalance });

      return new Response(
        JSON.stringify({ coins_earned: totalCoins, new_balance: newBalance }),
        { status: 200, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } },
      );
    }

    // No coins earned (all duplicates)
    const { data: currentWallet } = await admin
      .from("wallets")
      .select("balance")
      .eq("user_id", userId)
      .single();

    console.log("award-coins: wallet updated", { totalCoins: 0, balance: currentWallet?.balance ?? 0 });

    return new Response(
      JSON.stringify({
        coins_earned: 0,
        new_balance: currentWallet?.balance ?? 0,
      }),
      { status: 200, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } },
    );
  } catch (error) {
    const err = error as Record<string, unknown>;
    console.error("award-coins error:", {
      message: err?.message ?? String(error),
      details: err?.details,
      hint: err?.hint,
      code: err?.code,
      stack: err?.stack,
    });
    return new Response(
      JSON.stringify({ error: (err?.message as string) ?? String(error) }),
      { status: 500, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } },
    );
  }
});
