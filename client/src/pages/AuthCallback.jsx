import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Loader2, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import axios from '../utils/axios';
import toast from 'react-hot-toast';

const AuthCallback = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login, isAuthenticated, user } = useAuthStore();
  const [error, setError] = useState(null);
  const [status, setStatus] = useState('checking'); // checking, success, error, already_authorized
  
  const sessionId = searchParams.get('session');
  const token = searchParams.get('token');

  useEffect(() => {
    const checkAuth = async () => {
      // Check URL parameters
      if (!sessionId) {
        setError('Недействительная ссылка');
        setStatus('error');
        setTimeout(() => navigate('/login'), 3000);
        return;
      }

      try {
        // If token exists in URL, this is from Telegram
        if (token) {
          console.log('Auth via Telegram token');
          
          // Check if already authorized
          if (isAuthenticated && user) {
            setStatus('already_authorized');
            setTimeout(() => navigate('/'), 3000);
            return;
          }
          
          const { data } = await axios.post('/api/auth/auth-telegram', { 
            sessionId, 
            token 
          });
          
          if (data.status === 'already_authorized') {
            setStatus('already_authorized');
            toast.success('Вы уже авторизованы!');
            setTimeout(() => navigate('/'), 2000);
          } else if (data.status === 'authorized') {
            login(data.token, data.user);
            setStatus('success');
            toast.success('🔥 Добро пожаловать в DVIZH!');
            setTimeout(() => navigate('/'), 2000);
          } else {
            setError(data.error || 'Ошибка авторизации');
            setStatus('error');
            setTimeout(() => navigate('/login'), 3000);
          }
        } else {
          // No token in URL, this is immediate auth (first browser)
          console.log('Immediate auth check');
          const { data } = await axios.post('/api/auth/check-session', { sessionId });
          
          if (data.status === 'authorized') {
            login(data.token, data.user);
            setStatus('success');
            toast.success('🔥 Добро пожаловать в DVIZH!');
            // Don't redirect immediately, let user see success
            setTimeout(() => {
              // Stay on same page or go to home
              window.location.href = '/';
            }, 2000);
          } else if (data.status === 'expired') {
            setError('Сессия истекла. Попробуйте авторизоваться заново.');
            setStatus('error');
            setTimeout(() => navigate('/login'), 3000);
          } else if (data.status === 'pending') {
            // Keep checking for immediate auth
            setStatus('checking');
            // Poll every 2 seconds for up to 1 minute
            let attempts = 0;
            const maxAttempts = 30;
            
            const pollInterval = setInterval(async () => {
              attempts++;
              
              if (attempts >= maxAttempts) {
                clearInterval(pollInterval);
                setError('Время ожидания истекло');
                setStatus('error');
                setTimeout(() => navigate('/login'), 3000);
                return;
              }
              
              try {
                const { data: pollData } = await axios.post('/api/auth/check-session', { sessionId });
                
                if (pollData.status === 'authorized') {
                  clearInterval(pollInterval);
                  login(pollData.token, pollData.user);
                  setStatus('success');
                  toast.success('🔥 Добро пожаловать в DVIZH!');
                  setTimeout(() => {
                    window.location.href = '/';
                  }, 2000);
                } else if (pollData.status === 'expired') {
                  clearInterval(pollInterval);
                  setError('Сессия истекла');
                  setStatus('error');
                  setTimeout(() => navigate('/login'), 3000);
                }
              } catch (err) {
                console.error('Poll error:', err);
              }
            }, 2000);
          } else {
            setError(data.error || 'Сессия не найдена');
            setStatus('error');
            setTimeout(() => navigate('/login'), 3000);
          }
        }
      } catch (error) {
        console.error('Auth callback error:', error);
        
        if (error.response?.status === 401) {
          if (error.response.data.status === 'expired') {
            setError('Ссылка для входа истекла. Пожалуйста, авторизуйтесь заново.');
          } else {
            setError('Недействительная ссылка для входа');
          }
        } else {
          setError('Ошибка при авторизации');
        }
        
        setStatus('error');
        setTimeout(() => navigate('/login'), 5000);
      }
    };

    checkAuth();
  }, [sessionId, token, login, navigate, isAuthenticated, user]);

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center max-w-md"
      >
        {status === 'checking' && (
          <>
            <Loader2 className="animate-spin text-[#f9c200] mx-auto mb-4" size={48} />
            <h1 className="text-2xl font-bold text-white uppercase mb-2">
              {token ? 'АВТОРИЗАЦИЯ...' : 'ОЖИДАНИЕ ПОДТВЕРЖДЕНИЯ...'}
            </h1>
            <p className="text-gray-400">
              {token ? 'Проверяем вашу ссылку...' : 'Завершите авторизацию в Telegram боте'}
            </p>
          </>
        )}
        
        {status === 'success' && (
          <>
            <CheckCircle className="text-green-500 mx-auto mb-4" size={48} />
            <h1 className="text-2xl font-bold text-white uppercase mb-2">УСПЕШНО!</h1>
            <p className="text-gray-400">Перенаправление...</p>
          </>
        )}
        
        {status === 'already_authorized' && (
          <>
            <AlertCircle className="text-[#f9c200] mx-auto mb-4" size={48} />
            <h1 className="text-2xl font-bold text-white uppercase mb-2">ВЫ УЖЕ АВТОРИЗОВАНЫ</h1>
            <p className="text-gray-400">Перенаправление на главную...</p>
          </>
        )}
        
        {status === 'error' && (
          <>
            <XCircle className="text-red-500 mx-auto mb-4" size={48} />
            <h1 className="text-2xl font-bold text-white mb-2 uppercase">ОШИБКА</h1>
            <p className="text-gray-400 mb-4">{error}</p>
            <p className="text-sm text-gray-500">Перенаправление на страницу входа...</p>
          </>
        )}
      </motion.div>
    </div>
  );
};

export default AuthCallback;