import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Calendar, MapPin, DollarSign, Users, ArrowLeft,
  Instagram, MessageCircle, Phone, Bell, Image, 
  CheckCircle, XCircle, UserPlus, Trash2, Edit
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import axios from '../utils/axios';
import { useAuthStore } from '../stores/authStore';
import CountdownTimer from '../components/CountdownTimer';
import MediaGallery from '../components/MediaGallery';
import toast from 'react-hot-toast';
import { formatDate, formatPrice, getContactLink } from '../utils/helpers';

const EventDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'admin';
  
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [showMediaUpload, setShowMediaUpload] = useState(false);
  const [showUserSelect, setShowUserSelect] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [searchUser, setSearchUser] = useState('');
  
  // Загрузка данных события
  const { data: event, isLoading } = useQuery(
    ['event', id],
    () => axios.get(`/api/events/${id}`).then(res => res.data)
  );
  
  // Загрузка участников
  const { data: participants = [] } = useQuery(
    ['participants', id],
    () => axios.get(`/api/events/${id}/participants`).then(res => res.data)
  );
  
  // Загрузка медиа
  const { data: eventMedia = [] } = useQuery(
    ['eventMedia', id],
    () => axios.get(`/api/media?event_id=${id}`).then(res => res.data)
  );

  // Загрузка всех пользователей для ручной регистрации
  const { data: allUsers = [] } = useQuery(
    ['allUsers', searchUser],
    () => axios.get(`/api/users?search=${searchUser}`).then(res => res.data),
    { enabled: showUserSelect }
  );
  
  // Регистрация на событие
  const registerMutation = useMutation(
    () => axios.post(`/api/events/${id}/register`),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['participants', id]);
        queryClient.invalidateQueries(['event', id]);
        toast.success('Ты зарегистрирован на событие! 🔥');
        setShowRegisterModal(false);
      },
      onError: (error) => {
        if (error.response?.data?.error === 'Already registered') {
          toast.error('Ты уже зарегистрирован!');
        } else {
          toast.error('Ошибка при регистрации');
        }
      }
    }
  );
  
  // Напоминание о событии
  const remindMutation = useMutation(
    () => axios.post(`/api/events/${id}/remind`),
    {
      onSuccess: () => {
        toast.success('Напоминание отправлено в чат! 📢');
      }
    }
  );
  
  // Изменение статуса события
  const statusMutation = useMutation(
    (status) => axios.put(`/api/events/${id}/status`, { status }),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['event', id]);
        queryClient.invalidateQueries(['events']);
        toast.success('Статус события изменен');
      }
    }
  );
  
  // Загрузка медиа
  const uploadMediaMutation = useMutation(
    (formData) => axios.post('/api/media/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['eventMedia', id]);
        toast.success('Медиа загружены! 📸');
        setShowMediaUpload(false);
        setSelectedFiles([]);
      }
    }
  );
  
  // Ручная регистрация участника
  const manualRegisterMutation = useMutation(
    (userId) => axios.post(`/api/events/${id}/register-manual`, { userId }),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['participants', id]);
        queryClient.invalidateQueries(['event', id]);
        toast.success('Участник зарегистрирован!');
        setShowUserSelect(false);
        setSearchUser('');
      }
    }
  );

  // Удаление медиа
  const deleteMediaMutation = useMutation(
    (mediaId) => axios.delete(`/api/media/${mediaId}`),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['eventMedia', id]);
        toast.success('Медиа удалено');
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
  
  if (isLoading) {
    return <Loader fullScreen={false} />;
  }
  
  if (!event) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <h2 className="text-2xl font-bold text-gray-400">Событие не найдено</h2>
      </div>
    );
  }
  
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="container mx-auto px-4"
    >
      {/* Back button */}
      <button
        onClick={() => navigate('/events')}
        className="flex items-center gap-2 text-[#f9c200] mb-6 hover:opacity-80 transition"
      >
        <ArrowLeft size={20} />
        <span className="font-bold">Назад к событиям</span>
      </button>
      
      {/* Main content */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left column - Event details */}
        <div className="lg:col-span-2">
          <div className="bg-[#2a2a2a] rounded-2xl overflow-hidden border border-[#3a3a3a]">
            {/* Preview image */}
            {event.preview_image && (
              <div className="relative h-[400px]">
                <img 
                  src={`${import.meta.env.VITE_API_URL}${event.preview_image}`}
                  alt={event.title}
                  className="w-full h-full object-cover"
                />
                {event.status === 'upcoming' && (
                  <div className="absolute top-4 right-4 bg-black/70 backdrop-blur-sm rounded-xl p-4">
                    <CountdownTimer targetDate={event.event_date} />
                  </div>
                )}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent h-32" />
              </div>
            )}
            
            <div className="p-6">
              {/* Title and status */}
              <div className="flex items-start justify-between mb-6">
                <div className="flex-1">
                  <h1 className="text-3xl md:text-4xl font-black text-white mb-2">
                    {event.title}
                  </h1>
                  <div className="flex items-center gap-4 text-gray-400 flex-wrap">
                    <span className="flex items-center gap-2">
                      <Calendar size={18} />
                      {formatDate(event.event_date)}
                    </span>
                    <span className="flex items-center gap-2">
                      <Users size={18} />
                      {participants.length}
                      {event.max_participants && ` / ${event.max_participants}`} участников
                    </span>
                  </div>
                </div>
                
                <div className={`px-4 py-2 rounded-xl font-bold text-sm ${
                  event.status === 'upcoming' ? 'bg-green-500/20 text-green-500 border border-green-500/30' :
                  event.status === 'completed' ? 'bg-gray-500/20 text-gray-500 border border-gray-500/30' :
                  'bg-red-500/20 text-red-500 border border-red-500/30'
                }`}>
                  {event.status === 'upcoming' ? 'Ожидается' :
                   event.status === 'completed' ? 'Завершено' : 'Отменено'}
                </div>
              </div>
              
              {/* Description */}
              {event.description && (
                <div className="mb-6">
                  <h2 className="text-xl font-bold text-white mb-3">Описание</h2>
                  <p className="text-gray-300 whitespace-pre-line">{event.description}</p>
                </div>
              )}
              
              {/* Conditions */}
              {event.conditions && (
                <div className="mb-6">
                  <h2 className="text-xl font-bold text-white mb-3">Условия участия</h2>
                  <p className="text-gray-300 whitespace-pre-line">{event.conditions}</p>
                </div>
              )}
              
              {/* Price and location */}
              <div className="grid md:grid-cols-2 gap-4 mb-6">
                <div className="bg-[#1d1d1d] rounded-xl p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-[#f9c200]/20 rounded-lg">
                      <DollarSign className="text-[#f9c200]" size={24} />
                    </div>
                    <div>
                      <p className="text-gray-400 text-sm">Стоимость</p>
                      <p className="text-white font-bold text-lg">
                        {formatPrice(event.price)}
                      </p>
                    </div>
                  </div>
                </div>
                
                {event.location_url && (
                  
                  <a  href={event.location_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-[#1d1d1d] rounded-xl p-4 hover:bg-[#2a2a2a] transition"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-[#f9c200]/20 rounded-lg">
                        <MapPin className="text-[#f9c200]" size={24} />
                      </div>
                      <div>
                        <p className="text-gray-400 text-sm">Локация</p>
                        <p className="text-white font-bold text-lg">
                          Открыть в 2GIS →
                        </p>
                      </div>
                    </div>
                  </a>
                )}
              </div>
              
              {/* Contacts */}
              {event.contacts && event.contacts.length > 0 && (
                <div className="mb-6">
                  <h2 className="text-xl font-bold text-white mb-3">Контакты</h2>
                  <div className="flex flex-wrap gap-3">
                    {event.contacts.map((contact, index) => (
                      
                     <a   key={index}
                        href={getContactLink(contact.type, contact.value)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 bg-[#1d1d1d] px-4 py-2 rounded-xl hover:bg-[#f9c200]/20 transition"
                      >
                        {getContactIcon(contact.type)}
                        <span className="text-white font-medium">{contact.value}</span>
                      </a>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Action buttons */}
              <div className="flex flex-wrap gap-3">
                {/* User registration button */}
                {event.status === 'upcoming' && !isAdmin && (
                  <button
                    onClick={() => event.price > 0 ? setShowRegisterModal(true) : registerMutation.mutate()}
                    disabled={isRegistered || !canRegister}
                    className={`px-6 py-3 rounded-xl font-bold transition ${
                      isRegistered 
                        ? 'bg-gray-600 text-gray-400 cursor-not-allowed' 
                        : !canRegister
                        ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                        : 'bg-[#f9c200] text-black hover:bg-[#f9c200]/90'
                    }`}
                  >
                    {isRegistered ? 'Ты уже зарегистрирован ✓' : 
                     !canRegister ? 'Мест нет' : 'Зарегистрироваться'}
                  </button>
                )}
                
                {/* Admin buttons */}
                {isAdmin && (
                  <>
                    {event.status === 'upcoming' && (
                      <>
                        <button
                          onClick={() => statusMutation.mutate('completed')}
                          className="px-4 py-3 bg-green-500 text-white rounded-xl font-bold hover:bg-green-600 transition flex items-center gap-2"
                        >
                          <CheckCircle size={20} />
                          Завершить
                        </button>
                        
                        <button
                          onClick={() => statusMutation.mutate('cancelled')}
                          className="px-4 py-3 bg-red-500 text-white rounded-xl font-bold hover:bg-red-600 transition flex items-center gap-2"
                        >
                          <XCircle size={20} />
                          Отменить
                        </button>
                        
                        <button
                          onClick={() => remindMutation.mutate()}
                          className="px-4 py-3 bg-blue-500 text-white rounded-xl font-bold hover:bg-blue-600 transition flex items-center gap-2"
                        >
                          <Bell size={20} />
                          Напомнить в чат
                        </button>
                        
                        <button
                          onClick={() => setShowUserSelect(true)}
                          className="px-4 py-3 bg-purple-500 text-white rounded-xl font-bold hover:bg-purple-600 transition flex items-center gap-2"
                        >
                          <UserPlus size={20} />
                          Добавить участника
                        </button>
                      </>
                    )}
                    
                    <button
                      onClick={() => setShowMediaUpload(true)}
                      className="px-4 py-3 bg-indigo-500 text-white rounded-xl font-bold hover:bg-indigo-600 transition flex items-center gap-2"
                    >
                      <Image size={20} />
                      Загрузить медиа
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
          
          {/* Media section */}
          {eventMedia.length > 0 && (
            <div className="mt-6 bg-[#2a2a2a] rounded-2xl p-6 border border-[#3a3a3a]">
              <h2 className="text-2xl font-bold text-white mb-6">
                Медиа с события ({eventMedia.length})
              </h2>
              <MediaGallery 
                media={eventMedia}
                canDelete={isAdmin}
                onDelete={(mediaId) => deleteMediaMutation.mutate(mediaId)}
              />
            </div>
          )}
        </div>
        
        {/* Right column - Participants */}
        <div className="lg:col-span-1">
          <div className="bg-[#2a2a2a] rounded-2xl p-6 border border-[#3a3a3a] sticky top-24">
            <h3 className="text-xl font-bold text-white mb-4">
              Участники ({participants.length}
              {event.max_participants && `/${event.max_participants}`})
            </h3>
            
            {participants.length > 0 ? (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {participants.map((participant) => (
                  <motion.div
                    key={participant.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-[#3a3a3a] transition"
                  >
                    {participant.avatar_url ? (
                      <img 
                        src={participant.avatar_url} 
                        alt={participant.first_name}
                        className="w-10 h-10 rounded-full"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#f9c200] to-[#ffdd44] flex items-center justify-center font-bold text-black">
                        {participant.first_name?.[0] || '?'}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-medium truncate">
                        {participant.first_name} {participant.last_name}
                      </p>
                      <p className="text-gray-400 text-sm">
                        {participant.reputation} реп.
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <p className="text-gray-400 text-center py-8">
                Пока нет участников
              </p>
            )}
          </div>
        </div>
      </div>
      
      {/* Modals */}
      
      {/* Paid registration modal */}
      {showRegisterModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-[#2a2a2a] rounded-2xl p-6 max-w-md w-full border border-[#3a3a3a]"
          >
            <h3 className="text-xl font-bold text-white mb-4">
              💰 Платное мероприятие
            </h3>
            <p className="text-gray-300 mb-6">
              Стоимость участия: <span className="text-[#f9c200] font-bold">{event.price} сом</span>
            </p>
            <p className="text-gray-300 mb-6">
              Для регистрации обратись к организаторам:
            </p>
            <div className="space-y-2 mb-6">
              {event.contacts?.map((contact, index) => (
                
                <a  key={index}
                  href={getContactLink(contact.type, contact.value)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-[#f9c200] hover:text-[#f9c200]/80"
                >
                  {getContactIcon(contact.type)}
                  <span>{contact.value}</span>
                </a>
              ))}
            </div>
            <button
              onClick={() => setShowRegisterModal(false)}
              className="w-full btn-primary"
            >
              Понятно
            </button>
          </motion.div>
        </div>
      )}
      
      {/* Media upload modal */}
      {showMediaUpload && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-[#2a2a2a] rounded-2xl p-6 max-w-md w-full border border-[#3a3a3a]"
          >
            <h3 className="text-xl font-bold text-white mb-4">
              📸 Загрузить медиа
            </h3>
            <input
              type="file"
              multiple
              accept="image/*,video/*"
              onChange={handleFileSelect}
              className="mb-4 text-white"
            />
            {selectedFiles.length > 0 && (
              <p className="text-gray-300 mb-4">
                Выбрано файлов: {selectedFiles.length}
              </p>
            )}
            <div className="flex gap-3">
              <button
                onClick={handleMediaUpload}
                disabled={selectedFiles.length === 0 || uploadMediaMutation.isLoading}
                className="flex-1 btn-primary disabled:opacity-50"
              >
                {uploadMediaMutation.isLoading ? 'Загружаем...' : 'Загрузить'}
              </button>
              <button
                onClick={() => {
                  setShowMediaUpload(false);
                  setSelectedFiles([]);
                }}
                className="flex-1 btn-secondary"
              >
                Отмена
              </button>
            </div>
          </motion.div>
        </div>
      )}
      
      {/* User selection modal */}
      {showUserSelect && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-[#2a2a2a] rounded-2xl p-6 max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col border border-[#3a3a3a]"
          >
            <h3 className="text-xl font-bold text-white mb-4">
              Выбрать участника
            </h3>
            
            <input
              type="text"
              value={searchUser}
              onChange={(e) => setSearchUser(e.target.value)}
              placeholder="Поиск по имени..."
              className="input mb-4"
            />
            
            <div className="flex-1 overflow-y-auto mb-4">
              <div className="space-y-2">
                {allUsers
                  .filter(u => !participants.some(p => p.id === u.id))
                  .map(user => (
                    <button
                      key={user.id}
                      onClick={() => manualRegisterMutation.mutate(user.id)}
                      className="w-full flex items-center gap-3 bg-[#1d1d1d] p-3 rounded-xl hover:bg-[#3a3a3a] transition text-left"
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
                        {user.reputation} реп.
                      </div>
                    </button>
                  ))
                }
              </div>
            </div>
            
            <button
              onClick={() => {
                setShowUserSelect(false);
                setSearchUser('');
              }}
              className="w-full btn-secondary"
            >
              Отмена
            </button>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
};

export default EventDetails;