import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Send, CheckCircle, XCircle, Loader2,  // ✅ CheckCircle2 -> CheckCircle
  MessageCircle, Users, Sparkles, Zap,
  Shield, ArrowRight, AlertCircle
} from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import axios from '../utils/axios';
import toast from 'react-hot-toast';

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isAuthenticated } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [telegramData, setTelegramData] = useState(null);
  const [subscriptionStatus, setSubscriptionStatus] = useState({
    group: false,
    chat: false
  });
  const [checkingSubscription, setCheckingSubscription] = useState(false);

  const from = location.state?.from?.pathname || '/events';

  useEffect(() => {
    if (isAuthenticated) {
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, from]);

  useEffect(() => {
    window.TelegramLoginWidget = {
      dataOnauth: (user) => handleTelegramAuth(user)
    };

    const script = document.createElement('script');
    script.src = 'https://telegram.org/js/telegram-widget.js?22';
    script.setAttribute('data-telegram-login', import.meta.env.VITE_TELEGRAM_BOT_USERNAME);
    script.setAttribute('data-size', 'large');
    script.setAttribute('data-onauth', 'TelegramLoginWidget.dataOnauth(user)');
    script.setAttribute('data-request-access', 'write');
    script.async = true;
    
    const widgetContainer = document.getElementById('telegram-widget');
    if (widgetContainer && !widgetContainer.hasChildNodes()) {
      widgetContainer.appendChild(script);
    }

    return () => {
      if (widgetContainer) {
        widgetContainer.innerHTML = '';
      }
    };
  }, []);

  const handleTelegramAuth = async (userData) => {
    setLoading(true);
    setTelegramData(userData);
    
    try {
      const { data } = await axios.post('/api/auth/check-subscription', {
        telegramId: userData.id
      });
      
      setSubscriptionStatus(data);
      
      if (data.group && data.chat) {
        await completeAuth(userData);
      }
    } catch (error) {
      toast.error('Ошибка при проверке подписок');
    } finally {
      setLoading(false);
    }
  };

  const completeAuth = async (userData) => {
    try {
      const { data } = await axios.post('/api/auth/login', userData);
      login(data.token, data.user);
      toast.success('Добро пожаловать в DVIZH!');
      navigate(from, { replace: true });
    } catch (error) {
      toast.error('Ошибка авторизации');
    }
  };

  const checkSubscription = async () => {
    if (!telegramData) return;
    
    setCheckingSubscription(true);
    try {
      const { data } = await axios.post('/api/auth/check-subscription', {
        telegramId: telegramData.id
      });
      
      setSubscriptionStatus(data);
      
      if (data.group && data.chat) {
        await completeAuth(telegramData);
      } else {
        toast.error('Подпишись на все каналы!');
      }
    } catch (error) {
      toast.error('Ошибка проверки');
    } finally {
      setCheckingSubscription(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center px-4 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -left-40 w-80 h-80 bg-[#f9c200]/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-40 -right-40 w-80 h-80 bg-[#f9c200]/10 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[#f9c200]/5 rounded-full blur-3xl animate-pulse delay-2000" />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.5, type: "spring", stiffness: 100 }}
        className="relative z-10 w-full max-w-md"
      >
        <div className="glass rounded-3xl p-8 border border-[#f9c200]/20 glow-yellow-sm">
          {/* Header */}
          <div className="text-center mb-8">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="relative inline-block mb-6"
            >
              <div className="absolute inset-0 bg-[#f9c200]/20 blur-3xl" />
              <img 
                src="/logo.svg" 
                alt="DVIZH BISHKEK" 
                className="relative h-32 w-auto mx-auto"
                style={{ filter: 'drop-shadow(0 0 30px rgba(249, 194, 0, 0.5))' }}
              />
            </motion.div>
            
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-2xl font-black text-white mb-2"
            >
              Добро пожаловать в ДВИЖ
            </motion.h1>
            
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-gray-400 flex items-center justify-center gap-2"
            >
            </motion.p>
          </div>

          <AnimatePresence mode="wait">
            {!telegramData ? (
              <motion.div
                key="login"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-6"
              >
                <div className="text-center space-y-4">
                  <div className="flex items-center justify-center gap-3 text-sm text-gray-400">
                    <Shield className="text-[#f9c200]" size={20} />
                    <span>Авторизация через Telegram</span>
                  </div>
                  
                  <div id="telegram-widget" className="flex justify-center transform hover:scale-105 transition-transform" />
                  
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <div className="flex-1 h-px bg-gray-800" />
                    <span>Нажми кнопку выше</span>
                    <div className="flex-1 h-px bg-gray-800" />
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="subscription"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                {/* User greeting */}
                <div className="text-center p-4 rounded-2xl bg-gradient-to-br from-[#f9c200]/10 to-transparent border border-[#f9c200]/20">
                  <div className="flex items-center justify-center gap-3 mb-2">
                    <Zap className="text-[#f9c200]" size={24} />
                    <h3 className="text-xl font-bold text-white">
                      Привет, {telegramData.first_name}!
                    </h3>
                  </div>
                  <p className="text-sm text-gray-400">
                    Осталось подписаться на наши каналы
                  </p>
                </div>

                {/* Subscription status */}
                <div className="space-y-3">
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className={`relative p-4 rounded-xl transition-all duration-500 ${
                      subscriptionStatus.group 
                        ? 'bg-gradient-to-r from-green-500/20 to-green-500/10 border border-green-500/30 success-glow' 
                        : 'bg-gradient-to-r from-gray-800/50 to-gray-900/50 border border-gray-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${
                          subscriptionStatus.group ? 'bg-green-500/20' : 'bg-gray-800'
                        }`}>
                          <Users className={subscriptionStatus.group ? 'text-green-400' : 'text-gray-500'} size={20} />
                        </div>
                        <div>
                          <p className="font-semibold text-white">Группа DVIZH</p>
                          <p className="text-xs text-gray-400">Основная группа движухи</p>
                        </div>
                      </div>
                      {subscriptionStatus.group ? (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ type: "spring", stiffness: 200 }}
                        >
                          <CheckCircle className="text-green-400" size={28} />
                        </motion.div>
                      ) : (
                        <XCircle className="text-gray-500" size={28} />
                      )}
                    </div>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className={`relative p-4 rounded-xl transition-all duration-500 ${
                      subscriptionStatus.chat 
                        ? 'bg-gradient-to-r from-green-500/20 to-green-500/10 border border-green-500/30 success-glow' 
                        : 'bg-gradient-to-r from-gray-800/50 to-gray-900/50 border border-gray-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${
                          subscriptionStatus.chat ? 'bg-green-500/20' : 'bg-gray-800'
                        }`}>
                          <MessageCircle className={subscriptionStatus.chat ? 'text-green-400' : 'text-gray-500'} size={20} />
                        </div>
                        <div>
                          <p className="font-semibold text-white">Чат DVIZH</p>
                          <p className="text-xs text-gray-400">Общение, кайфы и веселуха</p>
                        </div>
                      </div>
                      {subscriptionStatus.chat ? (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ type: "spring", stiffness: 200 }}
                        >
                          <CheckCircle className="text-green-400" size={28} />
                        </motion.div>
                      ) : (
                        <XCircle className="text-gray-500" size={28} />
                      )}
                    </div>
                  </motion.div>
                </div>

                {/* Action buttons */}
                {(!subscriptionStatus.group || !subscriptionStatus.chat) ? (
                  <div className="space-y-3">
                    {!subscriptionStatus.group && (
                      <motion.a
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        href={import.meta.env.VITE_TELEGRAM_GROUP_LINK}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-3 w-full btn-primary group"
                      >
                        <Users size={20} />
                        <span>Подписаться на группу</span>
                        <ArrowRight className="group-hover:translate-x-1 transition-transform" size={20} />
                      </motion.a>
                    )}
                    
                    {!subscriptionStatus.chat && (
                      <motion.a
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        href={import.meta.env.VITE_TELEGRAM_CHAT_LINK}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-3 w-full btn-primary group"
                      >
                        <MessageCircle size={20} />
                        <span>Подписаться на чат</span>
                        <ArrowRight className="group-hover:translate-x-1 transition-transform" size={20} />
                      </motion.a>
                    )}

                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={checkSubscription}
                      disabled={checkingSubscription}
                      className="w-full btn-secondary flex items-center justify-center gap-2"
                    >
                      {checkingSubscription ? (
                        <>
                          <Loader2 className="animate-spin" size={20} />
                          <span>Проверяем...</span>
                        </>
                      ) : (
                        <>
                          <Shield size={20} />
                          <span>Проверить подписки</span>
                        </>
                      )}
                    </motion.button>

                    <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                      <AlertCircle className="text-red-400 flex-shrink-0" size={20} />
                      <p className="text-xs text-red-400">
                        Подпишись на оба ресурса для входа на сайт
                      </p>
                    </div>
                  </div>
                ) : (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center space-y-4"
                  >
                    <div className="inline-flex p-4 rounded-full bg-gradient-to-br from-green-500/20 to-green-500/10">
                      <CheckCircle className="text-green-400" size={48} />
                    </div>
                    <div>
                      <p className="text-xl font-bold text-green-400 mb-1">Все подписки активны!</p>
                      <p className="text-sm text-gray-400">Входим в систему...</p>
                    </div>
                    <div className="flex justify-center">
                      <Loader2 className="animate-spin text-[#f9c200]" size={24} />
                    </div>
                  </motion.div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;