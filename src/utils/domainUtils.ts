
/**
 * Utility functions for domain detection and URL construction
 */

export const getCurrentDomain = (): string => {
  return window.location.origin;
};

export const isLovablePreview = (): boolean => {
  return window.location.hostname.includes('lovable.app');
};

export const isProduction = (): boolean => {
  return window.location.hostname === 'thinkpost.co';
};

export const getInstagramRedirectUri = (): string => {
  const currentDomain = getCurrentDomain();
  return `${currentDomain}/instagram-callback`;
};

export const constructInstagramOAuthUrl = (): string => {
  const clientId = "1092698762721463";
  const redirectUri = encodeURIComponent(getInstagramRedirectUri());
  const scope = encodeURIComponent("instagram_business_basic,instagram_business_manage_messages,instagram_business_manage_comments,instagram_business_content_publish,instagram_business_manage_insights");
  
  return `https://www.instagram.com/oauth/authorize?force_reauth=true&client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=${scope}`;
};
