
import React from 'react';

interface TikTokIconProps {
  className?: string;
  size?: number;
}

const TikTokIcon: React.FC<TikTokIconProps> = ({ className, size = 24 }) => {
  return (
    <img 
      src="/lovable-uploads/5cde96f2-5708-444a-a83a-38ce5f3e75be.png"
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
