import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  Calendar, Image, User, Menu, LogOut, Trophy, 
  LogIn, ChevronRight, Sparkles, X, Home,
  Shield, MessageCircle, Users, ShoppingBag
} from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { motion, AnimatePresence } from 'framer-motion';

const Navigation = ({ onMenuToggle }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, isAuthenticated } = useAuthStore();
  const isAdmin = user?.role === 'admin';
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navItems = [
    { path: '/events', label: 'События', icon: Calendar, public: true },
    { path: '/media', label: 'Медиа', icon: Image, public: true },
    { path: '/profile', label: 'Профиль', icon: User, public: false },
    { path: '/merch', label: 'Мерч', icon: ShoppingBag, public: true },
  ];

  const isActive = (path) => location.pathname.startsWith(path);

  const handleMediaClick = (e) => {
    if (!isAuthenticated && location.pathname !== '/media') {
      e.preventDefault();
      navigate('/media');
    }
  };

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled 
          ? 'glass-dark border-b border-[#f9c200]/10' 
          : 'bg-transparent'
      }`}
    >
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link to="/" className="group relative">
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="relative"
            >
              <div className="absolute inset-0 bg-[#f9c200]/20 blur-xl group-hover:bg-[#f9c200]/30 transition-all duration-300" />
              <img 
                src="/logo.svg" 
                alt="DVIZH BISHKEK" 
                className="relative h-12 w-auto"
                style={{ 
                  filter: 'drop-shadow(0 0 20px rgba(249, 194, 0, 0.5))',
                }}
              />
            </motion.div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path);
              const isVisible = item.public || isAuthenticated;
              
              if (!isVisible && item.path !== '/media') return null;
              
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={item.path === '/media' ? handleMediaClick : undefined}
                  className="relative px-4 py-2"
                >
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className={`relative flex items-center gap-2 px-4 py-2 rounded-xl transition-all duration-300 ${
                      active 
                        ? 'text-[#f9c200]' 
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    <Icon size={20} />
                    <span className="font-semibold">{item.label}</span>
                    
                    {active && (
                      <motion.div
                        layoutId="navGlow"
                        className="absolute inset-0 bg-[#f9c200]/10 rounded-xl border border-[#f9c200]/30"
                        style={{
                          boxShadow: '0 0 20px rgba(249, 194, 0, 0.3)',
                        }}
                      />
                    )}
                  </motion.div>
                </Link>
              );
            })}
          </div>

          {/* Right Section */}
          <div className="flex items-center gap-4">
            {isAuthenticated ? (
              <>
                {/* User Info Card */}
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="hidden md:flex items-center gap-3"
                >
                  <Link
                    to="/profile"
                    className="group flex items-center gap-3 px-3 py-2 rounded-xl bg-black/30 border border-[#f9c200]/20 hover:border-[#f9c200]/40 transition-all duration-300"
                  >
                    <div className="text-right">
                      <div className="text-white font-semibold text-sm">
                        {user?.first_name} {user?.last_name}
                      </div>
                      <div className="text-[#f9c200] text-xs flex items-center justify-end gap-1">
                        <Trophy size={12} />
                        <span className="font-bold">{user?.reputation || 0}</span>
                        <span className="text-gray-400">реп.</span>
                      </div>
                    </div>
                    <div className="relative">
                      {user?.avatar_url ? (
                        <img 
                          src={user.avatar_url} 
                          alt={user.first_name}
                          className="w-10 h-10 rounded-full border-2 border-[#f9c200]/50 group-hover:border-[#f9c200] transition-all"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#f9c200] to-[#ffdd44] flex items-center justify-center font-bold text-black">
                          {user?.first_name?.[0] || '?'}
                        </div>
                      )}
                      <motion.div
                        className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-black"
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      />
                    </div>
                  </Link>
                </motion.div>

                {/* Admin Badge */}
                {isAdmin && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="hidden md:block"
                  >
                    <div className="relative px-3 py-1 bg-gradient-to-r from-red-500 to-red-600 text-white text-xs font-bold rounded-lg glow-red">
                      <Shield size={12} className="inline mr-1" />
                      ADMIN
                      <motion.div
                        className="absolute inset-0 bg-white/20 rounded-lg"
                        animate={{ opacity: [0, 0.5, 0] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      />
                    </div>
                  </motion.div>
                )}

                {/* Logout Button */}
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={logout}
                  className="hidden md:flex items-center gap-2 px-4 py-2 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 hover:bg-red-500/20 hover:border-red-500/30 transition-all duration-300"
                >
                  <LogOut size={18} />
                  <span className="font-semibold">Выйти</span>
                </motion.button>
              </>
            ) : (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
              >
                <Link
                  to="/login"
                  className="hidden md:flex items-center gap-2 btn-primary group"
                >
                  <LogIn size={18} />
                  <span>Войти</span>
                  <ChevronRight className="group-hover:translate-x-1 transition-transform" size={16} />
                </Link>
              </motion.div>
            )}

            {/* Mobile Menu Button */}
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={onMenuToggle}
              className="md:hidden relative p-2 text-white"
            >
              <div className="relative">
                <Menu size={24} />
                {isAuthenticated && user?.reputation > 0 && (
                  <div className="absolute -top-1 -right-1 w-2 h-2 bg-[#f9c200] rounded-full animate-pulse" />
                )}
              </div>
            </motion.button>
          </div>
        </div>
      </div>
    </motion.nav>
  );
};

export default Navigation;