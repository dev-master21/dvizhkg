import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Trash2, Upload, Calendar, MapPin, DollarSign, Users, Phone } from 'lucide-react';
import axios from '../utils/axios';
import toast from 'react-hot-toast';

const EventModal = ({ isOpen, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    event_date: '',
    price: 0,
    conditions: '',
    location_url: '',
    max_participants: '',
    contacts: []
  });
  const [previewImage, setPreviewImage] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPreviewImage(file);
    }
  };

  const addContact = () => {
    setFormData(prev => ({
      ...prev,
      contacts: [...prev.contacts, { type: 'telegram', value: '' }]
    }));
  };

  const updateContact = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      contacts: prev.contacts.map((contact, i) => 
        i === index ? { ...contact, [field]: value } : contact
      )
    }));
  };

  const removeContact = (index) => {
    setFormData(prev => ({
      ...prev,
      contacts: prev.contacts.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.title || !formData.event_date) {
      toast.error('Заполните обязательные поля');
      return;
    }

    setIsSubmitting(true);
    
    try {
      const data = new FormData();
      Object.keys(formData).forEach(key => {
        if (key === 'contacts') {
          data.append(key, JSON.stringify(formData[key]));
        } else {
          data.append(key, formData[key]);
        }
      });
      
      if (previewImage) {
        data.append('preview', previewImage);
      }

      await axios.post('/api/events', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      toast.success('Событие создано!');
      onSuccess();
      onClose();
    } catch (error) {
      toast.error('Ошибка при создании события');
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
        className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-[#2a2a2a] rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        >
          <div className="p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-black text-white">Создать событие</h2>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-white transition"
              >
                <X size={24} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Preview Image */}
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">
                  Превью изображение
                </label>
                <div className="relative">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                    id="preview-upload"
                  />
                  <label
                    htmlFor="preview-upload"
                    className="flex items-center justify-center gap-2 p-4 border-2 border-dashed border-[#3a3a3a] rounded-xl cursor-pointer hover:border-[#f9c200]/50 transition"
                  >
                    <Upload size={20} className="text-[#f9c200]" />
                    <span className="text-gray-300">
                      {previewImage ? previewImage.name : 'Загрузить изображение'}
                    </span>
                  </label>
                </div>
              </div>

              {/* Title */}
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">
                  Название события *
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  className="input"
                  required
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">
                  Описание
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={4}
                  className="input resize-none"
                />
              </div>

              {/* Date and Price */}
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">
                    Дата и время *
                  </label>
                  <input
                    type="datetime-local"
                    name="event_date"
                    value={formData.event_date}
                    onChange={handleChange}
                    className="input"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">
                    Стоимость (сом)
                  </label>
                  <input
                    type="number"
                    name="price"
                    value={formData.price}
                    onChange={handleChange}
                    min="0"
                    className="input"
                  />
                </div>
              </div>

              {/* Conditions */}
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">
                  Условия
                </label>
                <textarea
                  name="conditions"
                  value={formData.conditions}
                  onChange={handleChange}
                  rows={3}
                  className="input resize-none"
                />
              </div>

              {/* Location and Max Participants */}
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">
                    Ссылка на 2GIS
                  </label>
                  <input
                    type="url"
                    name="location_url"
                    value={formData.location_url}
                    onChange={handleChange}
                    placeholder="https://2gis.kg/..."
                    className="input"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">
                    Макс. участников
                  </label>
                  <input
                    type="number"
                    name="max_participants"
                    value={formData.max_participants}
                    onChange={handleChange}
                    min="1"
                    className="input"
                  />
                </div>
              </div>

              {/* Contacts */}
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">
                  Контакты
                </label>
                <div className="space-y-2">
                  {formData.contacts.map((contact, index) => (
                    <div key={index} className="flex gap-2">
                      <select
                        value={contact.type}
                        onChange={(e) => updateContact(index, 'type', e.target.value)}
                        className="input w-40"
                      >
                        <option value="telegram">Telegram</option>
                        <option value="instagram">Instagram</option>
                        <option value="whatsapp">WhatsApp</option>
                      </select>
                      <input
                        type="text"
                        value={contact.value}
                        onChange={(e) => updateContact(index, 'value', e.target.value)}
                        placeholder={
                          contact.type === 'whatsapp' ? '+996...' : '@username'
                        }
                        className="input flex-1"
                      />
                      <button
                        type="button"
                        onClick={() => removeContact(index)}
                        className="p-3 bg-red-500/20 text-red-500 rounded-xl hover:bg-red-500/30 transition"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={addContact}
                    className="flex items-center gap-2 text-[#f9c200] hover:text-[#f9c200]/80 transition"
                  >
                    <Plus size={18} />
                    <span className="font-semibold">Добавить контакт</span>
                  </button>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 btn-primary disabled:opacity-50"
                >
                  {isSubmitting ? 'Создаём...' : 'Создать событие'}
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 btn-secondary"
                >
                  Отмена
                </button>
              </div>
            </form>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default EventModal;