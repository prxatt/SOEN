// Database types for Praxis-AI
// Generated from comprehensive schema migration

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string | null;
          email: string | null;
          avatar_url: string | null;
          subscription_tier: 'free' | 'pro' | 'team';
          subscription_status: string | null;
          stripe_customer_id: string | null;
          kiko_relationship_level: number;
          kiko_personality_mode: 'supportive' | 'tough_love' | 'analytical' | 'motivational';
          kiko_voice_preference: 'neutral' | 'energetic' | 'calm' | 'professional';
          interaction_patterns: any;
          daily_ai_requests: number;
          monthly_ai_requests: number;
          last_ai_request_reset: string | null;
          preferences: any;
          praxis_flow_points: number;
          current_streak: number;
          longest_streak: number;
          last_activity_date: string | null;
          purchased_rewards: string[] | null;
          encryption_key_hash: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          full_name?: string | null;
          email?: string | null;
          avatar_url?: string | null;
          subscription_tier?: 'free' | 'pro' | 'team';
          subscription_status?: string | null;
          stripe_customer_id?: string | null;
          kiko_relationship_level?: number;
          kiko_personality_mode?: 'supportive' | 'tough_love' | 'analytical' | 'motivational';
          kiko_voice_preference?: 'neutral' | 'energetic' | 'calm' | 'professional';
          interaction_patterns?: any;
          daily_ai_requests?: number;
          monthly_ai_requests?: number;
          last_ai_request_reset?: string | null;
          preferences?: any;
          praxis_flow_points?: number;
          current_streak?: number;
          longest_streak?: number;
          last_activity_date?: string | null;
          purchased_rewards?: string[] | null;
          encryption_key_hash?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string | null;
          email?: string | null;
          avatar_url?: string | null;
          subscription_tier?: 'free' | 'pro' | 'team';
          subscription_status?: string | null;
          stripe_customer_id?: string | null;
          kiko_relationship_level?: number;
          kiko_personality_mode?: 'supportive' | 'tough_love' | 'analytical' | 'motivational';
          kiko_voice_preference?: 'neutral' | 'energetic' | 'calm' | 'professional';
          interaction_patterns?: any;
          daily_ai_requests?: number;
          monthly_ai_requests?: number;
          last_ai_request_reset?: string | null;
          preferences?: any;
          praxis_flow_points?: number;
          current_streak?: number;
          longest_streak?: number;
          last_activity_date?: string | null;
          purchased_rewards?: string[] | null;
          encryption_key_hash?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      kiko_conversations: {
        Row: {
          id: string;
          user_id: string;
          title: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "kiko_conversations_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      kiko_messages: {
        Row: {
          id: string;
          conversation_id: string;
          role: 'user' | 'assistant' | 'system';
          content: string;
          content_encrypted: string | null;
          content_iv: string | null;
          metadata: any | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          conversation_id: string;
          role: 'user' | 'assistant' | 'system';
          content: string;
          content_encrypted?: string | null;
          content_iv?: string | null;
          metadata?: any | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          conversation_id?: string;
          role?: 'user' | 'assistant' | 'system';
          content?: string;
          content_encrypted?: string | null;
          content_iv?: string | null;
          metadata?: any | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "kiko_messages_conversation_id_fkey";
            columns: ["conversation_id"];
            isOneToOne: false;
            referencedRelation: "kiko_conversations";
            referencedColumns: ["id"];
          }
        ];
      };
      tasks: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          description: string | null;
          status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
          priority: 'low' | 'medium' | 'high';
          due_date: string | null;
          estimated_duration: number | null;
          actual_duration: number | null;
          project_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          description?: string | null;
          status?: 'pending' | 'in_progress' | 'completed' | 'cancelled';
          priority?: 'low' | 'medium' | 'high';
          due_date?: string | null;
          estimated_duration?: number | null;
          actual_duration?: number | null;
          project_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          description?: string | null;
          status?: 'pending' | 'in_progress' | 'completed' | 'cancelled';
          priority?: 'low' | 'medium' | 'high';
          due_date?: string | null;
          estimated_duration?: number | null;
          actual_duration?: number | null;
          project_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "tasks_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "tasks_project_id_fkey";
            columns: ["project_id"];
            isOneToOne: false;
            referencedRelation: "projects";
            referencedColumns: ["id"];
          }
        ];
      };
      notebooks: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          description: string | null;
          color: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          description?: string | null;
          color?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          description?: string | null;
          color?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "notebooks_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      notes: {
        Row: {
          id: string;
          user_id: string;
          notebook_id: string | null;
          title: string;
          content: string;
          content_encrypted: string | null;
          content_iv: string | null;
          tags: string[] | null;
          ai_summary: string | null;
          action_items: any | null;
          notion_page_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          notebook_id?: string | null;
          title: string;
          content: string;
          content_encrypted?: string | null;
          content_iv?: string | null;
          tags?: string[] | null;
          ai_summary?: string | null;
          action_items?: any | null;
          notion_page_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          notebook_id?: string | null;
          title?: string;
          content?: string;
          content_encrypted?: string | null;
          content_iv?: string | null;
          tags?: string[] | null;
          ai_summary?: string | null;
          action_items?: any | null;
          notion_page_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "notes_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "notes_notebook_id_fkey";
            columns: ["notebook_id"];
            isOneToOne: false;
            referencedRelation: "notebooks";
            referencedColumns: ["id"];
          }
        ];
      };
      projects: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          description: string | null;
          status: 'planning' | 'active' | 'completed' | 'paused' | 'cancelled';
          start_date: string | null;
          end_date: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          description?: string | null;
          status?: 'planning' | 'active' | 'completed' | 'paused' | 'cancelled';
          start_date?: string | null;
          end_date?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          description?: string | null;
          status?: 'planning' | 'active' | 'completed' | 'paused' | 'cancelled';
          start_date?: string | null;
          end_date?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "projects_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      goals: {
        Row: {
          id: string;
          user_id: string;
          text: string;
          term: 'short' | 'mid' | 'long';
          status: 'active' | 'completed' | 'paused';
          priority: 'low' | 'medium' | 'high';
          due_date: string | null;
          progress: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          text: string;
          term: 'short' | 'mid' | 'long';
          status?: 'active' | 'completed' | 'paused';
          priority?: 'low' | 'medium' | 'high';
          due_date?: string | null;
          progress?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          text?: string;
          term?: 'short' | 'mid' | 'long';
          status?: 'active' | 'completed' | 'paused';
          priority?: 'low' | 'medium' | 'high';
          due_date?: string | null;
          progress?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "goals_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      ai_usage_logs: {
        Row: {
          id: string;
          user_id: string;
          model_used: string;
          operation_type: string;
          feature_used: string | null;
          tokens_input: number | null;
          tokens_output: number | null;
          cost_cents: number | null;
          latency_ms: number | null;
          cache_hit: boolean | null;
          fallback_used: boolean | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          model_used: string;
          operation_type: string;
          feature_used?: string | null;
          tokens_input?: number | null;
          tokens_output?: number | null;
          cost_cents?: number | null;
          latency_ms?: number | null;
          cache_hit?: boolean | null;
          fallback_used?: boolean | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          model_used?: string;
          operation_type?: string;
          feature_used?: string | null;
          tokens_input?: number | null;
          tokens_output?: number | null;
          cost_cents?: number | null;
          latency_ms?: number | null;
          cache_hit?: boolean | null;
          fallback_used?: boolean | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "ai_usage_logs_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      notion_integrations: {
        Row: {
          id: string;
          user_id: string;
          notion_workspace_id: string;
          notion_workspace_name: string;
          access_token_encrypted: string;
          access_token_iv: string;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          notion_workspace_id: string;
          notion_workspace_name: string;
          access_token_encrypted: string;
          access_token_iv: string;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          notion_workspace_id?: string;
          notion_workspace_name?: string;
          access_token_encrypted?: string;
          access_token_iv?: string;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "notion_integrations_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      notion_sync_log: {
        Row: {
          id: string;
          user_id: string;
          note_id: string | null;
          notion_page_id: string | null;
          sync_direction: string;
          sync_status: string;
          error_message: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          note_id?: string | null;
          notion_page_id?: string | null;
          sync_direction: string;
          sync_status: string;
          error_message?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          note_id?: string | null;
          notion_page_id?: string | null;
          sync_direction?: string;
          sync_status?: string;
          error_message?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "notion_sync_log_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
    };
    Views: {};
    Functions: {
      [_ in never]: never;
    };
    Enums: {};
    CompositeTypes: {};
  };
}
