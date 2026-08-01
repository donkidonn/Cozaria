import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './features/auth/AuthContext'
import { ProtectedRoute } from './features/auth/ProtectedRoute'
import { LoginPage } from './features/auth/LoginPage'
import { AppLayout } from './components/ui/AppLayout'
import { WalletProvider } from './lib/WalletContext'
import { DashboardPage } from './features/dashboard/DashboardPage'
import { ReviewersPage } from './features/reviewers/ReviewersPage'
import { ReviewerDetailPage } from './features/reviewers/ReviewerDetailPage'
import { StudyPage } from './features/reviewers/StudyPage'
import { ShopPage } from './features/shop/ShopPage'
import { WorldPage } from './features/world/WorldPage'

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
              <Route index element={<DashboardPage />} />
              <Route path="reviewers" element={<ReviewersPage />} />
              <Route path="reviewers/:id" element={<ReviewerDetailPage />} />
              <Route path="reviewers/:id/study" element={<StudyPage />} />
              <Route path="shop" element={<ShopPage />} />
              <Route path="world" element={<WorldPage />} />
            </Route>
          </Routes>
        </WalletProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
