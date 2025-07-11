export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      cars: {
        Row: {
          brand: string
          color: string | null
          condition: string | null
          created_at: string | null
          description: string | null
          drivetrain: string | null
          engine_size: string | null
          fuel_type: string
          id: string
          image_url: string | null
          is_featured: boolean | null
          is_sold: boolean | null
          mileage: number | null
          model: string
          price: number
          showroom_id: string | null
          transmission: string
          updated_at: string | null
          views: number | null
          year: number
        }
        Insert: {
          brand: string
          color?: string | null
          condition?: string | null
          created_at?: string | null
          description?: string | null
          drivetrain?: string | null
          engine_size?: string | null
          fuel_type: string
          id?: string
          image_url?: string | null
          is_featured?: boolean | null
          is_sold?: boolean | null
          mileage?: number | null
          model: string
          price: number
          showroom_id?: string | null
          transmission: string
          updated_at?: string | null
          views?: number | null
          year: number
        }
        Update: {
          brand?: string
          color?: string | null
          condition?: string | null
          created_at?: string | null
          description?: string | null
          drivetrain?: string | null
          engine_size?: string | null
          fuel_type?: string
          id?: string
          image_url?: string | null
          is_featured?: boolean | null
          is_sold?: boolean | null
          mileage?: number | null
          model?: string
          price?: number
          showroom_id?: string | null
          transmission?: string
          updated_at?: string | null
          views?: number | null
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "cars_showroom_id_fkey"
            columns: ["showroom_id"]
            isOneToOne: false
            referencedRelation: "showrooms"
            referencedColumns: ["id"]
          },
        ]
      }
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
          is_new: boolean | null
          name: string
          price: number | null
          tiktok_allow_comments: boolean | null
          tiktok_branded_content: boolean | null
          tiktok_commercial_content: boolean | null
          tiktok_enabled: boolean | null
          tiktok_privacy_level: string | null
          tiktok_your_brand: boolean | null
          updated_at: string
          user_id: string
        }
        Insert: {
          caption?: string | null
          created_at?: string
          description?: string | null
          id?: string
          image_path?: string | null
          is_new?: boolean | null
          name: string
          price?: number | null
          tiktok_allow_comments?: boolean | null
          tiktok_branded_content?: boolean | null
          tiktok_commercial_content?: boolean | null
          tiktok_enabled?: boolean | null
          tiktok_privacy_level?: string | null
          tiktok_your_brand?: boolean | null
          updated_at?: string
          user_id: string
        }
        Update: {
          caption?: string | null
          created_at?: string
          description?: string | null
          id?: string
          image_path?: string | null
          is_new?: boolean | null
          name?: string
          price?: number | null
          tiktok_allow_comments?: boolean | null
          tiktok_branded_content?: boolean | null
          tiktok_commercial_content?: boolean | null
          tiktok_enabled?: boolean | null
          tiktok_privacy_level?: string | null
          tiktok_your_brand?: boolean | null
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
          tiktok_refresh_token: string | null
          tiktok_token_expires_at: string | null
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
          tiktok_refresh_token?: string | null
          tiktok_token_expires_at?: string | null
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
          tiktok_refresh_token?: string | null
          tiktok_token_expires_at?: string | null
          tiktok_username?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      restaurants: {
        Row: {
          additional_locations: string[] | null
          brand_type: string | null
          category: Database["public"]["Enums"]["restaurant_category"]
          created_at: string | null
          custom_brand_type: string | null
          custom_category: string | null
          custom_location: string | null
          id: string
          location: string
          name: string
          owner_id: string
          updated_at: string | null
          vision: string | null
        }
        Insert: {
          additional_locations?: string[] | null
          brand_type?: string | null
          category: Database["public"]["Enums"]["restaurant_category"]
          created_at?: string | null
          custom_brand_type?: string | null
          custom_category?: string | null
          custom_location?: string | null
          id?: string
          location: string
          name: string
          owner_id: string
          updated_at?: string | null
          vision?: string | null
        }
        Update: {
          additional_locations?: string[] | null
          brand_type?: string | null
          category?: Database["public"]["Enums"]["restaurant_category"]
          created_at?: string | null
          custom_brand_type?: string | null
          custom_category?: string | null
          custom_location?: string | null
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
          image_url: string | null
          media_type: string | null
          platform: string
          processing_status: string | null
          product_id: string | null
          proxy_image_url: string | null
          proxy_video_url: string | null
          reviewed_and_approved: boolean | null
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
          image_url?: string | null
          media_type?: string | null
          platform: string
          processing_status?: string | null
          product_id?: string | null
          proxy_image_url?: string | null
          proxy_video_url?: string | null
          reviewed_and_approved?: boolean | null
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
          image_url?: string | null
          media_type?: string | null
          platform?: string
          processing_status?: string | null
          product_id?: string | null
          proxy_image_url?: string | null
          proxy_video_url?: string | null
          reviewed_and_approved?: boolean | null
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
      showrooms: {
        Row: {
          created_at: string | null
          description: string | null
          email: string | null
          id: string
          image_url: string | null
          is_active: boolean | null
          location: string
          name: string
          owner_id: string | null
          phone: string | null
          rating: number | null
          total_reviews: number | null
          updated_at: string | null
          website: string | null
          whatsapp_number: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          email?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          location: string
          name: string
          owner_id?: string | null
          phone?: string | null
          rating?: number | null
          total_reviews?: number | null
          updated_at?: string | null
          website?: string | null
          whatsapp_number?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          email?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          location?: string
          name?: string
          owner_id?: string | null
          phone?: string | null
          rating?: number | null
          total_reviews?: number | null
          updated_at?: string | null
          website?: string | null
          whatsapp_number?: string | null
        }
        Relationships: []
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
      user_favorites: {
        Row: {
          created_at: string
          id: string
          item_id: string
          item_type: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          item_id: string
          item_type?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          item_id?: string
          item_type?: string | null
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      auto_post_due_scheduled_posts: {
        Args: Record<PropertyKey, never>
        Returns: {
          processed_count: number
          success_count: number
          failed_count: number
        }[]
      }
      auto_post_scheduler: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      auto_process_scheduled_posts: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      bytea_to_text: {
        Args: { data: string }
        Returns: string
      }
      cleanup_expired_oauth_states: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      decrement_caption_credits: {
        Args: { user_id: string }
        Returns: number
      }
      delete_user_and_data: {
        Args: { user_id_to_delete: string }
        Returns: undefined
      }
      http: {
        Args: { request: Database["public"]["CompositeTypes"]["http_request"] }
        Returns: Database["public"]["CompositeTypes"]["http_response"]
      }
      http_delete: {
        Args:
          | { uri: string }
          | { uri: string; content: string; content_type: string }
        Returns: Database["public"]["CompositeTypes"]["http_response"]
      }
      http_get: {
        Args: { uri: string } | { uri: string; data: Json }
        Returns: Database["public"]["CompositeTypes"]["http_response"]
      }
      http_head: {
        Args: { uri: string }
        Returns: Database["public"]["CompositeTypes"]["http_response"]
      }
      http_header: {
        Args: { field: string; value: string }
        Returns: Database["public"]["CompositeTypes"]["http_header"]
      }
      http_list_curlopt: {
        Args: Record<PropertyKey, never>
        Returns: {
          curlopt: string
          value: string
        }[]
      }
      http_patch: {
        Args: { uri: string; content: string; content_type: string }
        Returns: Database["public"]["CompositeTypes"]["http_response"]
      }
      http_post: {
        Args:
          | { uri: string; content: string; content_type: string }
          | { uri: string; data: Json }
        Returns: Database["public"]["CompositeTypes"]["http_response"]
      }
      http_put: {
        Args: { uri: string; content: string; content_type: string }
        Returns: Database["public"]["CompositeTypes"]["http_response"]
      }
      http_reset_curlopt: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      http_set_curlopt: {
        Args: { curlopt: string; value: string }
        Returns: boolean
      }
      process_due_posts: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      process_due_scheduled_posts: {
        Args: Record<PropertyKey, never>
        Returns: {
          processed_count: number
          success_count: number
          failed_count: number
        }[]
      }
      text_to_bytea: {
        Args: { data: string }
        Returns: string
      }
      urlencode: {
        Args: { data: Json } | { string: string } | { string: string }
        Returns: string
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
      http_header: {
        field: string | null
        value: string | null
      }
      http_request: {
        method: unknown | null
        uri: string | null
        headers: Database["public"]["CompositeTypes"]["http_header"][] | null
        content_type: string | null
        content: string | null
      }
      http_response: {
        status: number | null
        content_type: string | null
        headers: Database["public"]["CompositeTypes"]["http_header"][] | null
        content: string | null
      }
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
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
