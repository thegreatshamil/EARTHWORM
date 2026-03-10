import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Globe, ChevronDown, Check } from 'lucide-react';
import { useLanguage, type Language } from '@/context/LanguageContext';

const LanguageToggle: React.FC = () => {
  const { language, setLanguage, t, supportedLanguages: languages } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentLang = languages.find(l => l.code === language);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={dropdownRef} className="relative">
      {/* Trigger button */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className="
          glass-strong rounded-full px-4 py-3 flex items-center gap-3
          text-white/90 hover:text-white transition-colors
        "
      >
        <Globe className="w-4 h-4 text-[#f4d03f]" />
        <span className="text-sm font-medium">{currentLang?.nativeName}</span>
        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </motion.button>

      {/* Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="
              absolute bottom-full left-0 mb-2 w-64
              glass-strong rounded-2xl shadow-2xl z-[100]
              overflow-hidden
            "
          >
            <div className="p-2 max-h-[300px] overflow-y-auto overscroll-contain">
              <p className="text-xs text-white/40 px-3 py-2 uppercase tracking-wider">
                {t('selectLanguage')}
              </p>
              {languages.map((lang) => (
                <motion.button
                  key={lang.code}
                  onClick={() => {
                    setLanguage(lang.code as Language);
                    setIsOpen(false);
                  }}
                  whileHover={{ x: 4 }}
                  className={`
                    w-full flex items-center gap-3 px-3 py-2.5 rounded-xl
                    transition-colors text-left
                    ${language === lang.code 
                      ? 'bg-[#f4d03f]/20 text-[#f4d03f]' 
                      : 'text-white/70 hover:bg-white/5 hover:text-white'
                    }
                  `}
                >
                  <span className="text-lg">{lang.flag}</span>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{lang.nativeName}</p>
                    <p className="text-xs text-white/40">{lang.name}</p>
                  </div>
                  {language === lang.code && (
                    <Check className="w-4 h-4" />
                  )}
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default LanguageToggle;
