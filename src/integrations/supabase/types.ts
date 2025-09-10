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
          ip_address: unknown | null
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
          ip_address?: unknown | null
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
          ip_address?: unknown | null
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
          ip_address: unknown | null
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
          ip_address?: unknown | null
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
          ip_address?: unknown | null
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
          ip_address: unknown | null
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
          ip_address?: unknown | null
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
          ip_address?: unknown | null
          is_active?: boolean
          last_activity?: string
          session_token?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
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
      cleanup_expired_sessions: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      delete_user: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      generate_deduplication_key: {
        Args: {
          p_authorid: string
          p_children_names?: string[]
          p_objective?: string
          p_title: string
        }
        Returns: string
      }
      get_next_tome_number: {
        Args: { p_series_id: string }
        Returns: number
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
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
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
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
    },
  },
} as const
