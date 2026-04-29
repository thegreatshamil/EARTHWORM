import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Clock, MessageSquare, Plus, Sprout, Trash2, X } from 'lucide-react';

import ChatInput from '@/components/chat/ChatInput';
import ChatMessage from '@/components/chat/ChatMessage';
import GlassPanel from '@/components/ui/GlassPanel';
import { useLanguage } from '@/context/LanguageContext';
import { chatService } from '@/services/chatService';
import type { ChatSession, Message, Page } from '@/types';

interface ChatPageProps {
    onPageChange: (page: Page) => void;
}

const ChatPage: React.FC<ChatPageProps> = ({ onPageChange: _onPageChange }) => {
    const { t, language } = useLanguage();

    const [sessions, setSessions] = useState<ChatSession[]>([]);
    const [currentSession, setCurrentSession] = useState<ChatSession>(() => {
        const now = new Date();
        return {
            id: chatService.getSessionId(),
            title: t('newChat'),
            messages: [],
            createdAt: now,
            updatedAt: now,
        };
    });
    const [isLoading, setIsLoading] = useState(false);
    const [showHistory, setShowHistory] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        setSessions(chatService.getChatHistory());
    }, []);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [currentSession.messages.length]);

    const isNewChat = currentSession.messages.length === 0;

    const generateTitle = useCallback(
        (firstMessage: string): string => {
            const cleaned = firstMessage.replace(/\s+/g, ' ').trim();
            if (!cleaned) return t('newChat');
            return cleaned.length > 30 ? `${cleaned.slice(0, 30)}…` : cleaned;
        },
        [t],
    );

    const formatDate = useCallback(
        (date: Date) => {
            try {
                return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
            } catch {
                return date.toDateString();
            }
        },
        [],
    );

    const persistSession = useCallback((session: ChatSession) => {
        chatService.saveChatHistory(session);
        setSessions(chatService.getChatHistory());
    }, []);

    const createFreshSession = useCallback((): ChatSession => {
        chatService.resetSession();
        const now = new Date();
        return {
            id: chatService.getSessionId(),
            title: t('newChat'),
            messages: [],
            createdAt: now,
            updatedAt: now,
        };
    }, [t]);

    const handleNewChat = useCallback(() => {
        if (currentSession.messages.length > 0) {
            persistSession(currentSession);
        }
        setCurrentSession(createFreshSession());
    }, [createFreshSession, currentSession, persistSession]);

    const handleSelectSession = useCallback((sessionId: string) => {
        const session = sessions.find((s) => s.id === sessionId);
        if (!session) return;
        chatService.setSessionId(session.id);
        setCurrentSession(session);
        setShowHistory(false);
    }, [sessions]);

    const handleDeleteSession = useCallback(
        (e: React.MouseEvent, sessionId: string) => {
            e.stopPropagation();
            chatService.deleteChatSession(sessionId);
            const nextSessions = chatService.getChatHistory();
            setSessions(nextSessions);

            if (currentSession.id === sessionId) {
                setCurrentSession(createFreshSession());
            }
        },
        [createFreshSession, currentSession.id],
    );

    const handleClearAll = useCallback(() => {
        chatService.clearAllHistory();
        setSessions([]);
        setCurrentSession(createFreshSession());
        setShowHistory(false);
    }, [createFreshSession]);

    const handleSend = useCallback(
        async (text: string, imageBase64?: string, audioFile?: string) => {
            if ((!text?.trim() && !imageBase64 && !audioFile) || isLoading) return;

            const now = new Date();
            const userMessage: Message = {
                id: `user_${now.getTime()}`,
                role: 'user',
                content: text || '',
                timestamp: now,
                imageUrl: imageBase64,
                audioUrl: audioFile,
            };

            const nextSessionBase: ChatSession = {
                ...currentSession,
                title: currentSession.messages.length === 0 ? generateTitle(text || t('newChat')) : currentSession.title,
                messages: [...currentSession.messages, userMessage],
                updatedAt: now,
            };

            setCurrentSession(nextSessionBase);
            setIsLoading(true);

            try {
                const assistantText = await chatService.sendMessage(text || '', language, imageBase64, audioFile);
                const assistantMessage: Message = {
                    id: `assistant_${Date.now()}`,
                    role: 'assistant',
                    content: assistantText,
                    timestamp: new Date(),
                };

                const finalSession: ChatSession = {
                    ...nextSessionBase,
                    messages: [...nextSessionBase.messages, assistantMessage],
                    updatedAt: new Date(),
                };

                setCurrentSession(finalSession);
                persistSession(finalSession);
            } catch (err) {
                console.error(err);
            } finally {
                setIsLoading(false);
            }
        },
        [currentSession, generateTitle, isLoading, language, persistSession, t],
    );

    const sessionsForDisplay = useMemo(() => {
        return [...sessions].sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
    }, [sessions]);

    return (
        <div className="relative h-full overflow-hidden">
            <div className="relative z-10 h-full pt-24 px-4 md:px-8 pb-4">
                <div className="mx-auto max-w-6xl h-full">
                    <div className="flex h-full items-stretch gap-4">
                        {/* Sidebar (push layout) */}
                        <div
                            style={{ width: showHistory ? 280 : 0, transition: 'width 250ms ease' }}
                            className="h-full shrink-0 overflow-hidden"
                        >
                            <div className="relative w-[280px] h-full glass-sidebar rounded-3xl border border-white/10 flex flex-col overflow-hidden">
                                {/* Glass shine effect */}
                                <div className="absolute inset-0 pointer-events-none">
                                    <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-white/[0.05] to-transparent" />
                                    <div className="absolute top-10 left-4 w-20 h-20 bg-white/[0.03] rounded-full blur-2xl" />
                                </div>

                                {/* Header */}
                                <div className="flex items-center justify-between p-4 border-b border-white/[0.08] relative z-10">
                                    <div className="flex items-center">
                                        <span className="text-white/90 text-sm font-medium">{t('previousConversations')}</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        {sessionsForDisplay.length > 0 && (
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
                                    {sessionsForDisplay.length === 0 ? (
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
                                                {sessionsForDisplay.map((session, index) => (
                                                    <motion.div
                                                        key={session.id}
                                                        initial={{ opacity: 0, x: -20 }}
                                                        animate={{ opacity: 1, x: 0 }}
                                                        exit={{ opacity: 0, scale: 0.95 }}
                                                        transition={{ delay: index * 0.03 }}
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
                        </div>

                        {/* Main chat area */}
                        <GlassPanel className="relative h-full flex-1 min-w-0 rounded-[32px] bg-white/[0.08] border border-white/15 shadow-2xl shadow-[#6b4f10]/25">
                            <div className="flex h-full min-h-0 flex-col">
                                {/* Toggle button always visible */}
                                <div className="z-10 px-4 pt-3 shrink-0">
                                    <motion.button
                                        onClick={() => setShowHistory((prev) => !prev)}
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        className="p-3 rounded-2xl bg-[#f4d03f]/15 border border-[#f4d03f]/25 text-[#fff7d6] hover:text-white transition-colors"
                                        title={t('previousConversations')}
                                    >
                                        <Clock className="w-5 h-5" />
                                    </motion.button>
                                </div>

                                {/* Messages: natural stacking in the scroll container */}
                                <div className="flex-1 min-h-0 overflow-y-auto px-3 sm:px-6 pt-2 pb-2">
                                    <AnimatePresence mode="popLayout">
                                        {isNewChat ? (
                                            <div className="h-full min-h-[320px] flex items-center justify-center">
                                                <motion.div
                                                    initial={{ opacity: 0, y: 8 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    className="w-full max-w-sm mx-auto rounded-3xl bg-white/[0.18] backdrop-blur-xl px-6 py-5 text-center shadow-[0_12px_28px_rgba(122,90,26,0.16)]"
                                                >
                                                    <Sprout className="w-8 h-8 text-[#f4d03f] mx-auto mb-2" />
                                                    <p className="text-sm text-white/90 leading-relaxed">{t('askAnything')}</p>
                                                </motion.div>
                                            </div>
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
                                                        <div className="bg-white/25 border border-white/30 rounded-2xl rounded-tl-sm px-5 py-4 backdrop-blur-3xl">
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

                                {/* Input pinned to bottom of viewport */}
                                <div className="mt-auto px-2 sm:px-6 pb-6 pt-4 border-t border-white/15 bg-white/[0.08] backdrop-blur-xl shrink-0">
                                    <ChatInput onSend={handleSend} isLoading={isLoading} />
                                </div>
                            </div>
                        </GlassPanel>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ChatPage;
