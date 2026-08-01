import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import { useAuth } from '../features/auth/AuthContext'
import { fetchBalance } from './wallet'

interface WalletState {
  balance: number | null
  loading: boolean
  refresh: () => Promise<void>
  setBalance: (b: number) => void
}

const WalletContext = createContext<WalletState | undefined>(undefined)

export function WalletProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [balance, setBalance] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    if (!user) return
    try {
      setBalance(await fetchBalance())
    } catch {
      // silently fail — balance will show as "--"
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    if (user) {
      refresh()
    } else {
      setBalance(null)
      setLoading(false)
    }
  }, [user, refresh])

  return (
    <WalletContext.Provider value={{ balance, loading, refresh, setBalance }}>
      {children}
    </WalletContext.Provider>
  )
}

export function useWallet() {
  const ctx = useContext(WalletContext)
  if (!ctx) throw new Error('useWallet must be used within WalletProvider')
  return ctx
}
