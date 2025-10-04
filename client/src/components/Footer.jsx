import React from 'react';
import { Send, MessageCircle, Instagram, Mail } from 'lucide-react';
import { motion } from 'framer-motion';

const FooterMinimal = () => {
  const socials = [
    { icon: Send, url: 'https://t.me/dvizh_bishkek', label: 'Telegram' },
    { icon: MessageCircle, url: 'https://t.me/dvizh_bishkek_chat', label: 'Chat' },
    { icon: Instagram, url: 'https://instagram.com/dvizhbishkek', label: 'Instagram' },
    { icon: Mail, url: 'mailto:dvizhbishkek@gmail.com', label: 'Email' }
  ];

  return (
    <footer className="mt-auto border-t border-[#3a3a3a] bg-[#0a0a0a]">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Logo */}
          <img 
            src="/logo.svg" 
            alt="DVIZH BISHKEK" 
            className="h-10 w-auto opacity-50 hover:opacity-100 transition"
          />
          
          {/* Social Links */}
          <div className="flex items-center gap-4">
            {socials.map((social, index) => (
              <motion.a
                key={social.label}
                href={social.url}
                target="_blank"
                rel="noopener noreferrer"
                whileHover={{ scale: 1.1, y: -2 }}
                className="p-2 rounded-lg bg-[#2a2a2a] text-gray-400 hover:text-[#f9c200] hover:bg-[#3a3a3a] transition-all"
                title={social.label}
              >
                <social.icon size={20} />
              </motion.a>
            ))}
          </div>
          
          {/* Copyright */}
          <p className="text-gray-600 text-xs uppercase">
            © 2025 DVIZH BISHKEK
          </p>
        </div>
      </div>
    </footer>
  );
};

export default FooterMinimal;