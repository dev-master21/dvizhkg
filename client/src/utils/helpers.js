import { format, formatDistanceToNow, parseISO } from 'date-fns';
import { ru } from 'date-fns/locale';

export const formatDate = (date) => {
  if (!date) return '';
  const parsedDate = typeof date === 'string' ? parseISO(date) : date;
  return format(parsedDate, 'dd MMMM yyyy, HH:mm', { locale: ru });
};

export const formatDateShort = (date) => {
  if (!date) return '';
  const parsedDate = typeof date === 'string' ? parseISO(date) : date;
  return format(parsedDate, 'dd.MM.yyyy', { locale: ru });
};

export const formatTimeAgo = (date) => {
  if (!date) return '';
  const parsedDate = typeof date === 'string' ? parseISO(date) : date;
  return formatDistanceToNow(parsedDate, { locale: ru, addSuffix: true });
};

export const getContactLink = (type, value) => {
  switch (type) {
    case 'telegram':
      return `https://t.me/${value.replace('@', '')}`;
    case 'instagram':
      return `https://instagram.com/${value.replace('@', '')}`;
    case 'whatsapp':
      return `https://wa.me/${value.replace('+', '')}`;
    default:
      return '#';
  }
};

export const formatPrice = (price) => {
  if (!price || price === 0) return 'БЕСПЛАТНО';
  return `${price} сом`;
};

export const truncateText = (text, maxLength = 100) => {
  if (!text || text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
};

export const getInitials = (firstName, lastName) => {
  const initials = `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase();
  return initials || '?';
};

export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};