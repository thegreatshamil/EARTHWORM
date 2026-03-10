import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Mic, Image as ImageIcon, X, Loader2 } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

interface ChatInputProps {
  onSend: (text: string, imageBase64?: string, audioFile?: string) => void;
  isLoading?: boolean;
  disabled?: boolean;
}

const ChatInput: React.FC<ChatInputProps> = ({ onSend, isLoading = false, disabled = false }) => {
  const { t } = useLanguage();
  const [input, setInput] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioFile, setAudioFile] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const handleSend = () => {
    if ((!input.trim() && !selectedImage && !audioFile) || isLoading || disabled) return;
    onSend(input.trim(), selectedImage || undefined, audioFile || undefined);
    setInput('');
    setSelectedImage(null);
    setAudioFile(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const clearImage = () => {
    setSelectedImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const startRecording = useCallback(async () => {
    try {
      // Reset any previously recorded audio before starting a new recording
      setAudioFile(null);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      const audioChunks: Blob[] = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunks.push(event.data);
      };

      mediaRecorder.onstop = () => {
        const mimeType = mediaRecorder.mimeType || 'audio/webm';
        const audioBlob = new Blob(audioChunks, { type: mimeType });
        const audioUrl = URL.createObjectURL(audioBlob);
        console.log('Recording stopped, audio URL:', audioUrl, 'MimeType:', mimeType);
        
        // Convert recorded audio to base64 so it can be sent to the backend
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64Audio = reader.result as string;
          setAudioFile(base64Audio);
        };
        reader.readAsDataURL(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);

      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

    } catch (error) {
      console.error('Error accessing microphone:', error);
      alert('Could not access microphone. Please check permissions.');
    }
  }, [t]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
        recordingIntervalRef.current = null;
      }
    }
  }, [isRecording]);

  const clearAudio = () => {
    setAudioFile(null);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="w-full max-w-3xl mx-auto px-4 pb-6">
      {/* Selected media previews */}
      <AnimatePresence>
        {(selectedImage || audioFile) && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="mb-3 flex justify-center gap-4"
          >
            {selectedImage && (
              <div className="relative inline-block">
                <img
                  src={selectedImage}
                  alt="Selected"
                  className="h-20 w-auto rounded-xl border border-white/[0.08]"
                />
                <button
                  onClick={clearImage}
                  className="absolute -top-2 -right-2 p-1.5 bg-red-500 rounded-full text-white hover:bg-red-600 transition-colors shadow-lg"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            )}

            {audioFile && (
              <div className="relative inline-block">
                <div className="h-20 w-32 bg-[#f4d03f]/10 rounded-xl border border-[#f4d03f]/20 flex flex-col items-center justify-center gap-1 group">
                  <Mic className="w-6 h-6 text-[#f4d03f]" />
                  <span className="text-[10px] text-[#f4d03f]/60 font-medium uppercase tracking-wider">{t('voiceNote')}</span>
                </div>
                <button
                  onClick={clearAudio}
                  className="absolute -top-2 -right-2 p-1.5 bg-red-500 rounded-full text-white hover:bg-red-600 transition-colors shadow-lg"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Recording indicator */}
      <AnimatePresence>
        {isRecording && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="mb-3 flex justify-center"
          >
            <div className="glass rounded-full px-4 py-2 flex items-center gap-3">
              <div className="w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse" />
              <span className="text-white/70 text-sm">{t('stopRecording')}</span>
              <span className="text-[#f4d03f] font-mono text-sm">{formatTime(recordingTime)}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input bar */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="
          glass-strong rounded-full px-2 py-2
          flex items-center gap-1
        "
      >
        {/* Image upload button */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleImageSelect}
          className="hidden"
        />
        <motion.button
          onClick={() => fileInputRef.current?.click()}
          disabled={isLoading || isRecording || disabled}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className={`
            p-3 rounded-full transition-colors
            ${selectedImage 
              ? 'bg-[#f4d03f]/20 text-[#f4d03f]' 
              : 'text-white/40 hover:text-white hover:bg-white/10'
            }
            disabled:opacity-50 disabled:cursor-not-allowed
          `}
          title={t('uploadImage')}
        >
          <ImageIcon className="w-5 h-5" />
        </motion.button>

        {/* Voice recording button */}
        <motion.button
          onClick={isRecording ? stopRecording : startRecording}
          disabled={isLoading || disabled}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className={`
            p-3 rounded-full transition-colors
            ${isRecording
              ? 'bg-red-500/20 text-red-400 animate-pulse'
              : audioFile
                ? 'bg-[#f4d03f]/20 text-[#f4d03f]'
                : 'text-white/40 hover:text-white hover:bg-white/10'
            }
            disabled:opacity-50 disabled:cursor-not-allowed
          `}
          title={isRecording ? t('stopRecording') : t('recordVoice')}
        >
          <Mic className="w-5 h-5" />
        </motion.button>

        {/* Text input */}
        <div className="flex-1 relative">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isLoading || isRecording || disabled}
            placeholder={isRecording ? t('recordingAudio') : t('typeMessage')}
            className="
              w-full bg-transparent text-white placeholder-white/30
              px-3 py-3 outline-none text-sm
              disabled:opacity-50 disabled:cursor-not-allowed
            "
          />
        </div>

        {/* Send button */}
        <motion.button
          onClick={handleSend}
          disabled={(!input.trim() && !selectedImage && !audioFile) || isLoading || isRecording || disabled}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className={`
            p-3 rounded-full transition-all duration-200
            ${(input.trim() || selectedImage || audioFile) && !isLoading && !isRecording
              ? 'bg-[#f4d03f] text-[#2d1a0a] hover:bg-[#f7dc6f]'
              : 'bg-white/5 text-white/30'
            }
            disabled:opacity-50 disabled:cursor-not-allowed
          `}
        >
          {isLoading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Send className="w-5 h-5" />
          )}
        </motion.button>
      </motion.div>

      {/* Helper text */}
      <p className="text-center mt-2 text-xs text-white/30">
        {t('askAnything')}
      </p>
    </div>
  );
};

export default ChatInput;
