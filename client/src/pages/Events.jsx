import React, { useState } from 'react';
import { useQuery } from 'react-query';
import { 
  Plus, Calendar, Search, Star, Clock,
  TrendingUp, Filter, Grid, List, MapPin,
  Users, ChevronRight, CheckCircle, XCircle, X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from '../utils/axios';
import { useAuthStore } from '../stores/authStore';
import EventCard from '../components/EventCard';
import EventModal from '../components/EventModal';
import UserTable from '../components/UserTable';
import Loader from '../components/Loader';

const Events = () => {
  const { user, isAuthenticated } = useAuthStore();
  const isAdmin = user?.role === 'admin';
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('grid');

  // Загрузка событий
  const { data: events = [], isLoading, refetch } = useQuery(
    ['events'],  // Убираем filterStatus из ключа, чтобы не перезагружать
    () => {
      const endpoint = isAuthenticated ? '/api/events' : '/api/events/public';
      return axios.get(endpoint).then(res => res.data);
    },
    {
      refetchInterval: 30000,
    }
  );

  // Загрузка топ пользователей
  const { data: topUsers = [] } = useQuery(
    'topUsers',
    () => {
      const endpoint = isAuthenticated ? '/api/users/top' : '/api/users/top/public';
      return axios.get(endpoint).then(res => res.data);
    }
  );

  const filteredEvents = events.filter(event => {
    const matchesStatus = filterStatus === 'all' || event.status === filterStatus;
    const matchesSearch = event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          event.description?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const sortedEvents = [...filteredEvents].sort((a, b) => {
    const statusOrder = { upcoming: 0, completed: 1, cancelled: 2 };
    if (statusOrder[a.status] !== statusOrder[b.status]) {
      return statusOrder[a.status] - statusOrder[b.status];
    }
    return new Date(b.event_date) - new Date(a.event_date);
  });

  const upcomingEvents = sortedEvents.filter(e => e.status === 'upcoming');
  const pastEvents = sortedEvents.filter(e => e.status !== 'upcoming');

  // Показываем лоадер только при первой загрузке
  if (isLoading && events.length === 0) {
    return <Loader fullScreen={false} />;
  }

  return (
    <div className="container mx-auto px-4 pt-24 pb-12">
      {/* Header Section */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-12"
      >
        <div className="text-center mb-8">
          <h1 className="text-5xl md:text-6xl font-black text-white mb-4">
            События DVIZH
          </h1>
          <p className="text-gray-400 text-lg">
            Все движухи Бишкека в одном месте
          </p>
        </div>

        {/* Controls Section */}
        <div className="glass rounded-2xl p-6 border border-[#f9c200]/10 space-y-6">
          {/* Search and Create */}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Поиск событий..."
                className="input pl-12 w-full"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                >
                  <X size={20} />
                </button>
              )}
            </div>
            
            {isAdmin && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="btn-primary flex items-center gap-2 px-6"
              >
                <Plus size={20} />
                <span>Создать событие</span>
              </button>
            )}
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-2">
            {[
              { value: 'all', label: 'Все' },
              { value: 'upcoming', label: 'Ожидаются' },
              { value: 'completed', label: 'Завершенные' },
              { value: 'cancelled', label: 'Отмененные' }
            ].map((filter) => {
              const isActive = filterStatus === filter.value;
              
              return (
                <button
                  key={filter.value}
                  onClick={() => setFilterStatus(filter.value)}
                  className={`px-4 py-2 rounded-xl font-semibold transition-all ${
                    isActive
                      ? 'bg-[#f9c200] text-black'
                      : 'bg-black/30 text-gray-400 hover:text-white border border-gray-800'
                  }`}
                >
                  {filter.label}
                </button>
              );
            })}
          </div>
        </div>
      </motion.div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Events Section */}
        <div className="lg:col-span-2 space-y-8">
          {/* Upcoming Events */}
          {upcomingEvents.length > 0 && (
            <section>
              <h2 className="text-2xl font-bold text-white mb-6">
                Ближайшие события
              </h2>
              
              <div className="grid gap-6">
                {upcomingEvents.map((event, index) => (
                  <EventCard 
                    key={event.id} 
                    event={event} 
                    index={index}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Past Events */}
          {pastEvents.length > 0 && (
            <section>
              <h2 className="text-2xl font-bold text-gray-400 mb-6">
                Прошедшие события
              </h2>
              
              <div className="grid gap-6">
                {pastEvents.map((event, index) => (
                  <EventCard 
                    key={event.id} 
                    event={event} 
                    index={index + upcomingEvents.length}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Empty State */}
          {sortedEvents.length === 0 && (
            <div className="text-center py-20">
              <Calendar className="mx-auto text-gray-600 mb-6" size={80} />
              <h3 className="text-2xl font-bold text-gray-400 mb-3">
                {searchQuery ? 'Ничего не найдено' : 'Нет событий'}
              </h3>
              <p className="text-gray-500">
                {searchQuery 
                  ? 'Попробуйте изменить параметры поиска' 
                  : 'Скоро здесь появятся новые события'}
              </p>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1">
          <UserTable 
            users={topUsers} 
            title="Топ-20 чуваков"
          />
        </div>
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
  );
};

export default Events;