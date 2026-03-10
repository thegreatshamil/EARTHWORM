import React, { useMemo } from 'react';
import { motion } from 'framer-motion';

interface SunflowerProps {
  x: number;
  scale: number;
  delay: number;
  swayType: 'gentle' | 'normal' | 'strong';
  layer: 'back' | 'mid' | 'front';
}

// Realistic SVG Sunflower Component
const SunflowerSVG: React.FC<{ layer: 'back' | 'mid' | 'front' }> = ({ layer }) => {
  const opacity = layer === 'back' ? 0.55 : layer === 'mid' ? 0.8 : 1;
  const blur = layer === 'back' ? 1.5 : layer === 'mid' ? 0.5 : 0;
  
  return (
    <svg
      viewBox="0 0 120 280"
      className="w-full h-full"
      style={{ 
        filter: `blur(${blur}px)`,
        opacity,
      }}
      preserveAspectRatio="xMidYMax meet"
    >
      <defs>
        {/* Stem gradient */}
        <linearGradient id={`stemGradient-${layer}`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#5d7a3d" />
          <stop offset="40%" stopColor="#4a6a2a" />
          <stop offset="100%" stopColor="#3a4d1a" />
        </linearGradient>
        
        {/* Petal gradient - more realistic */}
        <linearGradient id={`petalGradient-${layer}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#f9e79f" />
          <stop offset="30%" stopColor="#f4d03f" />
          <stop offset="70%" stopColor="#d4ac0d" />
          <stop offset="100%" stopColor="#b7950b" />
        </linearGradient>
        
        {/* Inner petal gradient */}
        <linearGradient id={`innerPetalGradient-${layer}`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#fcf3cf" />
          <stop offset="100%" stopColor="#f7dc6f" />
        </linearGradient>
        
        {/* Center disk gradient */}
        <radialGradient id={`centerGradient-${layer}`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#8b5a2b" />
          <stop offset="40%" stopColor="#6e4a1f" />
          <stop offset="80%" stopColor="#4a3015" />
          <stop offset="100%" stopColor="#2d1a0a" />
        </radialGradient>
        
        {/* Leaf gradient */}
        <linearGradient id={`leafGradient-${layer}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#6a8a4a" />
          <stop offset="50%" stopColor="#4a6a2a" />
          <stop offset="100%" stopColor="#3a4a1a" />
        </linearGradient>
      </defs>
      
      {/* Stem with natural curve */}
      <path
        d="M58 280 Q62 220 58 160 Q54 110 60 75"
        stroke={`url(#stemGradient-${layer})`}
        strokeWidth="5"
        fill="none"
        strokeLinecap="round"
      />
      
      {/* Lower leaf - larger */}
      <g transform="translate(42, 200)">
        <path
          d="M0 0 Q-20 -5 -35 -15 Q-25 -8 0 0"
          fill={`url(#leafGradient-${layer})`}
        />
        <path
          d="M0 0 Q-18 2 -30 8 Q-20 3 0 0"
          fill={`url(#leafGradient-${layer})`}
          opacity="0.8"
        />
      </g>
      
      {/* Upper leaf */}
      <g transform="translate(68, 140)">
        <path
          d="M0 0 Q20 -5 35 -15 Q25 -8 0 0"
          fill={`url(#leafGradient-${layer})`}
        />
        <path
          d="M0 0 Q18 2 30 8 Q20 3 0 0"
          fill={`url(#leafGradient-${layer})`}
          opacity="0.8"
        />
      </g>
      
      {/* Flower Head Group */}
      <g transform="translate(60, 55)">
        {/* Outer petals - 20 petals for fullness */}
        {[...Array(20)].map((_, i) => (
          <ellipse
            key={`outer-${i}`}
            cx="0"
            cy="-28"
            rx="6"
            ry="22"
            fill={`url(#petalGradient-${layer})`}
            transform={`rotate(${i * 18})`}
          />
        ))}
        
        {/* Middle petals - 16 petals */}
        {[...Array(16)].map((_, i) => (
          <ellipse
            key={`mid-${i}`}
            cx="0"
            cy="-20"
            rx="5"
            ry="16"
            fill={`url(#petalGradient-${layer})`}
            transform={`rotate(${i * 22.5 + 11})`}
            opacity="0.9"
          />
        ))}
        
        {/* Inner petals - 12 petals */}
        {[...Array(12)].map((_, i) => (
          <ellipse
            key={`inner-${i}`}
            cx="0"
            cy="-14"
            rx="4"
            ry="12"
            fill={`url(#innerPetalGradient-${layer})`}
            transform={`rotate(${i * 30 + 15})`}
          />
        ))}
        
        {/* Center disk - realistic seed pattern */}
        <circle cx="0" cy="0" r="18" fill={`url(#centerGradient-${layer})`} />
        
        {/* Fibonacci spiral seed pattern */}
        {[...Array(55)].map((_, i) => {
          const goldenAngle = 137.508;
          const r = 2.5 + Math.sqrt(i) * 2.2;
          const theta = (i * goldenAngle * Math.PI) / 180;
          const x = r * Math.cos(theta);
          const y = r * Math.sin(theta);
          const seedSize = 1.8 - (i / 55) * 0.8;
          return (
            <ellipse
              key={`seed-${i}`}
              cx={x}
              cy={y}
              rx={seedSize}
              ry={seedSize * 1.2}
              fill="#1a0f05"
              opacity={0.85}
              transform={`rotate(${(theta * 180) / Math.PI + 90} ${x} ${y})`}
            />
          );
        })}
        
        {/* Highlight on center */}
        <ellipse cx="-4" cy="-4" rx="6" ry="4" fill="#a06a3a" opacity="0.4" />
      </g>
    </svg>
  );
};

const Sunflower: React.FC<SunflowerProps> = ({ x, scale, delay, swayType, layer }) => {
  const swayAnimation = {
    gentle: 'animate-sway-gentle',
    normal: 'animate-sway',
    strong: 'animate-sway-strong',
  }[swayType];

  const height = layer === 'back' ? 160 : layer === 'mid' ? 200 : 260;

  return (
    <motion.div
      className={`absolute bottom-0 ${swayAnimation}`}
      style={{
        left: `${x}%`,
        height: `${height}px`,
        width: `${70 * scale}px`,
        transformOrigin: 'bottom center',
        animationDelay: `${delay}s`,
      }}
      initial={{ opacity: 0, scaleY: 0 }}
      animate={{ opacity: 1, scaleY: 1 }}
      transition={{ delay: delay * 0.3, duration: 0.5, ease: 'easeOut' }}
    >
      <SunflowerSVG layer={layer} />
    </motion.div>
  );
};

interface SunflowerFieldProps {
  className?: string;
}

const SunflowerField: React.FC<SunflowerFieldProps> = ({ className = '' }) => {
  const sunflowers = useMemo(() => {
    const flowers: SunflowerProps[] = [];
    
    // Back row - many smaller sunflowers
    for (let i = 0; i < 35; i++) {
      flowers.push({
        x: i * 3 + Math.random() * 2 - 1,
        scale: 0.4 + Math.random() * 0.15,
        delay: Math.random() * 3,
        swayType: 'gentle',
        layer: 'back',
      });
    }
    
    // Middle row - medium sunflowers
    for (let i = 0; i < 25; i++) {
      flowers.push({
        x: i * 4.2 + Math.random() * 3 - 1.5,
        scale: 0.6 + Math.random() * 0.15,
        delay: 0.5 + Math.random() * 3,
        swayType: 'normal',
        layer: 'mid',
      });
    }
    
    // Front row - large detailed sunflowers
    for (let i = 0; i < 15; i++) {
      flowers.push({
        x: i * 6.8 + Math.random() * 4 - 2,
        scale: 0.85 + Math.random() * 0.2,
        delay: 1 + Math.random() * 3,
        swayType: 'strong',
        layer: 'front',
      });
    }
    
    return flowers;
  }, []);

  return (
    <div className={`absolute inset-0 overflow-hidden ${className}`}>
      {/* Sky gradient */}
      <div className="absolute inset-0 gradient-earth" />
      
      {/* Sun - glowing orb */}
      <motion.div
        className="absolute top-10 right-[15%]"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.3, duration: 1 }}
      >
        <div className="relative w-32 h-32">
          {/* Outer glow */}
          <div className="absolute inset-0 bg-gradient-to-br from-amber-300 via-yellow-400 to-orange-400 rounded-full blur-2xl opacity-50 animate-pulse-glow" />
          {/* Inner sun */}
          <div className="absolute inset-3 bg-gradient-to-br from-yellow-200 via-yellow-400 to-amber-500 rounded-full" />
          {/* Core */}
          <div className="absolute inset-8 bg-gradient-to-br from-yellow-100 to-yellow-300 rounded-full opacity-90" />
        </div>
      </motion.div>

      {/* Soft clouds */}
      <motion.div
        className="absolute top-20 left-[10%]"
        animate={{ x: [0, 30, 0] }}
        transition={{ duration: 30, repeat: Infinity, ease: 'easeInOut' }}
      >
        <div className="flex">
          <div className="w-24 h-12 bg-white/12 rounded-full backdrop-blur-sm" />
          <div className="w-16 h-8 bg-white/8 rounded-full backdrop-blur-sm -mt-2 -ml-6" />
          <div className="w-20 h-10 bg-white/10 rounded-full backdrop-blur-sm -ml-4" />
        </div>
      </motion.div>

      <motion.div
        className="absolute top-32 right-[28%]"
        animate={{ x: [0, -20, 0] }}
        transition={{ duration: 35, repeat: Infinity, ease: 'easeInOut' }}
      >
        <div className="flex">
          <div className="w-16 h-8 bg-white/8 rounded-full backdrop-blur-sm" />
          <div className="w-22 h-11 bg-white/12 rounded-full backdrop-blur-sm -mt-1 -ml-4" />
        </div>
      </motion.div>

      {/* Horizon line */}
      <div className="absolute bottom-[40%] left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#4a5d3a]/25 to-transparent" />

      {/* Sunflower field - layered */}
      <div className="absolute bottom-0 left-[-8%] right-[-8%] h-[50%]">
        {/* Back layer */}
        <div className="absolute bottom-0 left-0 right-0 h-full">
          {sunflowers.slice(0, 35).map((flower, i) => (
            <Sunflower key={`back-${i}`} {...flower} />
          ))}
        </div>

        {/* Middle layer */}
        <div className="absolute bottom-0 left-[-4%] right-[-4%] h-[92%]">
          {sunflowers.slice(35, 60).map((flower, i) => (
            <Sunflower key={`mid-${i}`} {...flower} />
          ))}
        </div>

        {/* Front layer */}
        <div className="absolute bottom-0 left-0 right-0 h-[80%]">
          {sunflowers.slice(60).map((flower, i) => (
            <Sunflower key={`front-${i}`} {...flower} />
          ))}
        </div>
      </div>

      {/* Ground gradient overlay */}
      <div className="absolute bottom-0 left-0 right-0 h-[20%] bg-gradient-to-t from-[#1a2a0a] via-[#2a3d1a]/50 to-transparent" />
    </div>
  );
};

export default SunflowerField;
