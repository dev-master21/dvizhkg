export const EVENT_STATUS = {
  UPCOMING: 'upcoming',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
};

export const EVENT_STATUS_LABELS = {
  [EVENT_STATUS.UPCOMING]: 'Ожидается',
  [EVENT_STATUS.COMPLETED]: 'Завершено',
  [EVENT_STATUS.CANCELLED]: 'Отменено',
};

export const CONTACT_TYPES = {
  TELEGRAM: 'telegram',
  INSTAGRAM: 'instagram',
  WHATSAPP: 'whatsapp',
};

export const MEDIA_TYPES = {
  PHOTO: 'photo',
  VIDEO: 'video',
};

export const USER_ROLES = {
  USER: 'user',
  ADMIN: 'admin',
};

export const REPUTATION_COOLDOWN_HOURS = 8;
export const DAILY_REPUTATION_LIMIT = 10;