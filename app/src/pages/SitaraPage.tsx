import React, { useCallback, useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Volume2 } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import SunflowerField from '@/components/sunflower/SunflowerField';
import type { Page } from '@/types';

interface SitaraPageProps {
    onPageChange: (page: Page) => void;
}

type VoiceStatus = 'idle' | 'listening' | 'thinking' | 'speaking';

const SitaraPage: React.FC<SitaraPageProps> = ({ onPageChange: _onPageChange }) => {
    const { t } = useLanguage();
    const [status, setStatus] = useState<VoiceStatus>('idle');
    const [subtitle, setSubtitle] = useState('');
    const [displayedSubtitle, setDisplayedSubtitle] = useState('');
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const mediaStreamRef = useRef<MediaStream | null>(null);
    const wordIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    // Text reveal effect
    useEffect(() => {
        if (!subtitle) {
            setDisplayedSubtitle('');
            return;
        }

        if (wordIntervalRef.current) {
            clearInterval(wordIntervalRef.current);
            wordIntervalRef.current = null;
        }

        const words = subtitle.split(' ');
        let index = 0;

        setDisplayedSubtitle('');
        wordIntervalRef.current = setInterval(() => {
            index += 1;
            setDisplayedSubtitle(words.slice(0, index).join(' '));
            if (index >= words.length && wordIntervalRef.current) {
                clearInterval(wordIntervalRef.current);
                wordIntervalRef.current = null;
            }
        }, 80);

        return () => {
            if (wordIntervalRef.current) {
                clearInterval(wordIntervalRef.current);
                wordIntervalRef.current = null;
            }
        };
    }, [subtitle]);

    const cleanupMedia = () => {
        if (mediaRecorderRef.current) {
            mediaRecorderRef.current.ondataavailable = null;
            mediaRecorderRef.current.onstop = null;
            mediaRecorderRef.current = null;
        }
        if (mediaStreamRef.current) {
            mediaStreamRef.current.getTracks().forEach(track => track.stop());
            mediaStreamRef.current = null;
        }
    };

    const recordAudio = useCallback(async (): Promise<Blob | null> => {
        // TODO: Wire this recording logic to your n8n pipeline
        if (!navigator.mediaDevices?.getUserMedia) {
            console.warn('Media devices not available');
            return null;
        }

        return new Promise<Blob | null>(async (resolve) => {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                mediaStreamRef.current = stream;
                const recorder = new MediaRecorder(stream);
                mediaRecorderRef.current = recorder;
                const chunks: BlobPart[] = [];

                recorder.ondataavailable = (event) => {
                    if (event.data.size > 0) {
                        chunks.push(event.data);
                    }
                };

                recorder.onstop = () => {
                    const blob = chunks.length ? new Blob(chunks, { type: recorder.mimeType || 'audio/webm' }) : null;
                    cleanupMedia();
                    resolve(blob);
                };

                recorder.start();
            } catch (error) {
                console.error('Error starting audio recording', error);
                cleanupMedia();
                resolve(null);
            }
        });
    }, []);

    const sendToBackend = useCallback(async (_blob: Blob | null): Promise<string> => {
        // TODO: Replace with actual Sitara AI backend / n8n bridge
        setStatus('thinking');
        await new Promise(resolve => setTimeout(resolve, 900));
        return t('sitaraPlaceholderResponse');
    }, [t]);

    const playTTSResponse = useCallback(async (text: string) => {
        // TODO: Connect this to your TTS playback (audio element or Web Audio API)
        setStatus('speaking');
        setSubtitle(text);
        const estimatedDuration = Math.max(1800, text.split(' ').length * 160);
        await new Promise(resolve => setTimeout(resolve, estimatedDuration));
        setStatus('idle');
    }, []);

    const handlePressStart = async () => {
        if (status === 'speaking') return;
        setStatus('listening');

        const blobPromise = recordAudio();

        // Store promise to use on release
        (handlePressEnd as any)._pendingBlob = blobPromise;
    };

    const handlePressEnd = async () => {
        const pending: Promise<Blob | null> | undefined = (handlePressEnd as any)._pendingBlob;
        (handlePressEnd as any)._pendingBlob = undefined;

        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
            mediaRecorderRef.current.stop();
        }

        if (!pending) {
            setStatus('idle');
            return;
        }

        const blob = await pending;
        if (!blob) {
            setStatus('idle');
            return;
        }

        const responseText = await sendToBackend(blob);
        await playTTSResponse(responseText);
    };

    useEffect(() => {
        return () => {
            cleanupMedia();
            if (wordIntervalRef.current) {
                clearInterval(wordIntervalRef.current);
            }
        };
    }, []);

    const statusLabel = (() => {
        switch (status) {
            case 'listening':
                return t('statusListening');
            case 'thinking':
                return t('statusThinking');
            case 'speaking':
                return t('statusSpeaking');
            default:
                return t('statusIdle');
        }
    })();

    const sunflowerAnimation = (() => {
        if (status === 'listening') {
            return {
                scale: [1, 1.08, 1],
                transition: { repeat: Infinity, duration: 1.2, ease: 'easeInOut' },
            } as const;
        }
        if (status === 'speaking') {
            return {
                rotate: [-2, 2, -2],
                translateY: [0, -4, 0],
                transition: { repeat: Infinity, duration: 1.8, ease: 'easeInOut' },
            } as const;
        }
        return {
            scale: 1,
            rotate: 0,
            translateY: 0,
        } as const;
    })();

    return (
        <div className="relative h-screen overflow-hidden bg-[#28282B]">
            <SunflowerField />

            <div className="relative z-10 flex flex-col items-center justify-center h-full px-6 pt-16">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                    className="text-center mb-10"
                >
                    <h1 className="text-3xl md:text-4xl font-semibold text-white mb-1 tracking-tight">
                        {t('sitaraAI')}
                    </h1>
                    <p className="text-sm md:text-base text-white/70 max-w-md mx-auto">
                        {t('sitaraSubtitle')}
                    </p>
                </motion.div>

                {/* Status label */}
                <motion.div
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="mb-4"
                >
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass">
                        <span className="w-2 h-2 rounded-full bg-[#f4d03f] animate-pulse" />
                        <span className="text-xs md:text-sm text-white/80 font-medium tracking-wide uppercase">
                            {statusLabel}
                        </span>
                    </div>
                </motion.div>

                {/* Sunflower mic button */}
                <motion.button
                    type="button"
                    whileTap={{ scale: 0.96 }}
                    animate={sunflowerAnimation as any}
                    onMouseDown={handlePressStart}
                    onMouseUp={handlePressEnd}
                    onMouseLeave={handlePressEnd}
                    onTouchStart={(e) => {
                        e.preventDefault();
                        handlePressStart();
                    }}
                    onTouchEnd={(e) => {
                        e.preventDefault();
                        handlePressEnd();
                    }}
                    onTouchCancel={(e) => {
                        e.preventDefault();
                        handlePressEnd();
                    }}
                    className="
            relative w-40 h-40 md:w-52 md:h-52 rounded-full
            flex items-center justify-center
            bg-gradient-to-br from-[#f9e79f] via-[#f4d03f] to-[#b7950b]
            shadow-[0_0_60px_rgba(244,208,63,0.45)]
            border-4 border-amber-200/60
            overflow-hidden
          "
                >
                    {/* Petal ring */}
                    <div className="absolute inset-[-18%]">
                        <div className="w-full h-full animate-[spin_18s_linear_infinite]">
                            <div className="absolute inset-0">
                                {Array.from({ length: 16 }).map((_, i) => (
                                    <div
                                        key={i}
                                        className="absolute left-1/2 top-0 w-6 h-10 md:w-7 md:h-12 -translate-x-1/2 origin-[50%_100%] rounded-full bg-gradient-to-b from-amber-200 via-amber-300 to-amber-500"
                                        style={{ transform: `rotate(${(360 / 16) * i}deg) translateY(-12%)` }}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Center disk */}
                    <div className="relative w-24 h-24 md:w-30 md:h-30 rounded-full bg-gradient-to-br from-amber-900 via-amber-800 to-amber-900 flex items-center justify-center">
                        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-700 to-amber-900 flex items-center justify-center">
                            <Volume2 className="w-7 h-7 md:w-8 md:h-8 text-amber-200" />
                        </div>
                    </div>
                </motion.button>

                {/* Helper text */}
                <p className="mt-4 text-xs md:text-sm text-white/60">
                    {t('sitaraHint')}
                </p>

                {/* Subtitle / transcript area */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="mt-8 max-w-2xl w-full mx-auto"
                >
                    <div className="glass rounded-2xl px-4 py-3 md:px-6 md:py-4 min-h-[64px] flex items-center">
                        <p className="text-sm md:text-base text-white/80 whitespace-pre-wrap leading-relaxed min-h-[1.25rem]">
                            {displayedSubtitle || t('sitaraIdleSubtitle')}
                        </p>
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default SitaraPage;
