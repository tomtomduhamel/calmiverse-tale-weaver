export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      audio_files: {
        Row: {
          audio_url: string | null
          created_at: string
          duration: number | null
          file_size: number | null
          id: string
          status: string
          story_id: string | null
          text_content: string
          updated_at: string
          voice_id: string | null
          webhook_id: string | null
        }
        Insert: {
          audio_url?: string | null
          created_at?: string
          duration?: number | null
          file_size?: number | null
          id?: string
          status?: string
          story_id?: string | null
          text_content: string
          updated_at?: string
          voice_id?: string | null
          webhook_id?: string | null
        }
        Update: {
          audio_url?: string | null
          created_at?: string
          duration?: number | null
          file_size?: number | null
          id?: string
          status?: string
          story_id?: string | null
          text_content?: string
          updated_at?: string
          voice_id?: string | null
          webhook_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audio_files_story_id_fkey"
            columns: ["story_id"]
            isOneToOne: false
            referencedRelation: "stories"
            referencedColumns: ["id"]
          },
        ]
      }
      beta_invitations: {
        Row: {
          code: string
          created_at: string
          current_uses: number
          duration_months: number
          expires_at: string | null
          id: string
          is_active: boolean
          max_uses: number | null
          tier: Database["public"]["Enums"]["subscription_tier"]
        }
        Insert: {
          code: string
          created_at?: string
          current_uses?: number
          duration_months?: number
          expires_at?: string | null
          id?: string
          is_active?: boolean
          max_uses?: number | null
          tier?: Database["public"]["Enums"]["subscription_tier"]
        }
        Update: {
          code?: string
          created_at?: string
          current_uses?: number
          duration_months?: number
          expires_at?: string | null
          id?: string
          is_active?: boolean
          max_uses?: number | null
          tier?: Database["public"]["Enums"]["subscription_tier"]
        }
        Relationships: []
      }
      beta_users: {
        Row: {
          email: string
          id: string
          invitation_code: string
          rejection_reason: string | null
          requested_at: string
          status: string
          subscription_expires_at: string | null
          user_id: string
          validated_at: string | null
          validated_by: string | null
        }
        Insert: {
          email: string
          id?: string
          invitation_code: string
          rejection_reason?: string | null
          requested_at?: string
          status?: string
          subscription_expires_at?: string | null
          user_id: string
          validated_at?: string | null
          validated_by?: string | null
        }
        Update: {
          email?: string
          id?: string
          invitation_code?: string
          rejection_reason?: string | null
          requested_at?: string
          status?: string
          subscription_expires_at?: string | null
          user_id?: string
          validated_at?: string | null
          validated_by?: string | null
        }
        Relationships: []
      }
      children: {
        Row: {
          authorid: string
          birthdate: string
          createdat: string
          gender: string
          id: string
          imaginaryworld: string | null
          interests: string[] | null
          name: string
          pet_type: string | null
          pet_type_custom: string | null
          teddydescription: string | null
          teddyname: string | null
          teddyphotos: Json | null
        }
        Insert: {
          authorid: string
          birthdate: string
          createdat?: string
          gender?: string
          id?: string
          imaginaryworld?: string | null
          interests?: string[] | null
          name: string
          pet_type?: string | null
          pet_type_custom?: string | null
          teddydescription?: string | null
          teddyname?: string | null
          teddyphotos?: Json | null
        }
        Update: {
          authorid?: string
          birthdate?: string
          createdat?: string
          gender?: string
          id?: string
          imaginaryworld?: string | null
          interests?: string[] | null
          name?: string
          pet_type?: string | null
          pet_type_custom?: string | null
          teddydescription?: string | null
          teddyname?: string | null
          teddyphotos?: Json | null
        }
        Relationships: []
      }
      prompt_template_versions: {
        Row: {
          changelog: string | null
          content: string
          created_at: string
          created_by: string
          id: string
          template_id: string
          version: number
        }
        Insert: {
          changelog?: string | null
          content: string
          created_at?: string
          created_by: string
          id?: string
          template_id: string
          version: number
        }
        Update: {
          changelog?: string | null
          content?: string
          created_at?: string
          created_by?: string
          id?: string
          template_id?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "prompt_template_versions_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "prompt_templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prompt_template_versions_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "v_active_prompt_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      prompt_templates: {
        Row: {
          active_version_id: string | null
          created_at: string
          created_by: string
          description: string | null
          id: string
          key: string
          title: string
          updated_at: string
        }
        Insert: {
          active_version_id?: string | null
          created_at?: string
          created_by: string
          description?: string | null
          id?: string
          key: string
          title: string
          updated_at?: string
        }
        Update: {
          active_version_id?: string | null
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          key?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      rate_limits: {
        Row: {
          action_type: string | null
          blocked_until: string | null
          created_at: string
          endpoint: string
          id: string
          ip_address: unknown
          request_count: number
          severity: string | null
          user_agent: string | null
          user_id: string | null
          window_start: string
        }
        Insert: {
          action_type?: string | null
          blocked_until?: string | null
          created_at?: string
          endpoint: string
          id?: string
          ip_address?: unknown
          request_count?: number
          severity?: string | null
          user_agent?: string | null
          user_id?: string | null
          window_start?: string
        }
        Update: {
          action_type?: string | null
          blocked_until?: string | null
          created_at?: string
          endpoint?: string
          id?: string
          ip_address?: unknown
          request_count?: number
          severity?: string | null
          user_agent?: string | null
          user_id?: string | null
          window_start?: string
        }
        Relationships: []
      }
      role_modification_cooldown: {
        Row: {
          created_at: string
          id: string
          last_modification: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          last_modification?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          last_modification?: string
          user_id?: string
        }
        Relationships: []
      }
      security_audit_logs: {
        Row: {
          action: string
          created_at: string | null
          id: string
          ip_address: unknown
          metadata: Json | null
          reason: string | null
          resource: string | null
          result: string
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          id?: string
          ip_address?: unknown
          metadata?: Json | null
          reason?: string | null
          resource?: string | null
          result: string
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          id?: string
          ip_address?: unknown
          metadata?: Json | null
          reason?: string | null
          resource?: string | null
          result?: string
          user_id?: string | null
        }
        Relationships: []
      }
      sound_backgrounds: {
        Row: {
          created_at: string
          description: string | null
          duration: number
          file_path: string
          id: string
          objective: string
          title: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          duration: number
          file_path: string
          id?: string
          objective: string
          title: string
        }
        Update: {
          created_at?: string
          description?: string | null
          duration?: number
          file_path?: string
          id?: string
          objective?: string
          title?: string
        }
        Relationships: []
      }
      stories: {
        Row: {
          authorid: string
          childrenids: string[] | null
          childrennames: string[] | null
          content: string | null
          createdat: string
          deduplication_key: string | null
          error: string | null
          id: string
          image_path: string | null
          is_favorite: boolean
          is_series_starter: boolean | null
          next_story_id: string | null
          objective: string | null
          preview: string | null
          previous_story_id: string | null
          series_id: string | null
          sharing: Json | null
          sound_id: string | null
          status: string | null
          story_analysis: Json | null
          summary: string | null
          title: string
          tome_number: number | null
          updatedat: string
        }
        Insert: {
          authorid: string
          childrenids?: string[] | null
          childrennames?: string[] | null
          content?: string | null
          createdat?: string
          deduplication_key?: string | null
          error?: string | null
          id?: string
          image_path?: string | null
          is_favorite?: boolean
          is_series_starter?: boolean | null
          next_story_id?: string | null
          objective?: string | null
          preview?: string | null
          previous_story_id?: string | null
          series_id?: string | null
          sharing?: Json | null
          sound_id?: string | null
          status?: string | null
          story_analysis?: Json | null
          summary?: string | null
          title: string
          tome_number?: number | null
          updatedat?: string
        }
        Update: {
          authorid?: string
          childrenids?: string[] | null
          childrennames?: string[] | null
          content?: string | null
          createdat?: string
          deduplication_key?: string | null
          error?: string | null
          id?: string
          image_path?: string | null
          is_favorite?: boolean
          is_series_starter?: boolean | null
          next_story_id?: string | null
          objective?: string | null
          preview?: string | null
          previous_story_id?: string | null
          series_id?: string | null
          sharing?: Json | null
          sound_id?: string | null
          status?: string | null
          story_analysis?: Json | null
          summary?: string | null
          title?: string
          tome_number?: number | null
          updatedat?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_stories_next_story_id"
            columns: ["next_story_id"]
            isOneToOne: false
            referencedRelation: "stories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_stories_previous_story_id"
            columns: ["previous_story_id"]
            isOneToOne: false
            referencedRelation: "stories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_stories_series_id"
            columns: ["series_id"]
            isOneToOne: false
            referencedRelation: "story_series"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stories_sound_id_fkey"
            columns: ["sound_id"]
            isOneToOne: false
            referencedRelation: "sound_backgrounds"
            referencedColumns: ["id"]
          },
        ]
      }
      story_access_logs: {
        Row: {
          access_data: Json
          created_at: string
          id: string
          story_id: string
        }
        Insert: {
          access_data: Json
          created_at?: string
          id?: string
          story_id: string
        }
        Update: {
          access_data?: Json
          created_at?: string
          id?: string
          story_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "story_access_logs_story_id_fkey"
            columns: ["story_id"]
            isOneToOne: false
            referencedRelation: "stories"
            referencedColumns: ["id"]
          },
        ]
      }
      story_series: {
        Row: {
          author_id: string
          created_at: string
          description: string | null
          id: string
          image_path: string | null
          is_active: boolean
          title: string
          total_tomes: number
          updated_at: string
        }
        Insert: {
          author_id: string
          created_at?: string
          description?: string | null
          id?: string
          image_path?: string | null
          is_active?: boolean
          title: string
          total_tomes?: number
          updated_at?: string
        }
        Update: {
          author_id?: string
          created_at?: string
          description?: string | null
          id?: string
          image_path?: string | null
          is_active?: boolean
          title?: string
          total_tomes?: number
          updated_at?: string
        }
        Relationships: []
      }
      subscription_limits: {
        Row: {
          annual_price_usd: number
          audio_generations_per_month: number
          created_at: string
          has_background_music: boolean
          has_community_access: boolean
          has_priority_access: boolean
          has_story_series: boolean
          id: string
          max_children: number | null
          monthly_price_usd: number
          stories_per_month: number
          tier: Database["public"]["Enums"]["subscription_tier"]
          updated_at: string
        }
        Insert: {
          annual_price_usd: number
          audio_generations_per_month?: number
          created_at?: string
          has_background_music?: boolean
          has_community_access?: boolean
          has_priority_access?: boolean
          has_story_series?: boolean
          id?: string
          max_children?: number | null
          monthly_price_usd: number
          stories_per_month: number
          tier: Database["public"]["Enums"]["subscription_tier"]
          updated_at?: string
        }
        Update: {
          annual_price_usd?: number
          audio_generations_per_month?: number
          created_at?: string
          has_background_music?: boolean
          has_community_access?: boolean
          has_priority_access?: boolean
          has_story_series?: boolean
          id?: string
          max_children?: number | null
          monthly_price_usd?: number
          stories_per_month?: number
          tier?: Database["public"]["Enums"]["subscription_tier"]
          updated_at?: string
        }
        Relationships: []
      }
      user_feedback: {
        Row: {
          created_at: string
          device_info: Json | null
          feedback_text: string | null
          id: string
          page_url: string
          rating: number | null
          user_id: string
        }
        Insert: {
          created_at?: string
          device_info?: Json | null
          feedback_text?: string | null
          id?: string
          page_url: string
          rating?: number | null
          user_id: string
        }
        Update: {
          created_at?: string
          device_info?: Json | null
          feedback_text?: string | null
          id?: string
          page_url?: string
          rating?: number | null
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_sessions: {
        Row: {
          created_at: string
          expires_at: string
          id: string
          ip_address: unknown
          is_active: boolean
          last_activity: string
          session_token: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          expires_at: string
          id?: string
          ip_address?: unknown
          is_active?: boolean
          last_activity?: string
          session_token: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string
          id?: string
          ip_address?: unknown
          is_active?: boolean
          last_activity?: string
          session_token?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_subscriptions: {
        Row: {
          audio_generations_used_this_period: number
          created_at: string
          current_period_end: string
          current_period_start: string
          id: string
          is_annual: boolean
          status: string
          stories_used_this_period: number
          stripe_subscription_id: string | null
          tier: Database["public"]["Enums"]["subscription_tier"]
          updated_at: string
          user_id: string
        }
        Insert: {
          audio_generations_used_this_period?: number
          created_at?: string
          current_period_end?: string
          current_period_start?: string
          id?: string
          is_annual?: boolean
          status?: string
          stories_used_this_period?: number
          stripe_subscription_id?: string | null
          tier?: Database["public"]["Enums"]["subscription_tier"]
          updated_at?: string
          user_id: string
        }
        Update: {
          audio_generations_used_this_period?: number
          created_at?: string
          current_period_end?: string
          current_period_start?: string
          id?: string
          is_annual?: boolean
          status?: string
          stories_used_this_period?: number
          stripe_subscription_id?: string | null
          tier?: Database["public"]["Enums"]["subscription_tier"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          auto_scroll_enabled: boolean | null
          background_music_enabled: boolean | null
          created_at: string
          email: string
          email_notifications: boolean | null
          firstname: string | null
          id: string
          inapp_notifications: boolean | null
          kindle_email: string | null
          language: string | null
          lastname: string | null
          reading_speed: number | null
          story_notifications: boolean | null
          system_notifications: boolean | null
          timezone: string | null
        }
        Insert: {
          auto_scroll_enabled?: boolean | null
          background_music_enabled?: boolean | null
          created_at?: string
          email: string
          email_notifications?: boolean | null
          firstname?: string | null
          id: string
          inapp_notifications?: boolean | null
          kindle_email?: string | null
          language?: string | null
          lastname?: string | null
          reading_speed?: number | null
          story_notifications?: boolean | null
          system_notifications?: boolean | null
          timezone?: string | null
        }
        Update: {
          auto_scroll_enabled?: boolean | null
          background_music_enabled?: boolean | null
          created_at?: string
          email?: string
          email_notifications?: boolean | null
          firstname?: string | null
          id?: string
          inapp_notifications?: boolean | null
          kindle_email?: string | null
          language?: string | null
          lastname?: string | null
          reading_speed?: number | null
          story_notifications?: boolean | null
          system_notifications?: boolean | null
          timezone?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      v_active_prompt_templates: {
        Row: {
          active_content: string | null
          active_version: number | null
          active_version_id: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string | null
          key: string | null
          title: string | null
          updated_at: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      check_enhanced_rate_limit: {
        Args: {
          p_action_type?: string
          p_ip_address?: unknown
          p_max_requests?: number
          p_severity?: string
          p_user_id?: string
          p_window_minutes?: number
        }
        Returns: Json
      }
      check_rate_limit: {
        Args: {
          p_endpoint?: string
          p_ip_address?: unknown
          p_max_requests?: number
          p_user_id?: string
          p_window_minutes?: number
        }
        Returns: boolean
      }
      check_story_duplicate: {
        Args: {
          p_authorid: string
          p_children_names?: string[]
          p_objective?: string
          p_title: string
        }
        Returns: boolean
      }
      check_user_quota: {
        Args: { p_quota_type: string; p_user_id: string }
        Returns: Json
      }
      cleanup_expired_sessions: { Args: never; Returns: undefined }
      cleanup_old_storage_files: { Args: never; Returns: undefined }
      delete_user: { Args: never; Returns: undefined }
      generate_deduplication_key: {
        Args: {
          p_authorid: string
          p_children_names?: string[]
          p_objective?: string
          p_title: string
        }
        Returns: string
      }
      get_next_tome_number: { Args: { p_series_id: string }; Returns: number }
      get_pending_beta_users: {
        Args: never
        Returns: {
          email: string
          id: string
          invitation_code: string
          requested_at: string
          user_id: string
        }[]
      }
      get_signed_url: {
        Args: { bucket_name: string; expires_in?: number; file_path: string }
        Returns: string
      }
      get_stories_count_by_children: {
        Args: { p_user_id: string }
        Returns: {
          child_id: string
          story_count: number
        }[]
      }
      has_feature_access: {
        Args: { p_feature: string; p_user_id: string }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      increment_usage: {
        Args: { p_usage_type: string; p_user_id: string }
        Returns: boolean
      }
      is_admin: { Args: never; Returns: boolean }
      log_security_event: {
        Args: {
          p_action?: string
          p_ip_address?: unknown
          p_metadata?: Json
          p_reason?: string
          p_resource?: string
          p_result?: string
          p_user_id?: string
        }
        Returns: undefined
      }
      next_template_version: {
        Args: { p_template_id: string }
        Returns: number
      }
      register_beta_request: {
        Args: { p_code: string; p_email: string; p_user_id: string }
        Returns: Json
      }
      reject_beta_user: {
        Args: { p_beta_user_id: string; p_reason?: string }
        Returns: Json
      }
      reset_monthly_quotas: { Args: never; Returns: undefined }
      validate_beta_user: { Args: { p_beta_user_id: string }; Returns: Json }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
      subscription_tier: "calmini" | "calmidium" | "calmix" | "calmixxl"
    }
    CompositeTypes: {
      [_ in never]: never
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
      app_role: ["admin", "moderator", "user"],
      subscription_tier: ["calmini", "calmidium", "calmix", "calmixxl"],
    },
  },
} as const
