import { motion } from 'framer-motion';
import { User, Bot, Image as ImageIcon, Volume2 } from 'lucide-react';
import type { Message } from '@/types';

interface ChatMessageProps {
  message: Message;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const isUser = message.role === 'user';

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className={`
        flex gap-3 px-4 py-4
        ${isUser ? 'flex-row-reverse' : 'flex-row'}
      `}
    >
      {/* Avatar */}
      <div className={`
        flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center
        ${isUser 
          ? 'bg-[#f4d03f]/15 text-[#f4d03f]' 
          : 'bg-[#7a9a5a]/20 text-[#9aba7a]'
        }
      `}>
        {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
      </div>

      {/* Content */}
      <div className={`
        flex-1 max-w-[80%]
        ${isUser ? 'text-right' : 'text-left'}
      `}>
        {/* Image attachment */}
        {message.imageUrl && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`
              mb-2 inline-block
              ${isUser ? 'ml-auto' : 'mr-auto'}
            `}
          >
            <div className="relative rounded-xl overflow-hidden border border-white/[0.08]">
              <img
                src={message.imageUrl}
                alt="Uploaded"
                className="max-w-[180px] max-h-[180px] object-cover"
              />
              <div className="absolute top-2 right-2 p-1.5 bg-black/50 rounded-lg">
                <ImageIcon className="w-3.5 h-3.5 text-white" />
              </div>
            </div>
          </motion.div>
        )}

        {/* Audio attachment */}
        {message.audioUrl && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`
              mb-2 inline-flex items-center gap-3
              glass rounded-xl px-3 py-2
              ${isUser ? 'ml-auto' : 'mr-auto'}
            `}
          >
            <Volume2 className="w-4 h-4 text-[#f4d03f]" />
            <audio src={message.audioUrl} controls className="max-w-[180px] h-7" />
          </motion.div>
        )}

        {/* Text message */}
        <div
          className={`
            inline-block px-4 py-2.5 rounded-2xl text-left
            ${isUser
              ? 'bg-[#f4d03f] text-[#2d1a0a] rounded-tr-sm'
              : 'glass text-white rounded-tl-sm'
            }
          `}
        >
          <p className="text-sm leading-relaxed whitespace-pre-wrap">
            {message.content}
          </p>
        </div>

        {/* Timestamp */}
        <p className="mt-1.5 text-xs text-white/30">
          {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </p>
      </div>
    </motion.div>
  );
};

export default ChatMessage;
