import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Send, Loader2, CheckCircle, MessageCircle,
  Shield, ArrowRight, Sparkles, Zap, Phone,
  Clock, AlertCircle, RefreshCw
} from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import axios from '../utils/axios';
import toast from 'react-hot-toast';

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isAuthenticated } = useAuthStore();
  const [step, setStep] = useState('init'); // init, bot, waiting, success
  const [sessionId, setSessionId] = useState(null);
  const [botLink, setBotLink] = useState(null);
  const [checkInterval, setCheckInterval] = useState(null);
  const [countdown, setCountdown] = useState(300); // 5 minutes

  const from = location.state?.from?.pathname || '/';

  useEffect(() => {
    if (isAuthenticated) {
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, from]);

  useEffect(() => {
    // Countdown timer
    if (step === 'waiting' && countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (countdown === 0) {
      handleTimeout();
    }
  }, [countdown, step]);

  const handleStartAuth = async () => {
    try {
      setStep('bot');
      const { data } = await axios.post('/api/auth/generate-session');
      setSessionId(data.sessionId);
      setBotLink(data.botLink);
      
      // Open bot in new tab
      window.open(data.botLink, '_blank');
      
      // Start checking for auth
      setStep('waiting');
      startCheckingAuth(data.sessionId);
    } catch (error) {
      toast.error('Ошибка при создании сессии');
      setStep('init');
    }
  };

  const startCheckingAuth = (sessionId) => {
    const interval = setInterval(async () => {
      try {
        const { data } = await axios.post('/api/auth/check-session', { sessionId });
        
        if (data.status === 'authorized') {
          clearInterval(interval);
          setStep('success');
          login(data.token, data.user);
          toast.success('Добро пожаловать в DVIZH!');
          setTimeout(() => {
            navigate(from, { replace: true });
          }, 1500);
        }
      } catch (error) {
        console.error('Check session error:', error);
      }
    }, 2000); // Check every 2 seconds
    
    setCheckInterval(interval);
  };

  const handleTimeout = () => {
    if (checkInterval) {
      clearInterval(checkInterval);
    }
    setStep('init');
    toast.error('Время авторизации истекло');
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center px-4 relative overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -left-40 w-80 h-80 bg-[#f9c200]/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-40 -right-40 w-80 h-80 bg-[#f9c200]/10 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[#f9c200]/5 rounded-full blur-3xl animate-pulse delay-2000" />
      </div>

      {/* Particles */}
      <div className="absolute inset-0 pointer-events-none">
        {[...Array(30)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-0.5 h-0.5 bg-[#f9c200]/40 rounded-full"
            initial={{ 
              x: Math.random() * window.innerWidth,
              y: Math.random() * window.innerHeight
            }}
            animate={{ 
              x: Math.random() * window.innerWidth,
              y: Math.random() * window.innerHeight
            }}
            transition={{
              duration: Math.random() * 20 + 20,
              repeat: Infinity,
              ease: "linear"
            }}
          />
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.5, type: "spring", stiffness: 100 }}
        className="relative z-10 w-full max-w-md"
      >
        <div className="glass rounded-3xl p-8 border border-[#f9c200]/20 backdrop-blur-md">
          {/* Logo */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="relative inline-block mb-8 w-full"
          >
            <div className="absolute inset-0 bg-[#f9c200]/20 blur-3xl" />
            <img 
              src="/logo.svg" 
              alt="DVIZH BISHKEK" 
              className="relative h-32 w-auto mx-auto"
              style={{ filter: 'drop-shadow(0 0 30px rgba(249, 194, 0, 0.5))' }}
            />
          </motion.div>

          {/* Title */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-center mb-8"
          >
            <h1 className="text-3xl font-black text-white mb-3">
              Вход в DVIZH
            </h1>
            <p className="text-gray-400">
              Авторизация через Telegram
            </p>
          </motion.div>

          <AnimatePresence mode="wait">
            {/* Initial state */}
            {step === 'init' && (
              <motion.div
                key="init"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-6"
              >
                <div className="space-y-4">
                  {/* Features */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-[#1d1d1d] border border-[#3a3a3a]">
                      <div className="p-2 bg-[#f9c200]/20 rounded-lg">
                        <Shield className="text-[#f9c200]" size={20} />
                      </div>
                      <span className="text-gray-300">Безопасная авторизация</span>
                    </div>
                    
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-[#1d1d1d] border border-[#3a3a3a]">
                      <div className="p-2 bg-[#f9c200]/20 rounded-lg">
                        <MessageCircle className="text-[#f9c200]" size={20} />
                      </div>
                      <span className="text-gray-300">Через Telegram бота</span>
                    </div>
                    
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-[#1d1d1d] border border-[#3a3a3a]">
                      <div className="p-2 bg-[#f9c200]/20 rounded-lg">
                        <Zap className="text-[#f9c200]" size={20} />
                      </div>
                      <span className="text-gray-300">Быстрый доступ к событиям</span>
                    </div>
                  </div>

                  <button
                    onClick={handleStartAuth}
                    className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-[#f9c200] text-black font-bold rounded-2xl hover:bg-[#ffdd44] transition-all transform hover:scale-105"
                  >
                    <Send size={24} />
                    <span className="text-lg">Авторизоваться</span>
                    <ArrowRight size={20} />
                  </button>

                  <p className="text-center text-gray-500 text-sm">
                    Нажимая кнопку, вы будете перенаправлены в Telegram бот
                  </p>
                </div>
              </motion.div>
            )}

            {/* Bot opened state */}
            {step === 'bot' && (
              <motion.div
                key="bot"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="text-center space-y-6"
              >
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  className="inline-block"
                >
                  <Loader2 className="text-[#f9c200]" size={48} />
                </motion.div>
                
                <div>
                  <h3 className="text-xl font-bold text-white mb-2">
                    Открываем Telegram...
                  </h3>
                  <p className="text-gray-400">
                    Переходим к боту для авторизации
                  </p>
                </div>
              </motion.div>
            )}

            {/* Waiting for auth */}
            {step === 'waiting' && (
              <motion.div
                key="waiting"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                <div className="text-center space-y-4">
                  <motion.div
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="inline-flex p-4 rounded-full bg-[#f9c200]/10"
                  >
                    <Phone className="text-[#f9c200]" size={40} />
                  </motion.div>
                  
                  <div>
                    <h3 className="text-xl font-bold text-white mb-2">
                      Ожидаем авторизацию
                    </h3>
                    <p className="text-gray-400">
                      Следуйте инструкциям в Telegram боте
                    </p>
                  </div>

                  {/* Steps */}
                  <div className="text-left space-y-3 bg-[#1d1d1d] rounded-xl p-4">
                    <div className="flex items-start gap-3">
                      <div className="mt-1 w-6 h-6 rounded-full bg-[#f9c200]/20 flex items-center justify-center flex-shrink-0">
                        <span className="text-[#f9c200] text-xs font-bold">1</span>
                      </div>
                      <p className="text-gray-300 text-sm">
                        Поделитесь контактом в боте
                      </p>
                    </div>
                    
                    <div className="flex items-start gap-3">
                      <div className="mt-1 w-6 h-6 rounded-full bg-[#f9c200]/20 flex items-center justify-center flex-shrink-0">
                        <span className="text-[#f9c200] text-xs font-bold">2</span>
                      </div>
                      <p className="text-gray-300 text-sm">
                        Подпишитесь на группу и чат
                      </p>
                    </div>
                    
                    <div className="flex items-start gap-3">
                      <div className="mt-1 w-6 h-6 rounded-full bg-[#f9c200]/20 flex items-center justify-center flex-shrink-0">
                        <span className="text-[#f9c200] text-xs font-bold">3</span>
                      </div>
                      <p className="text-gray-300 text-sm">
                        Дождитесь подтверждения
                      </p>
                    </div>
                  </div>

                  {/* Timer */}
                  <div className="flex items-center justify-center gap-2 text-gray-400">
                    <Clock size={18} />
                    <span className="font-mono">{formatTime(countdown)}</span>
                  </div>

                  {/* Actions */}
                  <div className="space-y-3">
                    {botLink && (
                      
                       <a href={botLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-[#1d1d1d] text-gray-300 rounded-xl hover:bg-[#2a2a2a] transition"
                      >
                        <MessageCircle size={20} />
                        <span>Открыть бота снова</span>
                      </a>
                    )}
                    
                    <button
                      onClick={() => {
                        if (checkInterval) clearInterval(checkInterval);
                        setStep('init');
                      }}
                      className="w-full text-gray-500 hover:text-gray-300 transition"
                    >
                      Отмена
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Success state */}
            {step === 'success' && (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center space-y-6"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 200 }}
                  className="inline-flex p-4 rounded-full bg-green-500/10"
                >
                  <CheckCircle className="text-green-400" size={48} />
                </motion.div>
                
                <div>
                  <h3 className="text-2xl font-bold text-green-400 mb-2">
                    Успешная авторизация!
                  </h3>
                  <p className="text-gray-400">
                    Добро пожаловать в DVIZH
                  </p>
                </div>
                
                <div className="flex justify-center">
                  <Loader2 className="animate-spin text-[#f9c200]" size={24} />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;