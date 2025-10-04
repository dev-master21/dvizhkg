import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Send, MessageCircle, Instagram, Mail,
  Heart, MapPin, ExternalLink
} from 'lucide-react';
import { motion } from 'framer-motion';

const Footer = () => {
  const socialLinks = [
    {
      name: 'Telegram канал',
      icon: Send,
      url: 'https://t.me/dvizh_bishkek',
      color: 'hover:text-[#0088cc]',
      username: '@dvizh_bishkek'
    },
    {
      name: 'Telegram чат',
      icon: MessageCircle,
      url: 'https://t.me/dvizh_bishkek_chat',
      color: 'hover:text-[#0088cc]',
      username: '@dvizh_bishkek_chat'
    },
    {
      name: 'Instagram',
      icon: Instagram,
      url: 'https://instagram.com/dvizhbishkek',
      color: 'hover:text-[#E4405F]',
      username: '@dvizhbishkek'
    },
    {
      name: 'Email',
      icon: Mail,
      url: 'mailto:dvizhbishkek@gmail.com',
      color: 'hover:text-[#f9c200]',
      username: 'dvizhbishkek@gmail.com'
    }
  ];

  const currentYear = new Date().getFullYear();

  return (
    <footer className="relative mt-20 border-t border-[#3a3a3a] bg-gradient-to-b from-[#1d1d1d] to-[#0a0a0a]">
      {/* Decorative gradient line */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#f9c200]/50 to-transparent" />
      
      <div className="container mx-auto px-4 py-12">
        <div className="grid md:grid-cols-3 gap-8 mb-8">
          {/* Logo & Description */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center md:text-left"
          >
            <Link to="/" className="inline-block mb-4">
              <img 
                src="/logo.svg" 
                alt="DVIZH BISHKEK" 
                className="h-16 w-auto"
                style={{ filter: 'drop-shadow(0 0 20px rgba(249, 194, 0, 0.3))' }}
              />
            </Link>
            <p className="text-gray-400 text-sm uppercase">
              Самая движовая тусовка Бишкека
            </p>
            <div className="flex items-center gap-2 mt-2 justify-center md:justify-start">
              <MapPin size={14} className="text-[#f9c200]" />
              <span className="text-gray-400 text-sm">Бишкек, Кыргызстан</span>
            </div>
          </motion.div>

          {/* Social Links */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="md:col-span-2"
          >
            <h3 className="text-white font-bold text-lg mb-4 text-center md:text-left uppercase">
              Присоединяйся к движу
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {socialLinks.map((link, index) => (
                <motion.a
                  key={link.name}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.2 + index * 0.1 }}
                  whileHover={{ scale: 1.05, y: -2 }}
                  className="group relative"
                >
                  <div className="bg-[#2a2a2a] rounded-xl p-4 border border-[#3a3a3a] hover:border-[#f9c200]/30 transition-all duration-300">
                    <div className="flex flex-col items-center text-center">
                      <div className={`p-3 bg-black/50 rounded-lg mb-3 ${link.color} transition-colors`}>
                        <link.icon size={24} className="text-gray-400 group-hover:text-current" />
                      </div>
                      <span className="text-white font-semibold text-sm uppercase">
                        {link.name}
                      </span>
                      <span className="text-gray-500 text-xs mt-1 break-all">
                        {link.username}
                      </span>
                    </div>
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <ExternalLink size={12} className="text-[#f9c200]" />
                    </div>
                  </div>
                </motion.a>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Quick Links */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="border-t border-[#3a3a3a] pt-8 mb-8"
        >
          <div className="flex flex-wrap justify-center gap-6 text-sm">
            <Link to="/events" className="text-gray-400 hover:text-[#f9c200] transition uppercase">
              События
            </Link>
            <Link to="/media" className="text-gray-400 hover:text-[#f9c200] transition uppercase">
              Медиа
            </Link>
            <Link to="/profile" className="text-gray-400 hover:text-[#f9c200] transition uppercase">
              Профиль
            </Link>
            <a 
              href="https://t.me/dvizh_bishkek" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-[#f9c200] transition uppercase"
            >
              Telegram
            </a>
            <a 
              href="https://instagram.com/dvizhbishkek" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-[#f9c200] transition uppercase"
            >
              Instagram
            </a>
          </div>
        </motion.div>

        {/* Copyright */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-center border-t border-[#3a3a3a] pt-8"
        >
          <p className="text-gray-500 text-sm mb-2 uppercase">
            © {currentYear} DVIZH BISHKEK. Все права защищены
          </p>
          <div className="flex items-center justify-center gap-2">
            <span className="text-gray-600 text-xs">Made with</span>
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <Heart size={14} className="text-red-500" fill="currentColor" />
            </motion.div>
            <span className="text-gray-600 text-xs">in Bishkek</span>
          </div>
        </motion.div>
      </div>

      {/* Animated background decoration */}
      <div className="absolute bottom-0 left-0 right-0 h-32 overflow-hidden pointer-events-none">
        <div className="absolute bottom-0 left-1/4 w-64 h-64 bg-[#f9c200]/5 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-[#f9c200]/5 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>
    </footer>
  );
};

export default Footer;