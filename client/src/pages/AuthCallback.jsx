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
  const { login, isAuthenticated } = useAuthStore();
  const [error, setError] = useState(null);
  const [status, setStatus] = useState('checking'); // checking, success, error, already_authorized
  
  const sessionId = searchParams.get('session');
  const token = searchParams.get('token');

  useEffect(() => {
    const checkAuth = async () => {
      // Check URL parameters
      if (!sessionId) {
        setError('НЕДЕЙСТВИТЕЛЬНАЯ ССЫЛКА');
        setStatus('error');
        setTimeout(() => navigate('/login'), 3000);
        return;
      }

      try {
        // If token exists in URL, this is from Telegram button
        if (token) {
          console.log('Auth via Telegram token');
          
          const { data } = await axios.post('/api/auth/auth-telegram', { 
            sessionId, 
            token 
          });
          
          if (data.status === 'already_authorized') {
            // User is already logged in
            setStatus('already_authorized');
            toast.success('ВЫ УЖЕ АВТОРИЗОВАНЫ!');
            setTimeout(() => navigate('/'), 2000);
          } else if (data.status === 'authorized') {
            // Successful authorization
            login(data.token, data.user);
            setStatus('success');
            toast.success('🔥 ДОБРО ПОЖАЛОВАТЬ В DVIZH!');
            setTimeout(() => navigate('/'), 2000);
          } else if (data.status === 'expired') {
            setError('ССЫЛКА ДЛЯ ВХОДА ИСТЕКЛА');
            setStatus('error');
            setTimeout(() => navigate('/login'), 3000);
          } else {
            setError(data.error || 'ОШИБКА АВТОРИЗАЦИИ');
            setStatus('error');
            setTimeout(() => navigate('/login'), 3000);
          }
        } else {
          // No token in URL, this might be immediate auth check
          setError('НЕДЕЙСТВИТЕЛЬНАЯ ССЫЛКА');
          setStatus('error');
          setTimeout(() => navigate('/login'), 3000);
        }
      } catch (error) {
        console.error('Auth callback error:', error);
        
        if (error.response?.status === 401) {
          if (error.response.data.status === 'expired') {
            setError('ВРЕМЯ АВТОРИЗАЦИИ ИСТЕКЛО');
          } else if (error.response.data.status === 'invalid') {
            setError('НЕДЕЙСТВИТЕЛЬНАЯ ССЫЛКА');
          } else {
            setError('ОШИБКА АВТОРИЗАЦИИ');
          }
        } else {
          setError('ОШИБКА ПРИ АВТОРИЗАЦИИ');
        }
        
        setStatus('error');
        setTimeout(() => navigate('/login'), 5000);
      }
    };

    checkAuth();
  }, [sessionId, token, login, navigate]);

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
              АВТОРИЗАЦИЯ...
            </h1>
            <p className="text-gray-400 uppercase">
              ПРОВЕРЯЕМ ВАШУ ССЫЛКУ...
            </p>
          </>
        )}
        
        {status === 'success' && (
          <>
            <CheckCircle className="text-green-500 mx-auto mb-4" size={48} />
            <h1 className="text-2xl font-bold text-white uppercase mb-2">УСПЕШНО!</h1>
            <p className="text-gray-400 uppercase">ПЕРЕНАПРАВЛЕНИЕ...</p>
          </>
        )}
        
        {status === 'already_authorized' && (
          <>
            <AlertCircle className="text-[#f9c200] mx-auto mb-4" size={48} />
            <h1 className="text-2xl font-bold text-white uppercase mb-2">ВЫ УЖЕ АВТОРИЗОВАНЫ</h1>
            <p className="text-gray-400 uppercase">ПЕРЕНАПРАВЛЕНИЕ НА ГЛАВНУЮ...</p>
          </>
        )}
        
        {status === 'error' && (
          <>
            <XCircle className="text-red-500 mx-auto mb-4" size={48} />
            <h1 className="text-2xl font-bold text-white mb-2 uppercase">ОШИБКА</h1>
            <p className="text-gray-400 mb-4 uppercase">{error}</p>
            <p className="text-sm text-gray-500 uppercase">ПЕРЕНАПРАВЛЕНИЕ НА СТРАНИЦУ ВХОДА...</p>
          </>
        )}
      </motion.div>
    </div>
  );
};

export default AuthCallback;