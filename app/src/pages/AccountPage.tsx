import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { User, Globe, Trash2, LogOut } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import LanguageToggle from '@/components/language/LanguageToggle';
import { chatService } from '@/services/chatService';
import type { Page } from '@/types';

interface AccountPageProps {
  onPageChange: (page: Page) => void;
}

const AccountPage: React.FC<AccountPageProps> = ({ onPageChange }) => {
  const { logout } = useAuth();
  const { t } = useLanguage();
  const defaultName = t('farmerUser') || 'Farmer User';
  const [displayName, setDisplayName] = useState(defaultName);
  const [nameDraft, setNameDraft] = useState(defaultName);
  const [isEditingName, setIsEditingName] = useState(false);
  const [hasCustomName, setHasCustomName] = useState(false);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!hasCustomName) {
      setDisplayName(defaultName);
      if (!isEditingName) {
        setNameDraft(defaultName);
      }
    }
  }, [defaultName, hasCustomName, isEditingName]);

  const handleClearHistory = () => {
    if (confirm(t('clearChatConfirm') || 'Are you sure you want to clear all chat history?')) {
      chatService.clearAllHistory();
      window.location.reload();
    }
  };

  const handleLogout = async () => {
    await logout();
    onPageChange('login');
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setProfileImage(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const startNameEdit = () => {
    setNameDraft(displayName);
    setIsEditingName(true);
  };

  const commitNameEdit = () => {
    const trimmed = nameDraft.trim();
    if (trimmed.length > 0) {
      setDisplayName(trimmed);
      setHasCustomName(true);
    } else if (!hasCustomName) {
      setDisplayName(defaultName);
    }
    setIsEditingName(false);
  };

  const cancelNameEdit = () => {
    setNameDraft(displayName);
    setIsEditingName(false);
  };

  const settingsGroups = [
    {
      title: t('preferences') || 'Preferences',
      items: [
        {
          icon: Globe,
          label: t('language') || 'Language',
          description: t('changeLanguage') || 'Change app language',
          action: <LanguageToggle />,
        },
      ],
    },
    {
      title: t('dataPrivacy') || 'Data & Privacy',
      items: [
        {
          icon: Trash2,
          label: t('clearChatHistory') || 'Clear Chat History',
          description: t('deleteConversations') || 'Delete all conversations',
          action: (
            <button
              onClick={handleClearHistory}
              className="px-4 py-2 bg-red-500/15 text-red-400 rounded-full text-sm hover:bg-red-500/25 transition-colors"
            >
              {t('clear') || 'Clear'}
            </button>
          ),
        },
      ],
    },
  ];

  return (
    <div className="h-screen overflow-hidden">
      <div className="h-full overflow-y-auto pt-24 px-6 pb-12">
        <div className="max-w-2xl mx-auto">
          {/* Profile Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-10"
          >
            <button
              type="button"
              onClick={handleAvatarClick}
              className="w-24 h-24 mx-auto mb-4 rounded-full bg-gradient-to-br from-[#f4d03f] to-[#d4ac0d] flex items-center justify-center shadow-lg shadow-[#f4d03f]/20 overflow-hidden"
            >
              {profileImage ? (
                <img src={profileImage} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <User className="w-12 h-12 text-[#28282B]" />
              )}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="user"
              onChange={handleImageChange}
              className="hidden"
            />
            {isEditingName ? (
              <input
                value={nameDraft}
                onChange={(event) => setNameDraft(event.target.value)}
                onBlur={commitNameEdit}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    commitNameEdit();
                  }
                  if (event.key === 'Escape') {
                    cancelNameEdit();
                  }
                }}
                className="text-2xl font-bold text-white mb-1 bg-transparent border-b border-white/30 focus:border-[#f4d03f] outline-none text-center w-full"
                autoFocus
              />
            ) : (
              <button
                type="button"
                onClick={startNameEdit}
                className="text-2xl font-bold text-white mb-1"
              >
                {displayName}
              </button>
            )}
            <p className="text-white/50">farmer@earthworm.ai</p>
          </motion.div>

          {/* Settings Groups */}
          <div className="space-y-6">
            {settingsGroups.map((group, groupIndex) => (
              <motion.div
                key={group.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: groupIndex * 0.1 + 0.2 }}
              >
                <h2 className="text-white/40 text-xs uppercase tracking-wider mb-3 px-2">
                  {group.title}
                </h2>
                <div className="glass rounded-2xl overflow-hidden">
                  {group.items.map((item, itemIndex) => {
                    const Icon = item.icon;
                    return (
                      <motion.div
                        key={item.label}
                        initial={{ opacity: 0, x: -15 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: groupIndex * 0.1 + itemIndex * 0.05 + 0.3 }}
                        className={`
                        flex items-center gap-4 p-4
                        ${itemIndex !== group.items.length - 1 ? 'border-b border-white/[0.05]' : ''}
                        hover:bg-white/[0.03] transition-colors
                      `}
                      >
                        <div className="w-10 h-10 rounded-xl bg-white/[0.05] flex items-center justify-center flex-shrink-0">
                          <Icon className="w-5 h-5 text-[#f4d03f]" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-white font-medium text-sm">{item.label}</h3>
                          <p className="text-white/40 text-xs">{item.description}</p>
                        </div>
                        <div className="flex-shrink-0">
                          {item.action}
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </motion.div>
            ))}
          </div>

          {/* Logout Button */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="mt-10"
          >
            <button
              onClick={handleLogout}
              className="
              w-full flex items-center justify-center gap-2
              px-6 py-4 glass rounded-2xl
              text-red-400 hover:bg-red-500/10
              transition-colors
            "
            >
              <LogOut className="w-5 h-5" />
              <span>{t('signOut') || 'Sign Out'}</span>
            </button>
          </motion.div>

          {/* Version */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="text-center mt-8 text-white/30 text-sm"
          >
            Earthworm v1.0.0
          </motion.p>
        </div>
      </div>
    </div>
  );
};

export default AccountPage;
