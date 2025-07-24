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
          gender: string | null
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
          gender?: string | null
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
          gender?: string | null
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
          error: string | null
          id: string
          image_path: string | null
          is_favorite: boolean
          objective: string | null
          preview: string | null
          sharing: Json | null
          sound_id: string | null
          status: string | null
          story_analysis: Json | null
          summary: string | null
          title: string
          updatedat: string
        }
        Insert: {
          authorid: string
          childrenids?: string[] | null
          childrennames?: string[] | null
          content?: string | null
          createdat?: string
          error?: string | null
          id?: string
          image_path?: string | null
          is_favorite?: boolean
          objective?: string | null
          preview?: string | null
          sharing?: Json | null
          sound_id?: string | null
          status?: string | null
          story_analysis?: Json | null
          summary?: string | null
          title: string
          updatedat?: string
        }
        Update: {
          authorid?: string
          childrenids?: string[] | null
          childrennames?: string[] | null
          content?: string | null
          createdat?: string
          error?: string | null
          id?: string
          image_path?: string | null
          is_favorite?: boolean
          objective?: string | null
          preview?: string | null
          sharing?: Json | null
          sound_id?: string | null
          status?: string | null
          story_analysis?: Json | null
          summary?: string | null
          title?: string
          updatedat?: string
        }
        Relationships: [
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
      [_ in never]: never
    }
    Functions: {
      delete_user: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
