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
      allergies: {
        Row: {
          id: string
          care_team_id: string
          allergen: string
          severity: string
          reaction: string
          notes: string
          created_by: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          care_team_id: string
          allergen: string
          severity: string
          reaction?: string
          notes?: string
          created_by: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          care_team_id?: string
          allergen?: string
          severity?: string
          reaction?: string
          notes?: string
          created_by?: string
          created_at?: string
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
          id: string
          care_team_id: string
          title: string
          description: string | null
          category: string
          calendar_type: string
          start_date: string
          end_date: string
          all_day: boolean
          location: string | null
          reminder_minutes: number
          created_by: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          care_team_id: string
          title: string
          description?: string | null
          category: string
          calendar_type: string
          start_date: string
          end_date: string
          all_day?: boolean
          location?: string | null
          reminder_minutes?: number
          created_by: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          care_team_id?: string
          title?: string
          description?: string | null
          category?: string
          calendar_type?: string
          start_date?: string
          end_date?: string
          all_day?: boolean
          location?: string | null
          reminder_minutes?: number
          created_by?: string
          created_at?: string
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
      care_teams: {
        Row: {
          id: string
          name: string
          description: string
          primary_caregiver_id: string
          care_recipient_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string
          primary_caregiver_id: string
          care_recipient_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string
          primary_caregiver_id?: string
          care_recipient_id?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "care_teams_care_recipient_id_fkey"
            columns: ["care_recipient_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "care_teams_primary_caregiver_id_fkey"
            columns: ["primary_caregiver_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      care_team_members: {
        Row: {
          id: string
          care_team_id: string
          profile_id: string
          role: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          care_team_id: string
          profile_id: string
          role: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          care_team_id?: string
          profile_id?: string
          role?: string
          created_at?: string
          updated_at?: string
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
            foreignKeyName: "care_team_members_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      health_vitals: {
        Row: {
          id: string
          care_team_id: string
          vital_type: string
          value: number
          unit: string
          notes: string
          recorded_by: string
          recorded_at: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          care_team_id: string
          vital_type: string
          value: number
          unit: string
          notes?: string
          recorded_by: string
          recorded_at?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          care_team_id?: string
          vital_type?: string
          value?: number
          unit?: string
          notes?: string
          recorded_by?: string
          recorded_at?: string
          created_at?: string
          updated_at?: string
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
      medication_logs: {
        Row: {
          id: string
          medication_id: string
          administered_by: string
          administered_at: string
          dose_amount: number
          dose_unit: string
          notes: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          medication_id: string
          administered_by: string
          administered_at?: string
          dose_amount: number
          dose_unit: string
          notes?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          medication_id?: string
          administered_by?: string
          administered_at?: string
          dose_amount?: number
          dose_unit?: string
          notes?: string
          created_at?: string
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
          id: string
          care_team_id: string
          name: string
          dosage: string
          frequency: string
          start_date: string
          end_date: string
          instructions: string
          prescribing_doctor: string
          created_by: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          care_team_id: string
          name: string
          dosage: string
          frequency: string
          start_date: string
          end_date?: string
          instructions?: string
          prescribing_doctor?: string
          created_by: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          care_team_id?: string
          name?: string
          dosage?: string
          frequency?: string
          start_date?: string
          end_date?: string
          instructions?: string
          prescribing_doctor?: string
          created_by?: string
          created_at?: string
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
      pending_invitations: {
        Row: {
          id: string
          care_team_id: string
          email: string
          role: string
          invited_by: string
          created_at: string
          expires_at: string
        }
        Insert: {
          id?: string
          care_team_id: string
          email: string
          role: string
          invited_by: string
          created_at?: string
          expires_at?: string
        }
        Update: {
          id?: string
          care_team_id?: string
          email?: string
          role?: string
          invited_by?: string
          created_at?: string
          expires_at?: string
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
          id: string
          user_id: string
          first_name: string
          last_name: string
          email: string
          phone: string
          date_of_birth: string
          avatar_url: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          first_name: string
          last_name: string
          email: string
          phone?: string
          date_of_birth?: string
          avatar_url?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          first_name?: string
          last_name?: string
          email?: string
          phone?: string
          date_of_birth?: string
          avatar_url?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_by_email: {
        Args: {
          user_email: string
        }
        Returns: {
          user_id: string
          profile_id: string
          email: string
          first_name: string
          last_name: string
        }[]
      }
    }
    Enums: {
      member_role: "primary_caregiver" | "caregiver" | "family_member" | "healthcare_provider"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never
