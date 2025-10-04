import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShoppingBag, Plus, Trash2, Upload, X, Edit, 
  Package, DollarSign, Ruler, Tag, Image,
  MessageCircle, Star, Sparkles, Shield,
  Check, ChevronLeft, ChevronRight,
  Grid3x3, List, SlidersHorizontal
} from 'lucide-react';
import axios from '../utils/axios';
import { useAuthStore } from '../stores/authStore';
import Loader from '../components/Loader';
import toast from 'react-hot-toast';

// Merch Card Component
const MerchCard = ({ item, onEdit, onDelete, isAdmin }) => {
  const { isAuthenticated } = useAuthStore();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showOrderModal, setShowOrderModal] = useState(false);

  const nextImage = () => {
    if (item.images.length > 1) {
      setCurrentImageIndex((prev) => (prev + 1) % item.images.length);
    }
  };

  const prevImage = () => {
    if (item.images.length > 1) {
      setCurrentImageIndex((prev) => (prev - 1 + item.images.length) % item.images.length);
    }
  };

  const getCategoryBadge = () => {
    if (item.category === 'official_max_korzh') {
      return (
        <div className="absolute top-2 left-2 z-10 px-3 py-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white text-xs font-bold rounded-lg flex items-center gap-1">
          <Star size={12} />
          OFFICIAL MAX KORZH
        </div>
      );
    }
    return null;
  };

  const getRevisionBadge = () => {
    if (item.category === 'dvizh_bishkek' && item.revision) {
      return (
        <div className="absolute top-2 right-2 z-10 px-3 py-1 bg-black/70 backdrop-blur text-[#f9c200] text-xs font-bold rounded-lg">
          REV {item.revision}
        </div>
      );
    }
    return null;
  };

  const getTypeIcon = () => {
    switch(item.type) {
      case 'tshirt': return '👕';
      case 'hoodie': return '🧥';
      case 'panama': return '🧢';
      case 'scarf': return '🧣';
      default: return '📦';
    }
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ y: -5 }}
        className="group relative"
      >
        <div className="bg-gradient-to-br from-[#2a2a2a] to-[#1d1d1d] rounded-2xl overflow-hidden border border-[#3a3a3a] hover:border-[#f9c200]/30 transition-all">
          {/* Image Carousel */}
          <div className="relative h-80 bg-black/50 overflow-hidden">
            {item.images.length > 0 ? (
              <>
                <img
                  src={`${import.meta.env.VITE_API_URL}${item.images[currentImageIndex].url}`}
                  alt={item.title}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                />
                
                {/* Navigation Buttons */}
                {item.images.length > 1 && (
                  <>
                    <button
                      onClick={prevImage}
                      className="absolute left-2 top-1/2 -translate-y-1/2 p-2 bg-black/50 text-white rounded-full opacity-0 group-hover:opacity-100 transition"
                    >
                      <ChevronLeft size={20} />
                    </button>
                    <button
                      onClick={nextImage}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-black/50 text-white rounded-full opacity-0 group-hover:opacity-100 transition"
                    >
                      <ChevronRight size={20} />
                    </button>
                  </>
                )}

                {/* Image Indicators */}
                {item.images.length > 1 && (
                  <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
                    {item.images.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => setCurrentImageIndex(index)}
                        className={`w-2 h-2 rounded-full transition ${
                          index === currentImageIndex ? 'bg-[#f9c200] w-6' : 'bg-white/50'
                        }`}
                      />
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Package className="text-gray-600" size={48} />
              </div>
            )}

            {/* Badges */}
            {getCategoryBadge()}
            {getRevisionBadge()}

            {/* Status Badge */}
            {item.status === 'out_of_stock' && (
              <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                <div className="px-4 py-2 bg-red-500 text-white font-bold rounded-lg uppercase">
                  НЕТ В НАЛИЧИИ
                </div>
              </div>
            )}
          </div>

          {/* Content */}
          <div className="p-6 space-y-4">
            {/* Title & Type */}
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="text-xl font-bold text-white uppercase flex items-center gap-2">
                  <span>{getTypeIcon()}</span>
                  {item.title}
                </h3>
                {item.description && (
                  <p className="text-gray-400 text-sm mt-1 line-clamp-2">
                    {item.description}
                  </p>
                )}
              </div>
            </div>

            {/* Sizes */}
            {item.available_sizes && item.available_sizes.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {item.sizes.map((size) => (
                  <span
                    key={size}
                    className={`px-3 py-1 rounded-lg text-xs font-bold uppercase ${
                      item.available_sizes.includes(size)
                        ? 'bg-[#f9c200]/20 text-[#f9c200] border border-[#f9c200]/30'
                        : 'bg-gray-800 text-gray-500 line-through'
                    }`}
                  >
                    {size}
                  </span>
                ))}
              </div>
            )}

            {/* Price & Action */}
            <div className="flex items-center justify-between pt-4 border-t border-[#3a3a3a]">
              <div className="flex items-center gap-2">
                <DollarSign className="text-[#f9c200]" size={20} />
                <span className="text-2xl font-black text-white">
                  {item.price} СОМ
                </span>
              </div>

              {item.status === 'available' && (
                <>
                  {isAuthenticated ? (
                    <button
                      onClick={() => setShowOrderModal(true)}
                      className="px-4 py-2 bg-[#f9c200] text-black font-bold rounded-xl hover:bg-[#ffdd44] transition uppercase text-sm"
                    >
                      ЗАКАЗАТЬ
                    </button>
                  ) : (
                    <button
                      disabled
                      className="px-4 py-2 bg-gray-700 text-gray-400 font-bold rounded-xl cursor-not-allowed uppercase text-sm"
                    >
                      ВОЙТИ
                    </button>
                  )}
                </>
              )}
            </div>

            {/* Admin Controls */}
            {isAdmin && (
              <div className="flex gap-2 pt-4 border-t border-[#3a3a3a]">
                <button
                  onClick={() => onEdit(item)}
                  className="flex-1 px-3 py-2 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 transition flex items-center justify-center gap-2"
                >
                  <Edit size={16} />
                  <span className="text-sm font-bold uppercase">ИЗМЕНИТЬ</span>
                </button>
                <button
                  onClick={() => {
                    if (window.confirm('Удалить этот товар?')) {
                      onDelete(item.id);
                    }
                  }}
                  className="px-3 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            )}
          </div>
        </div>
      </motion.div>

      {/* Order Modal */}
      <AnimatePresence>
        {showOrderModal && (
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
              className="bg-gradient-to-br from-[#2a2a2a] to-[#1d1d1d] rounded-2xl p-6 max-w-md w-full border border-[#3a3a3a]"
            >
              <div className="text-center space-y-4">
                <div className="inline-block p-4 bg-[#f9c200]/10 rounded-full">
                  <ShoppingBag className="text-[#f9c200]" size={48} />
                </div>
                
                <h3 className="text-2xl font-bold text-white uppercase">
                  ЗАКАЗАТЬ МЕРЧ
                </h3>
                
                <p className="text-gray-300">
                  Для заказа мерча обратитесь к организаторам
                </p>
                
                <div className="p-4 bg-black/30 rounded-xl">
                  <p className="text-gray-400 text-sm mb-2 uppercase">TELEGRAM ЧАТ:</p>
                  
                   <a href="https://t.me/dvizh_bishkek_chat"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 text-[#f9c200] hover:text-[#ffdd44] transition"
                  >
                    <MessageCircle size={20} />
                    <span className="font-bold">@dvizh_bishkek_chat</span>
                  </a>
                </div>
                
                <button
                  onClick={() => setShowOrderModal(false)}
                  className="w-full btn-primary uppercase"
                >
                  ПОНЯТНО
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

// Admin Modal Component
const MerchModal = ({ isOpen, onClose, item = null, onSuccess }) => {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'tshirt',
    category: 'dvizh_bishkek',
    revision: '',
    price: '',
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    available_sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    status: 'available'
  });
  const [selectedImages, setSelectedImages] = useState([]);
  const [previewUrls, setPreviewUrls] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  React.useEffect(() => {
    if (item) {
      setFormData({
        title: item.title || '',
        description: item.description || '',
        type: item.type || 'tshirt',
        category: item.category || 'dvizh_bishkek',
        revision: item.revision || '',
        price: item.price || '',
        sizes: item.sizes || ['S', 'M', 'L', 'XL', 'XXL'],
        available_sizes: item.available_sizes || ['S', 'M', 'L', 'XL', 'XXL'],
        status: item.status || 'available'
      });
    }
  }, [item]);

  const handleImageSelect = (e) => {
    const files = Array.from(e.target.files);
    setSelectedImages(files);
    
    const urls = files.map(file => URL.createObjectURL(file));
    setPreviewUrls(urls);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const data = new FormData();
      Object.keys(formData).forEach(key => {
        if (key === 'sizes' || key === 'available_sizes') {
          data.append(key, JSON.stringify(formData[key]));
        } else {
          data.append(key, formData[key]);
        }
      });

      selectedImages.forEach(image => {
        data.append('images', image);
      });

      if (item) {
        await axios.put(`/api/merch/${item.id}`, data, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        toast.success('Мерч обновлен!');
      } else {
        await axios.post('/api/merch', data, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        toast.success('Мерч добавлен!');
      }

      queryClient.invalidateQueries('merch');
      onSuccess();
      onClose();
    } catch (error) {
      toast.error('Ошибка при сохранении');
    } finally {
      setIsSubmitting(false);
    }
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
          className="bg-gradient-to-br from-[#2a2a2a] to-[#1d1d1d] rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-[#3a3a3a]"
        >
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-black text-white uppercase">
                {item ? 'РЕДАКТИРОВАТЬ МЕРЧ' : 'ДОБАВИТЬ МЕРЧ'}
              </h2>
              <button onClick={onClose} className="text-gray-400 hover:text-white">
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Title */}
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2 uppercase">
                  Название
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="input w-full"
                  required
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2 uppercase">
                  Описание
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="input w-full resize-none"
                  rows={3}
                />
              </div>

              {/* Type & Category */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2 uppercase">
                    Тип
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="input w-full"
                  >
                    <option value="tshirt">Футболка</option>
                    <option value="hoodie">Худи</option>
                    <option value="panama">Панамка</option>
                    <option value="scarf">Шарф</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2 uppercase">
                    Категория
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="input w-full"
                  >
                    <option value="dvizh_bishkek">DVIZH BISHKEK</option>
                    <option value="official_max_korzh">Official MAX KORZH</option>
                  </select>
                </div>
              </div>

              {/* Revision & Price */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2 uppercase">
                    Ревизия (для DVIZH)
                  </label>
                  <input
                    type="number"
                    value={formData.revision}
                    onChange={(e) => setFormData({ ...formData, revision: e.target.value })}
                    className="input w-full"
                    min="1"
                    max="10"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2 uppercase">
                    Цена (сом)
                  </label>
                  <input
                    type="number"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    className="input w-full"
                    required
                    min="0"
                  />
                </div>
              </div>

              {/* Available Sizes */}
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2 uppercase">
                  Доступные размеры
                </label>
                <div className="flex flex-wrap gap-2">
                  {formData.sizes.map((size) => (
                    <label key={size} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={formData.available_sizes.includes(size)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFormData({
                              ...formData,
                              available_sizes: [...formData.available_sizes, size]
                            });
                          } else {
                            setFormData({
                              ...formData,
                              available_sizes: formData.available_sizes.filter(s => s !== size)
                            });
                          }
                        }}
                        className="rounded text-[#f9c200]"
                      />
                      <span className="text-white uppercase">{size}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Status */}
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2 uppercase">
                  Статус
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="input w-full"
                >
                  <option value="available">В наличии</option>
                  <option value="out_of_stock">Нет в наличии</option>
                </select>
              </div>

              {/* Images */}
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2 uppercase">
                  Изображения
                </label>
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-[#3a3a3a] rounded-xl cursor-pointer hover:border-[#f9c200]/50 transition">
                  <Upload size={32} className="text-[#f9c200] mb-2" />
                  <span className="text-gray-300 text-sm uppercase">
                    {selectedImages.length > 0 
                      ? `Выбрано: ${selectedImages.length}` 
                      : 'Загрузить фото'}
                  </span>
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleImageSelect}
                    className="hidden"
                  />
                </label>
              </div>

              {/* Preview */}
              {previewUrls.length > 0 && (
                <div className="grid grid-cols-4 gap-2">
                  {previewUrls.map((url, index) => (
                    <img
                      key={index}
                      src={url}
                      alt=""
                      className="w-full h-24 object-cover rounded-lg"
                    />
                  ))}
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 btn-primary disabled:opacity-50 uppercase"
                >
                  {isSubmitting ? 'СОХРАНЯЕМ...' : 'СОХРАНИТЬ'}
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 btn-secondary uppercase"
                >
                  ОТМЕНА
                </button>
              </div>
            </form>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

// Main Merch Page
const Merch = () => {
  const { user, isAuthenticated } = useAuthStore();
  const queryClient = useQueryClient();
  const isAdmin = user?.role === 'admin';
  
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedRevision, setSelectedRevision] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [viewMode, setViewMode] = useState('grid');

  // Load merch
  const { data: merchItems = [], isLoading } = useQuery(
    ['merch', selectedCategory, selectedType, selectedRevision],
    () => {
      const params = new URLSearchParams();
      if (selectedCategory !== 'all') params.append('category', selectedCategory);
      if (selectedType !== 'all') params.append('type', selectedType);
      if (selectedRevision !== 'all') params.append('revision', selectedRevision);
      
      return axios.get(`/api/merch?${params}`).then(res => res.data);
    }
  );

  // Delete mutation
  const deleteMutation = useMutation(
    (id) => axios.delete(`/api/merch/${id}`),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('merch');
        toast.success('Товар удален');
      }
    }
  );

  const handleEdit = (item) => {
    setEditingItem(item);
    setShowModal(true);
  };

  const handleModalClose = () => {
    setShowModal(false);
    setEditingItem(null);
  };

  if (isLoading) {
    return <Loader fullScreen={false} />;
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] relative">
      {/* Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-80 h-80 bg-[#f9c200]/5 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-40 -right-40 w-80 h-80 bg-purple-500/5 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>

      <div className="container mx-auto px-4 pt-20 md:pt-24 pb-12 relative z-10">
        {/* Header */}
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
              МЕРЧ DVIZH
            </motion.h1>
            <motion.p
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-gray-400 text-sm sm:text-base md:text-lg uppercase"
            >
              ОФИЦИАЛЬНЫЙ МЕРЧ И ЭКСКЛЮЗИВНЫЕ КОЛЛЕКЦИИ
            </motion.p>
          </div>

          {/* Filters */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="glass rounded-xl md:rounded-2xl p-4 md:p-6 border border-[#f9c200]/10 space-y-4"
          >
            <div className="flex flex-wrap gap-2">
              {/* Category Filter */}
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-4 py-2 bg-black/30 text-white rounded-xl border border-gray-800 focus:border-[#f9c200] outline-none uppercase"
              >
                <option value="all">ВСЕ КАТЕГОРИИ</option>
                <option value="dvizh_bishkek">DVIZH BISHKEK</option>
                <option value="official_max_korzh">OFFICIAL MAX KORZH</option>
              </select>

              {/* Type Filter */}
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="px-4 py-2 bg-black/30 text-white rounded-xl border border-gray-800 focus:border-[#f9c200] outline-none uppercase"
              >
                <option value="all">ВСЕ ТИПЫ</option>
                <option value="tshirt">ФУТБОЛКИ</option>
                <option value="hoodie">ХУДИ</option>
                <option value="panama">ПАНАМКИ</option>
                <option value="scarf">ШАРФЫ</option>
              </select>

              {/* Revision Filter */}
              {selectedCategory === 'dvizh_bishkek' && (
                <select
                  value={selectedRevision}
                  onChange={(e) => setSelectedRevision(e.target.value)}
                  className="px-4 py-2 bg-black/30 text-white rounded-xl border border-gray-800 focus:border-[#f9c200] outline-none uppercase"
                >
                  <option value="all">ВСЕ РЕВИЗИИ</option>
                  <option value="1">РЕВИЗИЯ 1</option>
                  <option value="2">РЕВИЗИЯ 2</option>
                </select>
              )}

              {/* View Mode */}
              <div className="ml-auto hidden sm:flex bg-black/30 rounded-xl p-1 border border-gray-800">
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

              {/* Admin Add Button */}
              {isAdmin && (
                <button
                  onClick={() => setShowModal(true)}
                  className="ml-auto btn-primary flex items-center gap-2 uppercase"
                >
                  <Plus size={20} />
                  <span className="hidden sm:inline">ДОБАВИТЬ</span>
                </button>
              )}
            </div>
          </motion.div>
        </motion.div>

        {/* Merch Grid */}
        {merchItems.length > 0 ? (
          <div className={
            viewMode === 'grid'
              ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'
              : 'space-y-6'
          }>
            {merchItems.map((item, index) => (
              <MerchCard
                key={item.id}
                item={item}
                onEdit={handleEdit}
                onDelete={(id) => deleteMutation.mutate(id)}
                isAdmin={isAdmin}
              />
            ))}
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-20"
          >
            <ShoppingBag className="text-gray-600 mx-auto mb-6" size={80} />
            <h3 className="text-2xl font-bold text-gray-400 mb-3 uppercase">
              НЕТ ТОВАРОВ
            </h3>
            <p className="text-gray-500 uppercase">
              СКОРО ПОЯВЯТСЯ НОВЫЕ ТОВАРЫ
            </p>
          </motion.div>
        )}

        {/* Admin Modal */}
        <MerchModal
          isOpen={showModal}
          onClose={handleModalClose}
          item={editingItem}
          onSuccess={() => {
            queryClient.invalidateQueries('merch');
          }}
        />
      </div>
    </div>
  );
};

export default Merch;