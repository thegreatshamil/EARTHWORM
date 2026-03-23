import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Sprout, Clock, X, Plus, Trash2 } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { chatService } from '@/services/chatService';
import ChatMessage from '@/components/chat/ChatMessage';
import ChatInput from '@/components/chat/ChatInput';
import SunflowerField from '@/components/sunflower/SunflowerField';
import GlassPanel from '@/components/ui/GlassPanel';
import type { Message, ChatSession, Page } from '@/types';

interface ChatPageProps {
  onPageChange: (page: Page) => void;
}

const ChatPage: React.FC<ChatPageProps> = ({ onPageChange: _onPageChange }) => {
  const { t, language } = useLanguage();
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSession, setCurrentSession] = useState<ChatSession>({
    id: chatService.getSessionId(),
    title: t('newChat'),
    messages: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  const [isLoading, setIsLoading] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load chat history on mount
  useEffect(() => {
    const history = chatService.getChatHistory();
    setSessions(history);
  }, []);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentSession.messages]);

  const generateTitle = (firstMessage: string): string => {
    const maxLength = 30;
    if (firstMessage.length <= maxLength) return firstMessage;
    return firstMessage.substring(0, maxLength) + '...';
  };

  const handleSend = useCallback(async (text: string, imageBase64?: string, audioFile?: string) => {
    if (!text.trim() && !imageBase64 && !audioFile) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      timestamp: new Date(),
      imageUrl: imageBase64,
      audioUrl: audioFile,
    };

    const updatedSession = {
      ...currentSession,
      messages: [...currentSession.messages, userMessage],
      updatedAt: new Date(),
    };

    if (updatedSession.messages.length === 1 && text.trim()) {
      updatedSession.title = generateTitle(text);
    }

    setCurrentSession(updatedSession);
    setIsLoading(true);

    try {
      const response = await chatService.sendMessage(text, language, imageBase64, audioFile);

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response,
        timestamp: new Date(),
      };

      const finalSession = {
        ...updatedSession,
        messages: [...updatedSession.messages, assistantMessage],
        updatedAt: new Date(),
      };

      setCurrentSession(finalSession);
      chatService.saveChatHistory(finalSession);

      setSessions(prev => {
        const existing = prev.find(s => s.id === finalSession.id);
        if (existing) {
          return prev.map(s => s.id === finalSession.id ? finalSession : s);
        }
        return [finalSession, ...prev];
      });

    } catch (error) {
      console.error('Error sending message:', error);

      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: t('maintenance'),
        timestamp: new Date(),
      };

      const finalSession = {
        ...updatedSession,
        messages: [...updatedSession.messages, errorMessage],
        updatedAt: new Date(),
      };

      setCurrentSession(finalSession);
    } finally {
      setIsLoading(false);
    }
  }, [currentSession, language, t]);

  const handleNewChat = useCallback(() => {
    chatService.resetSession();
    const newSession: ChatSession = {
      id: chatService.getSessionId(),
      title: t('newChat'),
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    setCurrentSession(newSession);
    setShowHistory(false); // Close sidebar on mobile/tablet for better 'opening' feel
  }, [t]);

  const handleSelectSession = useCallback((sessionId: string) => {
    const session = sessions.find(s => s.id === sessionId);
    if (session) {
      setCurrentSession(session);
    }
  }, [sessions]);

  const handleDeleteSession = useCallback((e: React.MouseEvent, sessionId: string) => {
    e.stopPropagation();
    chatService.deleteChatSession(sessionId);
    setSessions(prev => prev.filter(s => s.id !== sessionId));
    if (currentSession.id === sessionId) {
      handleNewChat();
    }
  }, [currentSession.id, handleNewChat]);

  const handleClearAll = useCallback(() => {
    if (window.confirm(t('clearChatConfirm'))) {
      chatService.clearAllHistory();
      setSessions([]);
      handleNewChat();
    }
  }, [handleNewChat, t]);

  const formatDate = (date: Date) => {
    const now = new Date();
    const sessionDate = new Date(date);
    const diffDays = Math.floor((now.getTime() - sessionDate.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return t('today');
    if (diffDays === 1) return t('yesterday');
    return sessionDate.toLocaleDateString();
  };

  const isNewChat = currentSession.messages.length === 0;

  return (
    <div className="relative h-screen overflow-hidden bg-[#28282B]">
      <SunflowerField />

      <div className="relative z-10 flex h-full pt-24 px-4 md:px-8 pb-6">
        <div className="relative flex-1 min-w-0">
          {/* Glassmorphic Chat History Sidebar - overlay, retractable */}
          <div
            className={`
              absolute left-0 top-0 bottom-0 z-30
              w-80 h-full
              glass-sidebar rounded-3xl border border-white/10
              flex flex-col overflow-hidden
              transform transition-transform duration-300 ease-in-out
              ${showHistory ? 'translate-x-0 opacity-100 pointer-events-auto' : '-translate-x-full opacity-0 pointer-events-none'}
            `}
          >
            {/* Glass shine effect */}
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-white/[0.05] to-transparent" />
              <div className="absolute top-10 left-4 w-20 h-20 bg-white/[0.03] rounded-full blur-2xl" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-white/[0.08] relative z-10">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-[#f4d03f]/20 flex items-center justify-center">
                  <Clock className="w-4 h-4 text-[#f4d03f]" />
                </div>
                <span className="text-white/90 text-sm font-medium">{t('previousConversations')}</span>
              </div>
              <div className="flex items-center gap-1">
                {sessions.length > 0 && (
                  <motion.button
                    onClick={handleClearAll}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    className="p-2 rounded-xl hover:bg-red-500/10 text-red-400/50 hover:text-red-400 transition-colors"
                    title={t('clearChat')}
                  >
                    <X className="w-4 h-4" />
                  </motion.button>
                )}
                <motion.button
                  onClick={() => setShowHistory(false)}
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                  className="p-2 rounded-xl hover:bg-white/10 text-white/50 transition-colors"
                >
                  <X className="w-4 h-4" />
                </motion.button>
              </div>
            </div>

            {/* New Chat Button */}
            <div className="p-3 relative z-10">
              <motion.button
                onClick={handleNewChat}
                whileHover={{ scale: 1.02, boxShadow: '0 0 20px rgba(244, 208, 63, 0.3)' }}
                whileTap={{ scale: 0.98 }}
                className="
                  w-full flex items-center justify-center gap-2
                  px-4 py-3 bg-gradient-to-r from-[#f4d03f] to-[#d4ac0d] text-[#28282B]
                  rounded-full font-semibold text-sm
                  transition-all duration-300
                  shadow-lg shadow-[#f4d03f]/20
                "
              >
                <Plus className="w-4 h-4" />
                <span>{t('newChat')}</span>
              </motion.button>
            </div>

            {/* Sessions List */}
            <div className="flex-1 overflow-y-auto px-3 pb-4 relative z-10">
              {sessions.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-center py-8"
                >
                  <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-white/5 flex items-center justify-center">
                    <MessageSquare className="w-6 h-6 text-white/20" />
                  </div>
                  <p className="text-white/40 text-sm">{t('noChatsYet')}</p>
                </motion.div>
              ) : (
                <div className="space-y-1">
                  <AnimatePresence mode="popLayout">
                    {sessions.map((session, index) => (
                      <motion.div
                        key={session.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ delay: index * 0.05 }}
                        className="group relative"
                      >
                        <button
                          onClick={() => handleSelectSession(session.id)}
                          className={`
                            w-full text-left px-4 py-3 rounded-xl
                            transition-all duration-200
                            ${currentSession.id === session.id
                              ? 'bg-gradient-to-r from-[#f4d03f]/15 to-transparent text-white border border-[#f4d03f]/30'
                              : 'text-white/60 hover:text-white/80 border border-transparent hover:bg-white/5'
                            }
                          `}
                        >
                          <p className="text-sm font-medium truncate pr-6">{session.title}</p>
                          <p className="text-xs text-white/35 mt-0.5">
                            {formatDate(session.updatedAt)} • {session.messages.length} messages
                          </p>
                        </button>

                        <button
                          onClick={(e) => handleDeleteSession(e, session.id)}
                          className="
                            absolute right-2 top-1/2 -translate-y-1/2
                            p-2 rounded-lg opacity-0 group-hover:opacity-100
                            hover:bg-red-500/20 text-white/30 hover:text-red-400
                            transition-all duration-200
                          "
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </div>
          </div>

          {/* Main chat area */}
          <GlassPanel className="relative flex flex-col min-w-0 h-full rounded-[32px] bg-[#171719]/80 shadow-2xl shadow-black/40">
            {/* Sidebar toggle (top-left) */}
            <motion.button
              onClick={() => setShowHistory(prev => !prev)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="absolute top-4 left-4 z-20 p-3 rounded-2xl bg-white/5 text-white/60 hover:text-white transition-colors"
              title={t('previousConversations')}
            >
              <Clock className="w-5 h-5" />
            </motion.button>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-3 sm:px-6 pt-16 pb-4">
              <AnimatePresence mode="popLayout">
                {isNewChat ? (
                  <motion.div
                    key={currentSession.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="min-h-[320px] flex flex-col items-center justify-center"
                  >
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                      className="max-w-md w-full text-center mx-auto"
                    >
                      <GlassPanel strong className="rounded-3xl px-8 py-10 border border-white/10">
                        <motion.div
                          className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-[#f4d03f]/20 to-[#d4ac0d]/20 flex items-center justify-center"
                          animate={{
                            boxShadow: [
                              '0 0 20px rgba(244, 208, 63, 0.15)',
                              '0 0 40px rgba(244, 208, 63, 0.35)',
                              '0 0 20px rgba(244, 208, 63, 0.15)',
                            ],
                          }}
                          transition={{ duration: 3, repeat: Infinity }}
                        >
                          <Sprout className="w-10 h-10 text-[#f4d03f]" />
                        </motion.div>
                        <h2 className="text-2xl font-bold text-white mb-3">{t('meetVarunAI')}</h2>
                        <p className="text-white/60 leading-relaxed">{t('varunAIDescription')}</p>
                      </GlassPanel>
                    </motion.div>
                  </motion.div>
                ) : (
                  <div className="space-y-2">
                    {currentSession.messages.map((message) => (
                      <ChatMessage key={message.id} message={message} />
                    ))}

                    {isLoading && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex gap-4 px-4 py-6"
                      >
                        <div className="w-10 h-10 rounded-full bg-[#7a9a5a]/30 flex items-center justify-center">
                          <Sprout className="w-5 h-5 text-[#9aba7a]" />
                        </div>
                        <div className="glass rounded-2xl rounded-tl-sm px-5 py-4">
                          <div className="flex gap-1.5">
                            <motion.span
                              animate={{ opacity: [0.3, 1, 0.3] }}
                              transition={{ duration: 1.2, repeat: Infinity, delay: 0 }}
                              className="w-2 h-2 bg-white/40 rounded-full"
                            />
                            <motion.span
                              animate={{ opacity: [0.3, 1, 0.3] }}
                              transition={{ duration: 1.2, repeat: Infinity, delay: 0.2 }}
                              className="w-2 h-2 bg-white/40 rounded-full"
                            />
                            <motion.span
                              animate={{ opacity: [0.3, 1, 0.3] }}
                              transition={{ duration: 1.2, repeat: Infinity, delay: 0.4 }}
                              className="w-2 h-2 bg-white/40 rounded-full"
                            />
                          </div>
                        </div>
                      </motion.div>
                    )}

                    <div ref={messagesEndRef} />
                  </div>
                )}
              </AnimatePresence>
            </div>

            {/* Input area */}
            <div className="px-2 sm:px-6 pb-6 pt-4 border-t border-white/10 bg-black/20 backdrop-blur-xl">
              <ChatInput onSend={handleSend} isLoading={isLoading} />
            </div>
          </GlassPanel>
        </div>
      </div>
    </div>
  );
};

export default ChatPage;
