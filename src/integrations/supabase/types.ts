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
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      allergies: {
        Row: {
          allergen: string
          care_team_id: string
          created_at: string
          created_by: string
          id: string
          notes: string | null
          reaction: string | null
          severity: string | null
          updated_at: string
        }
        Insert: {
          allergen: string
          care_team_id: string
          created_at?: string
          created_by: string
          id?: string
          notes?: string | null
          reaction?: string | null
          severity?: string | null
          updated_at?: string
        }
        Update: {
          allergen?: string
          care_team_id?: string
          created_at?: string
          created_by?: string
          id?: string
          notes?: string | null
          reaction?: string | null
          severity?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "allergies_care_team_id_fkey"
            columns: ["care_team_id"]
            isOneToOne: false
            referencedRelation: "care_teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "allergies_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      calendar_events: {
        Row: {
          all_day: boolean
          calendar_type: string
          care_team_id: string
          category: string
          created_at: string
          created_by: string
          description: string | null
          end_date: string
          id: string
          location: string | null
          recurrence_rule: string | null
          reminder_minutes: number | null
          start_date: string
          title: string
          updated_at: string
        }
        Insert: {
          all_day?: boolean
          calendar_type: string
          care_team_id: string
          category: string
          created_at?: string
          created_by: string
          description?: string | null
          end_date: string
          id?: string
          location?: string | null
          recurrence_rule?: string | null
          reminder_minutes?: number | null
          start_date: string
          title: string
          updated_at?: string
        }
        Update: {
          all_day?: boolean
          calendar_type?: string
          care_team_id?: string
          category?: string
          created_at?: string
          created_by?: string
          description?: string | null
          end_date?: string
          id?: string
          location?: string | null
          recurrence_rule?: string | null
          reminder_minutes?: number | null
          start_date?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "calendar_events_care_team_id_fkey"
            columns: ["care_team_id"]
            isOneToOne: false
            referencedRelation: "care_teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "calendar_events_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      care_team_members: {
        Row: {
          care_team_id: string
          created_at: string
          id: string
          invited_by: string | null
          joined_at: string | null
          role: Database["public"]["Enums"]["care_team_role"]
          user_id: string
        }
        Insert: {
          care_team_id: string
          created_at?: string
          id?: string
          invited_by?: string | null
          joined_at?: string | null
          role?: Database["public"]["Enums"]["care_team_role"]
          user_id: string
        }
        Update: {
          care_team_id?: string
          created_at?: string
          id?: string
          invited_by?: string | null
          joined_at?: string | null
          role?: Database["public"]["Enums"]["care_team_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "care_team_members_care_team_id_fkey"
            columns: ["care_team_id"]
            isOneToOne: false
            referencedRelation: "care_teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "care_team_members_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "care_team_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      care_teams: {
        Row: {
          care_recipient_name: string
          created_at: string
          created_by: string
          description: string | null
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          care_recipient_name: string
          created_at?: string
          created_by: string
          description?: string | null
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          care_recipient_name?: string
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "care_teams_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      health_vitals: {
        Row: {
          care_team_id: string
          created_at: string
          id: string
          notes: string | null
          recorded_at: string
          recorded_by: string
          unit: string
          updated_at: string
          value: number
          vital_type: string
        }
        Insert: {
          care_team_id: string
          created_at?: string
          id?: string
          notes?: string | null
          recorded_at?: string
          recorded_by: string
          unit: string
          updated_at?: string
          value: number
          vital_type: string
        }
        Update: {
          care_team_id?: string
          created_at?: string
          id?: string
          notes?: string | null
          recorded_at?: string
          recorded_by?: string
          unit?: string
          updated_at?: string
          value?: number
          vital_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "health_vitals_care_team_id_fkey"
            columns: ["care_team_id"]
            isOneToOne: false
            referencedRelation: "care_teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "health_vitals_recorded_by_fkey"
            columns: ["recorded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      medical_providers: {
        Row: {
          address: string | null
          care_team_id: string
          created_at: string
          created_by: string
          email: string | null
          id: string
          name: string
          notes: string | null
          phone: string | null
          practice_name: string | null
          provider_type: string
          specialty: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          care_team_id: string
          created_at?: string
          created_by: string
          email?: string | null
          id?: string
          name: string
          notes?: string | null
          phone?: string | null
          practice_name?: string | null
          provider_type: string
          specialty?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          care_team_id?: string
          created_at?: string
          created_by?: string
          email?: string | null
          id?: string
          name?: string
          notes?: string | null
          phone?: string | null
          practice_name?: string | null
          provider_type?: string
          specialty?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "medical_providers_care_team_id_fkey"
            columns: ["care_team_id"]
            isOneToOne: false
            referencedRelation: "care_teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "medical_providers_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      medication_logs: {
        Row: {
          administered_at: string
          administered_by: string
          created_at: string
          dose_amount: number | null
          dose_unit: string | null
          id: string
          medication_id: string
          notes: string | null
          updated_at: string
        }
        Insert: {
          administered_at?: string
          administered_by: string
          created_at?: string
          dose_amount?: number | null
          dose_unit?: string | null
          id?: string
          medication_id: string
          notes?: string | null
          updated_at?: string
        }
        Update: {
          administered_at?: string
          administered_by?: string
          created_at?: string
          dose_amount?: number | null
          dose_unit?: string | null
          id?: string
          medication_id?: string
          notes?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "medication_logs_administered_by_fkey"
            columns: ["administered_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "medication_logs_medication_id_fkey"
            columns: ["medication_id"]
            isOneToOne: false
            referencedRelation: "medications"
            referencedColumns: ["id"]
          },
        ]
      }
      medications: {
        Row: {
          care_team_id: string
          created_at: string
          created_by: string
          dosage: string | null
          end_date: string | null
          frequency: string | null
          id: string
          instructions: string | null
          is_active: boolean
          name: string
          pharmacy: string | null
          prescribing_doctor: string | null
          start_date: string | null
          updated_at: string
        }
        Insert: {
          care_team_id: string
          created_at?: string
          created_by: string
          dosage?: string | null
          end_date?: string | null
          frequency?: string | null
          id?: string
          instructions?: string | null
          is_active?: boolean
          name: string
          pharmacy?: string | null
          prescribing_doctor?: string | null
          start_date?: string | null
          updated_at?: string
        }
        Update: {
          care_team_id?: string
          created_at?: string
          created_by?: string
          dosage?: string | null
          end_date?: string | null
          frequency?: string | null
          id?: string
          instructions?: string | null
          is_active?: boolean
          name?: string
          pharmacy?: string | null
          prescribing_doctor?: string | null
          start_date?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "medications_care_team_id_fkey"
            columns: ["care_team_id"]
            isOneToOne: false
            referencedRelation: "care_teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "medications_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      message_attachments: {
        Row: {
          created_at: string
          file_name: string
          file_size: number
          file_type: string
          id: string
          message_id: string
          mime_type: string
          storage_path: string
          uploaded_by: string
        }
        Insert: {
          created_at?: string
          file_name: string
          file_size: number
          file_type: string
          id?: string
          message_id: string
          mime_type: string
          storage_path: string
          uploaded_by: string
        }
        Update: {
          created_at?: string
          file_name?: string
          file_size?: number
          file_type?: string
          id?: string
          message_id?: string
          mime_type?: string
          storage_path?: string
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "message_attachments_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "message_attachments_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      message_reactions: {
        Row: {
          created_at: string
          id: string
          message_id: string
          reaction_type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          message_id: string
          reaction_type?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          message_id?: string
          reaction_type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "message_reactions_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "message_reactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          author_id: string
          care_team_id: string
          content: string
          created_at: string
          id: string
          is_pinned: boolean
          is_urgent: boolean
          message_type: string
          parent_id: string | null
          updated_at: string
        }
        Insert: {
          author_id: string
          care_team_id: string
          content: string
          created_at?: string
          id?: string
          is_pinned?: boolean
          is_urgent?: boolean
          message_type?: string
          parent_id?: string | null
          updated_at?: string
        }
        Update: {
          author_id?: string
          care_team_id?: string
          content?: string
          created_at?: string
          id?: string
          is_pinned?: boolean
          is_urgent?: boolean
          message_type?: string
          parent_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_care_team_id_fkey"
            columns: ["care_team_id"]
            isOneToOne: false
            referencedRelation: "care_teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
        ]
      }
      mood_logs: {
        Row: {
          care_team_id: string
          created_at: string
          energy_level: number | null
          id: string
          logged_at: string
          logged_by: string
          mood_level: number
          mood_type: string
          notes: string | null
          pain_level: number | null
          sleep_quality: number | null
          stress_level: number | null
          updated_at: string
        }
        Insert: {
          care_team_id: string
          created_at?: string
          energy_level?: number | null
          id?: string
          logged_at?: string
          logged_by: string
          mood_level: number
          mood_type: string
          notes?: string | null
          pain_level?: number | null
          sleep_quality?: number | null
          stress_level?: number | null
          updated_at?: string
        }
        Update: {
          care_team_id?: string
          created_at?: string
          energy_level?: number | null
          id?: string
          logged_at?: string
          logged_by?: string
          mood_level?: number
          mood_type?: string
          notes?: string | null
          pain_level?: number | null
          sleep_quality?: number | null
          stress_level?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "mood_logs_care_team_id_fkey"
            columns: ["care_team_id"]
            isOneToOne: false
            referencedRelation: "care_teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mood_logs_logged_by_fkey"
            columns: ["logged_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      nutrition_logs: {
        Row: {
          calories: number | null
          care_team_id: string
          created_at: string
          food_name: string | null
          id: string
          log_type: string
          logged_at: string
          logged_by: string
          meal_type: string | null
          notes: string | null
          portion_size: string | null
          updated_at: string
          water_amount_ml: number | null
        }
        Insert: {
          calories?: number | null
          care_team_id: string
          created_at?: string
          food_name?: string | null
          id?: string
          log_type: string
          logged_at?: string
          logged_by: string
          meal_type?: string | null
          notes?: string | null
          portion_size?: string | null
          updated_at?: string
          water_amount_ml?: number | null
        }
        Update: {
          calories?: number | null
          care_team_id?: string
          created_at?: string
          food_name?: string | null
          id?: string
          log_type?: string
          logged_at?: string
          logged_by?: string
          meal_type?: string | null
          notes?: string | null
          portion_size?: string | null
          updated_at?: string
          water_amount_ml?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "nutrition_logs_care_team_id_fkey"
            columns: ["care_team_id"]
            isOneToOne: false
            referencedRelation: "care_teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "nutrition_logs_logged_by_fkey"
            columns: ["logged_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      pending_invitations: {
        Row: {
          care_team_id: string
          email: string
          expires_at: string
          first_name: string | null
          id: string
          invited_at: string
          invited_by: string
          last_name: string | null
          personal_message: string | null
          role: Database["public"]["Enums"]["care_team_role"]
          status: string
        }
        Insert: {
          care_team_id: string
          email: string
          expires_at?: string
          first_name?: string | null
          id?: string
          invited_at?: string
          invited_by: string
          last_name?: string | null
          personal_message?: string | null
          role?: Database["public"]["Enums"]["care_team_role"]
          status?: string
        }
        Update: {
          care_team_id?: string
          email?: string
          expires_at?: string
          first_name?: string | null
          id?: string
          invited_at?: string
          invited_by?: string
          last_name?: string | null
          personal_message?: string | null
          role?: Database["public"]["Enums"]["care_team_role"]
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "pending_invitations_care_team_id_fkey"
            columns: ["care_team_id"]
            isOneToOne: false
            referencedRelation: "care_teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pending_invitations_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          first_name: string | null
          id: string
          last_name: string | null
          phone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          first_name?: string | null
          id?: string
          last_name?: string | null
          phone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          first_name?: string | null
          id?: string
          last_name?: string | null
          phone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      cleanup_user_invitations: {
        Args: { p_user_id: string; p_care_team_id: string }
        Returns: undefined
      }
      get_user_by_email: {
        Args: { p_email: string }
        Returns: {
          user_id: string
          profile_id: string
        }[]
      }
    }
    Enums: {
      care_team_role:
        | "admin"
        | "family"
        | "friend"
        | "professional"
        | "caregiver"
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
      care_team_role: [
        "admin",
        "family",
        "friend",
        "professional",
        "caregiver",
      ],
    },
  },
} as const
