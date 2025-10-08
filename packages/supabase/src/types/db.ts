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
      activities: {
        Row: {
          created_at: string
          group_id: string | null
          id: string
          last_used_at: string | null
          metadata: Json
          priority: number | null
          source: Database["public"]["Enums"]["activity_source"]
          status: Database["public"]["Enums"]["activity_status"]
          team_id: string
          type: Database["public"]["Enums"]["activity_type"]
          user_id: string | null
        }
        Insert: {
          created_at?: string
          group_id?: string | null
          id?: string
          last_used_at?: string | null
          metadata: Json
          priority?: number | null
          source: Database["public"]["Enums"]["activity_source"]
          status?: Database["public"]["Enums"]["activity_status"]
          team_id: string
          type: Database["public"]["Enums"]["activity_type"]
          user_id?: string | null
        }
        Update: {
          created_at?: string
          group_id?: string | null
          id?: string
          last_used_at?: string | null
          metadata?: Json
          priority?: number | null
          source?: Database["public"]["Enums"]["activity_source"]
          status?: Database["public"]["Enums"]["activity_status"]
          team_id?: string
          type?: Database["public"]["Enums"]["activity_type"]
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "activities_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activities_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      api_keys: {
        Row: {
          created_at: string
          id: string
          key_encrypted: string
          key_hash: string | null
          last_used_at: string | null
          name: string
          scopes: string[]
          team_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          key_encrypted: string
          key_hash?: string | null
          last_used_at?: string | null
          name: string
          scopes?: string[]
          team_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          key_encrypted?: string
          key_hash?: string | null
          last_used_at?: string | null
          name?: string
          scopes?: string[]
          team_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "api_keys_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "api_keys_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      apps: {
        Row: {
          app_id: string
          config: Json | null
          created_at: string | null
          created_by: string | null
          id: string
          settings: Json | null
          team_id: string | null
        }
        Insert: {
          app_id: string
          config?: Json | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          settings?: Json | null
          team_id?: string | null
        }
        Update: {
          app_id?: string
          config?: Json | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          settings?: Json | null
          team_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "apps_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "integrations_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      authors: {
        Row: {
          avatar_url: string | null
          id: string
          name: string
          profile_url: string | null
          slug: string
        }
        Insert: {
          avatar_url?: string | null
          id?: string
          name: string
          profile_url?: string | null
          slug: string
        }
        Update: {
          avatar_url?: string | null
          id?: string
          name?: string
          profile_url?: string | null
          slug?: string
        }
        Relationships: []
      }
      chat_feedback: {
        Row: {
          chat_id: string
          comment: string | null
          created_at: string
          id: string
          message_id: string
          team_id: string
          type: string
          user_id: string
        }
        Insert: {
          chat_id: string
          comment?: string | null
          created_at?: string
          id?: string
          message_id: string
          team_id: string
          type: string
          user_id: string
        }
        Update: {
          chat_id?: string
          comment?: string | null
          created_at?: string
          id?: string
          message_id?: string
          team_id?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_feedback_chat_id_chats_id_fk"
            columns: ["chat_id"]
            isOneToOne: false
            referencedRelation: "chats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_feedback_team_id_teams_id_fk"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_feedback_user_id_users_id_fk"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_messages: {
        Row: {
          chat_id: string
          content: Json
          created_at: string
          id: string
          team_id: string
          user_id: string
        }
        Insert: {
          chat_id: string
          content: Json
          created_at?: string
          id?: string
          team_id: string
          user_id: string
        }
        Update: {
          chat_id?: string
          content?: Json
          created_at?: string
          id?: string
          team_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_chat_id_chats_id_fk"
            columns: ["chat_id"]
            isOneToOne: false
            referencedRelation: "chats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_messages_team_id_teams_id_fk"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_messages_user_id_users_id_fk"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      chats: {
        Row: {
          created_at: string
          id: string
          team_id: string
          title: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id: string
          team_id: string
          title?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          team_id?: string
          title?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chats_team_id_teams_id_fk"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chats_user_id_users_id_fk"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      contents: {
        Row: {
          audio_url: string | null
          content_hash: string
          content_type: string
          duration_seconds: number | null
          extracted_at: string | null
          html_url: string | null
          id: string
          language_code: string | null
          pdf_url: string | null
          raw_item_id: string
          text_body: string | null
          transcript_url: string | null
          transcript_vtt: string | null
          view_count: number | null
        }
        Insert: {
          audio_url?: string | null
          content_hash: string
          content_type: string
          duration_seconds?: number | null
          extracted_at?: string | null
          html_url?: string | null
          id?: string
          language_code?: string | null
          pdf_url?: string | null
          raw_item_id: string
          text_body?: string | null
          transcript_url?: string | null
          transcript_vtt?: string | null
          view_count?: number | null
        }
        Update: {
          audio_url?: string | null
          content_hash?: string
          content_type?: string
          duration_seconds?: number | null
          extracted_at?: string | null
          html_url?: string | null
          id?: string
          language_code?: string | null
          pdf_url?: string | null
          raw_item_id?: string
          text_body?: string | null
          transcript_url?: string | null
          transcript_vtt?: string | null
          view_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "contents_raw_item_id_raw_items_id_fk"
            columns: ["raw_item_id"]
            isOneToOne: false
            referencedRelation: "raw_items"
            referencedColumns: ["id"]
          },
        ]
      }
      highlight_collaborators: {
        Row: {
          created_at: string | null
          highlight_id: string
          id: string
          role: Database["public"]["Enums"]["highlight_collaborator_role"]
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          highlight_id: string
          id?: string
          role?: Database["public"]["Enums"]["highlight_collaborator_role"]
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          highlight_id?: string
          id?: string
          role?: Database["public"]["Enums"]["highlight_collaborator_role"]
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "highlight_collaborators_highlight_id_highlights_id_fk"
            columns: ["highlight_id"]
            isOneToOne: false
            referencedRelation: "highlights"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "highlight_collaborators_user_id_users_id_fk"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      highlight_references: {
        Row: {
          highlight_id: string
          id: string
          source_url: string | null
          turn_id: string
        }
        Insert: {
          highlight_id: string
          id?: string
          source_url?: string | null
          turn_id: string
        }
        Update: {
          highlight_id?: string
          id?: string
          source_url?: string | null
          turn_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "highlight_references_highlight_id_highlights_id_fk"
            columns: ["highlight_id"]
            isOneToOne: false
            referencedRelation: "highlights"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "highlight_references_turn_id_story_turns_id_fk"
            columns: ["turn_id"]
            isOneToOne: false
            referencedRelation: "story_turns"
            referencedColumns: ["id"]
          },
        ]
      }
      highlight_tags: {
        Row: {
          highlight_id: string
          id: string
          tag: string
        }
        Insert: {
          highlight_id: string
          id?: string
          tag: string
        }
        Update: {
          highlight_id?: string
          id?: string
          tag?: string
        }
        Relationships: [
          {
            foreignKeyName: "highlight_tags_highlight_id_highlights_id_fk"
            columns: ["highlight_id"]
            isOneToOne: false
            referencedRelation: "highlights"
            referencedColumns: ["id"]
          },
        ]
      }
      highlights: {
        Row: {
          chapter_id: string | null
          confidence: number | null
          created_at: string | null
          created_by: string
          end_seconds: number | null
          id: string
          is_generated: boolean | null
          kind: Database["public"]["Enums"]["highlight_kind"]
          metadata: Json | null
          origin: Database["public"]["Enums"]["highlight_origin"]
          origin_metadata: Json | null
          quote: string | null
          start_seconds: number | null
          story_id: string
          summary: string | null
          team_id: string | null
          title: string | null
          updated_at: string | null
        }
        Insert: {
          chapter_id?: string | null
          confidence?: number | null
          created_at?: string | null
          created_by: string
          end_seconds?: number | null
          id?: string
          is_generated?: boolean | null
          kind?: Database["public"]["Enums"]["highlight_kind"]
          metadata?: Json | null
          origin?: Database["public"]["Enums"]["highlight_origin"]
          origin_metadata?: Json | null
          quote?: string | null
          start_seconds?: number | null
          story_id: string
          summary?: string | null
          team_id?: string | null
          title?: string | null
          updated_at?: string | null
        }
        Update: {
          chapter_id?: string | null
          confidence?: number | null
          created_at?: string | null
          created_by?: string
          end_seconds?: number | null
          id?: string
          is_generated?: boolean | null
          kind?: Database["public"]["Enums"]["highlight_kind"]
          metadata?: Json | null
          origin?: Database["public"]["Enums"]["highlight_origin"]
          origin_metadata?: Json | null
          quote?: string | null
          start_seconds?: number | null
          story_id?: string
          summary?: string | null
          team_id?: string | null
          title?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "highlights_chapter_id_story_chapters_id_fk"
            columns: ["chapter_id"]
            isOneToOne: false
            referencedRelation: "story_chapters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "highlights_created_by_users_id_fk"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "highlights_story_id_stories_id_fk"
            columns: ["story_id"]
            isOneToOne: false
            referencedRelation: "stories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "highlights_team_id_teams_id_fk"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_settings: {
        Row: {
          channel: string
          created_at: string
          enabled: boolean
          id: string
          notification_type: string
          team_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          channel: string
          created_at?: string
          enabled?: boolean
          id?: string
          notification_type: string
          team_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          channel?: string
          created_at?: string
          enabled?: boolean
          id?: string
          notification_type?: string
          team_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_settings_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notification_settings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string | null
          id: string
          message: string | null
          metadata: Json | null
          read: boolean
          team_id: string
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          message?: string | null
          metadata?: Json | null
          read?: boolean
          team_id: string
          title: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          message?: string | null
          metadata?: Json | null
          read?: boolean
          team_id?: string
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_team_id_teams_id_fk"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_user_id_users_id_fk"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      oauth_access_tokens: {
        Row: {
          application_id: string
          created_at: string
          expires_at: string
          id: string
          last_used_at: string | null
          refresh_token: string | null
          refresh_token_expires_at: string | null
          revoked: boolean | null
          revoked_at: string | null
          scopes: string[]
          team_id: string
          token: string
          user_id: string
        }
        Insert: {
          application_id: string
          created_at?: string
          expires_at: string
          id?: string
          last_used_at?: string | null
          refresh_token?: string | null
          refresh_token_expires_at?: string | null
          revoked?: boolean | null
          revoked_at?: string | null
          scopes: string[]
          team_id: string
          token: string
          user_id: string
        }
        Update: {
          application_id?: string
          created_at?: string
          expires_at?: string
          id?: string
          last_used_at?: string | null
          refresh_token?: string | null
          refresh_token_expires_at?: string | null
          revoked?: boolean | null
          revoked_at?: string | null
          scopes?: string[]
          team_id?: string
          token?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "oauth_access_tokens_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "oauth_applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "oauth_access_tokens_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "oauth_access_tokens_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      oauth_applications: {
        Row: {
          active: boolean | null
          client_id: string
          client_secret: string
          created_at: string
          created_by: string
          description: string | null
          developer_name: string | null
          id: string
          install_url: string | null
          is_public: boolean | null
          logo_url: string | null
          name: string
          overview: string | null
          redirect_uris: string[]
          scopes: string[]
          screenshots: string[] | null
          slug: string
          status: string | null
          team_id: string
          updated_at: string
          website: string | null
        }
        Insert: {
          active?: boolean | null
          client_id: string
          client_secret: string
          created_at?: string
          created_by: string
          description?: string | null
          developer_name?: string | null
          id?: string
          install_url?: string | null
          is_public?: boolean | null
          logo_url?: string | null
          name: string
          overview?: string | null
          redirect_uris: string[]
          scopes?: string[]
          screenshots?: string[] | null
          slug: string
          status?: string | null
          team_id: string
          updated_at?: string
          website?: string | null
        }
        Update: {
          active?: boolean | null
          client_id?: string
          client_secret?: string
          created_at?: string
          created_by?: string
          description?: string | null
          developer_name?: string | null
          id?: string
          install_url?: string | null
          is_public?: boolean | null
          logo_url?: string | null
          name?: string
          overview?: string | null
          redirect_uris?: string[]
          scopes?: string[]
          screenshots?: string[] | null
          slug?: string
          status?: string | null
          team_id?: string
          updated_at?: string
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "oauth_applications_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "oauth_applications_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      oauth_authorization_codes: {
        Row: {
          application_id: string
          code: string
          code_challenge: string | null
          code_challenge_method: string | null
          created_at: string
          expires_at: string
          id: string
          redirect_uri: string
          scopes: string[]
          team_id: string
          used: boolean | null
          user_id: string
        }
        Insert: {
          application_id: string
          code: string
          code_challenge?: string | null
          code_challenge_method?: string | null
          created_at?: string
          expires_at: string
          id?: string
          redirect_uri: string
          scopes: string[]
          team_id: string
          used?: boolean | null
          user_id: string
        }
        Update: {
          application_id?: string
          code?: string
          code_challenge?: string | null
          code_challenge_method?: string | null
          created_at?: string
          expires_at?: string
          id?: string
          redirect_uri?: string
          scopes?: string[]
          team_id?: string
          used?: boolean | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "oauth_authorization_codes_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "oauth_applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "oauth_authorization_codes_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "oauth_authorization_codes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_quota: {
        Row: {
          provider: string
          quota_limit: number | null
          remaining: number | null
          reset_at: string | null
          updated_at: string | null
          used: number | null
        }
        Insert: {
          provider: string
          quota_limit?: number | null
          remaining?: number | null
          reset_at?: string | null
          updated_at?: string | null
          used?: number | null
        }
        Update: {
          provider?: string
          quota_limit?: number | null
          remaining?: number | null
          reset_at?: string | null
          updated_at?: string | null
          used?: number | null
        }
        Relationships: []
      }
      playbook_outputs: {
        Row: {
          created_at: string | null
          external_url: string | null
          id: string
          metadata: Json | null
          output_type: string
          playbook_id: string
        }
        Insert: {
          created_at?: string | null
          external_url?: string | null
          id?: string
          metadata?: Json | null
          output_type: string
          playbook_id: string
        }
        Update: {
          created_at?: string | null
          external_url?: string | null
          id?: string
          metadata?: Json | null
          output_type?: string
          playbook_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "playbook_outputs_playbook_id_playbooks_id_fk"
            columns: ["playbook_id"]
            isOneToOne: false
            referencedRelation: "playbooks"
            referencedColumns: ["id"]
          },
        ]
      }
      playbook_run_events: {
        Row: {
          created_at: string | null
          detail: Json | null
          event_type: string
          id: string
          run_id: string
          step_id: string | null
        }
        Insert: {
          created_at?: string | null
          detail?: Json | null
          event_type: string
          id?: string
          run_id: string
          step_id?: string | null
        }
        Update: {
          created_at?: string | null
          detail?: Json | null
          event_type?: string
          id?: string
          run_id?: string
          step_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "playbook_run_events_run_id_playbook_runs_id_fk"
            columns: ["run_id"]
            isOneToOne: false
            referencedRelation: "playbook_runs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "playbook_run_events_step_id_playbook_steps_id_fk"
            columns: ["step_id"]
            isOneToOne: false
            referencedRelation: "playbook_steps"
            referencedColumns: ["id"]
          },
        ]
      }
      playbook_runs: {
        Row: {
          completed_at: string | null
          id: string
          metadata: Json | null
          playbook_id: string
          started_at: string | null
          status: Database["public"]["Enums"]["playbook_run_status"]
          team_id: string
          trigger_source: string | null
          triggered_by: string | null
        }
        Insert: {
          completed_at?: string | null
          id?: string
          metadata?: Json | null
          playbook_id: string
          started_at?: string | null
          status?: Database["public"]["Enums"]["playbook_run_status"]
          team_id: string
          trigger_source?: string | null
          triggered_by?: string | null
        }
        Update: {
          completed_at?: string | null
          id?: string
          metadata?: Json | null
          playbook_id?: string
          started_at?: string | null
          status?: Database["public"]["Enums"]["playbook_run_status"]
          team_id?: string
          trigger_source?: string | null
          triggered_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "playbook_runs_playbook_id_playbooks_id_fk"
            columns: ["playbook_id"]
            isOneToOne: false
            referencedRelation: "playbooks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "playbook_runs_team_id_teams_id_fk"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "playbook_runs_triggered_by_users_id_fk"
            columns: ["triggered_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      playbook_step_highlights: {
        Row: {
          highlight_id: string
          id: string
          playbook_step_id: string
        }
        Insert: {
          highlight_id: string
          id?: string
          playbook_step_id: string
        }
        Update: {
          highlight_id?: string
          id?: string
          playbook_step_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "playbook_step_highlights_highlight_id_highlights_id_fk"
            columns: ["highlight_id"]
            isOneToOne: false
            referencedRelation: "highlights"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "playbook_step_highlights_playbook_step_id_playbook_steps_id_fk"
            columns: ["playbook_step_id"]
            isOneToOne: false
            referencedRelation: "playbook_steps"
            referencedColumns: ["id"]
          },
        ]
      }
      playbook_steps: {
        Row: {
          assigned_to: string | null
          completed_at: string | null
          content: string | null
          id: string
          playbook_id: string
          position: number
          status: Database["public"]["Enums"]["step_status"]
          template_step_id: string | null
        }
        Insert: {
          assigned_to?: string | null
          completed_at?: string | null
          content?: string | null
          id?: string
          playbook_id: string
          position?: number
          status?: Database["public"]["Enums"]["step_status"]
          template_step_id?: string | null
        }
        Update: {
          assigned_to?: string | null
          completed_at?: string | null
          content?: string | null
          id?: string
          playbook_id?: string
          position?: number
          status?: Database["public"]["Enums"]["step_status"]
          template_step_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "playbook_steps_assigned_to_users_id_fk"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "playbook_steps_playbook_id_playbooks_id_fk"
            columns: ["playbook_id"]
            isOneToOne: false
            referencedRelation: "playbooks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "playbook_steps_template_step_id_playbook_template_steps_id_fk"
            columns: ["template_step_id"]
            isOneToOne: false
            referencedRelation: "playbook_template_steps"
            referencedColumns: ["id"]
          },
        ]
      }
      playbook_template_steps: {
        Row: {
          default_payload: Json | null
          id: string
          output_type: string | null
          position: number
          template_id: string
          title: string
        }
        Insert: {
          default_payload?: Json | null
          id?: string
          output_type?: string | null
          position?: number
          template_id: string
          title: string
        }
        Update: {
          default_payload?: Json | null
          id?: string
          output_type?: string | null
          position?: number
          template_id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "playbook_template_steps_template_id_playbook_templates_id_fk"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "playbook_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      playbook_templates: {
        Row: {
          created_at: string | null
          created_by: string
          default_channel: string | null
          description: string | null
          id: string
          is_public: boolean | null
          metadata: Json | null
          target_role: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by: string
          default_channel?: string | null
          description?: string | null
          id?: string
          is_public?: boolean | null
          metadata?: Json | null
          target_role?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string
          default_channel?: string | null
          description?: string | null
          id?: string
          is_public?: boolean | null
          metadata?: Json | null
          target_role?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "playbook_templates_created_by_users_id_fk"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      playbooks: {
        Row: {
          created_at: string | null
          created_by: string
          id: string
          published_at: string | null
          status: Database["public"]["Enums"]["playbook_status"]
          story_id: string | null
          team_id: string
          template_id: string | null
        }
        Insert: {
          created_at?: string | null
          created_by: string
          id?: string
          published_at?: string | null
          status?: Database["public"]["Enums"]["playbook_status"]
          story_id?: string | null
          team_id: string
          template_id?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string
          id?: string
          published_at?: string | null
          status?: Database["public"]["Enums"]["playbook_status"]
          story_id?: string | null
          team_id?: string
          template_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "playbooks_created_by_users_id_fk"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "playbooks_story_id_stories_id_fk"
            columns: ["story_id"]
            isOneToOne: false
            referencedRelation: "stories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "playbooks_team_id_teams_id_fk"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "playbooks_template_id_playbook_templates_id_fk"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "playbook_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      raw_items: {
        Row: {
          created_at: string | null
          external_id: string
          id: string
          kind: string
          metadata: Json | null
          published_at: string | null
          source_id: string
          status: string
          title: string | null
          updated_at: string | null
          url: string | null
        }
        Insert: {
          created_at?: string | null
          external_id: string
          id?: string
          kind?: string
          metadata?: Json | null
          published_at?: string | null
          source_id: string
          status?: string
          title?: string | null
          updated_at?: string | null
          url?: string | null
        }
        Update: {
          created_at?: string | null
          external_id?: string
          id?: string
          kind?: string
          metadata?: Json | null
          published_at?: string | null
          source_id?: string
          status?: string
          title?: string | null
          updated_at?: string | null
          url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "raw_items_source_id_sources_id_fk"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "sources"
            referencedColumns: ["id"]
          },
        ]
      }
      source_connections: {
        Row: {
          filters: Json | null
          id: string
          last_synced_at: string | null
          source_id: string
          sync_status: string | null
          team_id: string
        }
        Insert: {
          filters?: Json | null
          id?: string
          last_synced_at?: string | null
          source_id: string
          sync_status?: string | null
          team_id: string
        }
        Update: {
          filters?: Json | null
          id?: string
          last_synced_at?: string | null
          source_id?: string
          sync_status?: string | null
          team_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "source_connections_source_id_sources_id_fk"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "sources"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "source_connections_team_id_teams_id_fk"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      source_health: {
        Row: {
          last_error_at: string | null
          last_success_at: string | null
          message: string | null
          source_id: string
          status: Database["public"]["Enums"]["health_status"]
          updated_at: string | null
        }
        Insert: {
          last_error_at?: string | null
          last_success_at?: string | null
          message?: string | null
          source_id: string
          status: Database["public"]["Enums"]["health_status"]
          updated_at?: string | null
        }
        Update: {
          last_error_at?: string | null
          last_success_at?: string | null
          message?: string | null
          source_id?: string
          status?: Database["public"]["Enums"]["health_status"]
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "source_health_source_id_sources_id_fk"
            columns: ["source_id"]
            isOneToOne: true
            referencedRelation: "sources"
            referencedColumns: ["id"]
          },
        ]
      }
      sources: {
        Row: {
          authority_score: number | null
          created_at: string | null
          id: string
          is_active: boolean | null
          metadata: Json | null
          name: string | null
          type: string
          updated_at: string | null
          url: string | null
        }
        Insert: {
          authority_score?: number | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          metadata?: Json | null
          name?: string | null
          type: string
          updated_at?: string | null
          url?: string | null
        }
        Update: {
          authority_score?: number | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          metadata?: Json | null
          name?: string | null
          type?: string
          updated_at?: string | null
          url?: string | null
        }
        Relationships: []
      }
      stories: {
        Row: {
          cluster_id: string | null
          content_id: string
          created_at: string | null
          id: string
          kind: Database["public"]["Enums"]["story_kind"]
          primary_source_id: string | null
          primary_url: string | null
          published_at: string | null
          summary: string | null
          title: string | null
          updated_at: string | null
        }
        Insert: {
          cluster_id?: string | null
          content_id: string
          created_at?: string | null
          id?: string
          kind?: Database["public"]["Enums"]["story_kind"]
          primary_source_id?: string | null
          primary_url?: string | null
          published_at?: string | null
          summary?: string | null
          title?: string | null
          updated_at?: string | null
        }
        Update: {
          cluster_id?: string | null
          content_id?: string
          created_at?: string | null
          id?: string
          kind?: Database["public"]["Enums"]["story_kind"]
          primary_source_id?: string | null
          primary_url?: string | null
          published_at?: string | null
          summary?: string | null
          title?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "stories_cluster_id_story_clusters_id_fk"
            columns: ["cluster_id"]
            isOneToOne: false
            referencedRelation: "story_clusters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stories_content_id_contents_id_fk"
            columns: ["content_id"]
            isOneToOne: false
            referencedRelation: "contents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stories_primary_source_id_sources_id_fk"
            columns: ["primary_source_id"]
            isOneToOne: false
            referencedRelation: "sources"
            referencedColumns: ["id"]
          },
        ]
      }
      story_assets: {
        Row: {
          asset_type: string
          external_url: string
          id: string
          metadata: Json | null
          story_id: string
        }
        Insert: {
          asset_type: string
          external_url: string
          id?: string
          metadata?: Json | null
          story_id: string
        }
        Update: {
          asset_type?: string
          external_url?: string
          id?: string
          metadata?: Json | null
          story_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "story_assets_story_id_stories_id_fk"
            columns: ["story_id"]
            isOneToOne: false
            referencedRelation: "stories"
            referencedColumns: ["id"]
          },
        ]
      }
      story_authors: {
        Row: {
          author_id: string
          position: number
          role: string | null
          story_id: string
        }
        Insert: {
          author_id: string
          position?: number
          role?: string | null
          story_id: string
        }
        Update: {
          author_id?: string
          position?: number
          role?: string | null
          story_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "story_authors_author_id_authors_id_fk"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "authors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "story_authors_story_id_stories_id_fk"
            columns: ["story_id"]
            isOneToOne: false
            referencedRelation: "stories"
            referencedColumns: ["id"]
          },
        ]
      }
      story_categories: {
        Row: {
          description: string | null
          id: string
          name: string
          slug: string
        }
        Insert: {
          description?: string | null
          id?: string
          name: string
          slug: string
        }
        Update: {
          description?: string | null
          id?: string
          name?: string
          slug?: string
        }
        Relationships: []
      }
      story_category_links: {
        Row: {
          category_id: string
          story_id: string
        }
        Insert: {
          category_id: string
          story_id: string
        }
        Update: {
          category_id?: string
          story_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "story_category_links_category_id_story_categories_id_fk"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "story_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "story_category_links_story_id_stories_id_fk"
            columns: ["story_id"]
            isOneToOne: false
            referencedRelation: "stories"
            referencedColumns: ["id"]
          },
        ]
      }
      story_chapters: {
        Row: {
          end_seconds: number | null
          id: string
          position: number
          start_seconds: number | null
          story_id: string
          summary: string | null
          title: string | null
        }
        Insert: {
          end_seconds?: number | null
          id?: string
          position?: number
          start_seconds?: number | null
          story_id: string
          summary?: string | null
          title?: string | null
        }
        Update: {
          end_seconds?: number | null
          id?: string
          position?: number
          start_seconds?: number | null
          story_id?: string
          summary?: string | null
          title?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "story_chapters_story_id_stories_id_fk"
            columns: ["story_id"]
            isOneToOne: false
            referencedRelation: "stories"
            referencedColumns: ["id"]
          },
        ]
      }
      story_clusters: {
        Row: {
          cluster_key: string
          created_at: string | null
          id: string
          label: string | null
          metrics: Json | null
          primary_story_id: string | null
          updated_at: string | null
        }
        Insert: {
          cluster_key: string
          created_at?: string | null
          id?: string
          label?: string | null
          metrics?: Json | null
          primary_story_id?: string | null
          updated_at?: string | null
        }
        Update: {
          cluster_key?: string
          created_at?: string | null
          id?: string
          label?: string | null
          metrics?: Json | null
          primary_story_id?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      story_embeddings: {
        Row: {
          embedding: string | null
          model_version: string | null
          story_id: string
          updated_at: string | null
        }
        Insert: {
          embedding?: string | null
          model_version?: string | null
          story_id: string
          updated_at?: string | null
        }
        Update: {
          embedding?: string | null
          model_version?: string | null
          story_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "story_embeddings_story_id_stories_id_fk"
            columns: ["story_id"]
            isOneToOne: true
            referencedRelation: "stories"
            referencedColumns: ["id"]
          },
        ]
      }
      story_notes: {
        Row: {
          body: string
          created_at: string | null
          id: string
          story_id: string
          team_id: string
          updated_at: string | null
          user_id: string
          visibility: string
        }
        Insert: {
          body: string
          created_at?: string | null
          id?: string
          story_id: string
          team_id: string
          updated_at?: string | null
          user_id: string
          visibility?: string
        }
        Update: {
          body?: string
          created_at?: string | null
          id?: string
          story_id?: string
          team_id?: string
          updated_at?: string | null
          user_id?: string
          visibility?: string
        }
        Relationships: [
          {
            foreignKeyName: "story_notes_story_id_stories_id_fk"
            columns: ["story_id"]
            isOneToOne: false
            referencedRelation: "stories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "story_notes_team_id_teams_id_fk"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "story_notes_user_id_users_id_fk"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      story_overlays: {
        Row: {
          analysis_state: string | null
          analyzed_at: string | null
          brief_elevator: string | null
          brief_generated_at: string | null
          brief_one_liner: string | null
          brief_two_liner: string | null
          citations: Json | null
          confidence: number | null
          story_id: string
          time_saved_seconds: number | null
          why_it_matters: string | null
        }
        Insert: {
          analysis_state?: string | null
          analyzed_at?: string | null
          brief_elevator?: string | null
          brief_generated_at?: string | null
          brief_one_liner?: string | null
          brief_two_liner?: string | null
          citations?: Json | null
          confidence?: number | null
          story_id: string
          time_saved_seconds?: number | null
          why_it_matters?: string | null
        }
        Update: {
          analysis_state?: string | null
          analyzed_at?: string | null
          brief_elevator?: string | null
          brief_generated_at?: string | null
          brief_one_liner?: string | null
          brief_two_liner?: string | null
          citations?: Json | null
          confidence?: number | null
          story_id?: string
          time_saved_seconds?: number | null
          why_it_matters?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "story_overlays_story_id_stories_id_fk"
            columns: ["story_id"]
            isOneToOne: true
            referencedRelation: "stories"
            referencedColumns: ["id"]
          },
        ]
      }
      story_tag_embeddings: {
        Row: {
          embedding: string | null
          model_version: string
          tag_id: string
          updated_at: string | null
        }
        Insert: {
          embedding?: string | null
          model_version: string
          tag_id: string
          updated_at?: string | null
        }
        Update: {
          embedding?: string | null
          model_version?: string
          tag_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "story_tag_embeddings_tag_id_story_tags_id_fk"
            columns: ["tag_id"]
            isOneToOne: true
            referencedRelation: "story_tags"
            referencedColumns: ["id"]
          },
        ]
      }
      story_tags: {
        Row: {
          created_at: string | null
          created_by: string | null
          id: string
          story_id: string
          tag: string
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          story_id: string
          tag: string
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          story_id?: string
          tag?: string
        }
        Relationships: [
          {
            foreignKeyName: "story_tags_created_by_users_id_fk"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "story_tags_story_id_stories_id_fk"
            columns: ["story_id"]
            isOneToOne: false
            referencedRelation: "stories"
            referencedColumns: ["id"]
          },
        ]
      }
      story_turns: {
        Row: {
          chapter_id: string | null
          content: string | null
          end_seconds: number | null
          id: string
          position: number
          speaker: string | null
          start_seconds: number | null
          story_id: string
        }
        Insert: {
          chapter_id?: string | null
          content?: string | null
          end_seconds?: number | null
          id?: string
          position?: number
          speaker?: string | null
          start_seconds?: number | null
          story_id: string
        }
        Update: {
          chapter_id?: string | null
          content?: string | null
          end_seconds?: number | null
          id?: string
          position?: number
          speaker?: string | null
          start_seconds?: number | null
          story_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "story_turns_chapter_id_story_chapters_id_fk"
            columns: ["chapter_id"]
            isOneToOne: false
            referencedRelation: "story_chapters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "story_turns_story_id_stories_id_fk"
            columns: ["story_id"]
            isOneToOne: false
            referencedRelation: "stories"
            referencedColumns: ["id"]
          },
        ]
      }
      tags: {
        Row: {
          created_at: string
          id: string
          name: string
          team_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          team_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          team_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tags_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      team_highlight_states: {
        Row: {
          highlight_id: string
          id: string
          pinned_by: string | null
          shared_at: string | null
          shared_by: string | null
          shared_scope: Database["public"]["Enums"]["highlight_share_scope"]
          state: string | null
          team_id: string
          updated_at: string | null
        }
        Insert: {
          highlight_id: string
          id?: string
          pinned_by?: string | null
          shared_at?: string | null
          shared_by?: string | null
          shared_scope?: Database["public"]["Enums"]["highlight_share_scope"]
          state?: string | null
          team_id: string
          updated_at?: string | null
        }
        Update: {
          highlight_id?: string
          id?: string
          pinned_by?: string | null
          shared_at?: string | null
          shared_by?: string | null
          shared_scope?: Database["public"]["Enums"]["highlight_share_scope"]
          state?: string | null
          team_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "team_highlight_states_highlight_id_highlights_id_fk"
            columns: ["highlight_id"]
            isOneToOne: false
            referencedRelation: "highlights"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_highlight_states_pinned_by_users_id_fk"
            columns: ["pinned_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_highlight_states_shared_by_users_id_fk"
            columns: ["shared_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_highlight_states_team_id_teams_id_fk"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      team_story_states: {
        Row: {
          id: string
          last_viewed_at: string | null
          pinned: boolean | null
          rating: number | null
          state: string | null
          story_id: string
          team_id: string
        }
        Insert: {
          id?: string
          last_viewed_at?: string | null
          pinned?: boolean | null
          rating?: number | null
          state?: string | null
          story_id: string
          team_id: string
        }
        Update: {
          id?: string
          last_viewed_at?: string | null
          pinned?: boolean | null
          rating?: number | null
          state?: string | null
          story_id?: string
          team_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_story_states_story_id_stories_id_fk"
            columns: ["story_id"]
            isOneToOne: false
            referencedRelation: "stories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_story_states_team_id_teams_id_fk"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      teams: {
        Row: {
          canceled_at: string | null
          created_at: string
          email: string | null
          id: string
          logo_url: string | null
          name: string | null
          plan: Database["public"]["Enums"]["plans"]
        }
        Insert: {
          canceled_at?: string | null
          created_at?: string
          email?: string | null
          id?: string
          logo_url?: string | null
          name?: string | null
          plan?: Database["public"]["Enums"]["plans"]
        }
        Update: {
          canceled_at?: string | null
          created_at?: string
          email?: string | null
          id?: string
          logo_url?: string | null
          name?: string | null
          plan?: Database["public"]["Enums"]["plans"]
        }
        Relationships: []
      }
      user_invites: {
        Row: {
          code: string | null
          created_at: string
          email: string | null
          id: string
          invited_by: string | null
          role: Database["public"]["Enums"]["teamRoles"] | null
          team_id: string | null
        }
        Insert: {
          code?: string | null
          created_at?: string
          email?: string | null
          id?: string
          invited_by?: string | null
          role?: Database["public"]["Enums"]["teamRoles"] | null
          team_id?: string | null
        }
        Update: {
          code?: string | null
          created_at?: string
          email?: string | null
          id?: string
          invited_by?: string | null
          role?: Database["public"]["Enums"]["teamRoles"] | null
          team_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "public_user_invites_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_invites_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          date_format: string | null
          email: string | null
          full_name: string | null
          id: string
          locale: string | null
          team_id: string | null
          time_format: number | null
          timezone: string | null
          timezone_auto_sync: boolean | null
          week_starts_on_monday: boolean | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          date_format?: string | null
          email?: string | null
          full_name?: string | null
          id: string
          locale?: string | null
          team_id?: string | null
          time_format?: number | null
          timezone?: string | null
          timezone_auto_sync?: boolean | null
          week_starts_on_monday?: boolean | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          date_format?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          locale?: string | null
          team_id?: string | null
          time_format?: number | null
          timezone?: string | null
          timezone_auto_sync?: boolean | null
          week_starts_on_monday?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "users_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "users_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      users_on_team: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["teamRoles"] | null
          team_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["teamRoles"] | null
          team_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["teamRoles"] | null
          team_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "users_on_team_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "users_on_team_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      gtrgm_compress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gtrgm_decompress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gtrgm_in: {
        Args: { "": unknown }
        Returns: unknown
      }
      gtrgm_options: {
        Args: { "": unknown }
        Returns: undefined
      }
      gtrgm_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      set_limit: {
        Args: { "": number }
        Returns: number
      }
      show_limit: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      show_trgm: {
        Args: { "": string }
        Returns: string[]
      }
    }
    Enums: {
      activity_source: "system" | "user"
      activity_status: "unread" | "read" | "archived"
      activity_type:
        | "story_published"
        | "story_pinned"
        | "highlight_created"
        | "highlight_pinned"
        | "playbook_created"
        | "playbook_published"
        | "goal_created"
        | "goal_completed"
        | "subscription_upgraded"
        | "subscription_downgraded"
      health_status: "ok" | "warn" | "error"
      highlight_collaborator_role: "viewer" | "editor"
      highlight_kind:
        | "insight"
        | "quote"
        | "action"
        | "question"
        | "code_example"
        | "code_change"
        | "api_change"
        | "metric"
      highlight_origin: "user" | "system"
      highlight_share_scope: "private" | "team" | "public"
      invite_status: "pending" | "accepted" | "expired" | "revoked"
      plan_code: "trial" | "starter" | "pro" | "enterprise"
      plans: "trial" | "starter" | "pro"
      playbook_run_status:
        | "pending"
        | "running"
        | "succeeded"
        | "failed"
        | "cancelled"
      playbook_status: "draft" | "active" | "published" | "archived"
      step_status: "pending" | "in_progress" | "completed" | "skipped"
      story_kind: "article" | "video" | "podcast" | "pdf" | "tweet"
      subscription_status:
        | "active"
        | "canceled"
        | "past_due"
        | "unpaid"
        | "trialing"
        | "incomplete"
        | "incomplete_expired"
      team_role: "owner" | "admin" | "member" | "viewer"
      teamRoles: "owner" | "member"
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
      activity_source: ["system", "user"],
      activity_status: ["unread", "read", "archived"],
      activity_type: [
        "story_published",
        "story_pinned",
        "highlight_created",
        "highlight_pinned",
        "playbook_created",
        "playbook_published",
        "goal_created",
        "goal_completed",
        "subscription_upgraded",
        "subscription_downgraded",
      ],
      health_status: ["ok", "warn", "error"],
      highlight_collaborator_role: ["viewer", "editor"],
      highlight_kind: [
        "insight",
        "quote",
        "action",
        "question",
        "code_example",
        "code_change",
        "api_change",
        "metric",
      ],
      highlight_origin: ["user", "system"],
      highlight_share_scope: ["private", "team", "public"],
      invite_status: ["pending", "accepted", "expired", "revoked"],
      plan_code: ["trial", "starter", "pro", "enterprise"],
      plans: ["trial", "starter", "pro"],
      playbook_run_status: [
        "pending",
        "running",
        "succeeded",
        "failed",
        "cancelled",
      ],
      playbook_status: ["draft", "active", "published", "archived"],
      step_status: ["pending", "in_progress", "completed", "skipped"],
      story_kind: ["article", "video", "podcast", "pdf", "tweet"],
      subscription_status: [
        "active",
        "canceled",
        "past_due",
        "unpaid",
        "trialing",
        "incomplete",
        "incomplete_expired",
      ],
      team_role: ["owner", "admin", "member", "viewer"],
      teamRoles: ["owner", "member"],
    },
  },
} as const
