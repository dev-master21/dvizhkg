import React, { useState, useEffect } from 'react';
import { Clock, Calendar, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const CountdownTimer = ({ targetDate, compact = false }) => {
  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());
  const [isUrgent, setIsUrgent] = useState(false);

  function calculateTimeLeft() {
    const difference = new Date(targetDate) - new Date();
    
    if (difference <= 0) {
      return { expired: true };
    }

    const days = Math.floor(difference / (1000 * 60 * 60 * 24));
    const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((difference % (1000 * 60)) / 1000);

    return { days, hours, minutes, seconds, expired: false };
  }

  useEffect(() => {
    const timer = setInterval(() => {
      const newTimeLeft = calculateTimeLeft();
      setTimeLeft(newTimeLeft);
      
      // Check if urgent (less than 1 hour)
      if (!newTimeLeft.expired && newTimeLeft.days === 0 && newTimeLeft.hours === 0) {
        setIsUrgent(true);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [targetDate]);

  if (timeLeft.expired) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className={`flex items-center gap-2 ${compact ? 'text-sm' : 'text-base'}`}
      >
        <AlertCircle className="text-red-500" size={compact ? 16 : 20} />
        <span className="text-red-500 font-semibold">Событие началось!</span>
      </motion.div>
    );
  }

  if (compact) {
    return (
      <motion.div 
        className="flex items-center gap-2 text-white"
        animate={isUrgent ? { scale: [1, 1.05, 1] } : {}}
        transition={{ duration: 1, repeat: Infinity }}
      >
        <Clock className={isUrgent ? 'text-red-500' : 'text-[#f9c200]'} size={14} />
        <span className={`font-bold ${isUrgent ? 'text-red-500' : ''}`}>
          {timeLeft.days > 0 && `${timeLeft.days}д `}
          {timeLeft.hours}ч {timeLeft.minutes}м
        </span>
      </motion.div>
    );
  }

  return (
    <div className="glass rounded-2xl p-6 border border-[#f9c200]/20">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-[#f9c200]/10 rounded-lg">
          <Calendar className="text-[#f9c200]" size={24} />
        </div>
        <h3 className="text-xl font-bold text-white">До начала события</h3>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {[
          { value: timeLeft.days, label: 'Дней' },
          { value: timeLeft.hours, label: 'Часов' },
          { value: timeLeft.minutes, label: 'Минут' },
          { value: timeLeft.seconds, label: 'Секунд' }
        ].map((item, index) => (
          <motion.div
            key={index}
            className={`text-center p-4 rounded-xl ${
              isUrgent && index >= 2 
                ? 'bg-red-500/10 border border-red-500/20' 
                : 'bg-black/30 border border-gray-800'
            }`}
            animate={
              isUrgent && index === 3 
                ? { scale: [1, 1.05, 1] }
                : {}
            }
            transition={{ duration: 1, repeat: Infinity }}
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={item.value}
                initial={{ y: -10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 10, opacity: 0 }}
                className={`text-3xl font-black ${
                  isUrgent && index >= 2 ? 'text-red-500 glow-text' : 'text-[#f9c200]'
                }`}
              >
                {String(item.value).padStart(2, '0')}
              </motion.div>
            </AnimatePresence>
            <p className="text-xs text-gray-400 mt-1">{item.label}</p>
          </motion.div>
        ))}
      </div>

      {isUrgent && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-2"
        >
          <AlertCircle className="text-red-500" size={20} />
          <p className="text-red-500 text-sm font-semibold">
            Событие скоро начнется! Не опаздывай!
          </p>
        </motion.div>
      )}
    </div>
  );
};

export default CountdownTimer;