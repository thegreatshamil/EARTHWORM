import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, MessageSquare, Trash2, X, History } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import type { ChatSession } from '@/types';

interface ChatSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  sessions: ChatSession[];
  currentSessionId: string;
  onNewChat: () => void;
  onSelectSession: (sessionId: string) => void;
  onDeleteSession: (sessionId: string) => void;
}

const ChatSidebar: React.FC<ChatSidebarProps> = ({
  isOpen,
  onClose,
  sessions,
  currentSessionId,
  onNewChat,
  onSelectSession,
  onDeleteSession,
}) => {
  const { t } = useLanguage();

  const formatDate = (date: Date) => {
    const now = new Date();
    const sessionDate = new Date(date);
    const diffDays = Math.floor((now.getTime() - sessionDate.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return t('today');
    if (diffDays === 1) return t('yesterday');
    return sessionDate.toLocaleDateString();
  };

  // Group sessions by date
  const groupedSessions = sessions.reduce((groups, session) => {
    const dateKey = formatDate(session.updatedAt);
    if (!groups[dateKey]) {
      groups[dateKey] = [];
    }
    groups[dateKey].push(session);
    return groups;
  }, {} as Record<string, ChatSession[]>);

  return (
    <>
      {/* Mobile overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside
        initial={{ x: -300, opacity: 0 }}
        animate={{
          x: isOpen ? 0 : -300,
          opacity: isOpen ? 1 : 0,
        }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className={`
          fixed left-0 top-0 bottom-0 w-[300px] z-50
          glass-dark border-r border-white/10
          flex flex-col
          ${isOpen ? 'pointer-events-auto' : 'pointer-events-none lg:pointer-events-auto'}
          lg:translate-x-0 lg:opacity-100
        `}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-earth-gold" />
            <span className="text-earth-cream font-semibold">{t('chatHistory')}</span>
          </div>
          <button
            onClick={onClose}
            className="lg:hidden p-2 rounded-lg hover:bg-white/10 text-earth-cream/60"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* New Chat Button */}
        <div className="p-4">
          <motion.button
            onClick={onNewChat}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="
              w-full flex items-center justify-center gap-2
              px-4 py-3 bg-earth-gold text-earth-brown
              rounded-xl font-medium
              hover:bg-earth-yellow transition-colors
            "
          >
            <Plus className="w-5 h-5" />
            <span>{t('newChat')}</span>
          </motion.button>
        </div>

        {/* Sessions List */}
        <div className="flex-1 overflow-y-auto px-3 pb-4">
          {Object.entries(groupedSessions).map(([date, dateSessions]) => (
            <div key={date} className="mb-4">
              <h4 className="text-earth-cream/40 text-xs uppercase tracking-wider px-3 mb-2">
                {date}
              </h4>
              <div className="space-y-1">
                <AnimatePresence>
                  {dateSessions.map((session) => (
                    <motion.div
                      key={session.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className={`
                        group relative flex items-center gap-3
                        px-3 py-3 rounded-xl cursor-pointer
                        transition-all duration-200
                        ${currentSessionId === session.id
                          ? 'bg-earth-gold/20 border border-earth-gold/30'
                          : 'hover:bg-white/5 border border-transparent'
                        }
                      `}
                      onClick={() => onSelectSession(session.id)}
                    >
                      <MessageSquare className={`
                        w-4 h-4 flex-shrink-0
                        ${currentSessionId === session.id ? 'text-earth-gold' : 'text-earth-cream/40'}
                      `} />
                      <div className="flex-1 min-w-0">
                        <p className={`
                          text-sm truncate
                          ${currentSessionId === session.id ? 'text-earth-cream' : 'text-earth-cream/70'}
                        `}>
                          {session.title || t('newChat')}
                        </p>
                        <p className="text-xs text-earth-cream/40">
                          {session.messages.length} messages
                        </p>
                      </div>
                      
                      {/* Delete button */}
                      <motion.button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteSession(session.id);
                        }}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        className="
                          opacity-0 group-hover:opacity-100
                          p-1.5 rounded-lg hover:bg-red-500/20
                          text-earth-cream/40 hover:text-red-400
                          transition-all duration-200
                        "
                      >
                        <Trash2 className="w-4 h-4" />
                      </motion.button>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>
          ))}

          {sessions.length === 0 && (
            <div className="text-center py-8">
              <MessageSquare className="w-12 h-12 text-earth-cream/20 mx-auto mb-3" />
              <p className="text-earth-cream/40 text-sm">{t('noChatsYet')}</p>
            </div>
          )}
        </div>
      </motion.aside>
    </>
  );
};

export default ChatSidebar;
