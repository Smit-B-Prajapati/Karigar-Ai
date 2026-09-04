import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import { LanguageProvider, useLanguage } from './context/LanguageContext.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import Navbar from './components/Navbar.jsx';
import BottomNavigation from './components/BottomNavigation.jsx';
import Toast from './components/Toast.jsx';

import Loader from './components/Loader.jsx';

import LoginPage from './pages/LoginPage.jsx';
import RegisterPage from './pages/RegisterPage.jsx';
import HomeDashboard from './pages/HomeDashboard.jsx';
import AddProduct from './pages/AddProduct.jsx';
import ProductStudio from './pages/ProductStudio.jsx';
import AiMarketStudio from './pages/AiMarketStudio.jsx';
import Catalogue from './pages/Catalogue.jsx';
import ProductDetails from './pages/ProductDetails.jsx';
import MarketplacePreview from './pages/MarketplacePreview.jsx';
import Profile from './pages/Profile.jsx';
import NotFoundPage from './pages/NotFoundPage.jsx';

// Root Route handler: Root / shows Login page when unauthenticated, Home when authenticated
function RootRoute({ addToast }) {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return <Loader fullPage text="Loading KarigarAI Platform..." />;
  return isAuthenticated ? <Navigate to="/home" replace /> : <LoginPage addToast={addToast} />;
}

// Public Auth Route handler: Prevents logged-in users from seeing login/register again
function PublicAuthRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return <Loader fullPage text="Loading KarigarAI Platform..." />;
  return isAuthenticated ? <Navigate to="/home" replace /> : children;
}

function MainAppContent() {
  const [toasts, setToasts] = useState([]);
  const { language, toggleLanguage, setLanguage } = useLanguage();

  const addToast = (message, type = 'info') => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);

    setTimeout(() => {
      removeToast(id);
    }, 4000);
  };

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const handleToggleLang = (selectedCode) => {
    if (typeof selectedCode === 'string') {
      setLanguage(selectedCode);
      return;
    }
    toggleLanguage();
  };

  return (
    <Router>
      <Navbar currentLang={language} onToggleLang={handleToggleLang} />

      <Toast toasts={toasts} removeToast={removeToast} />

      <main style={{ flex: 1 }}>
        <Routes>
          {/* Root / ALWAYS shows Login page when unauthenticated */}
          <Route path="/" element={<RootRoute addToast={addToast} />} />

          {/* Public Authentication Routes */}
          <Route path="/login" element={<PublicAuthRoute><LoginPage addToast={addToast} /></PublicAuthRoute>} />
          <Route path="/register" element={<PublicAuthRoute><RegisterPage addToast={addToast} /></PublicAuthRoute>} />

          {/* Protected Artisan SaaS Workspaces */}
          <Route path="/home" element={<ProtectedRoute><HomeDashboard addToast={addToast} /></ProtectedRoute>} />
          <Route path="/dashboard" element={<ProtectedRoute><HomeDashboard addToast={addToast} /></ProtectedRoute>} />
          <Route path="/add-product" element={<ProtectedRoute><AddProduct addToast={addToast} /></ProtectedRoute>} />
          <Route path="/studio" element={<ProtectedRoute><ProductStudio addToast={addToast} /></ProtectedRoute>} />
          <Route path="/product-studio" element={<ProtectedRoute><ProductStudio addToast={addToast} /></ProtectedRoute>} />
          <Route path="/ai-market-studio" element={<ProtectedRoute><AiMarketStudio addToast={addToast} /></ProtectedRoute>} />
          <Route path="/catalogue" element={<ProtectedRoute><Catalogue addToast={addToast} /></ProtectedRoute>} />
          <Route path="/catalogue/:id" element={<ProtectedRoute><ProductDetails addToast={addToast} /></ProtectedRoute>} />
          <Route path="/marketplace-preview" element={<ProtectedRoute><MarketplacePreview addToast={addToast} /></ProtectedRoute>} />
          <Route path="/marketplace-preview/:id" element={<ProtectedRoute><MarketplacePreview addToast={addToast} /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><Profile currentLang={language} onToggleLang={handleToggleLang} addToast={addToast} /></ProtectedRoute>} />

          {/* Legacy alias redirects for backwards compatibility */}
          <Route path="/ai-catalogue" element={<Navigate to="/ai-market-studio" replace />} />
          <Route path="/pricing" element={<Navigate to="/ai-market-studio" replace />} />
          <Route path="/business-advisor" element={<Navigate to="/ai-market-studio" replace />} />

          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>

      <BottomNavigation />
    </Router>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <LanguageProvider>
        <MainAppContent />
      </LanguageProvider>
    </AuthProvider>
  );
}

