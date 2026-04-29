import React, { useCallback, useMemo, useRef, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UserRound, Sparkles, MapPin, Ruler, Sprout, Trash2, Check } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import GlassPanel from '@/components/ui/GlassPanel';
import ChatMessage from '@/components/chat/ChatMessage';
import ChatInput from '@/components/chat/ChatInput';
import { forYouService } from '@/services/forYouService';
import type { FarmerProfile, Message, Page } from '@/types';

interface ForYouPageProps {
    onPageChange: (page: Page) => void;
}

const PROFILE_STORAGE_KEY = 'earthworm-for-you-profile';
const FIELDS_STORAGE_KEY = 'earthworm-for-you-fields';
const ACTIVE_FIELD_ID_KEY = 'earthworm-for-you-active-field-id';

type FieldProfile = {
    id: string;
    label: string;
    profile: FarmerProfile;
};

const createEmptyProfile = (): FarmerProfile => ({
    name: '',
    location: '',
    fieldSize: '',
    crops: '',
});

const createFieldProfile = (label: string, profile?: FarmerProfile): FieldProfile => ({
    id: `field_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    label,
    profile: profile ?? createEmptyProfile(),
});

const ForYouPage: React.FC<ForYouPageProps> = ({ onPageChange: _onPageChange }) => {
    const { t, language } = useLanguage();
    const [messages, setMessages] = useState<Message[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [fieldSetupPrompt, setFieldSetupPrompt] = useState('');

    const [tab, setTab] = useState<'chat' | 'fields'>('chat');
    const [profileExpanded, setProfileExpanded] = useState(false);

    const [fields, setFields] = useState<FieldProfile[]>(() => {
        if (typeof window === 'undefined') return [createFieldProfile('Field 1')];

        try {
            const savedFields = localStorage.getItem(FIELDS_STORAGE_KEY);
            if (savedFields) {
                const parsed = JSON.parse(savedFields);
                if (Array.isArray(parsed) && parsed.length > 0) {
                    return parsed.map((f: any) => ({
                        id: String(f.id),
                        label: String(f.label ?? ''),
                        profile: {
                            name: String(f.profile?.name ?? ''),
                            location: String(f.profile?.location ?? ''),
                            fieldSize: String(f.profile?.fieldSize ?? ''),
                            crops: String(f.profile?.crops ?? ''),
                        },
                    }));
                }
            }
        } catch (error) {
            console.warn('Unable to load saved fields', error);
        }

        // Legacy migration: single profile → first field profile
        try {
            const legacy = localStorage.getItem(PROFILE_STORAGE_KEY);
            if (legacy) {
                const parsed = JSON.parse(legacy);
                const restored: FarmerProfile = {
                    name: parsed.name || '',
                    location: parsed.location || '',
                    fieldSize: parsed.fieldSize || '',
                    crops: parsed.crops || '',
                };
                return [createFieldProfile('Field 1', restored)];
            }
        } catch (error) {
            console.warn('Unable to migrate legacy For You profile', error);
        }

        return [createFieldProfile('Field 1')];
    });

    const [activeFieldId, setActiveFieldId] = useState<string>(() => {
        if (typeof window === 'undefined') return '';
        return localStorage.getItem(ACTIVE_FIELD_ID_KEY) || '';
    });

    const [newFieldLabel, setNewFieldLabel] = useState('');

    const activeField = useMemo(() => {
        const byId = fields.find(f => f.id === activeFieldId);
        return byId ?? fields[0];
    }, [activeFieldId, fields]);

    const activeProfile = activeField?.profile ?? createEmptyProfile();
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const forYouSessionIdRef = useRef(
        typeof crypto !== 'undefined' && crypto.randomUUID
            ? crypto.randomUUID()
            : `for_you_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
    );

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    useEffect(() => {
        try {
            localStorage.setItem(FIELDS_STORAGE_KEY, JSON.stringify(fields));
        } catch (error) {
            console.warn('Unable to persist For You fields', error);
        }
    }, [fields]);

    useEffect(() => {
        if (!activeFieldId && fields[0]?.id) {
            setActiveFieldId(fields[0].id);
        }
    }, [activeFieldId, fields]);

    useEffect(() => {
        if (!activeFieldId) return;
        try {
            localStorage.setItem(ACTIVE_FIELD_ID_KEY, activeFieldId);
        } catch (error) {
            console.warn('Unable to persist active field id', error);
        }
    }, [activeFieldId]);

    const handleProfileChange = useCallback(
        (field: keyof FarmerProfile, value: string) => {
            if (!activeField) return;
            setFields(prev =>
                prev.map(f =>
                    f.id === activeField.id
                        ? { ...f, profile: { ...f.profile, [field]: value } }
                        : f
                )
            );
        },
        [activeField]
    );

    const handleFieldLabelChange = useCallback((value: string) => {
        if (!activeField) return;
        setFields(prev => prev.map(f => (f.id === activeField.id ? { ...f, label: value } : f)));
    }, [activeField]);

    const handleAddField = useCallback(() => {
        const label = newFieldLabel.trim() || `Field ${fields.length + 1}`;
        const created = createFieldProfile(label);
        setFields(prev => [...prev, created]);
        setActiveFieldId(created.id);
        setNewFieldLabel('');
        setTab('chat');
        setProfileExpanded(true);
    }, [fields.length, newFieldLabel, setTab]);

    const handleDeleteField = useCallback((fieldId: string) => {
        setFields(prev => {
            const next = prev.filter(f => f.id !== fieldId);
            return next.length > 0 ? next : [createFieldProfile('Field 1')];
        });

        setActiveFieldId(prev => {
            if (prev !== fieldId) return prev;
            const remaining = fields.filter(f => f.id !== fieldId);
            return remaining[0]?.id || '';
        });
    }, [fields]);

    const handleSelectField = useCallback((fieldId: string) => {
        setActiveFieldId(fieldId);
    }, []);

    const handleSend = useCallback(
        async (text: string, imageBase64?: string, audioFile?: string) => {
            if (!text.trim() && !imageBase64 && !audioFile) return;

            const hasRequiredProfile = Boolean(
                activeField &&
                activeProfile.location.trim() &&
                activeProfile.fieldSize.trim() &&
                activeProfile.crops.trim()
            );

            if (!hasRequiredProfile) {
                setFieldSetupPrompt('Please set up your field profile (location, size, and crops) before asking questions.');
                return;
            }

            setFieldSetupPrompt('');

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
                const sizeMatch = activeProfile.fieldSize.match(/[\d.]+/);
                const sizeAcres = sizeMatch ? Number.parseFloat(sizeMatch[0]) : 0;
                const crops = activeProfile.crops
                    .split(',')
                    .map(c => c.trim())
                    .filter(Boolean);

                const responseText = await forYouService.sendInsight({
                    text,
                    session_id: forYouSessionIdRef.current,
                    language,
                    field_profile: {
                        name: activeField?.label?.trim() || activeProfile.name.trim() || 'Field',
                        location: activeProfile.location.trim(),
                        size_acres: Number.isFinite(sizeAcres) ? sizeAcres : 0,
                        crops,
                    },
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
        [activeProfile, language, t]
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
        <div className="relative min-h-full">
            <div className="relative z-10 pt-24 px-4 md:px-8 pb-6">
                <div className="mx-auto max-w-4xl">
                    {/* Header */}
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4 }}
                        className="mb-4"
                    >
                        <div className="flex items-center justify-between gap-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-[#f4d03f]/20 flex items-center justify-center">
                                    <Sparkles className="w-5 h-5 text-[#f4d03f]" />
                                </div>
                                <div>
                                    <h1 className="text-lg md:text-xl font-semibold text-white tracking-tight">{t('forYou')}</h1>
                                    <p className="text-xs md:text-sm text-white/85">{t('forYouSubtitle')}</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <div className="text-right">
                                    <div className="text-[11px] uppercase tracking-[0.2em] text-white/80">
                                        {t('activeField')}
                                    </div>
                                    <div className="text-sm font-medium text-white/95 truncate max-w-[180px]">
                                        {activeField?.label || 'Field'}
                                    </div>
                                </div>
                                <motion.button
                                    onClick={() => setProfileExpanded(prev => !prev)}
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    className="px-4 py-2 rounded-2xl bg-white/[0.08] border border-white/20 text-[#fff5cf] hover:text-white transition-colors"
                                >
                                    {profileExpanded ? t('hideProfile') : t('editProfile')}
                                </motion.button>
                            </div>
                        </div>
                    </motion.div>

                    {/* Collapsible profile bar */}
                    <GlassPanel className="rounded-3xl px-4 py-4 mb-4">
                        <div className="flex flex-col gap-3">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                <label className="flex flex-col gap-2 rounded-2xl bg-white/10 border border-white/40 px-3 py-3">
                                    <span className="text-[11px] uppercase tracking-[0.2em] text-white/85">{t('fieldLabel')}</span>
                                    <div className="flex items-start gap-2 text-white/80">
                                        <Ruler className="w-4 h-4 text-[#f4d03f] mt-1" />
                                        <input
                                            value={activeField?.label ?? ''}
                                            onChange={(e) => handleFieldLabelChange(e.target.value)}
                                            placeholder={t('fieldLabelPlaceholder')}
                                            className="w-full bg-transparent text-sm placeholder-white/40 focus:outline-none"
                                        />
                                    </div>
                                </label>

                                <div className="flex items-center rounded-2xl bg-white/10 border border-white/40 px-3 py-3">
                                    <div className="text-sm text-white/85 truncate">
                                        {activeProfile.location ? `${t('farmerProfileLocation')}: ${activeProfile.location}` : t('farmerProfileLocation')}
                                    </div>
                                </div>

                                <div className="flex items-center rounded-2xl bg-white/10 border border-white/40 px-3 py-3">
                                    <div className="text-sm text-white/85 truncate">
                                        {activeProfile.fieldSize ? `${t('farmerProfileFieldSize')}: ${activeProfile.fieldSize}` : t('farmerProfileFieldSize')}
                                    </div>
                                </div>
                            </div>

                            <AnimatePresence initial={false}>
                                {profileExpanded && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className="overflow-hidden"
                                    >
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
                                            {profileFields.map(field => {
                                                const Icon = field.icon;
                                                const value = activeProfile[field.key];
                                                return (
                                                    <label
                                                        key={field.key}
                                                        className="flex flex-col gap-2 rounded-2xl bg-white/10 border border-white/40 px-3 py-3"
                                                    >
                                                        <span className="text-[11px] uppercase tracking-[0.2em] text-white/85">
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
                                        </div>
                                        <p className="text-[11px] text-white/85 mt-2">{t('farmerProfileHelper')}</p>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </GlassPanel>

                    {/* Tabs */}
                    <div className="flex items-center gap-2 mb-4">
                        <button
                            onClick={() => setTab('chat')}
                            className={`px-4 py-2 rounded-2xl border transition-colors ${tab === 'chat'
                                ? 'bg-[#f4d03f] border-[#f4d03f] text-[#28282B]'
                                : 'bg-white/[0.12] border-white/35 text-white/90 hover:text-white'
                                }`}
                        >
                            {t('chat')}
                        </button>
                        <button
                            onClick={() => setTab('fields')}
                            className={`px-4 py-2 rounded-2xl border transition-colors ${tab === 'fields'
                                ? 'bg-[#f4d03f] border-[#f4d03f] text-[#28282B]'
                                : 'bg-white/[0.12] border-white/35 text-white/90 hover:text-white'
                                }`}
                        >
                            {t('myFields')}
                        </button>
                    </div>

                    {/* Tab content */}
                    {tab === 'chat' ? (
                        <div className="relative">
                            {fieldSetupPrompt && (
                                <div className="max-w-3xl mx-auto w-full px-2 mb-3">
                                    <div className="rounded-2xl border border-amber-300/30 bg-amber-200/10 px-4 py-2 text-sm text-amber-100">
                                        {fieldSetupPrompt}
                                    </div>
                                </div>
                            )}
                            <div className="max-w-3xl mx-auto w-full px-2 space-y-2">
                                <AnimatePresence initial={false}>
                                    {messages.map(message => (
                                        <ChatMessage key={message.id} message={message} />
                                    ))}
                                </AnimatePresence>
                                <div ref={messagesEndRef} />
                            </div>

                            <div className="sticky bottom-0 mt-6 pb-2">
                                <ChatInput onSend={handleSend} isLoading={isLoading} />
                            </div>
                        </div>
                    ) : (
                        <GlassPanel className="rounded-3xl px-4 py-4">
                            <div className="flex flex-col gap-4">
                                <div className="flex items-center gap-2">
                                    <input
                                        value={newFieldLabel}
                                        onChange={(e) => setNewFieldLabel(e.target.value)}
                                        placeholder={t('fieldLabelPlaceholder')}
                                        className="flex-1 rounded-2xl bg-white/10 border border-white/40 px-4 py-3 text-sm text-white/90 placeholder-white/70 focus:outline-none"
                                    />
                                    <motion.button
                                        onClick={handleAddField}
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        className="px-4 py-3 rounded-2xl bg-[#f4d03f] text-[#28282B] font-semibold text-sm"
                                    >
                                        {t('addField')}
                                    </motion.button>
                                </div>

                                {fields.length === 0 ? (
                                    <p className="text-sm text-white/85">{t('noFieldsYet')}</p>
                                ) : (
                                    <div className="space-y-2">
                                        {fields.map(f => {
                                            const isActive = f.id === activeField?.id;
                                            return (
                                                <div
                                                    key={f.id}
                                                    className={`flex items-center justify-between gap-3 rounded-2xl border px-4 py-3 ${isActive
                                                        ? 'bg-white/10 border-[#f4d03f]/30'
                                                        : 'bg-white/10 border-white/30'
                                                        }`}
                                                >
                                                    <div className="min-w-0">
                                                        <div className="text-sm font-medium text-white/95 truncate">{f.label || 'Field'}</div>
                                                        <div className="text-xs text-white/80 truncate">
                                                            {[f.profile.location, f.profile.fieldSize, f.profile.crops].filter(Boolean).join(' • ') || t('farmerProfileHelper')}
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center gap-2 shrink-0">
                                                        <motion.button
                                                            onClick={() => handleSelectField(f.id)}
                                                            whileHover={{ scale: 1.05 }}
                                                            whileTap={{ scale: 0.95 }}
                                                            className={`p-2 rounded-xl border transition-colors ${isActive
                                                                ? 'border-[#f4d03f]/40 text-[#f4d03f] bg-[#f4d03f]/10'
                                                                : 'border-white/30 text-white/90 hover:text-white hover:bg-white/15'
                                                                }`}
                                                            title={t('activeField')}
                                                        >
                                                            <Check className="w-4 h-4" />
                                                        </motion.button>

                                                        <motion.button
                                                            onClick={() => handleDeleteField(f.id)}
                                                            whileHover={{ scale: 1.05 }}
                                                            whileTap={{ scale: 0.95 }}
                                                            className="p-2 rounded-xl border border-white/10 text-white/50 hover:text-red-300 hover:bg-red-500/10 transition-colors"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </motion.button>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </GlassPanel>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ForYouPage;
