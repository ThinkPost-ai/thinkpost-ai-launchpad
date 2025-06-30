
import React from 'react';

interface TikTokIconProps {
  className?: string;
  size?: number;
}

const TikTokIcon: React.FC<TikTokIconProps> = ({ className, size = 24 }) => {
  return (
    <img 
      src="/lovable-uploads/2724a728-8b48-4765-94bc-5dadc1f3c7bf.png"
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
