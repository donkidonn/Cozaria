// supabase/functions/buy-item/index.ts
// Edge Function: processes a shop purchase server-side.
//
// Expects POST with JSON body:
//   { item_id: string }
//
// The client sends ONLY the item_id — never a price or coin amount.
// Price is re-read from the DB. User identity comes from the JWT.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

function jsonResponse(body: Record<string, unknown>, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS_HEADERS });
  }

  try {
    // ─── Auth: get user from JWT ────────────────────────────
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return jsonResponse({ error: "Missing authorization header" }, 401);
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
      return jsonResponse({ error: "Invalid or expired token" }, 401);
    }

    const userId = user.id;
    console.log("buy-item: user from JWT", { userId });

    // ─── Parse body ─────────────────────────────────────────
    const { item_id } = (await req.json()) as { item_id: string };
    console.log("buy-item: parsed body", { item_id });

    if (!item_id || typeof item_id !== "string") {
      return jsonResponse({ error: "item_id is required" }, 400);
    }

    // ─── Service-role client for privileged reads/writes ────
    const admin = createClient(supabaseUrl, supabaseServiceKey);

    // ─── Re-read item price from DB (never trust client) ────
    const { data: item, error: itemError } = await admin
      .from("items")
      .select("id, name, price")
      .eq("id", item_id)
      .single();

    if (itemError || !item) {
      console.error("buy-item: item lookup failed", {
        message: itemError?.message,
        details: itemError?.details,
        hint: itemError?.hint,
        code: itemError?.code,
      });
      return jsonResponse({ error: "Item not found" }, 404);
    }

    console.log("buy-item: item found", { name: item.name, price: item.price });

    // ─── Check if already owned ─────────────────────────────
    const { data: existing, error: ownedCheckError } = await admin
      .from("owned_items")
      .select("id")
      .eq("user_id", userId)
      .eq("item_id", item_id)
      .maybeSingle();

    if (ownedCheckError) {
      console.error("buy-item: ownership check failed", {
        message: ownedCheckError.message,
        details: ownedCheckError.details,
        hint: ownedCheckError.hint,
        code: ownedCheckError.code,
      });
      return jsonResponse({ error: "Failed to check ownership" }, 500);
    }

    if (existing) {
      console.log("buy-item: already owned", { item_id });
      return jsonResponse({ error: "You already own this item" }, 409);
    }

    console.log("buy-item: not yet owned, checking balance");

    // ─── Check wallet balance ───────────────────────────────
    const { data: wallet, error: walletError } = await admin
      .from("wallets")
      .select("balance")
      .eq("user_id", userId)
      .single();

    if (walletError || !wallet) {
      console.error("buy-item: wallet read failed", {
        message: walletError?.message,
        details: walletError?.details,
        hint: walletError?.hint,
        code: walletError?.code,
      });
      return jsonResponse({ error: "Failed to read wallet" }, 500);
    }

    if (wallet.balance < item.price) {
      console.log("buy-item: insufficient balance", {
        balance: wallet.balance,
        price: item.price,
      });
      return jsonResponse(
        { error: `Not enough coins. Need ${item.price}, have ${wallet.balance}.` },
        400,
      );
    }

    console.log("buy-item: balance ok, purchasing", {
      balance: wallet.balance,
      price: item.price,
    });

    // ─── Deduct balance ─────────────────────────────────────
    const newBalance = wallet.balance - item.price;

    const { error: deductError } = await admin
      .from("wallets")
      .update({ balance: newBalance, updated_at: new Date().toISOString() })
      .eq("user_id", userId);

    if (deductError) {
      console.error("buy-item: wallet deduct failed", {
        message: deductError.message,
        details: deductError.details,
        hint: deductError.hint,
        code: deductError.code,
      });
      return jsonResponse({ error: "Failed to deduct coins" }, 500);
    }

    // ─── Insert owned_items row ─────────────────────────────
    const { error: insertError } = await admin
      .from("owned_items")
      .insert({ user_id: userId, item_id });

    if (insertError) {
      // Attempt to refund — best effort
      console.error("buy-item: insert owned_items failed, attempting refund", {
        message: insertError.message,
        details: insertError.details,
        hint: insertError.hint,
        code: insertError.code,
      });
      await admin
        .from("wallets")
        .update({ balance: wallet.balance, updated_at: new Date().toISOString() })
        .eq("user_id", userId);

      return jsonResponse({ error: "Failed to record purchase" }, 500);
    }

    console.log("buy-item: purchase complete", {
      item: item.name,
      price: item.price,
      newBalance,
    });

    return jsonResponse({ new_balance: newBalance, item_name: item.name }, 200);
  } catch (error) {
    const err = error as Record<string, unknown>;
    console.error("buy-item error:", {
      message: err?.message ?? String(error),
      details: err?.details,
      hint: err?.hint,
      code: err?.code,
      stack: err?.stack,
    });
    return jsonResponse(
      { error: (err?.message as string) ?? String(error) },
      500,
    );
  }
});
