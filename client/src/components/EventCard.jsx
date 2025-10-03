import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Calendar, Users, MapPin, DollarSign, 
  Clock, ChevronRight, Sparkles, Zap,
  CheckCircle, XCircle, AlertCircle  // ✅ CheckCircle2 -> CheckCircle
} from 'lucide-react';
import { motion } from 'framer-motion';
import CountdownTimer from './CountdownTimer';

const EventCard = ({ event, index, viewMode = 'grid' }) => {
  const getStatusConfig = () => {
    switch (event.status) {
      case 'upcoming':
        return {
          bgColor: 'bg-gradient-to-r from-green-500/20 to-green-500/10',
          borderColor: 'border-green-500/30',
          textColor: 'text-green-400',
          icon: <CheckCircle size={16} />,  // ✅ CheckCircle2 -> CheckCircle
          text: 'Ожидается',
          glow: 'shadow-green-500/20'
        };
      case 'completed':
        return {
          bgColor: 'bg-gradient-to-r from-gray-600/20 to-gray-600/10',
          borderColor: 'border-gray-600/30',
          textColor: 'text-gray-400',
          icon: <Clock size={16} />,
          text: 'Завершено',
          glow: 'shadow-gray-600/20'
        };
      case 'cancelled':
        return {
          bgColor: 'bg-gradient-to-r from-red-500/20 to-red-500/10',
          borderColor: 'border-red-500/30',
          textColor: 'text-red-400',
          icon: <XCircle size={16} />,
          text: 'Отменено',
          glow: 'shadow-red-500/20'
        };
      default:
        return {};
    }
  };

  // ... остальной код остается таким же ...

  const statusConfig = getStatusConfig();
  const isFree = !event.price || event.price === 0;

  if (viewMode === 'list') {
    return (
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: index * 0.05 }}
      >
        <Link to={`/events/${event.id}`}>
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="group card flex items-center gap-6 p-6"
          >
            {/* Image */}
            {event.preview_image && (
              <div className="relative w-32 h-32 rounded-xl overflow-hidden flex-shrink-0">
                <img 
                  src={`${import.meta.env.VITE_API_URL}${event.preview_image}`}
                  alt={event.title}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              </div>
            )}

            {/* Content */}
            <div className="flex-1">
              <div className="flex items-start justify-between mb-3">
                <h3 className="text-xl font-bold text-white group-hover:text-[#f9c200] transition-colors">
                  {event.title}
                </h3>
                <span className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold ${statusConfig.bgColor} ${statusConfig.borderColor} ${statusConfig.textColor} border`}>
                  {statusConfig.icon}
                  {statusConfig.text}
                </span>
              </div>

              <p className="text-gray-400 text-sm mb-3 line-clamp-1">
                {event.description}
              </p>

              <div className="flex items-center gap-4 text-sm">
                <span className="flex items-center gap-1 text-gray-300">
                  <Calendar className="text-[#f9c200]" size={14} />
                  {new Date(event.event_date).toLocaleDateString('ru-RU')}
                </span>
                <span className="flex items-center gap-1 text-gray-300">
                  <Users className="text-[#f9c200]" size={14} />
                  {event.participant_count || 0}
                </span>
                <span className="flex items-center gap-1 text-gray-300">
                  <DollarSign className="text-[#f9c200]" size={14} />
                  {isFree ? 'Бесплатно' : `${event.price} сом`}
                </span>
              </div>
            </div>

            {/* Arrow */}
            <ChevronRight className="text-gray-400 group-hover:text-[#f9c200] group-hover:translate-x-1 transition-all" size={24} />
          </motion.div>
        </Link>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      whileHover={{ y: -5 }}
      className="group"
    >
      <Link to={`/events/${event.id}`}>
        <div className="card gradient-border h-full">
          {/* Preview Image */}
          {event.preview_image && (
            <div className="relative h-56 -m-6 mb-4 overflow-hidden rounded-t-2xl">
              <img 
                src={`${import.meta.env.VITE_API_URL}${event.preview_image}`}
                alt={event.title}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
              
              {/* Status Badge */}
              <div className="absolute top-4 left-4">
                <span className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold ${statusConfig.bgColor} ${statusConfig.borderColor} ${statusConfig.textColor} border backdrop-blur-sm`}>
                  {statusConfig.icon}
                  {statusConfig.text}
                </span>
              </div>

              {/* Countdown Timer */}
              {event.status === 'upcoming' && (
                <div className="absolute top-4 right-4 bg-black/70 backdrop-blur-sm rounded-lg px-3 py-2">
                  <CountdownTimer targetDate={event.event_date} compact />
                </div>
              )}

              {/* Free Badge */}
              {isFree && (
                <div className="absolute bottom-4 right-4">
                  <motion.div
                    animate={{ rotate: [0, 5, -5, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="bg-gradient-to-r from-[#f9c200] to-[#ffdd44] text-black px-3 py-1 rounded-lg font-bold text-sm flex items-center gap-1"
                  >
                    <Sparkles size={14} />
                    БЕСПЛАТНО
                  </motion.div>
                </div>
              )}
            </div>
          )}

          {/* Content */}
          <div className="space-y-4">
            {/* Title */}
            <h3 className="text-xl font-bold text-white group-hover:text-[#f9c200] transition-colors line-clamp-2">
              {event.title}
            </h3>

            {/* Description */}
            {event.description && (
              <p className="text-gray-400 text-sm line-clamp-2">
                {event.description}
              </p>
            )}

            {/* Info Grid */}
            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center gap-2 text-sm">
                <div className="p-1.5 bg-[#f9c200]/10 rounded-lg">
                  <Calendar className="text-[#f9c200]" size={14} />
                </div>
                <span className="text-gray-300">
                  {new Date(event.event_date).toLocaleDateString('ru-RU', {
                    day: 'numeric',
                    month: 'short'
                  })}
                </span>
              </div>
              
              <div className="flex items-center gap-2 text-sm">
                <div className="p-1.5 bg-[#f9c200]/10 rounded-lg">
                  <Users className="text-[#f9c200]" size={14} />
                </div>
                <span className="text-gray-300">
                  {event.participant_count || 0}
                  {event.max_participants && ` / ${event.max_participants}`}
                </span>
              </div>
              
              {!isFree && (
                <div className="flex items-center gap-2 text-sm">
                  <div className="p-1.5 bg-[#f9c200]/10 rounded-lg">
                    <DollarSign className="text-[#f9c200]" size={14} />
                  </div>
                  <span className="text-gray-300 font-semibold">
                    {event.price} сом
                  </span>
                </div>
              )}
              
              {event.location_url && (
                <div className="flex items-center gap-2 text-sm">
                  <div className="p-1.5 bg-[#f9c200]/10 rounded-lg">
                    <MapPin className="text-[#f9c200]" size={14} />
                  </div>
                  <span className="text-gray-300">Есть локация</span>
                </div>
              )}
            </div>

            {/* Action Button */}
            <div className="pt-4 border-t border-gray-800">
              <div className="flex items-center justify-between">
                <span className="text-[#f9c200] font-semibold text-sm group-hover:text-[#ffdd44] transition-colors">
                  Подробнее
                </span>
                <motion.div
                  className="p-2 bg-[#f9c200]/10 rounded-lg group-hover:bg-[#f9c200]/20 transition-colors"
                  whileHover={{ scale: 1.1 }}
                >
                  <ChevronRight className="text-[#f9c200]" size={20} />
                </motion.div>
              </div>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
};

export default EventCard;