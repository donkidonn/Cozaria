import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './features/auth/AuthContext'
import { ProtectedRoute } from './features/auth/ProtectedRoute'
import { LoginPage } from './features/auth/LoginPage'
import { AppLayout } from './components/ui/AppLayout'
import { PaddedPage } from './components/ui/PaddedPage'
import { WalletProvider } from './lib/WalletContext'
import { DashboardPage } from './features/dashboard/DashboardPage'
import { ReviewersPage } from './features/reviewers/ReviewersPage'
import { ReviewerDetailPage } from './features/reviewers/ReviewerDetailPage'
import { StudyPage } from './features/reviewers/StudyPage'
import { ShopPage } from './features/shop/ShopPage'
import { WorldPage } from './features/world/WorldPage'
import { FocusPage } from './features/focus/FocusPage'
import { SettingsPage } from './features/settings/SettingsPage'

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <WalletProvider>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route
              element={
                <ProtectedRoute>
                  <AppLayout />
                </ProtectedRoute>
              }
            >
              {/* World runs edge-to-edge inside the shell. */}
              <Route path="world" element={<WorldPage />} />

              {/* Everything else gets the standard page padding. */}
              <Route element={<PaddedPage />}>
                <Route index element={<DashboardPage />} />
                <Route path="reviewers" element={<ReviewersPage />} />
                <Route path="reviewers/:id" element={<ReviewerDetailPage />} />
                <Route path="reviewers/:id/study" element={<StudyPage />} />
                <Route path="shop" element={<ShopPage />} />
                <Route path="focus" element={<FocusPage />} />
                <Route path="settings" element={<SettingsPage />} />
              </Route>
            </Route>
          </Routes>
        </WalletProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
