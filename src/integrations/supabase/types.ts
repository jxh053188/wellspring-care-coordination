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
          }
        ]
      }
      care_teams: {
        Row: {
          id: string
          name: string
          description: string
          care_recipient_name: string
          created_by: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string
          care_recipient_name: string
          created_by: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string
          care_recipient_name?: string
          created_by?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "care_teams_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      care_team_members: {
        Row: {
          id: string
          care_team_id: string
          user_id: string
          role: "admin" | "family" | "friend" | "professional" | "caregiver"
          invited_by: string | null
          joined_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          care_team_id: string
          user_id: string
          role?: "admin" | "family" | "friend" | "professional" | "caregiver"
          invited_by?: string | null
          joined_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          care_team_id?: string
          user_id?: string
          role?: "admin" | "family" | "friend" | "professional" | "caregiver"
          invited_by?: string | null
          joined_at?: string | null
          created_at?: string
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
            foreignKeyName: "care_team_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "care_team_members_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      health_vitals: {
        Row: {
          id: string
          care_team_id: string
          vital_type: string
          value: number
          unit: string
          recorded_by: string
          recorded_at: string
          notes: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          care_team_id: string
          vital_type: string
          value: number
          unit: string
          recorded_by: string
          recorded_at?: string
          notes?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          care_team_id?: string
          vital_type?: string
          value?: number
          unit?: string
          recorded_by?: string
          recorded_at?: string
          notes?: string
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
          }
        ]
      }
      medication_logs: {
        Row: {
          id: string
          medication_id: string
          taken_at: string
          taken_by: string
          notes: string
          created_at: string
        }
        Insert: {
          id?: string
          medication_id: string
          taken_at?: string
          taken_by: string
          notes?: string
          created_at?: string
        }
        Update: {
          id?: string
          medication_id?: string
          taken_at?: string
          taken_by?: string
          notes?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "medication_logs_medication_id_fkey"
            columns: ["medication_id"]
            isOneToOne: false
            referencedRelation: "medications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "medication_logs_taken_by_fkey"
            columns: ["taken_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      medications: {
        Row: {
          id: string
          care_team_id: string
          name: string
          dosage: string
          frequency: string
          prescribed_by: string
          start_date: string
          end_date: string | null
          notes: string
          is_active: boolean
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
          prescribed_by?: string
          start_date?: string
          end_date?: string | null
          notes?: string
          is_active?: boolean
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
          prescribed_by?: string
          start_date?: string
          end_date?: string | null
          notes?: string
          is_active?: boolean
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
          }
        ]
      }
      pending_invitations: {
        Row: {
          id: string
          care_team_id: string
          email: string
          role: "admin" | "family" | "friend" | "professional" | "caregiver"
          invited_by: string
          first_name: string | null
          last_name: string | null
          personal_message: string | null
          invited_at: string
          expires_at: string
          status: string
        }
        Insert: {
          id?: string
          care_team_id: string
          email: string
          role?: "admin" | "family" | "friend" | "professional" | "caregiver"
          invited_by: string
          first_name?: string | null
          last_name?: string | null
          personal_message?: string | null
          invited_at?: string
          expires_at?: string
          status?: string
        }
        Update: {
          id?: string
          care_team_id?: string
          email?: string
          role?: "admin" | "family" | "friend" | "professional" | "caregiver"
          invited_by?: string
          first_name?: string | null
          last_name?: string | null
          personal_message?: string | null
          invited_at?: string
          expires_at?: string
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
          }
        ]
      }
      profiles: {
        Row: {
          id: string
          user_id: string
          display_name: string | null
          first_name: string | null
          last_name: string | null
          phone: string | null
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          display_name?: string | null
          first_name?: string | null
          last_name?: string | null
          phone?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          display_name?: string | null
          first_name?: string | null
          last_name?: string | null
          phone?: string | null
          avatar_url?: string | null
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
      [_ in never]: never
    }
    Enums: {
      care_team_role: "admin" | "family" | "friend" | "professional" | "caregiver"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
