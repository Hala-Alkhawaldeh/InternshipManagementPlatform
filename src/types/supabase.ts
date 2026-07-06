// Auto-generated — do not edit manually.
// Run after any schema change:
//   npx supabase gen types typescript --project-id <your-project-id> > src/types/supabase.ts

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          user_id: string
          role: string
          full_name: string
          email: string
          track: string | null
          mentor_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          role: string
          full_name: string
          email: string
          track?: string | null
          mentor_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          role?: string
          full_name?: string
          email?: string
          track?: string | null
          mentor_id?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'profiles_mentor_id_fkey'
            columns: ['mentor_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      tasks: {
        Row: {
          id: string
          title: string
          description: string | null
          created_by: string
          assigned_to: string
          status: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          created_by: string
          assigned_to: string
          status?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          created_by?: string
          assigned_to?: string
          status?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'tasks_created_by_fkey'
            columns: ['created_by']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['user_id']
          },
          {
            foreignKeyName: 'tasks_assigned_to_fkey'
            columns: ['assigned_to']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['user_id']
          },
        ]
      }
      task_progress: {
        Row: {
          id: string
          task_id: string
          trainee_id: string
          status: string
          updated_at: string
        }
        Insert: {
          id?: string
          task_id: string
          trainee_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          id?: string
          task_id?: string
          trainee_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'task_progress_task_id_fkey'
            columns: ['task_id']
            isOneToOne: false
            referencedRelation: 'tasks'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'task_progress_trainee_id_fkey'
            columns: ['trainee_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['user_id']
          },
        ]
      }
      evaluation_settings: {
        Row: {
          id: string
          criteria: Json
          updated_at: string
        }
        Insert: {
          id?: string
          criteria?: Json
          updated_at?: string
        }
        Update: {
          id?: string
          criteria?: Json
          updated_at?: string
        }
        Relationships: []
      }
      evaluations: {
        Row: {
          id: string
          trainee_id: string
          mentor_id: string
          criteria: Json
          scores: Json
          average_score: number | null
          created_at: string
        }
        Insert: {
          id?: string
          trainee_id: string
          mentor_id: string
          criteria: Json
          scores: Json
          average_score?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          trainee_id?: string
          mentor_id?: string
          criteria?: Json
          scores?: Json
          average_score?: number | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'evaluations_trainee_id_fkey'
            columns: ['trainee_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['user_id']
          },
          {
            foreignKeyName: 'evaluations_mentor_id_fkey'
            columns: ['mentor_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['user_id']
          },
        ]
      }
    }
    Views: { [_ in never]: never }
    Functions: { [_ in never]: never }
    Enums: { [_ in never]: never }
    CompositeTypes: { [_ in never]: never }
  }
}
