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
      stories: {
        Row: {
          authorid: string
          childrenids: string[] | null
          childrennames: string[] | null
          content: string | null
          createdat: string
          error: string | null
          id: string
          objective: string | null
          preview: string | null
          sharing: Json | null
          status: string | null
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
          objective?: string | null
          preview?: string | null
          sharing?: Json | null
          status?: string | null
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
          objective?: string | null
          preview?: string | null
          sharing?: Json | null
          status?: string | null
          summary?: string | null
          title?: string
          updatedat?: string
        }
        Relationships: []
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
          created_at: string
          email: string
          email_notifications: boolean | null
          firstname: string | null
          id: string
          inapp_notifications: boolean | null
          language: string | null
          lastname: string | null
          reading_speed: number | null
          story_notifications: boolean | null
          system_notifications: boolean | null
          timezone: string | null
        }
        Insert: {
          auto_scroll_enabled?: boolean | null
          created_at?: string
          email: string
          email_notifications?: boolean | null
          firstname?: string | null
          id: string
          inapp_notifications?: boolean | null
          language?: string | null
          lastname?: string | null
          reading_speed?: number | null
          story_notifications?: boolean | null
          system_notifications?: boolean | null
          timezone?: string | null
        }
        Update: {
          auto_scroll_enabled?: boolean | null
          created_at?: string
          email?: string
          email_notifications?: boolean | null
          firstname?: string | null
          id?: string
          inapp_notifications?: boolean | null
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
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
