import React, { useState, useMemo } from 'react';
import { useQuery } from 'react-query';
import { 
  Image, Video, Upload, Search, Grid3x3, List,
  Lock, LogIn, Camera, Film, X, Calendar,
  SlidersHorizontal, Download, Eye, Trash2,
  Clock, Sparkles, ChevronDown, Check, Plus
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import axios from '../utils/axios';
import { useAuthStore } from '../stores/authStore';
import Loader from '../components/Loader';
import toast from 'react-hot-toast';
import { formatDate } from '../utils/helpers';

// Upload Modal Component
const MediaUploadModal = ({ isOpen, onClose, onUpload }) => {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState('none');
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrls, setPreviewUrls] = useState([]);
  
  // Загрузка событий для выбора
  const { data: events = [] } = useQuery(
    ['eventsForUpload'],
    () => axios.get('/api/events').then(res => res.data),
    { enabled: isOpen }
  );

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    setSelectedFiles(files);
    
    // Создаем превью для изображений
    const urls = files.map(file => {
      if (file.type.startsWith('image/')) {
        return URL.createObjectURL(file);
      }
      return null;
    });
    setPreviewUrls(urls);
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) {
      toast.error('ВЫБЕРИТЕ ФАЙЛЫ ДЛЯ ЗАГРУЗКИ');
      return;
    }

    setIsUploading(true);
    const formData = new FormData();
    
    selectedFiles.forEach(file => formData.append('files', file));
    
    if (selectedEventId !== 'none') {
      formData.append('event_id', selectedEventId);
    }

    try {
      await axios.post('/api/media/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      toast.success('🎉 МЕДИА ЗАГРУЖЕНЫ!');
      onUpload();
      handleClose();
    } catch (error) {
      toast.error('ОШИБКА ЗАГРУЗКИ');
    } finally {
      setIsUploading(false);
    }
  };

  const handleClose = () => {
    setSelectedFiles([]);
    setSelectedEventId('none');
    setPreviewUrls([]);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-gradient-to-br from-[#2a2a2a] to-[#1d1d1d] rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-[#3a3a3a]"
        >
          <div className="p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-black text-white uppercase">
                ЗАГРУЗИТЬ МЕДИА
              </h2>
              <button
                onClick={handleClose}
                className="text-gray-400 hover:text-white transition"
              >
                <X size={24} />
              </button>
            </div>

            {/* Event Selection */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-300 mb-2 uppercase">
                Привязать к событию (опционально)
              </label>
              <select
                value={selectedEventId}
                onChange={(e) => setSelectedEventId(e.target.value)}
                className="input w-full uppercase"
              >
                <option value="none">БЕЗ ПРИВЯЗКИ К СОБЫТИЮ</option>
                {events.filter(e => e.status !== 'cancelled').map(event => (
                  <option key={event.id} value={event.id}>
                    {event.title} ({formatDate(event.event_date)})
                  </option>
                ))}
              </select>
            </div>

            {/* File Selection */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-300 mb-2 uppercase">
                Выберите файлы
              </label>
              <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-[#3a3a3a] rounded-xl cursor-pointer hover:border-[#f9c200]/50 transition bg-black/20">
                <Upload size={40} className="text-[#f9c200] mb-2" />
                <span className="text-gray-300 uppercase">
                  {selectedFiles.length > 0 
                    ? `Выбрано файлов: ${selectedFiles.length}` 
                    : 'Нажмите для выбора файлов'}
                </span>
                <span className="text-gray-500 text-sm mt-1">
                  Максимум 20 файлов, до 100MB каждый
                </span>
                <input
                  type="file"
                  multiple
                  accept="image/*,video/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </label>
            </div>

            {/* Preview Grid */}
            {previewUrls.length > 0 && (
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-300 mb-2 uppercase">
                  Превью
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {previewUrls.map((url, index) => (
                    url && (
                      <div key={index} className="aspect-square rounded-lg overflow-hidden bg-black/30">
                        <img src={url} alt="" className="w-full h-full object-cover" />
                      </div>
                    )
                  ))}
                </div>
              </div>
            )}

            {/* Selected Files Info */}
            {selectedFiles.length > 0 && (
              <div className="mb-6 p-4 bg-black/30 rounded-xl">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400 uppercase">
                    Фото: {selectedFiles.filter(f => f.type.startsWith('image/')).length}
                  </span>
                  <span className="text-gray-400 uppercase">
                    Видео: {selectedFiles.filter(f => f.type.startsWith('video/')).length}
                  </span>
                  <span className="text-gray-400 uppercase">
                    Общий размер: {(selectedFiles.reduce((sum, f) => sum + f.size, 0) / 1024 / 1024).toFixed(2)} MB
                  </span>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={handleUpload}
                disabled={selectedFiles.length === 0 || isUploading}
                className="flex-1 btn-primary disabled:opacity-50 uppercase"
              >
                {isUploading ? 'ЗАГРУЖАЕМ...' : 'ЗАГРУЗИТЬ'}
              </button>
              <button
                onClick={handleClose}
                className="flex-1 btn-secondary uppercase"
              >
                ОТМЕНА
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

// Media Card Component
const MediaCard = ({ item, index, onClick, onDelete, isAdmin }) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.05 }}
      className="group relative"
    >
      <div 
        onClick={() => onClick(item)}
        className="relative aspect-square rounded-xl overflow-hidden bg-black/50 cursor-pointer"
      >
        {item.type === 'video' ? (
          <>
            <video
              src={`${import.meta.env.VITE_API_URL}${item.file_url || item.url}`}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
            />
            <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
              <Video className="text-white" size={32} />
            </div>
          </>
        ) : (
          <img
            src={`${import.meta.env.VITE_API_URL}${item.thumbnail_url || item.file_url || item.url}`}
            alt={item.event_title || 'Media'}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
            loading="lazy"
          />
        )}

        {/* Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="absolute bottom-0 left-0 right-0 p-4">
            {item.event_title && (
              <p className="text-white font-semibold text-sm uppercase">
                {item.event_title}
              </p>
            )}
            <p className="text-gray-300 text-xs uppercase">
              {formatDate(item.uploaded_at)}
            </p>
          </div>
        </div>

        {/* Admin Delete Button */}
        {isAdmin && onDelete && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(item.id);
            }}
            className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
          >
            <Trash2 size={16} />
          </button>
        )}
      </div>
    </motion.div>
  );
};

// Lightbox Component
const MediaLightbox = ({ media, onClose }) => {
  if (!media) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-white hover:text-[#f9c200] transition z-10"
        >
          <X size={32} />
        </button>

        <motion.div
          initial={{ scale: 0.9 }}
          animate={{ scale: 1 }}
          exit={{ scale: 0.9 }}
          className="relative max-w-6xl max-h-[90vh]"
          onClick={(e) => e.stopPropagation()}
        >
          {media.type === 'photo' ? (
            <img
              src={`${import.meta.env.VITE_API_URL}${media.url}`}
              alt=""
              className="max-w-full max-h-[90vh] object-contain rounded-xl"
            />
          ) : (
            <video
              src={`${import.meta.env.VITE_API_URL}${media.url}`}
              controls
              autoPlay
              className="max-w-full max-h-[90vh] rounded-xl"
            />
          )}

          <a 
            href={`${import.meta.env.VITE_API_URL}${media.url}`}
            download
            target="_blank"
            rel="noopener noreferrer"
            className="absolute bottom-4 right-4 p-3 bg-[#f9c200] text-black rounded-xl hover:bg-[#f9c200]/90 transition"
          >
            <Download size={20} />
          </a>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

// Main Media Component
const Media = () => {
  const { isAuthenticated, user } = useAuthStore();
  const isAdmin = user?.role === 'admin';
  
  const [selectedMedia, setSelectedMedia] = useState(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [filterType, setFilterType] = useState('all');
  const [filterEvent, setFilterEvent] = useState('all');
  const [sortBy, setSortBy] = useState('date');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState('grid');

  // Загрузка медиа
  const { data: mediaItems = [], isLoading, refetch } = useQuery(
    ['media'],
    () => axios.get('/api/media').then(res => res.data),
    {
      enabled: isAuthenticated,
      refetchInterval: 30000,
    }
  );

  // Загрузка событий для фильтра
  const { data: events = [] } = useQuery(
    ['eventsForFilter'],
    () => axios.get('/api/events').then(res => res.data),
    { enabled: isAuthenticated }
  );

  // Обработка и сортировка медиа
  const processedMedia = useMemo(() => {
    let filtered = mediaItems.filter(item => {
      const matchesType = filterType === 'all' || item.type === filterType;
      const matchesEvent = filterEvent === 'all' || 
                          (filterEvent === 'none' && !item.event_id) ||
                          (item.event_id && item.event_id.toString() === filterEvent);
      const matchesSearch = !searchQuery || 
                           item.event_title?.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesType && matchesEvent && matchesSearch;
    });

    // Сортировка
    filtered.sort((a, b) => {
      switch(sortBy) {
        case 'date_desc':
          return new Date(b.uploaded_at) - new Date(a.uploaded_at);
        case 'date_asc':
          return new Date(a.uploaded_at) - new Date(b.uploaded_at);
        case 'event':
          return (a.event_title || 'Я').localeCompare(b.event_title || 'Я');
        default:
          return new Date(b.uploaded_at) - new Date(a.uploaded_at);
      }
    });

    return filtered;
  }, [mediaItems, filterType, filterEvent, searchQuery, sortBy]);

  // Статистика
  const stats = useMemo(() => ({
    total: mediaItems.length,
    photos: mediaItems.filter(m => m.type === 'photo').length,
    videos: mediaItems.filter(m => m.type === 'video').length,
    withEvent: mediaItems.filter(m => m.event_id).length
  }), [mediaItems]);

  const handleDelete = async (mediaId) => {
    if (!window.confirm('УДАЛИТЬ ЭТОТ ФАЙЛ?')) return;
    
    try {
      await axios.delete(`/api/media/${mediaId}`);
      toast.success('ФАЙЛ УДАЛЕН');
      refetch();
    } catch (error) {
      toast.error('ОШИБКА УДАЛЕНИЯ');
    }
  };

  // Неавторизованный вид
  if (!isAuthenticated) {
    return (
      <>
        <div className="container mx-auto px-4 pt-24 pb-12 filter blur-sm pointer-events-none">
          <div className="text-center mb-8">
            <h1 className="text-5xl md:text-6xl font-black text-white mb-4 uppercase">
              МЕДИА DVIZH
            </h1>
            <p className="text-gray-400 text-lg uppercase">
              ФОТО И ВИДЕО С НАШИХ ДВИЖУХ
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="aspect-square bg-gray-800 rounded-xl animate-pulse" />
            ))}
          </div>
        </div>

        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="glass rounded-2xl p-8 max-w-md w-full border border-[#f9c200]/20"
          >
            <div className="text-center space-y-6">
              <div className="inline-block p-6 bg-[#f9c200]/10 rounded-full">
                <Lock className="text-[#f9c200]" size={48} />
              </div>
              <div>
                <h2 className="text-3xl font-black text-white mb-2 uppercase">
                  МЕДИА ТОЛЬКО ДЛЯ СВОИХ
                </h2>
                <p className="text-gray-400 uppercase">
                  ФОТО И ВИДЕО ДОСТУПНЫ ТОЛЬКО УЧАСТНИКАМ
                </p>
              </div>
              <div className="space-y-3">
                <Link
                  to="/login"
                  state={{ from: { pathname: '/media' } }}
                  className="w-full btn-primary flex items-center justify-center gap-2 uppercase"
                >
                  <LogIn size={20} />
                  <span>ВОЙТИ ЧЕРЕЗ TELEGRAM</span>
                </Link>
                <Link
                  to="/events"
                  className="w-full btn-secondary block text-center uppercase"
                >
                  К СОБЫТИЯМ
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
              МЕДИА DVIZH
            </motion.h1>
            <motion.p
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-gray-400 text-sm sm:text-base md:text-lg uppercase px-4"
            >
              ФОТО И ВИДЕО С НАШИХ ДВИЖУХ
            </motion.p>
          </div>

          {/* Stats Cards */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4 mb-6 md:mb-8"
          >
            {[
              { label: 'ВСЕГО', value: stats.total, icon: Grid3x3, color: 'from-blue-500/20 to-blue-500/10' },
              { label: 'ФОТО', value: stats.photos, icon: Image, color: 'from-green-500/20 to-green-500/10' },
              { label: 'ВИДЕО', value: stats.videos, icon: Video, color: 'from-purple-500/20 to-purple-500/10' },
              { label: 'С СОБЫТИЙ', value: stats.withEvent, icon: Calendar, color: 'from-[#f9c200]/20 to-[#f9c200]/10' }
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

          {/* Controls Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="glass rounded-xl md:rounded-2xl p-4 md:p-6 border border-[#f9c200]/10 space-y-4 md:space-y-6"
          >
            {/* Search Bar */}
            <div className="w-full relative">
              <Search className="absolute left-3 md:left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ПОИСК ПО СОБЫТИЯМ..."
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
            
            {/* Control Buttons */}
            <div className="flex flex-wrap gap-2">
              {/* View Mode */}
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
                className={`px-3 py-2 rounded-xl font-semibold text-sm transition flex items-center gap-1.5 flex-1 sm:flex-initial justify-center uppercase ${
                  showFilters ? 'bg-[#f9c200] text-black' : 'bg-black/30 text-gray-400 hover:text-white border border-gray-800'
                }`}
              >
                <SlidersHorizontal size={18} />
                <span>ФИЛЬТРЫ</span>
              </button>

              {/* Sort */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-2 bg-black/30 text-white text-sm rounded-xl border border-gray-800 focus:border-[#f9c200] outline-none uppercase flex-1 sm:flex-initial"
              >
                <option value="date_desc">НОВЫЕ</option>
                <option value="date_asc">СТАРЫЕ</option>
                <option value="event">ПО СОБЫТИЮ</option>
              </select>

              {/* Admin Upload Button */}
              {isAdmin && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowUploadModal(true)}
                  className="btn-primary flex items-center gap-1.5 px-4 py-2 text-sm uppercase w-full sm:w-auto justify-center"
                >
                  <Upload size={18} />
                  <span>ЗАГРУЗИТЬ</span>
                </motion.button>
              )}
            </div>

            {/* Expandable Filters */}
            <AnimatePresence>
              {showFilters && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="space-y-4 overflow-hidden"
                >
                  {/* Type Filters */}
                  <div>
                    <p className="text-gray-400 text-xs sm:text-sm mb-2 uppercase">ТИП</p>
                    <div className="flex flex-wrap gap-1.5 sm:gap-2">
                      {[
                        { value: 'all', label: 'ВСЕ', icon: Grid3x3 },
                        { value: 'photo', label: 'ФОТО', icon: Image },
                        { value: 'video', label: 'ВИДЕО', icon: Video }
                      ].map((filter) => (
                        <motion.button
                          key={filter.value}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => setFilterType(filter.value)}
                          className={`px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-1 sm:gap-2 uppercase ${
                            filterType === filter.value
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

                  {/* Event Filters */}
                  <div>
                    <p className="text-gray-400 text-xs sm:text-sm mb-2 uppercase">СОБЫТИЕ</p>
                    <select
                      value={filterEvent}
                      onChange={(e) => setFilterEvent(e.target.value)}
                      className="w-full px-3 py-2 bg-black/30 text-white text-sm rounded-xl border border-gray-800 focus:border-[#f9c200] outline-none uppercase"
                    >
                      <option value="all">ВСЕ СОБЫТИЯ</option>
                      <option value="none">БЕЗ СОБЫТИЯ</option>
                      {events.map(event => (
                        <option key={event.id} value={event.id}>
                          {event.title}
                        </option>
                      ))}
                    </select>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </motion.div>

        {/* Media Grid */}
        <div className={
          viewMode === 'grid'
            ? 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6'
            : 'grid grid-cols-1 gap-4'
        }>
          {processedMedia.map((item, index) => (
            viewMode === 'grid' ? (
              <MediaCard
                key={item.id}
                item={item}
                index={index}
                onClick={setSelectedMedia}
                onDelete={isAdmin ? handleDelete : null}
                isAdmin={isAdmin}
              />
            ) : (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="flex gap-4 p-4 bg-gradient-to-r from-[#2a2a2a] to-[#1d1d1d] rounded-xl border border-[#3a3a3a] hover:border-[#f9c200]/30 transition"
              >
                <div 
                  onClick={() => setSelectedMedia(item)}
                  className="w-32 h-32 rounded-lg overflow-hidden flex-shrink-0 cursor-pointer"
                >
                  {item.type === 'video' ? (
                    <div className="relative w-full h-full bg-black/50">
                      <video
                        src={`${import.meta.env.VITE_API_URL}${item.file_url || item.url}`}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Video className="text-white" size={24} />
                      </div>
                    </div>
                  ) : (
                    <img
                      src={`${import.meta.env.VITE_API_URL}${item.thumbnail_url || item.file_url || item.url}`}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>
                <div className="flex-1 flex flex-col justify-between">
                  <div>
                    <p className="text-white font-semibold uppercase">
                      {item.event_title || 'БЕЗ СОБЫТИЯ'}
                    </p>
                    <p className="text-gray-400 text-sm mt-1 uppercase">
                      {item.type === 'video' ? 'ВИДЕО' : 'ФОТО'}
                    </p>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-gray-500 text-xs uppercase">
                      {formatDate(item.uploaded_at)}
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setSelectedMedia(item)}
                        className="p-2 bg-black/30 rounded-lg hover:bg-black/50 transition"
                      >
                        <Eye size={16} className="text-gray-400" />
                      </button>
                      
                       <a href={`${import.meta.env.VITE_API_URL}${item.url}`}
                        download
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 bg-black/30 rounded-lg hover:bg-black/50 transition"
                      >
                        <Download size={16} className="text-gray-400" />
                      </a>
                      {isAdmin && (
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="p-2 bg-red-500/20 rounded-lg hover:bg-red-500/30 transition"
                        >
                          <Trash2 size={16} className="text-red-500" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            )
          ))}
        </div>

        {/* Empty State */}
        {processedMedia.length === 0 && (
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
              <Camera className="text-gray-600" size={60} />
            </motion.div>
            <h3 className="text-xl sm:text-2xl font-bold text-gray-400 mb-2 md:mb-3 uppercase">
              {searchQuery ? 'НИЧЕГО НЕ НАЙДЕНО' : 'НЕТ МЕДИА'}
            </h3>
            <p className="text-sm sm:text-base text-gray-500 uppercase px-4">
              {searchQuery 
                ? 'ИЗМЕНИТЕ ПАРАМЕТРЫ ПОИСКА' 
                : 'ПОКА ЗДЕСЬ ПУСТО'}
            </p>
          </motion.div>
        )}

        {/* Modals */}
        <MediaUploadModal
          isOpen={showUploadModal}
          onClose={() => setShowUploadModal(false)}
          onUpload={() => {
            refetch();
            setShowUploadModal(false);
          }}
        />

        <MediaLightbox
          media={selectedMedia}
          onClose={() => setSelectedMedia(null)}
        />
      </div>
    </div>
  );
};

export default Media;