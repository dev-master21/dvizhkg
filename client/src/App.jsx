import React, { Suspense, lazy, useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from 'react-query';
import { Toaster } from 'react-hot-toast';
import { AnimatePresence } from 'framer-motion';
import { useAuthStore } from './stores/authStore';
import Loader from './components/Loader';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';

// Lazy loading страниц
const Home = lazy(() => import('./pages/Home'));
const Login = lazy(() => import('./pages/Login'));
const Events = lazy(() => import('./pages/Events'));
const Media = lazy(() => import('./pages/Media'));
const Profile = lazy(() => import('./pages/Profile'));
const EventDetails = lazy(() => import('./pages/EventDetails'));
const AuthCallback = lazy(() => import('./pages/AuthCallback'));
const Merch = lazy(() => import('./pages/Merch'));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000,
    },
  },
});

function App() {
  const { checkAuth } = useAuthStore();
  const [initialLoading, setInitialLoading] = useState(true);

  useEffect(() => {
    checkAuth();
    // Минимум 2 секунды показываем лоадер при первой загрузке
    const timer = setTimeout(() => {
      setInitialLoading(false);
    }, 2000);
    
    return () => clearTimeout(timer);
  }, [checkAuth]);

  if (initialLoading) {
    return <Loader fullScreen minDuration={2000} />;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <AnimatePresence mode="wait">
          <Suspense fallback={<Loader />}>
            <Routes>
              {/* Страница логина */}
              <Route path="/login" element={<Login />} />
              
              {/* Страница обработки авторизации из бота */}
              <Route path="/auth-callback" element={<AuthCallback />} />
              
              {/* Публичные страницы с Layout */}
              <Route element={<Layout />}>
                <Route path="/" element={<Home />} />
                <Route path="/events" element={<Events />} />
                <Route path="/events/:id" element={<EventDetails />} />
                <Route path="/merch" element={<Merch />} />
                
                {/* Страницы требующие авторизации */}
                <Route element={<ProtectedRoute requireAuth />}>
                  <Route path="/media" element={<Media />} />
                  <Route path="/profile/:id?" element={<Profile />} />
                </Route>
              </Route>
            </Routes>
          </Suspense>
        </AnimatePresence>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#2a2a2a',
              color: '#fff',
              border: '1px solid #f9c200',
              borderRadius: '12px',
              padding: '16px',
              fontFamily: 'Montserrat',
              fontWeight: 600,
            },
            success: {
              iconTheme: {
                primary: '#f9c200',
                secondary: '#1d1d1d',
              },
            },
            error: {
              iconTheme: {
                primary: '#ef4444',
                secondary: '#fff',
              },
            },
          }}
        />
      </Router>
    </QueryClientProvider>
  );
}

export default App;