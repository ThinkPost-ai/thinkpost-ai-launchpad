import React from 'react';

interface TikTokIconProps {
  className?: string;
  size?: number;
}

const TikTokIcon: React.FC<TikTokIconProps> = ({ className, size = 24 }) => {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 100 100" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Black circular background */}
      <circle cx="50" cy="50" r="50" fill="#000000"/>
      
      {/* Main white shape - the characteristic TikTok "d" */}
      <path 
        d="M35 25 L35 65 C35 72 40 77 47 77 L53 77 C60 77 65 72 65 65 L65 55 C65 48 60 43 53 43 L47 43 C44 43 42 41 42 38 L42 25 L35 25 Z" 
        fill="#FFFFFF"
      />
      
      {/* Teal accent - left part */}
      <path 
        d="M32 25 L32 65 C32 72.5 37.5 78 45 78 L50 78 C57.5 78 63 72.5 63 65 L63 55 C63 47.5 57.5 42 50 42 L45 42 C42.5 42 40.5 40 40.5 37.5 L40.5 25 L32 25 Z" 
        fill="#25F4EE"
        opacity="0.8"
      />
      
      {/* Pink accent - right part */}
      <path 
        d="M38 25 L38 65 C38 72.5 43.5 78 51 78 L56 78 C63.5 78 69 72.5 69 65 L69 55 C69 47.5 63.5 42 56 42 L51 42 C48.5 42 46.5 40 46.5 37.5 L46.5 25 L38 25 Z" 
        fill="#FE2C55"
        opacity="0.8"
      />
    </svg>
  );
};

export default TikTokIcon; 