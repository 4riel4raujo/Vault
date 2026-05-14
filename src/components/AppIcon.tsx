import React from 'react';
import { motion } from 'motion/react';
import Logo from './Logo';
import { usePreferences } from '../contexts/PreferencesContext';

interface AppIconProps {
  size?: number;
  className?: string;
  animate?: boolean;
}

export default function AppIcon({ size = 52, className = '', animate = false }: AppIconProps) {
  const { isDark } = usePreferences();
  
  // Scale factor based on base size 52
  const scale = size / 52;
  const borderRadius = 14 * scale;
  const logoSize = 42 * scale;

  const iconContainer = (
    <div 
      style={{ 
        width: `${size}px`, 
        height: `${size}px`, 
        background: isDark 
          ? 'linear-gradient(135deg, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.02) 100%)' 
          : 'linear-gradient(135deg, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0.04) 100%)',
        backdropFilter: 'blur(24px) saturate(200%)',
        WebkitBackdropFilter: 'blur(24px) saturate(200%)',
        borderRadius: `${borderRadius}px`,
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        boxShadow: isDark
          ? `0 ${8 * scale}px ${16 * scale}px rgba(0,0,0,0.4), inset 0 0 0 1px rgba(255,255,255,0.1), inset 0 1px ${3 * scale}px rgba(255,255,255,0.1)`
          : `0 ${8 * scale}px ${16 * scale}px rgba(0,0,0,0.25), inset 0 0 0 1px rgba(255,255,255,0.2), inset 0 ${2 * scale}px ${5 * scale}px rgba(255,255,255,0.3)`,
        position: 'relative',
        overflow: 'hidden',
        border: isDark ? '1px solid rgba(255,255,255,0.05)' : '1px solid rgba(255,255,255,0.12)',
        flexShrink: 0
      }}
    >
      {/* Glossy Top Sheen (Liquid Effect) */}
      <div style={{
        position: 'absolute',
        top: '-35%',
        left: '-20%',
        width: '140%',
        height: '75%',
        background: 'radial-gradient(ellipse at 50% 0%, rgba(255,255,255,0.45) 0%, rgba(255,255,255,0) 80%)',
        borderRadius: '50%',
        transform: 'rotate(-2deg)',
        pointerEvents: 'none',
        opacity: isDark ? 0.2 : 0.4,
        zIndex: 3
      }} />

      {/* Reflection Highlight Line */}
      <div style={{
        position: 'absolute',
        top: '1px',
        left: '50%',
        transform: 'translateX(-50%)',
        width: '80%',
        height: '1px',
        background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)',
        zIndex: 4
      }} />

      {/* Bottom Internal Glow */}
      <div style={{
        position: 'absolute',
        bottom: `${2 * scale}px`,
        left: `${2 * scale}px`,
        right: `${2 * scale}px`,
        height: '40%',
        background: 'linear-gradient(0deg, #4CAF50 0%, transparent 100%)',
        opacity: isDark ? 0.1 : 0.2,
        filter: `blur(${8 * scale}px)`,
        pointerEvents: 'none',
        zIndex: 1,
        borderRadius: `${10 * scale}px`
      }} />

      {/* Inner Border Ring */}
      <div style={{
        position: 'absolute',
        inset: `${2 * scale}px`,
        borderRadius: `${12 * scale}px`,
        border: '1px solid rgba(255,255,255,0.08)',
        background: 'transparent',
        pointerEvents: 'none',
        zIndex: 2
      }} />

      {/* Central Symbol */}
      <Logo size={logoSize} className="relative z-[2]" />
    </div>
  );

  if (animate) {
    return (
      <motion.div
        className={className}
        animate={{ scale: [1, 1.05, 1] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}
      >
        {iconContainer}
      </motion.div>
    );
  }

  return (
    <div className={className} style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      {iconContainer}
    </div>
  );
}
