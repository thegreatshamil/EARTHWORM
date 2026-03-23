import React, { useCallback, useRef, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UserRound, Sparkles, MapPin, Ruler, Sprout } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import SunflowerField from '@/components/sunflower/SunflowerField';
import GlassPanel from '@/components/ui/GlassPanel';
import ChatMessage from '@/components/chat/ChatMessage';
import ChatInput from '@/components/chat/ChatInput';
import { forYouService } from '@/services/forYouService';
import type { FarmerProfile, Message, Page } from '@/types';

interface ForYouPageProps {
    onPageChange: (page: Page) => void;
}

const PROFILE_STORAGE_KEY = 'earthworm-for-you-profile';

const createEmptyProfile = (): FarmerProfile => ({
    name: '',
    location: '',
    fieldSize: '',
    crops: '',
});

const ForYouPage: React.FC<ForYouPageProps> = ({ onPageChange: _onPageChange }) => {
    const { t, language } = useLanguage();
    const [messages, setMessages] = useState<Message[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [profile, setProfile] = useState<FarmerProfile>(() => {
        if (typeof window === 'undefined') return createEmptyProfile();
        try {
            const saved = localStorage.getItem(PROFILE_STORAGE_KEY);
            if (saved) {
                const parsed = JSON.parse(saved);
                const restored: FarmerProfile = {
                    name: parsed.name || '',
                    location: parsed.location || '',
                    fieldSize: parsed.fieldSize || '',
                    crops: parsed.crops || '',
                };
                return restored;
            }
        } catch (error) {
            console.warn('Unable to load saved For You profile', error);
        }
        return createEmptyProfile();
    });
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    useEffect(() => {
        try {
            localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profile));
        } catch (error) {
            console.warn('Unable to persist For You profile', error);
        }
    }, [profile]);

    const handleProfileChange = useCallback(
        (field: keyof FarmerProfile, value: string) => {
            setProfile(prev => ({ ...prev, [field]: value }));
        },
        []
    );

    const handleSend = useCallback(
        async (text: string, imageBase64?: string, audioFile?: string) => {
            if (!text.trim() && !imageBase64 && !audioFile) return;

            const userMessage: Message = {
                id: Date.now().toString(),
                role: 'user',
                content: text,
                timestamp: new Date(),
                imageUrl: imageBase64,
                audioUrl: audioFile,
            };

            setMessages(prev => [...prev, userMessage]);
            setIsLoading(true);

            try {
                const responseText = await forYouService.sendInsight({
                    message: text,
                    profile,
                    language,
                    image_base64: imageBase64,
                    audio_file: audioFile,
                });

                const assistantMessage: Message = {
                    id: (Date.now() + 1).toString(),
                    role: 'assistant',
                    content: responseText,
                    timestamp: new Date(),
                };

                setMessages(prev => [...prev, assistantMessage]);
            } catch (error) {
                console.error('For You service error:', error);
                const fallbackMessage: Message = {
                    id: (Date.now() + 1).toString(),
                    role: 'assistant',
                    content: t('forYouPlaceholderResponse'),
                    timestamp: new Date(),
                };
                setMessages(prev => [...prev, fallbackMessage]);
            } finally {
                setIsLoading(false);
            }
        },
        [language, profile, t]
    );

    const profileFields: Array<{
        key: keyof FarmerProfile;
        label: string;
        placeholder: string;
        icon: React.ElementType;
        multiline?: boolean;
    }> = [
            {
                key: 'name',
                label: t('farmerProfileName'),
                placeholder: t('farmerProfileNamePlaceholder'),
                icon: UserRound,
            },
            {
                key: 'location',
                label: t('farmerProfileLocation'),
                placeholder: t('farmerProfileLocationPlaceholder'),
                icon: MapPin,
            },
            {
                key: 'fieldSize',
                label: t('farmerProfileFieldSize'),
                placeholder: t('farmerProfileFieldSizePlaceholder'),
                icon: Ruler,
            },
            {
                key: 'crops',
                label: t('farmerProfileCrops'),
                placeholder: t('farmerProfileCropsPlaceholder'),
                icon: Sprout,
                multiline: true,
            },
        ];

    return (
        <div className="relative h-screen overflow-hidden bg-[#28282B]">
            {/* Background */}
            <SunflowerField />

            {/* Overlay content */}
            <div className="relative z-10 flex flex-col h-full pt-24 px-4 md:px-8 pb-6">
                {/* Header and farmer profile strip */}
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                    className="max-w-4xl mx-auto w-full mb-4 shrink-0 h-[260px] overflow-y-auto"
                >
                    <div className="flex items-center justify-between gap-4 mb-3">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-[#f4d03f]/20 flex items-center justify-center">
                                <Sparkles className="w-5 h-5 text-[#f4d03f]" />
                            </div>
                            <div>
                                <h1 className="text-lg md:text-xl font-semibold text-white tracking-tight">
                                    {t('forYou')}
                                </h1>
                                <p className="text-xs md:text-sm text-white/60">
                                    {t('forYouSubtitle')}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Farmer profile inputs */}
                    <GlassPanel className="rounded-3xl px-4 py-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                        {profileFields.map(field => {
                            const Icon = field.icon;
                            const value = profile[field.key];
                            return (
                                <label
                                    key={field.key}
                                    className="flex flex-col gap-2 rounded-2xl bg-white/5 border border-white/10 px-3 py-3"
                                >
                                    <span className="text-[11px] uppercase tracking-[0.2em] text-white/50">
                                        {field.label}
                                    </span>
                                    <div className="flex items-start gap-2 text-white/80">
                                        <Icon className="w-4 h-4 text-[#f4d03f] mt-1" />
                                        {field.multiline ? (
                                            <textarea
                                                value={value}
                                                onChange={(e) => handleProfileChange(field.key, e.target.value)}
                                                placeholder={field.placeholder}
                                                rows={2}
                                                className="w-full bg-transparent resize-none text-sm placeholder-white/40 focus:outline-none"
                                            />
                                        ) : (
                                            <input
                                                value={value}
                                                onChange={(e) => handleProfileChange(field.key, e.target.value)}
                                                placeholder={field.placeholder}
                                                className="w-full bg-transparent text-sm placeholder-white/40 focus:outline-none"
                                            />
                                        )}
                                    </div>
                                </label>
                            );
                        })}
                    </GlassPanel>
                    <p className="text-[11px] text-white/60 mt-2">
                        {t('farmerProfileHelper')}
                    </p>
                </motion.div>

                {/* Chat area */}
                <div className="flex-1 min-h-0 flex flex-col">
                    <div className="flex-1 min-h-0 overflow-y-auto pb-4">
                        <div className="max-w-3xl mx-auto w-full px-2 space-y-2">
                            <AnimatePresence initial={false}>
                                {messages.map(message => (
                                    <ChatMessage key={message.id} message={message} />
                                ))}
                            </AnimatePresence>
                            <div ref={messagesEndRef} />
                        </div>
                    </div>

                    {/* Input bar */}
                    <div className="shrink-0">
                        <ChatInput onSend={handleSend} isLoading={isLoading} />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ForYouPage;
