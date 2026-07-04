import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import './App.css'
import ProtectedRoute from './components/ProtectedRoute.jsx'
import { AuthProvider } from './contexts/AuthContext.jsx'
import AppLayout from './layouts/AppLayout.jsx'
import AdminDashboard from './pages/AdminDashboard.jsx'
import Booth from './pages/Booth.jsx'
import Browse from './pages/Browse.jsx'
import Fees from './pages/Fees.jsx'
import Home from './pages/Home.jsx'
import Listing from './pages/Listing.jsx'
import Login from './pages/Login.jsx'
import OpenYourBooth from './pages/OpenYourBooth.jsx'
import PolicyPage from './pages/PolicyPage.jsx'
import SellerDashboard from './pages/SellerDashboard.jsx'
import Signup from './pages/Signup.jsx'

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<AppLayout />}>
            <Route index element={<Home />} />
            <Route path="browse" element={<Browse />} />
            <Route path="booth/:boothId" element={<Booth />} />
            <Route path="listing/:listingId" element={<Listing />} />
            <Route path="fees" element={<Fees />} />
            <Route path="login" element={<Login />} />
            <Route path="signup" element={<Signup />} />
            <Route path="open-your-booth" element={<OpenYourBooth />} />
            <Route path="choose-booth-type" element={<Navigate to="/open-your-booth" replace />} />
            <Route path="seller-profile-setup" element={<Navigate to="/open-your-booth" replace />} />
            <Route path="seller-promise" element={<Navigate to="/open-your-booth" replace />} />
            <Route path="fee-transparency" element={<Navigate to="/open-your-booth" replace />} />
            <Route path="terms-acceptance" element={<Navigate to="/open-your-booth" replace />} />
            <Route path=":policySlug" element={<PolicyPage />} />
            <Route
              path="seller-dashboard"
              element={
                <ProtectedRoute allowedRoles={['seller', 'admin']}>
                  <SellerDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="admin"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App
