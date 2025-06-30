
import React from 'react';

interface TikTokIconProps {
  className?: string;
  size?: number;
}

const TikTokIcon: React.FC<TikTokIconProps> = ({ className, size = 24 }) => {
  return (
    <img 
      src="/lovable-uploads/11457a01-faaf-4382-866d-f4c305d39975.png"
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
