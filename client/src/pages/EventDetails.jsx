import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Calendar, MapPin, DollarSign, Users, ArrowLeft, Share2,
  Instagram, MessageCircle, Phone, Bell, Image,
  CheckCircle, XCircle, UserPlus, Trash2, ExternalLink,
  Clock, Sparkles, Zap, Shield, Copy, Check,
  Trophy, Award, Flag, AlertCircle
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import axios from '../utils/axios';
import { useAuthStore } from '../stores/authStore';
import MediaGallery from '../components/MediaGallery';
import toast from 'react-hot-toast';
import Loader from '../components/Loader';
import { formatDate, formatPrice, getContactLink } from '../utils/helpers';

const EventDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, isAuthenticated } = useAuthStore();
  const isAdmin = user?.role === 'admin';
  
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [showMediaUpload, setShowMediaUpload] = useState(false);
  const [showUserSelect, setShowUserSelect] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [searchUser, setSearchUser] = useState('');
  const [copied, setCopied] = useState(false);
  
  // Таймер обратного отсчета
  const [timeLeft, setTimeLeft] = useState(null);

  // Загрузка данных
  const { data: event, isLoading } = useQuery(
    ['event', id],
    () => axios.get(`/api/events/${id}`).then(res => res.data)
  );
  
  const { data: participants = [] } = useQuery(
    ['participants', id],
    () => axios.get(`/api/events/${id}/participants`).then(res => res.data),
    { enabled: isAuthenticated }
  );
  
  const { data: eventMedia = [] } = useQuery(
    ['eventMedia', id],
    () => axios.get(`/api/media?event_id=${id}`).then(res => res.data),
    { enabled: isAuthenticated }
  );

  const { data: allUsers = [] } = useQuery(
    ['allUsers', searchUser],
    () => axios.get(`/api/users?search=${searchUser}`).then(res => res.data),
    { enabled: showUserSelect && isAdmin }
  );

  // Расчет времени до события
  React.useEffect(() => {
    if (!event?.event_date || event.status !== 'upcoming') return;

    const calculateTimeLeft = () => {
      const difference = new Date(event.event_date) - new Date();
      
      if (difference <= 0) {
        return null;
      }

      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      
      if (days > 0) {
        return `${days}Д ${hours}Ч`;
      } else {
        return `${hours}Ч ${minutes}М`;
      }
    };

    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    setTimeLeft(calculateTimeLeft());

    return () => clearInterval(timer);
  }, [event]);

  // Копирование ссылки
  const copyLink = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    setCopied(true);
    toast.success('ССЫЛКА СКОПИРОВАНА!');
    setTimeout(() => setCopied(false), 2000);
  };

  // Поделиться в соцсетях
  const shareToSocial = (platform) => {
    const url = window.location.href;
    const text = `${event?.title} - DVIZH BISHKEK`;
    
    const urls = {
      telegram: `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`,
      whatsapp: `https://wa.me/?text=${encodeURIComponent(text + ' ' + url)}`,
      instagram: '#'
    };
    
    if (urls[platform] !== '#') {
      window.open(urls[platform], '_blank');
    }
    setShowShareModal(false);
  };
  
  // Mutations
  const registerMutation = useMutation(
    () => axios.post(`/api/events/${id}/register`),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['participants', id]);
        queryClient.invalidateQueries(['event', id]);
        toast.success('🔥 ТЫ В ДВИЖЕ!');
        setShowRegisterModal(false);
      },
      onError: (error) => {
        if (error.response?.data?.error === 'Already registered') {
          toast.error('ТЫ УЖЕ В СПИСКЕ!');
        } else {
          toast.error('ОШИБКА РЕГИСТРАЦИИ');
        }
      }
    }
  );
  
  const remindMutation = useMutation(
    () => axios.post(`/api/events/${id}/remind`),
    {
      onSuccess: () => {
        toast.success('📢 НАПОМИНАНИЕ ОТПРАВЛЕНО!');
      }
    }
  );
  
  const statusMutation = useMutation(
    (status) => axios.put(`/api/events/${id}/status`, { status }),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['event', id]);
        queryClient.invalidateQueries(['events']);
        toast.success('СТАТУС ИЗМЕНЕН');
      }
    }
  );
  
  const uploadMediaMutation = useMutation(
    (formData) => axios.post('/api/media/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['eventMedia', id]);
        toast.success('📸 МЕДИА ЗАГРУЖЕНЫ!');
        setShowMediaUpload(false);
        setSelectedFiles([]);
      }
    }
  );
  
  const manualRegisterMutation = useMutation(
    (userId) => axios.post(`/api/events/${id}/register-manual`, { userId }),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['participants', id]);
        queryClient.invalidateQueries(['event', id]);
        toast.success('УЧАСТНИК ДОБАВЛЕН!');
        setShowUserSelect(false);
        setSearchUser('');
      }
    }
  );

  const deleteMediaMutation = useMutation(
    (mediaId) => axios.delete(`/api/media/${mediaId}`),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['eventMedia', id]);
        toast.success('МЕДИА УДАЛЕНО');
      }
    }
  );
  
  const handleMediaUpload = () => {
    const formData = new FormData();
    formData.append('event_id', id);
    selectedFiles.forEach(file => {
      formData.append('files', file);
    });
    uploadMediaMutation.mutate(formData);
  };
  
  const handleFileSelect = (e) => {
    setSelectedFiles(Array.from(e.target.files));
  };
  
  const getContactIcon = (type) => {
    switch(type) {
      case 'instagram': return <Instagram size={20} />;
      case 'whatsapp': return <Phone size={20} />;
      case 'telegram': return <MessageCircle size={20} />;
      default: return null;
    }
  };
  
  const isRegistered = participants.some(p => p.id === user?.id);
  const canRegister = event?.status === 'upcoming' && 
                     (!event.max_participants || participants.length < event.max_participants);
  const isFull = event?.max_participants && participants.length >= event.max_participants;
  
  if (isLoading) {
    return <Loader fullScreen={false} />;
  }
  
  if (!event) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <AlertCircle className="text-gray-600 mx-auto mb-4" size={64} />
          <h2 className="text-2xl font-bold text-gray-400 uppercase">СОБЫТИЕ НЕ НАЙДЕНО</h2>
        </motion.div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-[#0a0a0a] relative">
      {/* Animated background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-80 h-80 bg-[#f9c200]/5 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-40 -right-40 w-80 h-80 bg-[#f9c200]/5 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="container mx-auto px-4 pt-20 md:pt-24 pb-12 relative z-10"
      >
        {/* Back & Share buttons */}
        <div className="flex justify-between items-center mb-4 md:mb-6">
          <motion.button
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            whileHover={{ x: -5 }}
            onClick={() => navigate('/events')}
            className="flex items-center gap-1.5 md:gap-2 text-[#f9c200] hover:text-[#ffdd44] transition uppercase font-bold text-sm md:text-base"
          >
            <ArrowLeft size={18} />
            <span>НАЗАД</span>
          </motion.button>

          <motion.button
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setShowShareModal(true)}
            className="p-2.5 md:p-3 bg-black/30 text-gray-400 hover:text-white rounded-xl border border-gray-800 transition"
          >
            <Share2 size={18} />
          </motion.button>
        </div>
        
        {/* Main content */}
        <div className="grid lg:grid-cols-3 gap-6 md:gap-8">
          {/* Left column - Event details */}
          <div className="lg:col-span-2 space-y-4 md:space-y-6">
            {/* Hero Card */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="relative rounded-2xl md:rounded-3xl overflow-hidden bg-gradient-to-br from-[#2a2a2a] to-[#1d1d1d] border border-[#3a3a3a]"
            >
              {/* Preview image */}
              {event.preview_image && (
                <div className="relative h-[250px] sm:h-[350px] md:h-[500px]">
                  <img 
                    src={`${import.meta.env.VITE_API_URL}${event.preview_image}`}
                    alt={event.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
                  
                  {/* Status Badge */}
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.3 }}
                    className="absolute top-4 md:top-6 left-4 md:left-6"
                  >
                    <div className={`px-3 md:px-4 py-1.5 md:py-2 rounded-lg md:rounded-xl font-bold text-xs md:text-sm backdrop-blur-md flex items-center gap-1.5 md:gap-2 ${
                      event.status === 'upcoming' ? 'bg-green-500/20 text-green-400 border border-green-500/30' :
                      event.status === 'completed' ? 'bg-gray-500/20 text-gray-400 border border-gray-500/30' :
                      'bg-red-500/20 text-red-400 border border-red-500/30'
                    }`}>
                      {event.status === 'upcoming' ? <Zap size={14} /> :
                       event.status === 'completed' ? <CheckCircle size={14} /> : 
                       <XCircle size={14} />}
                      <span className="uppercase">
                        {event.status === 'upcoming' ? 'ОЖИДАЕТСЯ' :
                         event.status === 'completed' ? 'ЗАВЕРШЕНО' : 'ОТМЕНЕНО'}
                      </span>
                    </div>
                  </motion.div>

                  {/* Compact Timer */}
                  {event.status === 'upcoming' && timeLeft && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.4 }}
                      className="absolute top-4 md:top-6 right-4 md:right-6"
                    >
                      <div className="bg-black/70 backdrop-blur-sm rounded-lg px-3 py-2 flex items-center gap-1.5">
                        <Clock className="text-[#f9c200]" size={14} />
                        <span className="text-white font-bold text-sm uppercase">{timeLeft}</span>
                      </div>
                    </motion.div>
                  )}

                  {/* Title Overlay */}
                  <div className="absolute bottom-0 left-0 right-0 p-4 md:p-8">
                    <motion.h1
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.2 }}
                      className="text-2xl sm:text-4xl md:text-6xl font-black text-white mb-2 md:mb-4 uppercase"
                    >
                      {event.title}
                    </motion.h1>
                    
                    <motion.div
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.3 }}
                      className="flex flex-wrap items-center gap-3 md:gap-4 text-white/80 text-sm md:text-base"
                    >
                      <span className="flex items-center gap-1.5 md:gap-2">
                        <Calendar size={16} />
                        {formatDate(event.event_date)}
                      </span>
                      <span className="flex items-center gap-1.5 md:gap-2">
                        <Users size={16} />
                        {participants.length}
                        {event.max_participants && ` / ${event.max_participants}`}
                      </span>
                      {event.price > 0 ? (
                        <span className="flex items-center gap-1.5 md:gap-2">
                          <DollarSign size={16} />
                          {event.price} СОМ
                        </span>
                      ) : (
                        <span className="flex items-center gap-1.5 md:gap-2 text-[#f9c200]">
                          <Sparkles size={16} />
                          БЕСПЛАТНО
                        </span>
                      )}
                    </motion.div>
                  </div>
                </div>
              )}
              
              {/* Content */}
              <div className="p-4 md:p-8 space-y-6 md:space-y-8">
                {/* Description */}
                {event.description && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                  >
                    <h2 className="text-lg md:text-xl font-bold text-white mb-3 md:mb-4 uppercase flex items-center gap-2">
                      <Flag size={18} className="text-[#f9c200]" />
                      ОПИСАНИЕ
                    </h2>
                    <p className="text-gray-300 text-sm md:text-base leading-relaxed whitespace-pre-line">
                      {event.description}
                    </p>
                  </motion.div>
                )}
                
                {/* Conditions */}
                {event.conditions && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                  >
                    <h2 className="text-lg md:text-xl font-bold text-white mb-3 md:mb-4 uppercase flex items-center gap-2">
                      <Shield size={18} className="text-[#f9c200]" />
                      УСЛОВИЯ
                    </h2>
                    <p className="text-gray-300 text-sm md:text-base leading-relaxed whitespace-pre-line">
                      {event.conditions}
                    </p>
                  </motion.div>
                )}

                {/* Location & Contacts */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7 }}
                  className="grid sm:grid-cols-2 gap-3 md:gap-4"
                >
                  {event.location_url && (
                    
                     <a href={event.location_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group flex items-center gap-3 md:gap-4 p-3 md:p-4 bg-black/30 rounded-xl border border-gray-800 hover:border-[#f9c200]/30 transition"
                    >
                      <div className="p-2 md:p-3 bg-[#f9c200]/10 rounded-lg md:rounded-xl group-hover:bg-[#f9c200]/20 transition">
                        <MapPin className="text-[#f9c200]" size={20} />
                      </div>
                      <div className="flex-1">
                        <p className="text-gray-400 text-xs md:text-sm uppercase">ЛОКАЦИЯ</p>
                        <p className="text-white font-bold text-sm md:text-base uppercase">2GIS</p>
                      </div>
                      <ExternalLink className="text-gray-400 group-hover:text-[#f9c200] transition" size={16} />
                    </a>
                  )}
                  
                  {event.contacts?.length > 0 && event.contacts.map((contact, index) => (
                    
                     <a key={index}
                      href={getContactLink(contact.type, contact.value)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group flex items-center gap-3 md:gap-4 p-3 md:p-4 bg-black/30 rounded-xl border border-gray-800 hover:border-[#f9c200]/30 transition"
                    >
                      <div className="p-2 md:p-3 bg-[#f9c200]/10 rounded-lg md:rounded-xl group-hover:bg-[#f9c200]/20 transition">
                        {getContactIcon(contact.type)}
                      </div>
                      <div className="flex-1">
                        <p className="text-gray-400 text-xs md:text-sm uppercase">{contact.type}</p>
                        <p className="text-white font-bold text-sm md:text-base">{contact.value}</p>
                      </div>
                      <ExternalLink className="text-gray-400 group-hover:text-[#f9c200] transition" size={16} />
                    </a>
                  ))}
                </motion.div>
                
                {/* Action buttons */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8 }}
                  className="flex flex-wrap gap-2 md:gap-3"
                >
                  {/* User registration button */}
                  {event.status === 'upcoming' && !isAdmin && isAuthenticated && (
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => event.price > 0 ? setShowRegisterModal(true) : registerMutation.mutate()}
                      disabled={isRegistered || !canRegister}
                      className={`px-6 md:px-8 py-3 md:py-4 rounded-xl font-bold text-sm md:text-base transition uppercase ${
                        isRegistered 
                          ? 'bg-gray-600 text-gray-400 cursor-not-allowed' 
                          : !canRegister
                          ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                          : 'bg-[#f9c200] text-black hover:bg-[#ffdd44]'
                      }`}
                    >
                      {isRegistered ? (
                        <>
                          <CheckCircle className="inline mr-1.5 md:mr-2" size={18} />
                          ТЫ В ДВИЖЕ
                        </>
                      ) : !canRegister ? (
                        <>
                          <XCircle className="inline mr-1.5 md:mr-2" size={18} />
                          МЕСТ НЕТ
                        </>
                      ) : (
                        <>
                          <Zap className="inline mr-1.5 md:mr-2" size={18} />
                          УЧАСТВОВАТЬ
                        </>
                      )}
                    </motion.button>
                  )}

                  {!isAuthenticated && event.status === 'upcoming' && (
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => navigate('/login')}
                      className="px-6 md:px-8 py-3 md:py-4 bg-[#f9c200] text-black rounded-xl font-bold hover:bg-[#ffdd44] transition uppercase text-sm md:text-base w-full sm:w-auto"
                    >
                      <Users className="inline mr-1.5 md:mr-2" size={18} />
                      ВОЙТИ
                    </motion.button>
                  )}
                  
                  {/* Admin buttons */}
                  {isAdmin && (
                    <>
                      {event.status === 'upcoming' && (
                        <>
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => statusMutation.mutate('completed')}
                            className="px-4 md:px-6 py-3 md:py-4 bg-green-500 text-white rounded-xl font-bold hover:bg-green-600 transition flex items-center gap-1.5 md:gap-2 uppercase text-xs md:text-sm"
                          >
                            <CheckCircle size={18} />
                            <span className="hidden sm:inline">ЗАВЕРШИТЬ</span>
                          </motion.button>
                          
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => remindMutation.mutate()}
                            className="px-4 md:px-6 py-3 md:py-4 bg-blue-500 text-white rounded-xl font-bold hover:bg-blue-600 transition flex items-center gap-1.5 md:gap-2 uppercase text-xs md:text-sm"
                          >
                            <Bell size={18} />
                            <span className="hidden sm:inline">НАПОМНИТЬ</span>
                          </motion.button>
                          
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setShowUserSelect(true)}
                            className="px-4 md:px-6 py-3 md:py-4 bg-purple-500 text-white rounded-xl font-bold hover:bg-purple-600 transition flex items-center gap-1.5 md:gap-2 uppercase text-xs md:text-sm"
                          >
                            <UserPlus size={18} />
                            <span className="hidden sm:inline">ДОБАВИТЬ</span>
                          </motion.button>
                        </>
                      )}
                      
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setShowMediaUpload(true)}
                        className="px-4 md:px-6 py-3 md:py-4 bg-indigo-500 text-white rounded-xl font-bold hover:bg-indigo-600 transition flex items-center gap-1.5 md:gap-2 uppercase text-xs md:text-sm"
                      >
                        <Image size={18} />
                        <span className="hidden sm:inline">МЕДИА</span>
                      </motion.button>
                    </>
                  )}
                </motion.div>
              </div>
            </motion.div>
            
            {/* Media section */}
            {isAuthenticated && eventMedia.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.9 }}
                className="bg-gradient-to-br from-[#2a2a2a] to-[#1d1d1d] rounded-2xl md:rounded-3xl p-4 md:p-8 border border-[#3a3a3a]"
              >
                <h2 className="text-xl md:text-2xl font-bold text-white mb-4 md:mb-6 uppercase flex items-center gap-2 md:gap-3">
                  <Image className="text-[#f9c200]" size={20} />
                  МЕДИА ({eventMedia.length})
                </h2>
                <MediaGallery 
                  media={eventMedia}
                  canDelete={isAdmin}
                  onDelete={(mediaId) => deleteMediaMutation.mutate(mediaId)}
                />
              </motion.div>
            )}
          </div>
          
          {/* Right column - Participants */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
            className="lg:col-span-1"
          >
            <div className="sticky top-20 md:top-24">
              {/* Participants List */}
              {isAuthenticated && (
                <div className="bg-gradient-to-br from-[#2a2a2a] to-[#1d1d1d] rounded-2xl md:rounded-3xl p-4 md:p-6 border border-[#3a3a3a]">
                  <h3 className="text-lg md:text-xl font-bold text-white mb-3 md:mb-4 uppercase flex items-center justify-between">
                    <span className="flex items-center gap-1.5 md:gap-2">
                      <Users className="text-[#f9c200]" size={18} />
                      УЧАСТНИКИ
                    </span>
                    <span className="text-[#f9c200] text-sm md:text-base">
                      {participants.length}
                      {event.max_participants && `/${event.max_participants}`}
                    </span>
                  </h3>

                  {/* Progress bar */}
                  {event.max_participants && (
                    <div className="mb-3 md:mb-4">
                      <div className="h-1.5 md:h-2 bg-black/30 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${(participants.length / event.max_participants) * 100}%` }}
                          transition={{ duration: 1, ease: "easeOut" }}
                          className={`h-full ${
                            isFull ? 'bg-red-500' : 'bg-[#f9c200]'
                          }`}
                        />
                      </div>
                      <p className="text-[10px] md:text-xs text-gray-400 mt-1 uppercase">
                        {isFull ? 'МЕСТ НЕТ' : `ОСТАЛОСЬ ${event.max_participants - participants.length} МЕСТ`}
                      </p>
                    </div>
                  )}
                  
                  {participants.length > 0 ? (
                    <div className="space-y-1.5 md:space-y-2 max-h-80 md:max-h-96 overflow-y-auto">
                      <AnimatePresence>
                        {participants.map((participant, index) => (
                          <motion.div
                            key={participant.id}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ delay: index * 0.05 }}
                            className="group flex items-center gap-2 md:gap-3 p-2 md:p-3 rounded-lg md:rounded-xl bg-black/20 hover:bg-black/30 transition cursor-pointer"
                            onClick={() => navigate(`/profile/${participant.id}`)}
                          >
                            {participant.avatar_url ? (
                              <img 
                                src={participant.avatar_url} 
                                alt={participant.first_name}
                                className="w-8 h-8 md:w-10 md:h-10 rounded-full border-2 border-gray-700 group-hover:border-[#f9c200] transition"
                              />
                            ) : (
                              <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-gradient-to-br from-[#f9c200] to-[#ffdd44] flex items-center justify-center font-bold text-black text-sm">
                                {participant.first_name?.[0] || '?'}
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="text-white font-medium truncate group-hover:text-[#f9c200] transition text-sm md:text-base">
                                {participant.first_name} {participant.last_name}
                              </p>
                              <p className="text-gray-400 text-xs md:text-sm flex items-center gap-1">
                                <Trophy size={10} />
                                {participant.reputation} РЕП
                              </p>
                            </div>
                            {index < 3 && (
                              <Award className={`${
                                index === 0 ? 'text-[#f9c200]' :
                                index === 1 ? 'text-gray-300' :
                                'text-orange-500'
                              }`} size={16} />
                            )}
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    </div>
                  ) : (
                    <div className="text-center py-6 md:py-8">
                      <Users className="text-gray-600 mx-auto mb-2 md:mb-3" size={32} />
                      <p className="text-gray-400 uppercase text-sm md:text-base">НЕТ УЧАСТНИКОВ</p>
                      <p className="text-gray-500 text-xs md:text-sm mt-1">БУДЬ ПЕРВЫМ!</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        </div>
        
        {/* Modals */}
        
        {/* Share Modal */}
        <AnimatePresence>
          {showShareModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50"
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-gradient-to-br from-[#2a2a2a] to-[#1d1d1d] rounded-2xl p-6 max-w-md w-full border border-[#3a3a3a]"
              >
                <h3 className="text-xl font-bold text-white mb-4 uppercase">
                  ПОДЕЛИТЬСЯ
                </h3>
                
                <div className="space-y-3 mb-6">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => shareToSocial('telegram')}
                    className="w-full flex items-center gap-3 p-4 bg-black/30 rounded-xl hover:bg-black/50 transition"
                  >
                    <MessageCircle className="text-[#0088cc]" size={24} />
                    <span className="text-white uppercase">TELEGRAM</span>
                  </motion.button>
                  
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => shareToSocial('whatsapp')}
                    className="w-full flex items-center gap-3 p-4 bg-black/30 rounded-xl hover:bg-black/50 transition"
                  >
                    <Phone className="text-[#25D366]" size={24} />
                    <span className="text-white uppercase">WHATSAPP</span>
                  </motion.button>
                  
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={copyLink}
                    className="w-full flex items-center gap-3 p-4 bg-black/30 rounded-xl hover:bg-black/50 transition"
                  >
                    {copied ? (
                      <Check className="text-green-500" size={24} />
                    ) : (
                      <Copy className="text-[#f9c200]" size={24} />
                    )}
                    <span className="text-white uppercase">
                      {copied ? 'СКОПИРОВАНО!' : 'КОПИРОВАТЬ ССЫЛКУ'}
                    </span>
                  </motion.button>
                </div>
                
                <button
                  onClick={() => setShowShareModal(false)}
                  className="w-full btn-secondary uppercase"
                >
                  ЗАКРЫТЬ
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Paid Registration Modal */}
        <AnimatePresence>
          {showRegisterModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50"
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-gradient-to-br from-[#2a2a2a] to-[#1d1d1d] rounded-2xl p-6 max-w-md w-full border border-[#3a3a3a]"
              >
                <h3 className="text-xl font-bold text-white mb-4 uppercase">
                  💰 ПЛАТНОЕ МЕРОПРИЯТИЕ
                </h3>
                <p className="text-gray-300 mb-6">
                  СТОИМОСТЬ УЧАСТИЯ: <span className="text-[#f9c200] font-bold">{event.price} СОМ</span>
                </p>
                <p className="text-gray-300 mb-6 uppercase">
                  ДЛЯ РЕГИСТРАЦИИ ОБРАТИСЬ К ОРГАНИЗАТОРАМ:
                </p>
                <div className="space-y-2 mb-6">
                  {event.contacts?.map((contact, index) => (
                    
                     <a key={index}
                      href={getContactLink(contact.type, contact.value)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-[#f9c200] hover:text-[#ffdd44] transition"
                    >
                      {getContactIcon(contact.type)}
                      <span>{contact.value}</span>
                    </a>
                  ))}
                </div>
                <button
                  onClick={() => setShowRegisterModal(false)}
                  className="w-full btn-primary uppercase"
                >
                  ПОНЯТНО
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Media Upload Modal */}
        <AnimatePresence>
          {showMediaUpload && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50"
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-gradient-to-br from-[#2a2a2a] to-[#1d1d1d] rounded-2xl p-6 max-w-md w-full border border-[#3a3a3a]"
              >
                <h3 className="text-xl font-bold text-white mb-4 uppercase">
                  📸 ЗАГРУЗИТЬ МЕДИА
                </h3>
                <input
                  type="file"
                  multiple
                  accept="image/*,video/*"
                  onChange={handleFileSelect}
                  className="mb-4 text-white w-full p-3 bg-black/30 rounded-xl border border-gray-800"
                />
                {selectedFiles.length > 0 && (
                  <p className="text-gray-300 mb-4">
                    ВЫБРАНО ФАЙЛОВ: {selectedFiles.length}
                  </p>
                )}
                <div className="flex gap-3">
                  <button
                    onClick={handleMediaUpload}
                    disabled={selectedFiles.length === 0 || uploadMediaMutation.isLoading}
                    className="flex-1 btn-primary disabled:opacity-50 uppercase"
                  >
                    {uploadMediaMutation.isLoading ? 'ЗАГРУЖАЕМ...' : 'ЗАГРУЗИТЬ'}
                  </button>
                  <button
                    onClick={() => {
                      setShowMediaUpload(false);
                      setSelectedFiles([]);
                    }}
                    className="flex-1 btn-secondary uppercase"
                  >
                    ОТМЕНА
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* User Selection Modal */}
        <AnimatePresence>
          {showUserSelect && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50"
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-gradient-to-br from-[#2a2a2a] to-[#1d1d1d] rounded-2xl p-6 max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col border border-[#3a3a3a]"
              >
                <h3 className="text-xl font-bold text-white mb-4 uppercase">
                  ВЫБРАТЬ УЧАСТНИКА
                </h3>
                
                <input
                  type="text"
                  value={searchUser}
                  onChange={(e) => setSearchUser(e.target.value)}
                  placeholder="ПОИСК ПО ИМЕНИ..."
                  className="input mb-4 uppercase"
                />
                
                <div className="flex-1 overflow-y-auto mb-4">
                  <div className="space-y-2">
                    {allUsers
                      .filter(u => !participants.some(p => p.id === u.id))
                      .map(user => (
                        <button
                          key={user.id}
                          onClick={() => manualRegisterMutation.mutate(user.id)}
                          className="w-full flex items-center gap-3 bg-black/30 p-3 rounded-xl hover:bg-black/50 transition text-left"
                        >
                          {user.avatar_url ? (
                            <img 
                              src={user.avatar_url} 
                              alt={user.first_name}
                              className="w-10 h-10 rounded-full"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-[#f9c200] flex items-center justify-center font-bold text-black">
                              {user.first_name?.[0] || '?'}
                            </div>
                          )}
                          <div className="flex-1">
                            <p className="text-white font-medium">
                              {user.first_name} {user.last_name}
                            </p>
                            {user.username && (
                              <p className="text-gray-400 text-sm">@{user.username}</p>
                            )}
                          </div>
                          <div className="text-gray-400 text-sm">
                            {user.reputation} РЕП
                          </div>
                        </button>
                      ))}
                  </div>
                </div>
                
                <button
                  onClick={() => {
                    setShowUserSelect(false);
                    setSearchUser('');
                  }}
                  className="w-full btn-secondary uppercase"
                >
                  ОТМЕНА
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

export default EventDetails;