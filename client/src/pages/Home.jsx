import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import { 
  ChevronDown, Calendar, Trophy, Image, Star,
  Sparkles, Zap, Users, ArrowRight, Play,
  MessageCircle, MapPin, Clock, ChevronLeft, ChevronRight as ChevronRightIcon,
  Lock, Video, Package
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
  
  const { scrollYProgress } = useScroll();
  const heroOpacity = useTransform(scrollYProgress, [0, 0.3], [1, 0]);
  const heroScale = useTransform(scrollYProgress, [0, 0.3], [1, 0.8]);
  
  // Load ALL events - изменен эндпоинт для получения всех событий
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

      {/* Events Carousel Section - ИЗМЕНЕНО: отображение всех событий */}
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

              {/* Custom Navigation Buttons */}
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

      {/* Media Section - ТЕПЕРЬ ИДЕТ ПЕРЕД TOP USERS */}
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
                  // Fallback если нет медиа
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

      {/* Merch Section - НОВЫЙ БЛОК */}
      <section className="relative py-20 px-4">
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* DVIZH BISHKEK Card */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#2a2a2a] to-[#1d1d1d] border border-[#3a3a3a] hover:border-[#f9c200]/30 transition-all"
            >
              <div className="p-8">
                <div className="mb-6">
                  <Sparkles className="text-[#f9c200] mb-4" size={48} />
                  <h3 className="text-2xl font-black text-white mb-2 uppercase">
                    DVIZH BISHKEK
                  </h3>
                  <p className="text-gray-400">
                    Футболки, худи и панамки с символикой движухи
                  </p>
                </div>
                <div className="flex flex-wrap gap-2 mb-6">
                  <span className="px-3 py-1 bg-[#f9c200]/20 text-[#f9c200] rounded-lg text-xs font-bold uppercase">
                    2 РЕВИЗИИ
                  </span>
                  <span className="px-3 py-1 bg-black/30 text-gray-300 rounded-lg text-xs font-bold uppercase">
                    ФУТБОЛКИ
                  </span>
                  <span className="px-3 py-1 bg-black/30 text-gray-300 rounded-lg text-xs font-bold uppercase">
                    ХУДИ
                  </span>
                  <span className="px-3 py-1 bg-black/30 text-gray-300 rounded-lg text-xs font-bold uppercase">
                    ПАНАМКИ
                  </span>
                </div>
                <Link
                  to="/merch?category=dvizh_bishkek"
                  className="inline-flex items-center gap-2 text-[#f9c200] hover:text-[#ffdd44] transition font-bold uppercase"
                >
                  <span>СМОТРЕТЬ КОЛЛЕКЦИЮ</span>
                  <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
              <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-[#f9c200]/10 rounded-full blur-3xl" />
            </motion.div>

            {/* MAX KORZH Card */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-purple-900/20 to-pink-900/20 border border-purple-500/30 hover:border-purple-500/50 transition-all"
            >
              <div className="p-8">
                <div className="mb-6">
                  <Star className="text-purple-400 mb-4" size={48} />
                  <h3 className="text-2xl font-black text-white mb-2 uppercase">
                    OFFICIAL MAX KORZH
                  </h3>
                  <p className="text-gray-400">
                    Официальный мерч: худи и шарфы
                  </p>
                </div>
                <div className="flex flex-wrap gap-2 mb-6">
                  <span className="px-3 py-1 bg-purple-500/20 text-purple-400 rounded-lg text-xs font-bold uppercase">
                    ЭКСКЛЮЗИВ
                  </span>
                  <span className="px-3 py-1 bg-black/30 text-gray-300 rounded-lg text-xs font-bold uppercase">
                    ХУДИ
                  </span>
                  <span className="px-3 py-1 bg-black/30 text-gray-300 rounded-lg text-xs font-bold uppercase">
                    ШАРФЫ
                  </span>
                </div>
                <Link
                  to="/merch?category=official_max_korzh"
                  className="inline-flex items-center gap-2 text-purple-400 hover:text-purple-300 transition font-bold uppercase"
                >
                  <span>СМОТРЕТЬ КОЛЛЕКЦИЮ</span>
                  <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
              <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-purple-500/10 rounded-full blur-3xl" />
            </motion.div>
          </div>

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
              <Package  size={24} />
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

      {/* Top Users Section - ПЕРЕМЕЩЕНО В САМЫЙ НИЗ */}
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
    </div>
  );
};

export default Home;