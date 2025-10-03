import React, { useState } from 'react';
import { Play, X, Download, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { LazyLoadImage } from 'react-lazy-load-image-component';
import 'react-lazy-load-image-component/src/effects/blur.css';

const MediaGallery = ({ media, canDelete = false, onDelete }) => {
  const [selectedMedia, setSelectedMedia] = useState(null);

  const handleDelete = (mediaId) => {
    if (window.confirm('Удалить этот файл?')) {
      onDelete(mediaId);
    }
  };

  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {media.map((item, index) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.05 }}
            className="relative group cursor-pointer rounded-xl overflow-hidden bg-[#1d1d1d]"
            onClick={() => setSelectedMedia(item)}
          >
            {item.type === 'photo' ? (
              <LazyLoadImage
                src={`${import.meta.env.VITE_API_URL}${item.thumbnail_url || item.url}`}
                alt=""
                effect="blur"
                className="w-full h-48 object-cover"
              />
            ) : (
              <div className="relative h-48">
                <video 
                  src={`${import.meta.env.VITE_API_URL}${item.url}`}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                  <Play className="text-white" size={40} />
                </div>
              </div>
            )}

            {/* Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="absolute bottom-0 left-0 right-0 p-3">
                {item.event_title && (
                  <p className="text-white text-sm font-semibold truncate">
                    {item.event_title}
                  </p>
                )}
                <p className="text-gray-300 text-xs">
                  {new Date(item.uploaded_at).toLocaleDateString('ru-RU')}
                </p>
              </div>
            </div>

            {/* Delete button */}
            {canDelete && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete(item.id);
                }}
                className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
              >
                <Trash2 size={16} />
              </button>
            )}
          </motion.div>
        ))}
      </div>

      {/* Lightbox */}
      <AnimatePresence>
        {selectedMedia && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedMedia(null)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="relative max-w-6xl max-h-[90vh]"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close button */}
              <button
                onClick={() => setSelectedMedia(null)}
                className="absolute -top-12 right-0 text-white hover:text-[#f9c200] transition"
              >
                <X size={32} />
              </button>

              {/* Media content */}
              {selectedMedia.type === 'photo' ? (
                <img
                  src={`${import.meta.env.VITE_API_URL}${selectedMedia.url}`}
                  alt=""
                  className="max-w-full max-h-[90vh] object-contain rounded-xl"
                />
              ) : (
                <video
                  src={`${import.meta.env.VITE_API_URL}${selectedMedia.url}`}
                  controls
                  autoPlay
                  className="max-w-full max-h-[90vh] rounded-xl"
                />
              )}

              {/* Download button */}
              
               <a href={`${import.meta.env.VITE_API_URL}${selectedMedia.url}`}
                download
                target="_blank"
                rel="noopener noreferrer"
                className="absolute bottom-4 right-4 p-3 bg-[#f9c200] text-black rounded-xl hover:bg-[#f9c200]/90 transition"
              >
                <Download size={20} />
              </a>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default MediaGallery;