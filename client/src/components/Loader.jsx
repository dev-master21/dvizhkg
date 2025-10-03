import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const Loader = ({ fullScreen = true }) => {
  const containerClass = fullScreen 
    ? "fixed inset-0 bg-[#0a0a0a] flex items-center justify-center z-50"
    : "flex items-center justify-center p-8";

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className={containerClass}
      >
        <div className="flex flex-col items-center justify-center">
          {/* Logo with simple fade animation */}
          <motion.div
            animate={{ 
              opacity: [0.5, 1, 0.5],
            }}
            transition={{ 
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="mb-8"
          >
            <img 
              src="/logo.svg" 
              alt="DVIZH BISHKEK"
              className="h-48 w-auto"
            />
          </motion.div>

          {/* Loading text */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-center"
          >
            <p className="text-white font-bold text-lg mb-2">Загружаем движуху...</p>
            
            {/* Simple progress bar */}
            <div className="w-48 h-1 bg-gray-800 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-[#f9c200]"
                animate={{ x: ['-100%', '100%'] }}
                transition={{ 
                  duration: 1.5,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              />
            </div>
          </motion.div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default Loader;