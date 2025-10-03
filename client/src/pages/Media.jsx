import React, { useState, useEffect } from 'react';
import { useQuery } from 'react-query';
import { 
  Image, Video, Upload, Search, Grid, 
  Maximize2, Download, Heart, MessageCircle,
  Lock, LogIn, Camera, Film, X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import axios from '../utils/axios';
import { useAuthStore } from '../stores/authStore';
import Loader from '../components/Loader';
import toast from 'react-hot-toast';

const Media = () => {
  const { isAuthenticated, user } = useAuthStore();
  const [selectedMedia, setSelectedMedia] = useState(null);
  const [filterType, setFilterType] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const isAdmin = user?.role === 'admin';

  const { data: mediaItems = [], isLoading, refetch } = useQuery(
    ['media', filterType],
    () => axios.get('/api/media').then(res => res.data),
    {
      enabled: isAuthenticated,
      refetchInterval: 30000,
    }
  );

  const handleUpload = async (e) => {
    if (!isAdmin) {
      toast.error('Только администраторы могут загружать медиа');
      return;
    }

    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setUploadingMedia(true);
    const formData = new FormData();
    files.forEach(file => formData.append('media', file));

    try {
      await axios.post('/api/media/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      toast.success('Медиа успешно загружено!');
      refetch();
    } catch (error) {
      toast.error('Ошибка загрузки медиа');
    } finally {
      setUploadingMedia(false);
    }
  };

  const filteredMedia = mediaItems.filter(item => {
    const matchesType = filterType === 'all' || item.media_type === filterType;
    const matchesSearch = !searchQuery || 
      item.event_title?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesType && matchesSearch;
  });

  // Если не авторизован - показываем контент с модалкой
  if (!isAuthenticated) {
    return (
      <>
        {/* Blurred background content */}
        <div className="container mx-auto px-4 pt-24 pb-12 filter blur-sm pointer-events-none">
          <div className="text-center mb-8">
            <h1 className="text-5xl md:text-6xl font-black text-white mb-4">
              Медиа DVIZH
            </h1>
            <p className="text-gray-400 text-lg">
              Фото и видео с наших движух
            </p>
          </div>

          {/* Mock grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="aspect-square bg-gray-800 rounded-xl animate-pulse" />
            ))}
          </div>
        </div>

        {/* Auth Modal */}
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="glass rounded-2xl p-8 max-w-md w-full border border-[#f9c200]/20"
          >
            <div className="text-center space-y-6">
              {/* Icon */}
              <div className="inline-block p-6 bg-[#f9c200]/10 rounded-full">
                <Lock className="text-[#f9c200]" size={48} />
              </div>

              {/* Title */}
              <div>
                <h2 className="text-3xl font-black text-white mb-2">
                  Медиа только для своих
                </h2>
                <p className="text-gray-400">
                  Фото и видео с наших движух доступны только авторизованным пользователям
                </p>
              </div>

              {/* Features */}
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 bg-black/30 rounded-xl">
                  <Camera className="text-[#f9c200]" size={20} />
                  <span className="text-white">Эксклюзивные фото с событий</span>
                </div>
                <div className="flex items-center gap-3 p-3 bg-black/30 rounded-xl">
                  <Film className="text-[#f9c200]" size={20} />
                  <span className="text-white">Видео с лучших моментов</span>
                </div>
              </div>

              {/* Actions */}
              <div className="space-y-3">
                <Link
                  to="/login"
                  state={{ from: { pathname: '/media' } }}
                  className="w-full btn-primary flex items-center justify-center gap-2"
                >
                  <LogIn size={20} />
                  <span>Войти через Telegram</span>
                </Link>
                
                <Link
                  to="/events"
                  className="w-full btn-secondary block text-center"
                >
                  Вернуться к событиям
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </>
    );
  }

  if (isLoading) {
    return <Loader fullScreen={false} />;
  }

  return (
    <div className="container mx-auto px-4 pt-24 pb-12">
      {/* Header */}
      <div className="mb-12">
        <div className="text-center mb-8">
          <h1 className="text-5xl md:text-6xl font-black text-white mb-4">
            Медиа DVIZH
          </h1>
          <p className="text-gray-400 text-lg">
            Фото и видео с наших движух
          </p>
        </div>

        {/* Controls */}
        <div className="glass rounded-2xl p-6 border border-[#f9c200]/10 space-y-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Поиск по событиям..."
                className="input pl-12 w-full"
              />
            </div>

            {/* Upload Button */}
            {isAdmin && (
              <label className="btn-primary flex items-center gap-2 cursor-pointer">
                <Upload size={20} />
                <span>Загрузить медиа</span>
                <input
                  type="file"
                  multiple
                  accept="image/*,video/*"
                  onChange={handleUpload}
                  className="hidden"
                />
              </label>
            )}
          </div>

          {/* Filters */}
          <div className="flex gap-2">
            {[
              { value: 'all', label: 'Все', icon: Grid },
              { value: 'photo', label: 'Фото', icon: Image },
              { value: 'video', label: 'Видео', icon: Video }
            ].map((filter) => {
              const Icon = filter.icon;
              const isActive = filterType === filter.value;
              
              return (
                <button
                  key={filter.value}
                  onClick={() => setFilterType(filter.value)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl font-semibold transition-all ${
                    isActive
                      ? 'bg-[#f9c200] text-black'
                      : 'bg-black/30 text-gray-400 hover:text-white border border-gray-800'
                  }`}
                >
                  <Icon size={16} />
                  <span>{filter.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Media Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredMedia.map((item, index) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.05 }}
            onClick={() => setSelectedMedia(item)}
            className="group relative cursor-pointer"
          >
            <div className="relative aspect-square rounded-xl overflow-hidden bg-black/50">
              {item.media_type === 'video' ? (
                <>
                  <video
                    src={`${import.meta.env.VITE_API_URL}${item.file_url}`}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                    <Video className="text-white" size={32} />
                  </div>
                </>
              ) : (
                <img
                  src={`${import.meta.env.VITE_API_URL}${item.thumbnail_url || item.file_url}`}
                  alt={item.event_title}
                  className="w-full h-full object-cover"
                />
              )}

              {/* Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="absolute bottom-0 left-0 right-0 p-4">
                  <p className="text-white font-semibold">
                    {item.event_title}
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Empty State */}
      {filteredMedia.length === 0 && (
        <div className="text-center py-20">
          <Camera className="mx-auto text-gray-600 mb-6" size={80} />
          <h3 className="text-2xl font-bold text-gray-400 mb-3">
            Нет медиа
          </h3>
          <p className="text-gray-500">
            Пока здесь пусто. Скоро появятся фото и видео!
          </p>
        </div>
      )}
    </div>
  );
};

export default Media;