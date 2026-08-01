import { supabase } from './supabase'

export async function fetchBalance(): Promise<number> {
  const { data, error } = await supabase
    .from('wallets')
    .select('balance')
    .single()

  if (error) throw error
  return data.balance as number
}

export interface AwardCoinsResult {
  coins_earned: number
  new_balance: number
}

export async function awardCoins(
  results: { card_id: string; was_correct: boolean }[],
): Promise<AwardCoinsResult> {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) throw new Error('Not authenticated')

  const response = await supabase.functions.invoke('award-coins', {
    body: { results },
  })

  if (response.error) {
    throw new Error(response.error.message ?? 'Failed to award coins')
  }

  return response.data as AwardCoinsResult
}
