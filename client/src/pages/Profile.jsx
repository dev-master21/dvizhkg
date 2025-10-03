import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from 'react-query';
import { 
  User, Trophy, Calendar, MessageSquare, 
  Edit, Shield, Ban, Save, X, ArrowLeft
} from 'lucide-react';
import { motion } from 'framer-motion';
import axios from '../utils/axios';
import { useAuthStore } from '../stores/authStore';
import Loader from '../components/Loader';
import toast from 'react-hot-toast';
import { formatDate } from '../utils/helpers';

const Profile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user: currentUser } = useAuthStore();
  const isOwnProfile = !id || id === currentUser?.id?.toString();
  const isAdmin = currentUser?.role === 'admin';
  
  const [isEditingReputation, setIsEditingReputation] = useState(false);
  const [newReputation, setNewReputation] = useState(0);
  
  // Загрузка профиля
  const { data: user, isLoading, refetch } = useQuery(
    ['profile', id || currentUser?.id],
    () => axios.get(`/api/users/${id || currentUser?.id}`).then(res => res.data)
  );
  
  // Загрузка статистики пользователя
  const { data: stats } = useQuery(
    ['userStats', id || currentUser?.id],
    () => axios.get(`/api/users/${id || currentUser?.id}/stats`).then(res => res.data)
  );
  
  // Обновление репутации
  const updateReputationMutation = useMutation(
    (reputation) => axios.put(`/api/users/${user.id}/reputation`, { reputation }),
    {
      onSuccess: () => {
        refetch();
        setIsEditingReputation(false);
        toast.success('Репутация обновлена');
      }
    }
  );
  
  // Блокировка пользователя
  const blockUserMutation = useMutation(
    () => axios.post(`/api/users/${user.id}/block`),
    {
      onSuccess: () => {
        refetch();
        toast.success('Пользователь заблокирован и удален из чата');
      }
    }
  );
  
  // Разблокировка пользователя
  const unblockUserMutation = useMutation(
    () => axios.post(`/api/users/${user.id}/unblock`),
    {
      onSuccess: () => {
        refetch();
        toast.success('Пользователь разблокирован');
      }
    }
  );
  
  const handleReputationEdit = () => {
    setNewReputation(user.reputation);
    setIsEditingReputation(true);
  };
  
  const handleReputationSave = () => {
    if (newReputation < 0) {
      toast.error('Репутация не может быть отрицательной');
      return;
    }
    updateReputationMutation.mutate(newReputation);
  };
  
  if (isLoading) {
    return <Loader fullScreen={false} />;
  }
  
  if (!user) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <h2 className="text-2xl font-bold text-gray-400">Пользователь не найден</h2>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4">
      {/* Back button */}
      {!isOwnProfile && (
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-[#f9c200] mb-6 hover:opacity-80 transition"
        >
          <ArrowLeft size={20} />
          <span className="font-bold">Назад</span>
        </button>
      )}
      
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main profile card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="lg:col-span-2"
        >
          <div className="bg-[#2a2a2a] rounded-2xl p-6 border border-[#3a3a3a]">
            {/* Header */}
            <div className="flex flex-col md:flex-row items-start md:items-center gap-6 mb-6">
              {/* Avatar */}
              <div className="relative">
                {user.avatar_url ? (
                  <img 
                    src={user.avatar_url} 
                    alt={user.first_name}
                    className="w-32 h-32 rounded-full border-4 border-[#f9c200]"
                  />
                ) : (
                  <div className="w-32 h-32 rounded-full bg-gradient-to-br from-[#f9c200] to-[#ffdd44] flex items-center justify-center font-black text-4xl text-black">
                    {user.first_name?.[0] || '?'}
                  </div>
                )}
                {user.role === 'admin' && (
                  <div className="absolute -top-2 -right-2 bg-red-500 text-white px-3 py-1 rounded-lg font-bold text-sm flex items-center gap-1">
                    <Shield size={16} />
                    ADMIN
                  </div>
                )}
                {user.is_blocked && (
                  <div className="absolute -bottom-2 -right-2 bg-gray-600 text-white px-3 py-1 rounded-lg font-bold text-sm flex items-center gap-1">
                    <Ban size={16} />
                    BLOCKED
                  </div>
                )}
              </div>
              
              {/* User info */}
              <div className="flex-1">
                <h1 className="text-3xl font-black text-white mb-2">
                  {user.first_name} {user.last_name}
                </h1>
                {user.username && (
                  <p className="text-gray-400 mb-3">@{user.username}</p>
                )}
                
                {/* Reputation */}
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Trophy className="text-[#f9c200]" size={24} />
                    {isEditingReputation && isAdmin ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          value={newReputation}
                          onChange={(e) => setNewReputation(parseInt(e.target.value) || 0)}
                          className="w-20 px-2 py-1 bg-[#1d1d1d] text-white rounded border border-[#3a3a3a]"
                        />
                        <button
                          onClick={handleReputationSave}
                          className="p-1 text-green-500 hover:text-green-400"
                        >
                          <Save size={20} />
                        </button>
                        <button
                          onClick={() => setIsEditingReputation(false)}
                          className="p-1 text-red-500 hover:text-red-400"
                        >
                          <X size={20} />
                        </button>
                      </div>
                    ) : (
                      <span className="text-2xl font-black text-[#f9c200]">
                        {user.reputation} реп.
                      </span>
                    )}
                  </div>
                  
                  {isAdmin && !isOwnProfile && !isEditingReputation && (
                    <button
                      onClick={handleReputationEdit}
                      className="p-2 text-gray-400 hover:text-white transition"
                    >
                      <Edit size={18} />
                    </button>
                  )}
                </div>
              </div>
              
              {/* Admin actions */}
              {isAdmin && !isOwnProfile && (
                <div className="flex flex-col gap-2">
                  {user.is_blocked ? (
                    <button
                      onClick={() => unblockUserMutation.mutate()}
                      className="px-4 py-2 bg-green-500 text-white rounded-xl font-bold hover:bg-green-600 transition"
                    >
                      Разблокировать
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        if (window.confirm(`Заблокировать ${user.first_name}? Пользователь будет удален из чата.`)) {
                          blockUserMutation.mutate();
                        }
                      }}
                      className="px-4 py-2 bg-red-500 text-white rounded-xl font-bold hover:bg-red-600 transition"
                    >
                      Заблокировать
                    </button>
                  )}
                </div>
              )}
            </div>
            
            {/* Stats grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-[#1d1d1d] rounded-xl p-4">
                <div className="flex items-center gap-2 text-gray-400 mb-1">
                  <MessageSquare size={18} />
                  <span className="text-sm">Сообщений</span>
                </div>
                <p className="text-2xl font-bold text-white">
                  {user.message_count || 0}
                </p>
              </div>
              
              <div className="bg-[#1d1d1d] rounded-xl p-4">
                <div className="flex items-center gap-2 text-gray-400 mb-1">
                  <Trophy size={18} />
                  <span className="text-sm">Место в топе</span>
                </div>
                <p className="text-2xl font-bold text-white">
                  #{stats?.rank || '-'}
                </p>
              </div>
              
              <div className="bg-[#1d1d1d] rounded-xl p-4">
                <div className="flex items-center gap-2 text-gray-400 mb-1">
                  <Calendar size={18} />
                  <span className="text-sm">Событий</span>
                </div>
                <p className="text-2xl font-bold text-white">
                  {stats?.events_count || 0}
                </p>
              </div>
              
              <div className="bg-[#1d1d1d] rounded-xl p-4">
                <div className="flex items-center gap-2 text-gray-400 mb-1">
                  <User size={18} />
                  <span className="text-sm">В движе с</span>
                </div>
                <p className="text-sm font-bold text-white">
                  {formatDate(user.registration_date)}
                </p>
              </div>
            </div>
          </div>
          
          {/* Recent activity */}
          {stats?.recent_events && stats.recent_events.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="mt-6 bg-[#2a2a2a] rounded-2xl p-6 border border-[#3a3a3a]"
            >
              <h2 className="text-xl font-bold text-white mb-4">
                Последние события
              </h2>
              <div className="space-y-3">
                {stats.recent_events.map(event => (
                  <div
                    key={event.id}
                    onClick={() => navigate(`/events/${event.id}`)}
                    className="flex items-center justify-between p-3 bg-[#1d1d1d] rounded-xl hover:bg-[#3a3a3a] transition cursor-pointer"
                  >
                    <div>
                      <p className="text-white font-semibold">{event.title}</p>
                      <p className="text-gray-400 text-sm">
                        {formatDate(event.event_date)}
                      </p>
                    </div>
                    <div className={`px-3 py-1 rounded-lg text-xs font-bold ${
                      event.status === 'upcoming' ? 'bg-green-500/20 text-green-500' :
                      event.status === 'completed' ? 'bg-gray-500/20 text-gray-500' :
                      'bg-red-500/20 text-red-500'
                    }`}>
                      {event.status === 'upcoming' ? 'Ожидается' :
                       event.status === 'completed' ? 'Завершено' : 'Отменено'}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </motion.div>
        
        {/* Sidebar - Achievements */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="lg:col-span-1"
        >
          <div className="bg-[#2a2a2a] rounded-2xl p-6 border border-[#3a3a3a] sticky top-24">
            <h2 className="text-xl font-bold text-white mb-4">
              🏆 Достижения
            </h2>
            
            {/* Achievements list */}
            <div className="space-y-3">
              {user.reputation >= 100 && (
                <div className="flex items-center gap-3 p-3 bg-[#1d1d1d] rounded-xl border border-[#f9c200]/20">
                  <div className="text-3xl">💯</div>
                  <div>
                    <p className="text-white font-semibold">Сотка</p>
                    <p className="text-gray-400 text-sm">100+ репутации</p>
                  </div>
                </div>
              )}
              
              {user.reputation >= 50 && (
                <div className="flex items-center gap-3 p-3 bg-[#1d1d1d] rounded-xl border border-[#f9c200]/20">
                  <div className="text-3xl">⭐</div>
                  <div>
                    <p className="text-white font-semibold">Звезда</p>
                    <p className="text-gray-400 text-sm">50+ репутации</p>
                  </div>
                </div>
              )}
              
              {user.message_count >= 1000 && (
                <div className="flex items-center gap-3 p-3 bg-[#1d1d1d] rounded-xl border border-[#f9c200]/20">
                  <div className="text-3xl">💬</div>
                  <div>
                    <p className="text-white font-semibold">Болтун</p>
                    <p className="text-gray-400 text-sm">1000+ сообщений</p>
                  </div>
                </div>
              )}
              
              {stats?.events_count >= 10 && (
                <div className="flex items-center gap-3 p-3 bg-[#1d1d1d] rounded-xl border border-[#f9c200]/20">
                  <div className="text-3xl">🎉</div>
                  <div>
                    <p className="text-white font-semibold">Тусовщик</p>
                    <p className="text-gray-400 text-sm">10+ событий</p>
                  </div>
                </div>
              )}
              
              {user.role === 'admin' && (
                <div className="flex items-center gap-3 p-3 bg-red-500/20 rounded-xl border border-red-500/30">
                  <div className="text-3xl">👑</div>
                  <div>
                    <p className="text-white font-semibold">Организатор</p>
                    <p className="text-gray-400 text-sm">Администратор</p>
                  </div>
                </div>
              )}
              
              {/* Old timer achievement */}
              {stats?.days_in_dvizh >= 30 && (
                <div className="flex items-center gap-3 p-3 bg-[#1d1d1d] rounded-xl border border-[#f9c200]/20">
                  <div className="text-3xl">🎖️</div>
                  <div>
                    <p className="text-white font-semibold">Старожил</p>
                    <p className="text-gray-400 text-sm">{stats.days_in_dvizh} дней в движе</p>
                  </div>
                </div>
              )}
            </div>
            
            {/* Progress to next achievement */}
            {user.reputation < 50 && (
              <div className="mt-6 pt-6 border-t border-[#3a3a3a]">
                <p className="text-gray-400 text-sm mb-2">До следующего достижения</p>
                <div className="flex items-center gap-3">
                  <div className="flex-1 bg-[#1d1d1d] rounded-full h-2">
                    <div 
                      className="bg-[#f9c200] h-2 rounded-full transition-all duration-500"
                      style={{ width: `${(user.reputation / 50) * 100}%` }}
                    />
                  </div>
                  <span className="text-white font-bold text-sm">
                    {user.reputation}/50
                  </span>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Profile;