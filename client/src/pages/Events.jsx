import React, { useState, useMemo } from 'react';
import { useQuery } from 'react-query';
import { 
  Plus, Calendar, Search, Star, Clock, TrendingUp,
  Filter, Grid3x3, List, MapPin, Users, ChevronRight, 
  Sparkles, X, SlidersHorizontal, ArrowUpDown, Zap,
  CalendarDays, DollarSign, Trophy, History
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from '../utils/axios';
import { useAuthStore } from '../stores/authStore';
import EventCard from '../components/EventCard';
import EventModal from '../components/EventModal';
import Loader from '../components/Loader';

const Events = () => {
  const { user, isAuthenticated } = useAuthStore();
  const isAdmin = user?.role === 'admin';
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('grid');
  const [sortBy, setSortBy] = useState('date');
  const [showFilters, setShowFilters] = useState(false);
  const [priceFilter, setPriceFilter] = useState('all');

  // Загрузка событий
  const { data: events = [], isLoading, refetch } = useQuery(
    ['events'],
    () => {
    const endpoint = isAuthenticated ? '/api/events' : '/api/events/public/all';
      return axios.get(endpoint).then(res => res.data);
    },
    {
      refetchInterval: 30000,
    }
  );

  // Фильтрация и сортировка событий
  const processedEvents = useMemo(() => {
    let filtered = events.filter(event => {
      const matchesStatus = filterStatus === 'all' || event.status === filterStatus;
      const matchesSearch = event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           event.description?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesPrice = priceFilter === 'all' || 
                          (priceFilter === 'free' && (!event.price || event.price === 0)) ||
                          (priceFilter === 'paid' && event.price > 0);
      return matchesStatus && matchesSearch && matchesPrice;
    });

    // Сортировка
    filtered.sort((a, b) => {
      const statusOrder = { upcoming: 0, completed: 1, cancelled: 2 };
      if (statusOrder[a.status] !== statusOrder[b.status]) {
        return statusOrder[a.status] - statusOrder[b.status];
      }

      switch(sortBy) {
        case 'popularity':
          return (b.participant_count || 0) - (a.participant_count || 0);
        case 'price':
          return (a.price || 0) - (b.price || 0);
        default:
          return new Date(b.event_date) - new Date(a.event_date);
      }
    });

    return filtered;
  }, [events, filterStatus, searchQuery, priceFilter, sortBy]);

  const upcomingEvents = processedEvents.filter(e => e.status === 'upcoming');
  const pastEvents = processedEvents.filter(e => e.status !== 'upcoming');

  // Статистика
  const stats = useMemo(() => ({
    total: events.length,
    upcoming: events.filter(e => e.status === 'upcoming').length,
    completed: events.filter(e => e.status === 'completed').length,
    thisWeek: events.filter(e => {
      const eventDate = new Date(e.event_date);
      const now = new Date();
      const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      return eventDate >= now && eventDate <= weekFromNow;
    }).length
  }), [events]);

  if (isLoading && events.length === 0) {
    return <Loader fullScreen={false} />;
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] relative">
      {/* Animated background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-80 h-80 bg-[#f9c200]/5 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-40 -right-40 w-80 h-80 bg-[#f9c200]/5 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>

      <div className="container mx-auto px-4 pt-20 md:pt-24 pb-12 relative z-10">
        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 md:mb-12"
        >
          <div className="text-center mb-6 md:mb-8">
            <motion.h1
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="text-3xl sm:text-5xl md:text-7xl font-black text-white mb-2 md:mb-4 uppercase"
            >
              СОБЫТИЯ DVIZH
            </motion.h1>
            <motion.p
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-gray-400 text-sm sm:text-base md:text-lg uppercase px-4"
            >
              ВСЕ ДВИЖУХИ БИШКЕКА
            </motion.p>
          </div>

          {/* Stats Cards - Адаптивная сетка */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4 mb-6 md:mb-8"
          >
            {[
              { label: 'ВСЕГО', value: stats.total, icon: CalendarDays, color: 'from-blue-500/20 to-blue-500/10' },
              { label: 'ОЖИДАЕТСЯ', value: stats.upcoming, icon: Clock, color: 'from-green-500/20 to-green-500/10' },
              { label: 'ПРОШЕДШИЕ', value: stats.completed, icon: History, color: 'from-purple-500/20 to-purple-500/10' },
              { label: 'НА ЭТОЙ НЕДЕЛЕ', value: stats.thisWeek, icon: Zap, color: 'from-[#f9c200]/20 to-[#f9c200]/10' }
            ].map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4 + index * 0.1 }}
                className={`relative overflow-hidden rounded-xl sm:rounded-2xl bg-gradient-to-br ${stat.color} border border-white/5 p-3 sm:p-4 md:p-6`}
              >
                <div className="relative z-10">
                  <stat.icon className="text-white/40 mb-1 sm:mb-2" size={20} />
                  <div className="text-xl sm:text-2xl md:text-3xl font-black text-white">{stat.value}</div>
                  <div className="text-[10px] sm:text-xs text-gray-400 uppercase mt-0.5 sm:mt-1">{stat.label}</div>
                </div>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                  className="absolute -bottom-4 -right-4 sm:-bottom-6 sm:-right-6 opacity-10"
                >
                  <stat.icon size={60} className="text-white hidden sm:block" />
                </motion.div>
              </motion.div>
            ))}
          </motion.div>

          {/* Controls Section - Улучшенная мобильная версия */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="glass rounded-xl md:rounded-2xl p-4 md:p-6 border border-[#f9c200]/10 space-y-4 md:space-y-6"
          >
            {/* Search Bar - Полная ширина на мобильных */}
            <div className="w-full relative">
              <Search className="absolute left-3 md:left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ПОИСК..."
                className="input pl-10 md:pl-12 pr-10 w-full uppercase text-sm md:text-base"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 md:right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition"
                >
                  <X size={18} />
                </button>
              )}
            </div>
            
            {/* Control Buttons - Адаптивная сетка */}
            <div className="flex flex-wrap gap-2">
              {/* View Mode - Скрытый на маленьких экранах */}
              <div className="hidden sm:flex bg-black/30 rounded-xl p-1 border border-gray-800">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-lg transition ${
                    viewMode === 'grid' ? 'bg-[#f9c200] text-black' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  <Grid3x3 size={18} />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-lg transition ${
                    viewMode === 'list' ? 'bg-[#f9c200] text-black' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  <List size={18} />
                </button>
              </div>

              {/* Filters Toggle */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`px-3 py-2 rounded-xl font-semibold text-sm transition flex items-center gap-1.5 flex-1 sm:flex-initial justify-center ${
                  showFilters ? 'bg-[#f9c200] text-black' : 'bg-black/30 text-gray-400 hover:text-white border border-gray-800'
                }`}
              >
                <SlidersHorizontal size={18} />
                <span className="uppercase">ФИЛЬТРЫ</span>
              </button>

              {/* Sort - Адаптивный селект */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-2 bg-black/30 text-white text-sm rounded-xl border border-gray-800 focus:border-[#f9c200] outline-none uppercase flex-1 sm:flex-initial"
              >
                <option value="date">ДАТА</option>
                <option value="popularity">ПОПУЛЯРНОСТЬ</option>
                <option value="price">ЦЕНА</option>
              </select>

              {/* Admin Create Button */}
              {isAdmin && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowCreateModal(true)}
                  className="btn-primary flex items-center gap-1.5 px-4 py-2 text-sm uppercase w-full sm:w-auto justify-center"
                >
                  <Plus size={18} />
                  <span>СОЗДАТЬ</span>
                </motion.button>
              )}
            </div>

            {/* Expandable Filters - Адаптивные фильтры */}
            <AnimatePresence>
              {showFilters && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="space-y-4 overflow-hidden"
                >
                  {/* Status Filters */}
                  <div>
                    <p className="text-gray-400 text-xs sm:text-sm mb-2 uppercase">СТАТУС</p>
                    <div className="flex flex-wrap gap-1.5 sm:gap-2">
                      {[
                        { value: 'all', label: 'ВСЕ', count: events.length },
                        { value: 'upcoming', label: 'СКОРО', count: events.filter(e => e.status === 'upcoming').length },
                        { value: 'completed', label: 'ПРОШЛИ', count: events.filter(e => e.status === 'completed').length },
                        { value: 'cancelled', label: 'ОТМЕНА', count: events.filter(e => e.status === 'cancelled').length }
                      ].map((filter) => (
                        <motion.button
                          key={filter.value}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => setFilterStatus(filter.value)}
                          className={`px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-1 sm:gap-2 uppercase ${
                            filterStatus === filter.value
                              ? 'bg-[#f9c200] text-black'
                              : 'bg-black/30 text-gray-400 hover:text-white border border-gray-800'
                          }`}
                        >
                          <span>{filter.label}</span>
                          <span className={`text-[10px] sm:text-xs ${
                            filterStatus === filter.value ? 'text-black/60' : 'text-gray-500'
                          }`}>
                            {filter.count}
                          </span>
                        </motion.button>
                      ))}
                    </div>
                  </div>

                  {/* Price Filters */}
                  <div>
                    <p className="text-gray-400 text-xs sm:text-sm mb-2 uppercase">ЦЕНА</p>
                    <div className="flex flex-wrap gap-1.5 sm:gap-2">
                      {[
                        { value: 'all', label: 'ЛЮБАЯ', icon: DollarSign },
                        { value: 'free', label: 'FREE', icon: Sparkles },
                        { value: 'paid', label: 'ПЛАТНО', icon: Trophy }
                      ].map((filter) => (
                        <motion.button
                          key={filter.value}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => setPriceFilter(filter.value)}
                          className={`px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-1 sm:gap-2 uppercase ${
                            priceFilter === filter.value
                              ? 'bg-[#f9c200] text-black'
                              : 'bg-black/30 text-gray-400 hover:text-white border border-gray-800'
                          }`}
                        >
                          <filter.icon size={14} />
                          <span>{filter.label}</span>
                        </motion.button>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </motion.div>

        {/* Events Section - Без сайдбара */}
        <div className="space-y-6 md:space-y-8">
          {/* Upcoming Events */}
          {upcomingEvents.length > 0 && (
            <motion.section
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
            >
              <h2 className="text-xl sm:text-2xl font-bold text-white mb-4 md:mb-6 uppercase flex items-center gap-2 sm:gap-3">
                <motion.div
                  animate={{ rotate: [0, 360] }}
                  transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                >
                  <Sparkles className="text-[#f9c200]" size={20} />
                </motion.div>
                БЛИЖАЙШИЕ СОБЫТИЯ
              </h2>
              
              {/* Адаптивная сетка для карточек */}
              <div className={
                viewMode === 'grid' 
                  ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6' 
                  : 'space-y-3 md:space-y-4'
              }>
                <AnimatePresence>
                  {upcomingEvents.map((event, index) => (
                    <EventCard 
                      key={event.id} 
                      event={event} 
                      index={index}
                      viewMode={viewMode}
                    />
                  ))}
                </AnimatePresence>
              </div>
            </motion.section>
          )}

          {/* Past Events */}
          {pastEvents.length > 0 && (
            <motion.section
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
            >
              <h2 className="text-xl sm:text-2xl font-bold text-gray-400 mb-4 md:mb-6 uppercase">
                ПРОШЕДШИЕ СОБЫТИЯ
              </h2>
              
              <div className={
                viewMode === 'grid' 
                  ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6' 
                  : 'space-y-3 md:space-y-4'
              }>
                <AnimatePresence>
                  {pastEvents.map((event, index) => (
                    <EventCard 
                      key={event.id} 
                      event={event} 
                      index={index + upcomingEvents.length}
                      viewMode={viewMode}
                    />
                  ))}
                </AnimatePresence>
              </div>
            </motion.section>
          )}

          {/* Empty State */}
          {processedEvents.length === 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-12 md:py-20"
            >
              <motion.div
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="inline-block mb-4 md:mb-6"
              >
                <Calendar className="text-gray-600" size={60} />
              </motion.div>
              <h3 className="text-xl sm:text-2xl font-bold text-gray-400 mb-2 md:mb-3 uppercase">
                {searchQuery ? 'НИЧЕГО НЕ НАЙДЕНО' : 'НЕТ СОБЫТИЙ'}
              </h3>
              <p className="text-sm sm:text-base text-gray-500 uppercase px-4">
                {searchQuery 
                  ? 'ИЗМЕНИТЕ ПАРАМЕТРЫ ПОИСКА' 
                  : 'СКОРО ПОЯВЯТСЯ НОВЫЕ'}
              </p>
            </motion.div>
          )}
        </div>

        {/* Create Event Modal */}
        {isAdmin && (
          <EventModal 
            isOpen={showCreateModal}
            onClose={() => setShowCreateModal(false)}
            onSuccess={() => {
              refetch();
              setShowCreateModal(false);
            }}
          />
        )}
      </div>
    </div>
  );
};

export default Events;