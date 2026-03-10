import React from 'react';
import { motion } from 'framer-motion';
import { ChevronRight } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import SunflowerField from '@/components/sunflower/SunflowerField';
import WeatherWidget from '@/components/weather/WeatherWidget';
import LanguageToggle from '@/components/language/LanguageToggle';
import type { Page } from '@/types';

interface HomePageProps {
  onPageChange: (page: Page) => void;
}

const HomePage: React.FC<HomePageProps> = ({ onPageChange }) => {
  const { t } = useLanguage();

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#28282B]">
      {/* Sunflower field background */}
      <SunflowerField />

      {/* Content overlay */}
      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Spacer for navbar */}
        <div className="h-24" />

        {/* Main content - centered hero */}
        <div className="flex-1 flex flex-col items-center justify-center px-6">
          {/* Welcome text - hero section */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.8 }}
            className="text-center"
          >
            <motion.h1
              className="text-5xl md:text-7xl lg:text-8xl font-bold text-white text-shadow-glow mb-4 tracking-tight"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5, duration: 0.8 }}
            >
              {t('welcome')}
            </motion.h1>
            <motion.p
              className="text-lg md:text-xl lg:text-2xl text-white/80 text-shadow-soft font-light"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
            >
              {t('subtitle')}
            </motion.p>
          </motion.div>

          {/* CTA Button */}
          <motion.button
            onClick={() => onPageChange('chat')}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9 }}
            whileHover={{ scale: 1.03, boxShadow: '0 0 50px hsl(45 92% 58% / 0.5)' }}
            whileTap={{ scale: 0.97 }}
            className="
              group relative mt-10 px-10 py-4 bg-[#f4d03f] text-[#28282B] 
              rounded-full font-semibold text-lg
              shadow-lg transition-all duration-300
              flex items-center gap-3
            "
          >
            <span>{t('chat')}</span>
            <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            
            {/* Shimmer effect */}
            <div className="absolute inset-0 rounded-full overflow-hidden">
              <div className="absolute inset-0 animate-shimmer opacity-20" />
            </div>
          </motion.button>
        </div>

        {/* Bottom section - Widgets below hero */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.1 }}
          className="relative z-20 px-6 pb-8"
        >
          <div className="max-w-4xl mx-auto">
            {/* Widgets row */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <LanguageToggle />
              <WeatherWidget />
            </div>
          </div>
        </motion.div>

        {/* Bottom gradient fade */}
        <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-[#28282B] to-transparent pointer-events-none" />
      </div>
    </div>
  );
};

export default HomePage;
