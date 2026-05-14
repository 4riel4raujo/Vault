import React from 'react';
import { motion } from 'motion/react';

interface LogoProps {
  size?: number;
  className?: string;
  color?: string;
}

const Logo: React.FC<LogoProps> = ({ size = 32, className = '' }) => {
  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 10 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      strokeLinejoin="round"
      strokeLinecap="round"
    >
      <defs>
        {/* Facet Highlighting - Vibrant Lime Green for top highlights */}
        <linearGradient id="facetHighlight" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#B2FFB2" />
          <stop offset="100%" stopColor="#66FF66" />
        </linearGradient>

        {/* Facet Vibrant - Bright Emerald for mid-highlights */}
        <linearGradient id="facetVibrant" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#66BB6A" />
          <stop offset="100%" stopColor="#43A047" />
        </linearGradient>
        
        {/* Facet Mid-tone - Richer, saturated Emerald Green */}
        <linearGradient id="facetMedium" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#4CAF50" />
          <stop offset="100%" stopColor="#2E7D32" />
        </linearGradient>

        {/* Facet Soft Medium - For smoother transitions */}
        <linearGradient id="facetSoftMedium" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#81C784" />
          <stop offset="100%" stopColor="#66BB6A" />
        </linearGradient>
        
        {/* Facet Deep Shadow - High contrast Deep Forest */}
        <linearGradient id="facetDeep" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#1B5E20" />
          <stop offset="100%" stopColor="#0A310D" />
        </linearGradient>

        <filter id="crystalShadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="2" stdDeviation="1.5" floodOpacity="0.4" floodColor="#000" />
        </filter>
      </defs>

      {/* Main Structural Group */}
      <g>
        {/* RIGHT WING */}
        <motion.g
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          {/* Back/Outer Shadow Facet - Using gradient for depth */}
          <path d="M50 95L85 45L80 25L50 65V95Z" fill="url(#facetDeep)" stroke="rgba(255,255,255,0.1)" strokeWidth="0.5" />
          
          {/* Main Front Body */}
          <path d="M50 95L75 60L80 25L60 45L50 95Z" fill="url(#facetMedium)" stroke="rgba(255,255,255,0.15)" strokeWidth="0.5" />
          
          {/* Interior Highlight Facet - Using Vibrant Gradient */}
          <path d="M50 95L50 65L60 45L50 95Z" fill="url(#facetVibrant)" stroke="rgba(255,255,255,0.15)" strokeWidth="0.5" />
          
          {/* Top Sharp Tip Highlight */}
          <path d="M80 25L60 45L75 60L80 25Z" fill="url(#facetHighlight)" stroke="white" strokeWidth="0.5" strokeOpacity="0.5" />
          
          {/* Mid-facet Transition - Adding detail */}
          <path d="M75 60L60 45L50 65L75 60Z" fill="url(#facetSoftMedium)" opacity="0.4" />
          
          {/* Super Sharp Edge Sheen */}
          <path d="M80 25L60 45" stroke="white" strokeWidth="0.5" opacity="0.4" strokeLinecap="round" />
          <path d="M60 45L50 95" stroke="white" strokeWidth="0.3" opacity="0.2" strokeLinecap="round" />
        </motion.g>

        {/* LEFT WING */}
        <motion.g
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          {/* Back/Outer Shadow Facet - Using gradient for depth */}
          <path d="M50 95L15 45L20 25L50 65V95Z" fill="url(#facetDeep)" stroke="rgba(255,255,255,0.1)" strokeWidth="0.5" />

          {/* Main Front Body */}
          <path d="M50 95L25 60L20 25L40 45L50 95Z" fill="url(#facetMedium)" stroke="rgba(255,255,255,0.15)" strokeWidth="0.5" />
          
          {/* Interior Highlight Facet - Using Vibrant Gradient */}
          <path d="M50 95L50 65L40 45L50 95Z" fill="url(#facetVibrant)" stroke="rgba(255,255,255,0.15)" strokeWidth="0.5" />
          
          {/* Top Sharp Tip Highlight */}
          <path d="M20 25L40 45L25 60L20 25Z" fill="url(#facetHighlight)" stroke="white" strokeWidth="0.5" strokeOpacity="0.5" />

          {/* Mid-facet Transition - Adding detail */}
          <path d="M25 60L40 45L50 65L25 60Z" fill="url(#facetSoftMedium)" opacity="0.4" />

          {/* Super Sharp Edge Sheen */}
          <path d="M20 25L40 45" stroke="white" strokeWidth="0.5" opacity="0.4" strokeLinecap="round" />
          <path d="M40 45L50 95" stroke="white" strokeWidth="0.3" opacity="0.2" strokeLinecap="round" />
        </motion.g>

        {/* The Sharp Vertex Pivot (The very bottom pinch point) */}
        <motion.path
          d="M48 92L50 95L52 92L50 90L48 92Z"
          fill="#C5E8B0"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.6 }}
        />
      </g>

      {/* Shine/Sparkle Detail at the top tips - Standardized */}
      <motion.circle
        cx="20" cy="25" r="0.8" fill="white"
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 0.9, 0], scale: [0.8, 1.2, 0.8] }}
        transition={{ duration: 4, repeat: Infinity, delay: 1 }}
      />
      <motion.circle
        cx="80" cy="25" r="0.8" fill="white"
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 0.9, 0], scale: [0.8, 1.2, 0.8] }}
        transition={{ duration: 4, repeat: Infinity, delay: 2 }}
      />

      {/* Glossy Diagonal Shine - Liquid Glass Feel */}
      <motion.path
        d="M20 30L80 70"
        stroke="white"
        strokeWidth="12"
        opacity="0.015"
        filter="blur(10px)"
        initial={{ x: -100 }}
        animate={{ x: 100 }}
        transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
      />
    </motion.svg>
  );
};

export default Logo;
