import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Droplets, Cloud, Sun, CloudRain, Wind } from 'lucide-react';
import type { WeatherData } from '@/types';

interface WeatherWidgetProps {
  className?: string;
}

const WeatherWidget: React.FC<WeatherWidgetProps> = ({ className = '' }) => {
  const [weather, setWeather] = useState<WeatherData>({
    temperature: 28,
    humidity: 65,
    condition: 'partly-cloudy',
    location: 'Tamil Nadu',
  });
  const [loading, setLoading] = useState(false);

  // Simulate fetching weather data
  useEffect(() => {
    const fetchWeather = async () => {
      setLoading(true);
      setTimeout(() => {
        setWeather(prev => ({
          ...prev,
          temperature: 26 + Math.floor(Math.random() * 8),
          humidity: 55 + Math.floor(Math.random() * 25),
        }));
        setLoading(false);
      }, 1000);
    };

    fetchWeather();
    const interval = setInterval(fetchWeather, 300000);
    return () => clearInterval(interval);
  }, []);

  const getWeatherIcon = () => {
    switch (weather.condition) {
      case 'sunny':
        return <Sun className="w-5 h-5 text-[#f4d03f]" />;
      case 'rainy':
        return <CloudRain className="w-5 h-5 text-blue-400" />;
      case 'windy':
        return <Wind className="w-5 h-5 text-[#7a9a5a]" />;
      default:
        return <Cloud className="w-5 h-5 text-white/70" />;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
      className={`
        glass-strong rounded-2xl px-5 py-3
        flex items-center gap-5
        ${className}
      `}
    >
      {/* Temperature display */}
      <div className="flex items-center gap-2">
        {getWeatherIcon()}
        <div className="flex items-baseline gap-0.5">
          <motion.span
            key={weather.temperature}
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-2xl font-semibold text-white"
          >
            {weather.temperature}
          </motion.span>
          <span className="text-white/60 text-sm">°C</span>
        </div>
      </div>

      {/* Divider */}
      <div className="w-px h-8 bg-white/10" />

      {/* Humidity */}
      <div className="flex items-center gap-2">
        <Droplets className="w-4 h-4 text-blue-400/70" />
        <div className="flex items-baseline gap-0.5">
          <span className="text-lg font-medium text-white">{weather.humidity}</span>
          <span className="text-white/50 text-xs">%</span>
        </div>
      </div>

      {/* Location */}
      <div className="hidden sm:block text-xs text-white/40">
        {weather.location}
      </div>

      {/* Loading indicator */}
      {loading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute inset-0 bg-black/20 backdrop-blur-sm rounded-2xl flex items-center justify-center"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            className="w-4 h-4 border-2 border-[#f4d03f]/30 border-t-[#f4d03f] rounded-full"
          />
        </motion.div>
      )}
    </motion.div>
  );
};

export default WeatherWidget;
