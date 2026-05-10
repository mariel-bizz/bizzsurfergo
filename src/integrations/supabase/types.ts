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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      admin_alerts: {
        Row: {
          acknowledged_at: string | null
          acknowledged_by: string | null
          created_at: string
          id: string
          kind: string
          message: string
          metadata: Json
          severity: string
          title: string
        }
        Insert: {
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          created_at?: string
          id?: string
          kind: string
          message: string
          metadata?: Json
          severity?: string
          title: string
        }
        Update: {
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          created_at?: string
          id?: string
          kind?: string
          message?: string
          metadata?: Json
          severity?: string
          title?: string
        }
        Relationships: []
      }
      event_reminder_log: {
        Row: {
          id: string
          reminder_kind: string
          rsvp_id: string
          sent_at: string
        }
        Insert: {
          id?: string
          reminder_kind: string
          rsvp_id: string
          sent_at?: string
        }
        Update: {
          id?: string
          reminder_kind?: string
          rsvp_id?: string
          sent_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_reminder_log_rsvp_id_fkey"
            columns: ["rsvp_id"]
            isOneToOne: false
            referencedRelation: "event_rsvps"
            referencedColumns: ["id"]
          },
        ]
      }
      event_rsvps: {
        Row: {
          created_at: string
          email: string
          event_href: string | null
          event_id: number
          event_location: string | null
          event_starts_at: string
          event_title: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email: string
          event_href?: string | null
          event_id: number
          event_location?: string | null
          event_starts_at: string
          event_title: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string
          event_href?: string | null
          event_id?: number
          event_location?: string | null
          event_starts_at?: string
          event_title?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      insights_comments: {
        Row: {
          article_slug: string
          body: string
          company: string | null
          created_at: string
          id: string
          moderation_reason: string | null
          name: string
          position: string | null
          status: string
          user_id: string
        }
        Insert: {
          article_slug: string
          body: string
          company?: string | null
          created_at?: string
          id?: string
          moderation_reason?: string | null
          name: string
          position?: string | null
          status?: string
          user_id: string
        }
        Update: {
          article_slug?: string
          body?: string
          company?: string | null
          created_at?: string
          id?: string
          moderation_reason?: string | null
          name?: string
          position?: string | null
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      insights_likes: {
        Row: {
          article_slug: string
          company: string | null
          created_at: string
          id: string
          name: string
          position: string | null
          user_id: string
        }
        Insert: {
          article_slug: string
          company?: string | null
          created_at?: string
          id?: string
          name: string
          position?: string | null
          user_id: string
        }
        Update: {
          article_slug?: string
          company?: string | null
          created_at?: string
          id?: string
          name?: string
          position?: string | null
          user_id?: string
        }
        Relationships: []
      }
      marketplace_inquiries: {
        Row: {
          action_type: string
          company: string | null
          created_at: string
          email: string
          id: string
          listing_category: string
          listing_id: string
          listing_title: string
          message: string | null
          name: string
          user_id: string | null
        }
        Insert: {
          action_type: string
          company?: string | null
          created_at?: string
          email: string
          id?: string
          listing_category: string
          listing_id: string
          listing_title: string
          message?: string | null
          name: string
          user_id?: string | null
        }
        Update: {
          action_type?: string
          company?: string | null
          created_at?: string
          email?: string
          id?: string
          listing_category?: string
          listing_id?: string
          listing_title?: string
          message?: string | null
          name?: string
          user_id?: string | null
        }
        Relationships: []
      }
      outbound_clicks: {
        Row: {
          created_at: string
          destination: string
          id: string
          path: string | null
          referrer: string | null
          source: string
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          destination: string
          id?: string
          path?: string | null
          referrer?: string | null
          source: string
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          destination?: string
          id?: string
          path?: string | null
          referrer?: string | null
          source?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      team_members: {
        Row: {
          accepted_at: string | null
          email: string
          id: string
          invite_token: string
          invited_at: string
          name: string | null
          owner_id: string
          role: string
          status: string
          updated_at: string
        }
        Insert: {
          accepted_at?: string | null
          email: string
          id?: string
          invite_token?: string
          invited_at?: string
          name?: string | null
          owner_id: string
          role?: string
          status?: string
          updated_at?: string
        }
        Update: {
          accepted_at?: string | null
          email?: string
          id?: string
          invite_token?: string
          invited_at?: string
          name?: string | null
          owner_id?: string
          role?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_preferences: {
        Row: {
          company: string | null
          created_at: string
          display_name: string | null
          email_updates: boolean
          event_reminders: boolean
          id: string
          insights_digest: boolean
          job_title: string | null
          languages: string[]
          topics: string[]
          updated_at: string
          user_id: string
        }
        Insert: {
          company?: string | null
          created_at?: string
          display_name?: string | null
          email_updates?: boolean
          event_reminders?: boolean
          id?: string
          insights_digest?: boolean
          job_title?: string | null
          languages?: string[]
          topics?: string[]
          updated_at?: string
          user_id: string
        }
        Update: {
          company?: string | null
          created_at?: string
          display_name?: string | null
          email_updates?: boolean
          event_reminders?: boolean
          id?: string
          insights_digest?: boolean
          job_title?: string | null
          languages?: string[]
          topics?: string[]
          updated_at?: string
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
      waitlist: {
        Row: {
          company: string | null
          created_at: string
          email: string
          id: string
          name: string
          role: string | null
        }
        Insert: {
          company?: string | null
          created_at?: string
          email: string
          id?: string
          name: string
          role?: string | null
        }
        Update: {
          company?: string | null
          created_at?: string
          email?: string
          id?: string
          name?: string
          role?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_insights_like_count: { Args: { _slug: string }; Returns: number }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user"
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
      app_role: ["admin", "user"],
    },
  },
} as const
