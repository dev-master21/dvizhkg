import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Trophy, Medal, Award, Star, Crown,
  TrendingUp, Zap, Flame, Gem  // ✅ Fire -> Flame, Diamond -> Gem
} from 'lucide-react';
import { motion } from 'framer-motion';

const UserTable = ({ users, title = "Топ-20 чуваков", icon }) => {
  const getRankIcon = (position) => {
    switch (position) {
      case 1: 
        return (
          <motion.div
            animate={{ rotate: [0, 5, -5, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="relative"
          >
            <Crown className="text-[#f9c200]" size={28} />
            <div className="absolute inset-0 bg-[#f9c200]/30 blur-xl" />
          </motion.div>
        );
      case 2: 
        return (
          <motion.div
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <Trophy className="text-gray-300" size={24} />
          </motion.div>
        );
      case 3: 
        return (
          <motion.div
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 2, repeat: Infinity, delay: 0.2 }}
          >
            <Medal className="text-orange-500" size={24} />
          </motion.div>
        );
      default: 
        return (
          <div className="w-8 h-8 flex items-center justify-center">
            <span className="text-gray-500 font-bold text-lg">
              {position}
            </span>
          </div>
        );
    }
  };

  const getReputationIcon = (reputation) => {
    if (reputation >= 1000) return <Flame className="text-red-500" size={16} />;
    if (reputation >= 500) return <Gem className="text-purple-500" size={16} />;
    if (reputation >= 250) return <Zap className="text-[#f9c200]" size={16} />;
    if (reputation >= 100) return <Star className="text-yellow-500" size={16} />;
    return null;
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className="glass rounded-2xl p-6 border border-[#f9c200]/20 glow-yellow-sm"
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        >
          {icon || <Star className="text-[#f9c200]" size={28} />}
        </motion.div>
        <h2 className="text-2xl font-black text-white">
          {title}
        </h2>
        <div className="flex-1 h-px bg-gradient-to-r from-[#f9c200]/50 to-transparent" />
      </div>

      {/* Users List */}
      <div className="space-y-2">
        {users.map((user, index) => {
          const position = index + 1;
          const isTop3 = position <= 3;
          
          return (
            <motion.div
              key={user.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Link to={`/profile/${user.id}`}>
                <motion.div
                  whileHover={{ scale: 1.02, x: 5 }}
                  className={`relative group flex items-center gap-3 p-3 rounded-xl transition-all duration-300 ${
                    isTop3 
                      ? 'bg-gradient-to-r from-[#f9c200]/10 to-transparent border border-[#f9c200]/20' 
                      : 'bg-black/30 hover:bg-black/50 border border-transparent hover:border-[#f9c200]/10'
                  }`}
                >
                  {/* Glow effect for top 3 */}
                  {isTop3 && (
                    <div className="absolute inset-0 bg-gradient-to-r from-[#f9c200]/5 to-transparent rounded-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                  )}

                  {/* Rank */}
                  <div className="w-10 flex justify-center">
                    {getRankIcon(position)}
                  </div>

                  {/* Avatar */}
                  <div className="relative">
                    {user.avatar_url ? (
                      <motion.img 
                        whileHover={{ scale: 1.1 }}
                        src={user.avatar_url} 
                        alt={user.first_name}
                        className={`w-12 h-12 rounded-full border-2 ${
                          isTop3 ? 'border-[#f9c200]' : 'border-gray-700'
                        } group-hover:border-[#f9c200] transition-colors`}
                      />
                    ) : (
                      <motion.div 
                        whileHover={{ scale: 1.1 }}
                        className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-black ${
                          isTop3
                            ? 'bg-gradient-to-br from-[#f9c200] to-[#ffdd44]'
                            : 'bg-gradient-to-br from-gray-600 to-gray-700'
                        }`}
                      >
                        {user.first_name?.[0] || '?'}
                      </motion.div>
                    )}
                    
                    {/* Online indicator */}
                    {user.is_online && (
                      <motion.div
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-black"
                      />
                    )}
                  </div>

                  {/* User Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className={`font-semibold truncate ${
                        isTop3 ? 'text-[#f9c200]' : 'text-white'
                      } group-hover:text-[#f9c200] transition-colors`}>
                        {user.first_name} {user.last_name}
                      </p>
                      {getReputationIcon(user.reputation)}
                    </div>
                    {user.username && (
                      <p className="text-xs text-gray-500 truncate">
                        @{user.username}
                      </p>
                    )}
                  </div>

                  {/* Reputation */}
                  <div className="text-right">
                    <motion.div 
                      className={`text-2xl font-black ${
                        isTop3 ? 'text-[#f9c200] glow-text' : 'text-white'
                      }`}
                      whileHover={{ scale: 1.1 }}
                    >
                      {user.reputation}
                    </motion.div>
                    <p className="text-xs text-gray-500">репутации</p>
                  </div>

                  {/* Hover arrow */}
                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 0, x: -10 }}
                    whileGroupHover={{ opacity: 1, x: 0 }}
                    className="absolute right-2"
                  >
                    <TrendingUp className="text-[#f9c200]" size={20} />
                  </motion.div>
                </motion.div>
              </Link>
            </motion.div>
          );
        })}
      </div>

      {/* Footer */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="mt-6 pt-6 border-t border-gray-800 text-center"
      >
        <p className="text-sm text-gray-400">
          Набирай репутацию в чате{' '}
        </p>
      </motion.div>
    </motion.div>
  );
};

export default UserTable;