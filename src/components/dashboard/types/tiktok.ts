
export interface TikTokConnection {
  id: string;
  tiktok_user_id: string;
  tiktok_username: string;
  created_at: string;
  scope?: string;
  token_expires_at?: string;
}
