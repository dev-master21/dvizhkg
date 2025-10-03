import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Calendar, Image, User, LogOut, Trophy, 
  LogIn, X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '../stores/authStore';

const MobileMenu = ({ isOpen, onClose }) => {
  const { user, logout, isAuthenticated } = useAuthStore();

  const navItems = [
    { path: '/events', label: 'События', icon: Calendar, public: true },
    { path: '/media', label: 'Медиа', icon: Image, public: true },
    { path: '/profile', label: 'Профиль', icon: User, public: false },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
          />

          {/* Menu */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'tween', duration: 0.3 }}
            className="fixed right-0 top-0 h-full w-80 bg-[#1a1a1a] z-50 overflow-y-auto"
          >
            <div className="p-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-8">
                <img 
                  src="/logo.svg" 
                  alt="DVIZH" 
                  className="h-10 w-auto"
                />
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-white/10 rounded-lg transition"
                >
                  <X className="text-white" size={24} />
                </button>
              </div>

              {/* User info - только для авторизованных */}
              {isAuthenticated && user && (
                <div className="mb-8 p-4 bg-black/30 rounded-xl">
                  <div className="flex items-center gap-3 mb-3">
                    {user.avatar_url ? (
                      <img 
                        src={user.avatar_url} 
                        alt={user.first_name}
                        className="w-12 h-12 rounded-full border-2 border-[#f9c200]"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-[#f9c200] flex items-center justify-center font-bold text-black">
                        {user.first_name?.[0] || '?'}
                      </div>
                    )}
                    <div>
                      <div className="text-white font-semibold">
                        {user.first_name} {user.last_name}
                      </div>
                      <div className="text-[#f9c200] text-sm flex items-center gap-1">
                        <Trophy size={14} />
                        {user.reputation || 0} репутации
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Navigation */}
              <nav className="space-y-2 mb-8">
                {navItems
                  .filter(item => item.public || isAuthenticated)
                  .map((item) => {
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.path}
                        to={item.path}
                        onClick={onClose}
                        className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-300 hover:text-white hover:bg-white/5 transition"
                      >
                        <Icon size={20} />
                        <span className="font-semibold">{item.label}</span>
                      </Link>
                    );
                  })}
              </nav>

              {/* Auth button */}
              {isAuthenticated ? (
                <button
                  onClick={() => {
                    logout();
                    onClose();
                  }}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-500/20 text-red-500 rounded-xl hover:bg-red-500/30 transition"
                >
                  <LogOut size={20} />
                  <span>Выйти</span>
                </button>
              ) : (
                <Link
                  to="/login"
                  onClick={onClose}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-[#f9c200] text-black rounded-xl font-bold hover:bg-[#ffdd44] transition"
                >
                  <LogIn size={20} />
                  <span>Войти</span>
                </Link>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default MobileMenu;