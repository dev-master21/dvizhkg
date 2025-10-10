import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import { 
  ChevronDown, Calendar, Trophy, Image, Star,
  Sparkles, Zap, Users, ArrowRight, Play,
  MessageCircle, MapPin, Clock, ChevronLeft, ChevronRight as ChevronRightIcon,
  Lock, Video, Package, ShoppingBag, DollarSign,
  Search, Instagram, Send, Globe, X as CloseIcon
} from 'lucide-react';
import { useQuery } from 'react-query';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, Autoplay } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import axios from '../utils/axios';
import { useAuthStore } from '../stores/authStore';
import EventCard from '../components/EventCard';
import UserTable from '../components/UserTable';

const Home = () => {
  const navigate = useNavigate();
  const videoRef = useRef(null);
  const { isAuthenticated } = useAuthStore();
  const [videoLoaded, setVideoLoaded] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState(null);
  const [selectedMerchCategory, setSelectedMerchCategory] = useState('all');
  
  // Состояния для модального окна сообществ
  const [showCommunitiesModal, setShowCommunitiesModal] = useState(false);
  const [communitiesSearch, setCommunitiesSearch] = useState('');
  const [communities, setCommunities] = useState([]);
  const [loadingCommunities, setLoadingCommunities] = useState(false);
  
  const { scrollYProgress } = useScroll();
  const heroOpacity = useTransform(scrollYProgress, [0, 0.3], [1, 0]);
  const heroScale = useTransform(scrollYProgress, [0, 0.3], [1, 0.8]);
  
  // Load ALL events
  const { data: events = [] } = useQuery(
    ['homeEvents'],
    () => axios.get('/api/events/public/all').then(res => res.data)
  );
  
  // Load top users
  const { data: topUsers = [] } = useQuery(
    'topUsersHome',
    () => axios.get('/api/users/top/public').then(res => res.data)
  );

  // Load media files
  const { data: mediaItems = [] } = useQuery(
    ['homeMedia'],
    () => axios.get('/api/media/public').then(res => res.data.slice(0, 8)),
    { 
      enabled: true,
      retry: 1 
    }
  );

  // Загрузка товаров из базы данных
  const { data: merchItems = [] } = useQuery(
    ['homeMerch'],
    () => axios.get('/api/merch').then(res => res.data),
    { 
      enabled: true,
      retry: 1 
    }
  );

  // Фильтрация товаров по категории
  const filteredMerchItems = merchItems.filter(item => {
    if (selectedMerchCategory === 'all') return true;
    if (selectedMerchCategory === 'dvizh') return item.category === 'dvizh_bishkek';
    if (selectedMerchCategory === 'official') return item.category === 'official_max_korzh';
    return true;
  });

  // Загрузка сообществ
  const loadCommunities = async (searchTerm = '') => {
    setLoadingCommunities(true);
    try {
      const response = await axios.get('/api/communities', {
        params: { search: searchTerm }
      });
      setCommunities(response.data);
    } catch (error) {
      console.error('Error loading communities:', error);
    } finally {
      setLoadingCommunities(false);
    }
  };

  // При открытии модального окна
  useEffect(() => {
    if (showCommunitiesModal) {
      loadCommunities();
    }
  }, [showCommunitiesModal]);

  // Поиск с debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      if (showCommunitiesModal) {
        loadCommunities(communitiesSearch);
      }
    }, 300);
    
    return () => clearTimeout(timer);
  }, [communitiesSearch]);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.play().catch(err => console.log('Video autoplay failed:', err));
    }
  }, []);

  const scrollToContent = () => {
    window.scrollTo({
      top: window.innerHeight,
      behavior: 'smooth'
    });
  };

  const getTypeIcon = (type) => {
    switch(type) {
      case 'tshirt': return '👕';
      case 'hoodie': return '🧥';
      case 'panama': return '🧢';
      case 'scarf': return '🧣';
      default: return '📦';
    }
  };

  return (
    <div className="relative min-h-screen bg-[#0a0a0a]">
      {/* Hero Section - остается без изменений */}
      <motion.section 
        className="relative h-screen flex items-center justify-center overflow-hidden"
        style={{ opacity: heroOpacity, scale: heroScale }}
      >
        <div className="absolute inset-0 z-0">
          <video
            ref={videoRef}
            className="absolute inset-0 w-full h-full object-cover"
            autoPlay
            muted
            loop
            playsInline
            onLoadedData={() => setVideoLoaded(true)}
          >
            <source src="/hero-video.mp4" type="video/mp4" />
          </video>
          <div className="absolute inset-0 bg-black/60" />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/30 to-black" />
        </div>

        <div className="relative z-10 text-center px-4 pb-20">
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ duration: 1, type: "spring", stiffness: 100 }}
            className="mb-8"
          >
            <img 
              src="/logo.svg" 
              alt="DVIZH BISHKEK" 
              className="h-48 md:h-64 w-auto mx-auto"
            />
          </motion.div>

          <motion.h1
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.8 }}
            className="text-6xl md:text-8xl font-black text-white mb-6 uppercase"
          >
            ТУТ ЛУЧШИЙ ВАЙБ
          </motion.h1>

          <motion.p
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.7, duration: 0.8 }}
            className="text-xl md:text-2xl text-gray-300 mb-12 max-w-2xl mx-auto uppercase"
          >
            СОБЫТИЯ, ТУСОВКИ И ДВИЖУХИ В ОДНОМ МЕСТЕ
          </motion.p>

          <motion.div
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.9 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            {isAuthenticated ? (
              <Link
                to="/events"
                className="group px-8 py-4 bg-[#f9c200] text-black font-bold rounded-2xl hover:bg-[#ffdd44] transition-all transform hover:scale-105 flex items-center justify-center gap-3 uppercase"
              >
                <Calendar size={24} />
                <span className="text-lg">СМОТРЕТЬ СОБЫТИЯ</span>
                <ArrowRight className="group-hover:translate-x-1 transition-transform" size={20} />
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  className="group px-8 py-4 bg-[#f9c200] text-black font-bold rounded-2xl hover:bg-[#ffdd44] transition-all transform hover:scale-105 flex items-center justify-center gap-3 uppercase"
                >
                  <Zap size={24} />
                  <span className="text-lg">ПРИСОЕДИНИТЬСЯ</span>
                  <ArrowRight className="group-hover:translate-x-1 transition-transform" size={20} />
                </Link>
                <Link
                  to="/events"
                  className="px-8 py-4 bg-white/10 backdrop-blur text-white font-bold rounded-2xl border border-white/20 hover:bg-white/20 transition-all flex items-center justify-center gap-3 uppercase"
                >
                  <Calendar size={24} />
                  <span className="text-lg">СОБЫТИЯ</span>
                </Link>
              </>
            )}
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          className="absolute bottom-20 left-1/2 -translate-x-1/2 cursor-pointer"
          onClick={scrollToContent}
        >
          <motion.div
            animate={{ y: [0, 10, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="flex flex-col items-center gap-2 text-white/70 hover:text-[#f9c200] transition-colors"
          >
            <span className="text-sm font-semibold uppercase">ЛИСТАЙ ВНИЗ</span>
            <ChevronDown size={32} />
          </motion.div>
        </motion.div>

        <div className="absolute inset-0 pointer-events-none">
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 bg-[#f9c200]/30 rounded-full"
              initial={{ 
                x: Math.random() * window.innerWidth,
                y: window.innerHeight + 100
              }}
              animate={{ 
                y: -100,
                x: Math.random() * window.innerWidth
              }}
              transition={{
                duration: Math.random() * 10 + 10,
                repeat: Infinity,
                ease: "linear",
                delay: Math.random() * 5
              }}
            />
          ))}
        </div>
      </motion.section>

      {/* Events Carousel Section */}
      <section className="relative py-20 px-4 bg-gradient-to-b from-black to-[#0a0a0a]">
        <div className="container mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-5xl md:text-6xl font-black text-white mb-4 uppercase">
              НАШИ ДВИЖУХИ
            </h2>
            <p className="text-xl text-gray-400 uppercase">
              ВСЕ СОБЫТИЯ DVIZH BISHKEK
            </p>
          </motion.div>

          {events.length > 0 ? (
            <div className="relative">
              <Swiper
                modules={[Navigation, Pagination, Autoplay]}
                spaceBetween={30}
                slidesPerView={1}
                navigation={{
                  prevEl: '.swiper-button-prev-custom',
                  nextEl: '.swiper-button-next-custom'
                }}
                pagination={{ 
                  clickable: true,
                  bulletClass: 'swiper-pagination-bullet !bg-gray-600',
                  bulletActiveClass: 'swiper-pagination-bullet-active !bg-[#f9c200]'
                }}
                autoplay={{
                  delay: 5000,
                  disableOnInteraction: false
                }}
                breakpoints={{
                  640: {
                    slidesPerView: 2,
                    spaceBetween: 20
                  },
                  1024: {
                    slidesPerView: 3,
                    spaceBetween: 30
                  }
                }}
                className="!pb-12"
              >
                {events.map((event, index) => (
                  <SwiperSlide key={event.id}>
                    <motion.div
                      initial={{ opacity: 0, y: 30 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <EventCard event={event} index={index} />
                    </motion.div>
                  </SwiperSlide>
                ))}
              </Swiper>

              <button className="swiper-button-prev-custom absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-10 p-2 bg-[#f9c200] text-black rounded-full hover:bg-[#ffdd44] transition">
                <ChevronLeft size={24} />
              </button>
              <button className="swiper-button-next-custom absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-10 p-2 bg-[#f9c200] text-black rounded-full hover:bg-[#ffdd44] transition">
                <ChevronRightIcon size={24} />
              </button>
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="text-center py-20"
            >
              <Calendar className="mx-auto text-gray-600 mb-6" size={80} />
              <h3 className="text-2xl font-bold text-gray-400 mb-3 uppercase">
                СОБЫТИЯ СКОРО ПОЯВЯТСЯ
              </h3>
              <p className="text-gray-500 uppercase">
                СЛЕДИТЕ ЗА ОБНОВЛЕНИЯМИ
              </p>
            </motion.div>
          )}

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mt-12"
          >
            <Link
              to="/events"
              className="inline-flex items-center gap-3 px-8 py-4 bg-[#f9c200] text-black font-bold rounded-2xl hover:bg-[#ffdd44] transition-all transform hover:scale-105 uppercase"
            >
              <Calendar size={24} />
              <span>ВСЕ СОБЫТИЯ</span>
              <ArrowRight size={20} />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Media Section */}
      <section className="relative py-20 px-4 bg-gradient-to-b from-[#0a0a0a] to-black">
        <div className="container mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center"
          >
            <h2 className="text-5xl md:text-6xl font-black text-white mb-4 uppercase">
              ФОТОЧКИ С ДВИЖУХ
            </h2>
            <p className="text-xl text-gray-400 mb-8 uppercase">
              ФОТО И ВИДЕО С НАШИХ ЯРКИХ И НЕЗАБЫВАЕМЫХ ВСТРЕЧ
            </p>

            <div className="relative max-w-4xl mx-auto">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {mediaItems.length > 0 ? (
                  mediaItems.map((item, i) => (
                    <motion.div
                      key={item.id || i}
                      initial={{ opacity: 0, scale: 0.8 }}
                      whileInView={{ opacity: 1, scale: 1 }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.05 }}
                      className={`relative aspect-square rounded-2xl overflow-hidden ${
                        !isAuthenticated ? 'cursor-not-allowed' : 'cursor-pointer'
                      }`}
                      onClick={() => isAuthenticated && navigate('/media')}
                    >
                      {item.type === 'video' ? (
                        <>
                          <video
                            src={`${import.meta.env.VITE_API_URL}${item.url || item.file_url}`}
                            className={`w-full h-full object-cover ${
                              !isAuthenticated ? 'filter blur-sm' : ''
                            }`}
                          />
                          <div className="absolute inset-0 flex items-center justify-center">
                            <Video className="text-white/50" size={32} />
                          </div>
                        </>
                      ) : (
                        <img
                          src={`${import.meta.env.VITE_API_URL}${item.thumbnail_url || item.url || item.file_url}`}
                          alt=""
                          className={`w-full h-full object-cover ${
                            !isAuthenticated ? 'filter blur-sm' : ''
                          }`}
                        />
                      )}
                      
                      {!isAuthenticated && (
                        <div className="absolute inset-0 bg-black/40" />
                      )}
                    </motion.div>
                  ))
                ) : (
                  [...Array(8)].map((_, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, scale: 0.8 }}
                      whileInView={{ opacity: 1, scale: 1 }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.05 }}
                      className="aspect-square bg-gradient-to-br from-[#f9c200]/20 to-[#f9c200]/5 rounded-2xl flex items-center justify-center"
                    >
                      <Image className="text-[#f9c200]/50" size={40} />
                    </motion.div>
                  ))
                )}
              </div>

              {!isAuthenticated && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="text-center p-8 bg-black/90 backdrop-blur-sm rounded-2xl border border-[#f9c200]/30"
                  >
                    <Lock className="text-[#f9c200] mx-auto mb-4" size={48} />
                    <h3 className="text-2xl font-bold text-white mb-4 uppercase">
                      МЕДИА ДОСТУПНЫ ТОЛЬКО УЧАСТНИКАМ
                    </h3>
                    <Link
                      to="/login"
                      className="inline-flex items-center gap-3 px-8 py-4 bg-[#f9c200] text-black font-bold rounded-2xl hover:bg-[#ffdd44] transition-all transform hover:scale-105 uppercase"
                    >
                      <Users size={24} />
                      <span>ПРИСОЕДИНИТЬСЯ</span>
                      <ArrowRight size={20} />
                    </Link>
                  </motion.div>
                </div>
              )}
            </div>

            {isAuthenticated && (
              <Link
                to="/media"
                className="inline-flex items-center gap-3 px-8 py-4 bg-[#f9c200] text-black font-bold rounded-2xl hover:bg-[#ffdd44] transition-all transform hover:scale-105 uppercase mt-8"
              >
                <Image size={24} />
                <span>СМОТРЕТЬ МЕДИА</span>
                <ArrowRight size={20} />
              </Link>
            )}
          </motion.div>
        </div>
      </section>

      {/* Merch Section - ОБНОВЛЕННАЯ ВЕРСИЯ С КАРУСЕЛЬЮ ИЗ БД */}
      <section className="relative py-20 px-4 bg-gradient-to-b from-black to-[#0a0a0a]">
        <div className="container mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-5xl md:text-6xl font-black text-white mb-4 uppercase">
              НАШ МЕРЧ
            </h2>
            <p className="text-xl text-gray-400 uppercase">
              ЭКСКЛЮЗИВНАЯ ОДЕЖДА И АКСЕССУАРЫ
            </p>
          </motion.div>

          {/* Переключатель категорий */}
          <div className="flex justify-center mb-8">
            <div className="inline-flex bg-black/30 backdrop-blur rounded-2xl p-1 border border-[#3a3a3a]">
              {[
                { id: 'all', label: 'ВСЕ' },
                { id: 'dvizh', label: 'НАШ МЕРЧ' },
                { id: 'official', label: 'ОФИЦИАЛЬНЫЙ МЕРЧ' }
              ].map((category) => (
                <button
                  key={category.id}
                  onClick={() => setSelectedMerchCategory(category.id)}
                  className={`px-4 sm:px-6 py-2 sm:py-3 rounded-xl font-bold uppercase transition-all text-sm sm:text-base ${
                    selectedMerchCategory === category.id
                      ? 'bg-[#f9c200] text-black'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  {category.label}
                </button>
              ))}
            </div>
          </div>

          {/* Карусель товаров */}
          {filteredMerchItems.length > 0 ? (
            <div className="relative">
              <Swiper
                modules={[Navigation, Pagination]}
                spaceBetween={20}
                slidesPerView={1}
                navigation={{
                  prevEl: '.merch-prev',
                  nextEl: '.merch-next',
                }}
                pagination={{ 
                  clickable: true,
                  bulletClass: 'swiper-pagination-bullet !bg-gray-600',
                  bulletActiveClass: 'swiper-pagination-bullet-active !bg-[#f9c200]'
                }}
                breakpoints={{
                  640: { slidesPerView: 2, spaceBetween: 20 },
                  768: { slidesPerView: 3, spaceBetween: 24 },
                  1024: { slidesPerView: 4, spaceBetween: 30 }
                }}
                className="!pb-12"
              >
                {filteredMerchItems.map((item, index) => (
                  <SwiperSlide key={item.id}>
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      whileInView={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.05 }}
                      className="h-full"
                    >
                      <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#2a2a2a] to-[#1d1d1d] border border-[#3a3a3a] hover:border-[#f9c200]/30 transition-all hover:scale-[1.02] h-full flex flex-col">
                        {/* Изображение товара */}
                        <div className="relative h-64 sm:h-72 bg-black/50 overflow-hidden">
                          {item.images && item.images.length > 0 ? (
                            <img 
                              src={`${import.meta.env.VITE_API_URL}${item.images[0].url}`}
                              alt={item.title}
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Package className="text-gray-600" size={48} />
                            </div>
                          )}
                          
                          {/* Бейджи */}
                          {item.category === 'official_max_korzh' && (
                            <div className="absolute top-3 left-3 px-3 py-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white text-xs font-bold rounded-lg flex items-center gap-1">
                              <Star size={12} />
                              OFFICIAL
                            </div>
                          )}
                          
                          {item.category === 'dvizh_bishkek' && item.revision && (
                            <div className="absolute top-3 right-3 px-3 py-1 bg-black/70 backdrop-blur text-[#f9c200] text-xs font-bold rounded-lg">
                              REV {item.revision}
                            </div>
                          )}

                          {/* Тип товара */}
                          <div className="absolute bottom-3 left-3 text-2xl">
                            {getTypeIcon(item.type)}
                          </div>

                          {/* Статус товара */}
                          {item.status === 'out_of_stock' && (
                            <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                              <div className="px-4 py-2 bg-red-500 text-white font-bold rounded-lg uppercase">
                                НЕТ В НАЛИЧИИ
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Контент карточки */}
                        <div className="p-4 sm:p-6 flex-1 flex flex-col">
                          <h3 className="text-lg sm:text-xl font-bold text-white mb-2 uppercase line-clamp-1">
                            {item.title}
                          </h3>
                          {item.description && (
                            <p className="text-gray-400 text-sm mb-4 line-clamp-2">
                              {item.description}
                            </p>
                          )}
                          
                          {/* Размеры */}
                          {item.available_sizes && item.available_sizes.length > 0 && (
                            <div className="flex flex-wrap gap-1 mb-4">
                              {item.sizes?.map((size) => (
                                <span
                                  key={size}
                                  className={`px-2 py-1 rounded text-xs font-bold ${
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

                          {/* Цена и кнопка */}
                          <div className="flex items-center justify-between mt-auto pt-4 border-t border-[#3a3a3a]">
                            <div className="flex items-center gap-1">
                              <DollarSign className="text-[#f9c200]" size={18} />
                              <span className="text-xl sm:text-2xl font-black text-white">
                                {item.price}
                              </span>
                              <span className="text-sm text-gray-400">СОМ</span>
                            </div>
                            
                            {item.status === 'available' ? (
                              <Link
                                to="/merch"
                                className="px-3 sm:px-4 py-1.5 sm:py-2 bg-[#f9c200] text-black font-bold rounded-xl hover:bg-[#ffdd44] transition uppercase text-xs sm:text-sm"
                              >
                                ЗАКАЗАТЬ
                              </Link>
                            ) : (
                              <span className="px-3 sm:px-4 py-1.5 sm:py-2 bg-gray-700 text-gray-400 font-bold rounded-xl uppercase text-xs sm:text-sm">
                                НЕТ
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  </SwiperSlide>
                ))}
              </Swiper>
              
              {/* Кнопки навигации */}
              <button className="merch-prev absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-10 p-2 bg-[#f9c200] text-black rounded-full hover:bg-[#ffdd44] transition">
                <ChevronLeft size={24} />
              </button>
              <button className="merch-next absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-10 p-2 bg-[#f9c200] text-black rounded-full hover:bg-[#ffdd44] transition">
                <ChevronRightIcon size={24} />
              </button>
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="text-center py-20"
            >
              <ShoppingBag className="text-gray-600 mx-auto mb-6" size={80} />
              <h3 className="text-2xl font-bold text-gray-400 mb-3 uppercase">
                {selectedMerchCategory === 'dvizh' 
                  ? 'НАШ МЕРЧ СКОРО ПОЯВИТСЯ' 
                  : selectedMerchCategory === 'official'
                  ? 'ОФИЦИАЛЬНЫЙ МЕРЧ СКОРО ПОЯВИТСЯ'
                  : 'ТОВАРЫ СКОРО ПОЯВЯТСЯ'}
              </h3>
            </motion.div>
          )}

          {/* Кнопка перехода на страницу мерча */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mt-12"
          >
            <Link
              to="/merch"
              className="inline-flex items-center gap-3 px-8 py-4 bg-[#f9c200] text-black font-bold rounded-2xl hover:bg-[#ffdd44] transition-all transform hover:scale-105 uppercase"
            >
              <Package size={24} />
              <span>ВЕСЬ МЕРЧ</span>
              <ArrowRight size={20} />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      {!isAuthenticated && (
        <section className="relative py-20 px-4">
          <div className="container mx-auto max-w-4xl">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#f9c200]/20 to-[#f9c200]/5 p-12 text-center border border-[#f9c200]/30"
            >
              <div className="absolute inset-0 bg-[#f9c200]/10 blur-3xl" />
              
              <div className="relative z-10">
                <h2 className="text-4xl md:text-5xl font-black text-white mb-4 uppercase">
                  ВРЫВАЙСЯ К НАМ!
                </h2>
                <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto uppercase">
                  СТАНЬ ЧАСТЬЮ САМОЙ АКТИВНОЙ ТУСОВКИ! СОБЫТИЯ, НОВЫЕ ЗНАКОМСТВА И НЕЗАБЫВАЕМЫЕ ВПЕЧАТЛЕНИЯ ЖДУТ ТЕБЯ!
                </p>
                
                <Link
                  to="/login"
                  className="inline-flex items-center gap-3 px-10 py-5 bg-[#f9c200] text-black font-bold text-lg rounded-2xl hover:bg-[#ffdd44] transition-all transform hover:scale-105 uppercase"
                >
                  <MessageCircle size={28} />
                  <span>ВСТУПИТЬ В DVIZH</span>
                  <ArrowRight size={24} />
                </Link>
              </div>
            </motion.div>
          </div>
        </section>
      )}

      {/* Top Users Section */}
      <section className="relative py-20 px-4 bg-gradient-to-t from-[#0a0a0a] to-black">
        <div className="container mx-auto max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-5xl md:text-6xl font-black text-white mb-4 uppercase">
              ТОП ЧЕЛОВ
            </h2>
            <p className="text-xl text-gray-400 uppercase">
              САМЫЕ АКТИВНЫЕ УЧАСТНИКИ ДВИЖА
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
          >
            <UserTable users={topUsers} title="ЛИДЕРЫ ДВИЖУХИ" />
          </motion.div>
        </div>
      </section>

      {/* Кнопка ДРУГИЕ ДВИЖУХИ */}
      <section className="relative py-20 px-4">
        <div className="container mx-auto max-w-4xl">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="text-center"
          >
            <button
              onClick={() => setShowCommunitiesModal(true)}
              className="group relative inline-flex items-center gap-4 px-12 py-6 bg-gradient-to-r from-[#f9c200] to-[#ffdd44] text-black font-black text-xl rounded-3xl hover:scale-105 transition-all transform uppercase shadow-2xl hover:shadow-[#f9c200]/50"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-[#f9c200] to-[#ffdd44] rounded-3xl blur-xl opacity-50 group-hover:opacity-75 transition-opacity" />
              <Globe className="relative" size={28} />
              <span className="relative">ДРУГИЕ ДВИЖУХИ</span>
              <ArrowRight className="relative group-hover:translate-x-1 transition-transform" size={24} />
            </button>
            <p className="text-gray-400 mt-4 uppercase">
              Движухи по всему миру
            </p>
          </motion.div>
        </div>
      </section>

      {/* Модальное окно с сообществами */}
      <AnimatePresence>
        {showCommunitiesModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowCommunitiesModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-gradient-to-br from-[#1a1a1a] to-[#0a0a0a] rounded-3xl max-w-4xl w-full max-h-[85vh] overflow-hidden border border-[#3a3a3a]"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="sticky top-0 bg-gradient-to-r from-[#1a1a1a] to-[#0a0a0a] p-6 border-b border-[#3a3a3a] z-10">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-3xl font-black text-white uppercase">
                    ДВИЖУХИ ПО ВСЕМУ МИРУ
                  </h2>
                  <button
                    onClick={() => setShowCommunitiesModal(false)}
                    className="p-2 hover:bg-white/10 rounded-xl transition"
                  >
                    <CloseIcon className="text-gray-400 hover:text-white" size={24} />
                  </button>
                </div>
                
                {/* Поиск */}
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type="text"
                    value={communitiesSearch}
                    onChange={(e) => setCommunitiesSearch(e.target.value)}
                    placeholder="Поиск по городам и странам..."
                    className="w-full pl-12 pr-4 py-3 bg-black/50 text-white rounded-2xl border border-[#3a3a3a] focus:border-[#f9c200] outline-none transition"
                  />
                </div>
              </div>

              {/* Список сообществ */}
              <div className="p-6 overflow-y-auto max-h-[calc(85vh-180px)]">
                {loadingCommunities ? (
                  <div className="flex items-center justify-center py-20">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#f9c200]"></div>
                  </div>
                ) : communities.length > 0 ? (
                  <div className="grid gap-3">
                    {communities.map((community) => (
                      <motion.div
                        key={community.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-center justify-between p-4 bg-black/30 rounded-2xl border border-[#3a3a3a] hover:border-[#f9c200]/30 transition-all"
                      >
                        <div className="flex-1">
                          <h3 className="text-white font-bold text-lg">
                            {community.name}
                          </h3>
                          <p className="text-gray-400 text-sm">
                            {community.city_ru || community.city}
                            {community.country_ru && `, ${community.country_ru}`}
                          </p>
                        </div>
                        
                        <div className="flex gap-2">
                          {community.instagram && (
                            
                             <a href={`https://instagram.com/${community.instagram.replace('@', '')}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-2 bg-gradient-to-tr from-purple-600 to-pink-600 rounded-xl hover:scale-110 transition-transform"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Instagram className="text-white" size={20} />
                            </a>
                          )}
                          {community.telegram && (
                            
                             <a href={community.telegram.startsWith('http') ? community.telegram : `https://${community.telegram}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-2 bg-[#0088cc] rounded-xl hover:scale-110 transition-transform"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Send className="text-white" size={20} />
                            </a>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-20">
                    <Globe className="text-gray-600 mx-auto mb-4" size={60} />
                    <p className="text-gray-400 text-lg">Сообщества не найдены</p>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="sticky bottom-0 bg-gradient-to-r from-[#1a1a1a] to-[#0a0a0a] p-4 border-t border-[#3a3a3a] text-center">
                <p className="text-gray-500 text-sm">
                  Найдено сообществ: {communities.length}
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Home;