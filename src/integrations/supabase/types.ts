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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      abuse_reports: {
        Row: {
          created_at: string | null
          description: string
          evidence_file_url: string | null
          id: string
          location: string | null
          status: Database["public"]["Enums"]["report_status"] | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          description: string
          evidence_file_url?: string | null
          id?: string
          location?: string | null
          status?: Database["public"]["Enums"]["report_status"] | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          description?: string
          evidence_file_url?: string | null
          id?: string
          location?: string | null
          status?: Database["public"]["Enums"]["report_status"] | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "abuse_reports_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      anonymous_questions: {
        Row: {
          created_at: string | null
          id: string
          question: string
          topic: Database["public"]["Enums"]["question_topic"]
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          question: string
          topic: Database["public"]["Enums"]["question_topic"]
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          question?: string
          topic?: Database["public"]["Enums"]["question_topic"]
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "anonymous_questions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      answers: {
        Row: {
          answer_text: string
          created_at: string | null
          id: string
          question_id: string
          upvotes: number | null
          user_id: string | null
        }
        Insert: {
          answer_text: string
          created_at?: string | null
          id?: string
          question_id: string
          upvotes?: number | null
          user_id?: string | null
        }
        Update: {
          answer_text?: string
          created_at?: string | null
          id?: string
          question_id?: string
          upvotes?: number | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "answers_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "anonymous_questions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "answers_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      meetings: {
        Row: {
          created_at: string | null
          description: string
          id: string
          meeting_date: string
          meeting_link: string | null
          speaker: string | null
          title: string
        }
        Insert: {
          created_at?: string | null
          description: string
          id?: string
          meeting_date: string
          meeting_link?: string | null
          speaker?: string | null
          title: string
        }
        Update: {
          created_at?: string | null
          description?: string
          id?: string
          meeting_date?: string
          meeting_link?: string | null
          speaker?: string | null
          title?: string
        }
        Relationships: []
      }
      mentors: {
        Row: {
          approved: boolean | null
          availability: string | null
          bio: string
          created_at: string | null
          id: string
          skills: string[]
          user_id: string
        }
        Insert: {
          approved?: boolean | null
          availability?: string | null
          bio: string
          created_at?: string | null
          id?: string
          skills: string[]
          user_id: string
        }
        Update: {
          approved?: boolean | null
          availability?: string | null
          bio?: string
          created_at?: string | null
          id?: string
          skills?: string[]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "mentors_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          age: number | null
          created_at: string | null
          fitness_level: Database["public"]["Enums"]["fitness_level"] | null
          id: string
          name: string
          profile_picture_url: string | null
          total_workout_minutes: number | null
        }
        Insert: {
          age?: number | null
          created_at?: string | null
          fitness_level?: Database["public"]["Enums"]["fitness_level"] | null
          id: string
          name: string
          profile_picture_url?: string | null
          total_workout_minutes?: number | null
        }
        Update: {
          age?: number | null
          created_at?: string | null
          fitness_level?: Database["public"]["Enums"]["fitness_level"] | null
          id?: string
          name?: string
          profile_picture_url?: string | null
          total_workout_minutes?: number | null
        }
        Relationships: []
      }
      resources: {
        Row: {
          category: string
          content_url: string
          created_at: string | null
          description: string
          id: string
          resource_type: string
          title: string
        }
        Insert: {
          category: string
          content_url: string
          created_at?: string | null
          description: string
          id?: string
          resource_type: string
          title: string
        }
        Update: {
          category?: string
          content_url?: string
          created_at?: string | null
          description?: string
          id?: string
          resource_type?: string
          title?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      workouts: {
        Row: {
          created_at: string | null
          date: string | null
          id: string
          minutes: number
          user_id: string
          workout_type: string
        }
        Insert: {
          created_at?: string | null
          date?: string | null
          id?: string
          minutes: number
          user_id: string
          workout_type: string
        }
        Update: {
          created_at?: string | null
          date?: string | null
          id?: string
          minutes?: number
          user_id?: string
          workout_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "workouts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "user" | "mentor" | "admin"
      fitness_level: "beginner" | "intermediate" | "advanced"
      question_topic:
        | "safety"
        | "relationships"
        | "mental_health"
        | "fitness"
        | "legal_help"
        | "other"
      report_status: "pending" | "reviewed" | "resolved"
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
      app_role: ["user", "mentor", "admin"],
      fitness_level: ["beginner", "intermediate", "advanced"],
      question_topic: [
        "safety",
        "relationships",
        "mental_health",
        "fitness",
        "legal_help",
        "other",
      ],
      report_status: ["pending", "reviewed", "resolved"],
    },
  },
} as const
