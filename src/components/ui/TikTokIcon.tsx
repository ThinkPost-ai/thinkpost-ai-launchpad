import React from 'react';
import tikTokLogo from '@/assets/tiktok-logo.png';

interface TikTokIconProps {
  className?: string;
  size?: number;
}

const TikTokIcon: React.FC<TikTokIconProps> = ({ className, size = 24 }) => {
  return (
    <img 
      src={tikTokLogo}
      alt="TikTok"
      width={size} 
      height={size} 
      className={`${className}`}
      style={{ 
        objectFit: 'contain',
        aspectRatio: '1/1'
      }}
    />
  );
};

export default TikTokIcon; 