export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      images: {
        Row: {
          caption: string | null
          created_at: string | null
          file_path: string
          id: string
          original_filename: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          caption?: string | null
          created_at?: string | null
          file_path: string
          id?: string
          original_filename: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          caption?: string | null
          created_at?: string | null
          file_path?: string
          id?: string
          original_filename?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      instagram_oauth_states: {
        Row: {
          created_at: string | null
          expires_at: string | null
          id: string
          state_value: string
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          expires_at?: string | null
          id?: string
          state_value: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          expires_at?: string | null
          id?: string
          state_value?: string
          user_id?: string | null
        }
        Relationships: []
      }
      products: {
        Row: {
          caption: string | null
          created_at: string
          description: string | null
          id: string
          image_path: string | null
          name: string
          price: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          caption?: string | null
          created_at?: string
          description?: string | null
          id?: string
          image_path?: string | null
          name: string
          price?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          caption?: string | null
          created_at?: string
          description?: string | null
          id?: string
          image_path?: string | null
          name?: string
          price?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          auth_provider: string | null
          avatar_url: string | null
          caption_credits: number
          display_name: string | null
          facebook_access_token: string | null
          facebook_app_scoped_user_id: string | null
          facebook_page_id: string | null
          full_name: string | null
          id: string
          instagram_access_token: string | null
          instagram_avatar_url: string | null
          instagram_connected: boolean | null
          instagram_development_mode: boolean | null
          instagram_test_mode: boolean | null
          instagram_user_id: string | null
          instagram_username: string | null
          tiktok_access_token: string | null
          tiktok_avatar_url: string | null
          tiktok_connected: boolean | null
          tiktok_open_id: string | null
          tiktok_username: string | null
          updated_at: string
        }
        Insert: {
          auth_provider?: string | null
          avatar_url?: string | null
          caption_credits?: number
          display_name?: string | null
          facebook_access_token?: string | null
          facebook_app_scoped_user_id?: string | null
          facebook_page_id?: string | null
          full_name?: string | null
          id: string
          instagram_access_token?: string | null
          instagram_avatar_url?: string | null
          instagram_connected?: boolean | null
          instagram_development_mode?: boolean | null
          instagram_test_mode?: boolean | null
          instagram_user_id?: string | null
          instagram_username?: string | null
          tiktok_access_token?: string | null
          tiktok_avatar_url?: string | null
          tiktok_connected?: boolean | null
          tiktok_open_id?: string | null
          tiktok_username?: string | null
          updated_at?: string
        }
        Update: {
          auth_provider?: string | null
          avatar_url?: string | null
          caption_credits?: number
          display_name?: string | null
          facebook_access_token?: string | null
          facebook_app_scoped_user_id?: string | null
          facebook_page_id?: string | null
          full_name?: string | null
          id?: string
          instagram_access_token?: string | null
          instagram_avatar_url?: string | null
          instagram_connected?: boolean | null
          instagram_development_mode?: boolean | null
          instagram_test_mode?: boolean | null
          instagram_user_id?: string | null
          instagram_username?: string | null
          tiktok_access_token?: string | null
          tiktok_avatar_url?: string | null
          tiktok_connected?: boolean | null
          tiktok_open_id?: string | null
          tiktok_username?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      restaurants: {
        Row: {
          category: Database["public"]["Enums"]["restaurant_category"]
          created_at: string | null
          id: string
          location: string
          name: string
          owner_id: string
          updated_at: string | null
          vision: string | null
        }
        Insert: {
          category: Database["public"]["Enums"]["restaurant_category"]
          created_at?: string | null
          id?: string
          location: string
          name: string
          owner_id: string
          updated_at?: string | null
          vision?: string | null
        }
        Update: {
          category?: Database["public"]["Enums"]["restaurant_category"]
          created_at?: string | null
          id?: string
          location?: string
          name?: string
          owner_id?: string
          updated_at?: string | null
          vision?: string | null
        }
        Relationships: []
      }
      scheduled_posts: {
        Row: {
          caption: string
          created_at: string
          id: string
          image_id: string | null
          platform: string
          processing_status: string | null
          product_id: string | null
          proxy_video_url: string | null
          scheduled_date: string
          status: string
          tiktok_publish_id: string | null
          updated_at: string
          user_id: string
          video_path: string | null
          video_url: string | null
        }
        Insert: {
          caption: string
          created_at?: string
          id?: string
          image_id?: string | null
          platform: string
          processing_status?: string | null
          product_id?: string | null
          proxy_video_url?: string | null
          scheduled_date: string
          status?: string
          tiktok_publish_id?: string | null
          updated_at?: string
          user_id: string
          video_path?: string | null
          video_url?: string | null
        }
        Update: {
          caption?: string
          created_at?: string
          id?: string
          image_id?: string | null
          platform?: string
          processing_status?: string | null
          product_id?: string | null
          proxy_video_url?: string | null
          scheduled_date?: string
          status?: string
          tiktok_publish_id?: string | null
          updated_at?: string
          user_id?: string
          video_path?: string | null
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "scheduled_posts_image_id_fkey"
            columns: ["image_id"]
            isOneToOne: false
            referencedRelation: "images"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scheduled_posts_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      tiktok_oauth_states: {
        Row: {
          created_at: string
          expires_at: string
          id: string
          state_value: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          expires_at?: string
          id?: string
          state_value: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          expires_at?: string
          id?: string
          state_value?: string
          user_id?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      cleanup_expired_oauth_states: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      decrement_caption_credits: {
        Args: { user_id: string }
        Returns: number
      }
    }
    Enums: {
      restaurant_category:
        | "fast_food"
        | "casual_dining"
        | "fine_dining"
        | "cafe"
        | "bakery"
        | "pizza"
        | "seafood"
        | "middle_eastern"
        | "asian"
        | "italian"
        | "american"
        | "mexican"
        | "indian"
        | "other"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      restaurant_category: [
        "fast_food",
        "casual_dining",
        "fine_dining",
        "cafe",
        "bakery",
        "pizza",
        "seafood",
        "middle_eastern",
        "asian",
        "italian",
        "american",
        "mexican",
        "indian",
        "other",
      ],
    },
  },
} as const 