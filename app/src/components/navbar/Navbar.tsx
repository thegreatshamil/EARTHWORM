import { motion } from 'framer-motion';
import { Home, MessageCircle, User } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import type { Page } from '@/types';

interface NavbarProps {
  currentPage: Page;
  onPageChange: (page: Page) => void;
}

const Navbar: React.FC<NavbarProps> = ({ currentPage, onPageChange }) => {
  const { t } = useLanguage();

  const navItems: { id: Page; label: string; icon: React.ElementType }[] = [
    { id: 'home', label: t('home'), icon: Home },
    { id: 'chat', label: t('chat'), icon: MessageCircle },
    { id: 'account', label: t('account'), icon: User },
  ];

  return (
    <motion.nav
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="fixed top-5 left-1/2 -translate-x-1/2 z-50"
    >
      <div className="glass-strong rounded-full px-2 py-2 flex items-center gap-1">
        {navItems.map((item, index) => {
          const isActive = currentPage === item.id;
          const Icon = item.icon;

          return (
            <motion.button
              key={item.id}
              onClick={() => onPageChange(item.id)}
              className={`
                relative px-5 py-2.5 rounded-full flex items-center gap-2 
                transition-all duration-300 ease-out
                ${isActive 
                  ? 'text-[#28282B]' 
                  : 'text-white/60 hover:text-white'
                }
              `}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              initial={{ opacity: 0, y: -15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.08 + 0.2 }}
            >
              {/* Active background pill */}
              {isActive && (
                <motion.div
                  layoutId="activeNavPill"
                  className="absolute inset-0 bg-[#f4d03f] rounded-full"
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}

              {/* Content */}
              <span className="relative z-10 flex items-center gap-2">
                <Icon className="w-4 h-4" strokeWidth={2} />
                <span className="text-sm font-medium">{item.label}</span>
              </span>
            </motion.button>
          );
        })}
      </div>
    </motion.nav>
  );
};

export default Navbar;
