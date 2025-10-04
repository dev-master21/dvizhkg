import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import { 
  ChevronDown, Calendar, Trophy, Image, Star,
  Sparkles, Zap, Users, ArrowRight, Play,
  MessageCircle, MapPin, Clock
} from 'lucide-react';
import { useQuery } from 'react-query';
import axios from '../utils/axios';
import { useAuthStore } from '../stores/authStore';
import EventCard from '../components/EventCard';
import UserTable from '../components/UserTable';

const Home = () => {
  const navigate = useNavigate();
  const videoRef = useRef(null);
  const { isAuthenticated } = useAuthStore();
  const [videoLoaded, setVideoLoaded] = useState(false);
  
  const { scrollYProgress } = useScroll();
  const heroOpacity = useTransform(scrollYProgress, [0, 0.3], [1, 0]);
  const heroScale = useTransform(scrollYProgress, [0, 0.3], [1, 0.8]);
  
  // Load events
  const { data: events = [] } = useQuery(
    ['homeEvents'],
    () => axios.get('/api/events/public').then(res => res.data.slice(0, 6))
  );
  
  // Load top users
  const { data: topUsers = [] } = useQuery(
    'topUsersHome',
    () => axios.get('/api/users/top/public').then(res => res.data)
  );

  useEffect(() => {
    // Auto-play video when loaded
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
      {/* Hero Section with Video */}
      <motion.section 
        className="relative h-screen flex items-center justify-center overflow-hidden"
        style={{ opacity: heroOpacity, scale: heroScale }}
      >
        {/* Video Background */}
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
            {/* Fallback to gradient if video doesn't load */}
          </video>
          
          {/* Dark overlay */}
          <div className="absolute inset-0 bg-black/60" />
          
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/30 to-black" />
        </div>

        {/* Hero Content */}
        <div className="relative z-10 text-center px-4 pb-20">
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ 
              duration: 1, 
              type: "spring",
              stiffness: 100
            }}
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
            style={{
              background: 'linear-gradient(to bottom, #ffffff, #ffffff)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
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

        {/* Scroll indicator - Поднял выше, изменил bottom-12 на bottom-20 */}
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

        {/* Animated particles */}
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

      {/* Events Section */}
      <section className="relative py-20 px-4 bg-gradient-to-b from-black to-[#0a0a0a]">
        <div className="container mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-5xl md:text-6xl font-black text-white mb-4 uppercase">
              БЛИЖАЙШИЕ СОБЫТИЯ
            </h2>
            <p className="text-xl text-gray-400 uppercase">
              НЕ ПРОПУСТИ САМЫЕ ЯРКИЕ ДВИЖУХИ
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {events.slice(0, 6).map((event, index) => (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <EventCard event={event} index={index} />
              </motion.div>
            ))}
          </div>

          {events.length === 0 && (
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
            className="text-center"
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

      {/* Top Users Section */}
      <section className="relative py-20 px-4">
        <div className="container mx-auto max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-5xl md:text-6xl font-black text-white mb-4 uppercase">
              ТОП ДВИЖ ПАЦАНОВ
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

      {/* Media Section - Уменьшил отступы еще больше */}
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
            <p className="text-xl text-gray-400 mb-4 uppercase">
              ФОТО И ВИДЕО С НАШИХ ЯРКИХ И НЕЗАБЫВАЕМЫХ ВСТРЕЧ
            </p>

            <div className="relative max-w-4xl mx-auto">
              {/* Media Preview Grid - Уменьшил mb-8 до mb-4 */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[...Array(8)].map((_, i) => (
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
                ))}
              </div>

              {!isAuthenticated && (
                <div className="absolute inset-0 bg-black/80 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                  <div className="text-center p-8">
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
                  </div>
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
              {/* Glow effect */}
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
    </div>
  );
};

export default Home;