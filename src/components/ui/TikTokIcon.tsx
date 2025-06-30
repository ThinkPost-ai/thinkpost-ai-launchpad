import React from 'react';
import tikTokLogo from '@/assets/tiktok-logo.jpg';

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
      className={`rounded-full ${className}`}
      style={{ 
        objectFit: 'cover',
        aspectRatio: '1/1'
      }}
    />
  );
};

export default TikTokIcon; 