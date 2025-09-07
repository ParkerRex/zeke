// TODO: this file is duplicated in other places.
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      clusters: {
        Row: {
          cluster_key: string;
          created_at: string | null;
          representative_story_id: string | null;
        };
        Insert: {
          cluster_key: string;
          created_at?: string | null;
          representative_story_id?: string | null;
        };
        Update: {
          cluster_key?: string;
          created_at?: string | null;
          representative_story_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "clusters_representative_story_id_fkey";
            columns: ["representative_story_id"];
            isOneToOne: false;
            referencedRelation: "stories";
            referencedColumns: ["id"];
          },
        ];
      };
      contents: {
        Row: {
          audio_url: string | null;
          content_hash: string;
          duration_seconds: number | null;
          extracted_at: string | null;
          html_url: string | null;
          id: string;
          lang: string | null;
          pdf_url: string | null;
          raw_item_id: string;
          text: string | null;
          transcript_url: string | null;
          transcript_vtt: string | null;
          view_count: number | null;
        };
        Insert: {
          audio_url?: string | null;
          content_hash: string;
          duration_seconds?: number | null;
          extracted_at?: string | null;
          html_url?: string | null;
          id?: string;
          lang?: string | null;
          pdf_url?: string | null;
          raw_item_id: string;
          text?: string | null;
          transcript_url?: string | null;
          transcript_vtt?: string | null;
          view_count?: number | null;
        };
        Update: {
          audio_url?: string | null;
          content_hash?: string;
          duration_seconds?: number | null;
          extracted_at?: string | null;
          html_url?: string | null;
          id?: string;
          lang?: string | null;
          pdf_url?: string | null;
          raw_item_id?: string;
          text?: string | null;
          transcript_url?: string | null;
          transcript_vtt?: string | null;
          view_count?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "contents_raw_item_id_fkey";
            columns: ["raw_item_id"];
            isOneToOne: false;
            referencedRelation: "raw_items";
            referencedColumns: ["id"];
          },
        ];
      };
      customers: {
        Row: {
          id: string;
          stripe_customer_id: string | null;
        };
        Insert: {
          id: string;
          stripe_customer_id?: string | null;
        };
        Update: {
          id?: string;
          stripe_customer_id?: string | null;
        };
        Relationships: [];
      };
      highlights: {
        Row: {
          content_id: string;
          created_at: string | null;
          id: string;
          span: Json;
          story_id: string;
          user_id: string;
        };
        Insert: {
          content_id: string;
          created_at?: string | null;
          id?: string;
          span: Json;
          story_id: string;
          user_id: string;
        };
        Update: {
          content_id?: string;
          created_at?: string | null;
          id?: string;
          span?: Json;
          story_id?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "highlights_content_id_fkey";
            columns: ["content_id"];
            isOneToOne: false;
            referencedRelation: "contents";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "highlights_story_id_fkey";
            columns: ["story_id"];
            isOneToOne: false;
            referencedRelation: "stories";
            referencedColumns: ["id"];
          },
        ];
      };
      job_metrics: {
        Row: {
          count: number;
          name: string;
          state: string;
          updated_at: string;
        };
        Insert: {
          count?: number;
          name: string;
          state: string;
          updated_at?: string;
        };
        Update: {
          count?: number;
          name?: string;
          state?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      platform_quota: {
        Row: {
          provider: string;
          quota_limit: number | null;
          remaining: number | null;
          reset_at: string | null;
          updated_at: string;
          used: number | null;
        };
        Insert: {
          provider: string;
          quota_limit?: number | null;
          remaining?: number | null;
          reset_at?: string | null;
          updated_at?: string;
          used?: number | null;
        };
        Update: {
          provider?: string;
          quota_limit?: number | null;
          remaining?: number | null;
          reset_at?: string | null;
          updated_at?: string;
          used?: number | null;
        };
        Relationships: [];
      };
      prices: {
        Row: {
          active: boolean | null;
          currency: string | null;
          description: string | null;
          id: string;
          interval: Database["public"]["Enums"]["pricing_plan_interval"] | null;
          interval_count: number | null;
          metadata: Json | null;
          product_id: string | null;
          trial_period_days: number | null;
          type: Database["public"]["Enums"]["pricing_type"] | null;
          unit_amount: number | null;
        };
        Insert: {
          active?: boolean | null;
          currency?: string | null;
          description?: string | null;
          id: string;
          interval?:
            | Database["public"]["Enums"]["pricing_plan_interval"]
            | null;
          interval_count?: number | null;
          metadata?: Json | null;
          product_id?: string | null;
          trial_period_days?: number | null;
          type?: Database["public"]["Enums"]["pricing_type"] | null;
          unit_amount?: number | null;
        };
        Update: {
          active?: boolean | null;
          currency?: string | null;
          description?: string | null;
          id?: string;
          interval?:
            | Database["public"]["Enums"]["pricing_plan_interval"]
            | null;
          interval_count?: number | null;
          metadata?: Json | null;
          product_id?: string | null;
          trial_period_days?: number | null;
          type?: Database["public"]["Enums"]["pricing_type"] | null;
          unit_amount?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "prices_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
        ];
      };
      products: {
        Row: {
          active: boolean | null;
          description: string | null;
          id: string;
          image: string | null;
          metadata: Json | null;
          name: string | null;
        };
        Insert: {
          active?: boolean | null;
          description?: string | null;
          id: string;
          image?: string | null;
          metadata?: Json | null;
          name?: string | null;
        };
        Update: {
          active?: boolean | null;
          description?: string | null;
          id?: string;
          image?: string | null;
          metadata?: Json | null;
          name?: string | null;
        };
        Relationships: [];
      };
      raw_items: {
        Row: {
          attempts: number | null;
          discovered_at: string | null;
          error: string | null;
          external_id: string;
          id: string;
          kind: string | null;
          metadata: Json | null;
          source_id: string;
          status: string | null;
          title: string | null;
          url: string;
        };
        Insert: {
          attempts?: number | null;
          discovered_at?: string | null;
          error?: string | null;
          external_id: string;
          id?: string;
          kind?: string | null;
          metadata?: Json | null;
          source_id: string;
          status?: string | null;
          title?: string | null;
          url: string;
        };
        Update: {
          attempts?: number | null;
          discovered_at?: string | null;
          error?: string | null;
          external_id?: string;
          id?: string;
          kind?: string | null;
          metadata?: Json | null;
          source_id?: string;
          status?: string | null;
          title?: string | null;
          url?: string;
        };
        Relationships: [
          {
            foreignKeyName: "raw_items_source_id_fkey";
            columns: ["source_id"];
            isOneToOne: false;
            referencedRelation: "sources";
            referencedColumns: ["id"];
          },
        ];
      };
      source_health: {
        Row: {
          error_24h: number | null;
          last_error_at: string | null;
          last_success_at: string | null;
          message: string | null;
          source_id: string;
          status: Database["public"]["Enums"]["health_status"];
          updated_at: string;
        };
        Insert: {
          error_24h?: number | null;
          last_error_at?: string | null;
          last_success_at?: string | null;
          message?: string | null;
          source_id: string;
          status?: Database["public"]["Enums"]["health_status"];
          updated_at?: string;
        };
        Update: {
          error_24h?: number | null;
          last_error_at?: string | null;
          last_success_at?: string | null;
          message?: string | null;
          source_id?: string;
          status?: Database["public"]["Enums"]["health_status"];
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "source_health_source_id_fkey";
            columns: ["source_id"];
            isOneToOne: true;
            referencedRelation: "sources";
            referencedColumns: ["id"];
          },
        ];
      };
      source_metrics: {
        Row: {
          contents_24h: number | null;
          contents_total: number | null;
          last_content_at: string | null;
          last_raw_at: string | null;
          last_story_at: string | null;
          raw_24h: number | null;
          raw_total: number | null;
          source_id: string;
          stories_24h: number | null;
          stories_total: number | null;
          updated_at: string;
        };
        Insert: {
          contents_24h?: number | null;
          contents_total?: number | null;
          last_content_at?: string | null;
          last_raw_at?: string | null;
          last_story_at?: string | null;
          raw_24h?: number | null;
          raw_total?: number | null;
          source_id: string;
          stories_24h?: number | null;
          stories_total?: number | null;
          updated_at?: string;
        };
        Update: {
          contents_24h?: number | null;
          contents_total?: number | null;
          last_content_at?: string | null;
          last_raw_at?: string | null;
          last_story_at?: string | null;
          raw_24h?: number | null;
          raw_total?: number | null;
          source_id?: string;
          stories_24h?: number | null;
          stories_total?: number | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "source_metrics_source_id_fkey";
            columns: ["source_id"];
            isOneToOne: true;
            referencedRelation: "sources";
            referencedColumns: ["id"];
          },
        ];
      };
      sources: {
        Row: {
          active: boolean;
          authority_score: number | null;
          created_at: string;
          domain: string | null;
          id: string;
          kind: string;
          last_checked: string | null;
          last_cursor: Json | null;
          metadata: Json | null;
          name: string | null;
          updated_at: string;
          url: string | null;
        };
        Insert: {
          active?: boolean;
          authority_score?: number | null;
          created_at?: string;
          domain?: string | null;
          id?: string;
          kind: string;
          last_checked?: string | null;
          last_cursor?: Json | null;
          metadata?: Json | null;
          name?: string | null;
          updated_at?: string;
          url?: string | null;
        };
        Update: {
          active?: boolean;
          authority_score?: number | null;
          created_at?: string;
          domain?: string | null;
          id?: string;
          kind?: string;
          last_checked?: string | null;
          last_cursor?: Json | null;
          metadata?: Json | null;
          name?: string | null;
          updated_at?: string;
          url?: string | null;
        };
        Relationships: [];
      };
      stories: {
        Row: {
          canonical_url: string | null;
          cluster_key: string | null;
          content_id: string;
          created_at: string | null;
          id: string;
          kind: string | null;
          primary_url: string | null;
          published_at: string | null;
          title: string | null;
        };
        Insert: {
          canonical_url?: string | null;
          cluster_key?: string | null;
          content_id: string;
          created_at?: string | null;
          id?: string;
          kind?: string | null;
          primary_url?: string | null;
          published_at?: string | null;
          title?: string | null;
        };
        Update: {
          canonical_url?: string | null;
          cluster_key?: string | null;
          content_id?: string;
          created_at?: string | null;
          id?: string;
          kind?: string | null;
          primary_url?: string | null;
          published_at?: string | null;
          title?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "stories_content_id_fkey";
            columns: ["content_id"];
            isOneToOne: true;
            referencedRelation: "contents";
            referencedColumns: ["id"];
          },
        ];
      };
      story_embeddings: {
        Row: {
          embedding: string;
          model_version: string | null;
          story_id: string;
        };
        Insert: {
          embedding: string;
          model_version?: string | null;
          story_id: string;
        };
        Update: {
          embedding?: string;
          model_version?: string | null;
          story_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "story_embeddings_story_id_fkey";
            columns: ["story_id"];
            isOneToOne: true;
            referencedRelation: "stories";
            referencedColumns: ["id"];
          },
        ];
      };
      story_overlays: {
        Row: {
          analyzed_at: string | null;
          chili: number | null;
          citations: Json | null;
          confidence: number | null;
          model_version: string | null;
          story_id: string;
          why_it_matters: string | null;
        };
        Insert: {
          analyzed_at?: string | null;
          chili?: number | null;
          citations?: Json | null;
          confidence?: number | null;
          model_version?: string | null;
          story_id: string;
          why_it_matters?: string | null;
        };
        Update: {
          analyzed_at?: string | null;
          chili?: number | null;
          citations?: Json | null;
          confidence?: number | null;
          model_version?: string | null;
          story_id?: string;
          why_it_matters?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "story_overlays_story_id_fkey";
            columns: ["story_id"];
            isOneToOne: true;
            referencedRelation: "stories";
            referencedColumns: ["id"];
          },
        ];
      };
      subscriptions: {
        Row: {
          cancel_at: string | null;
          cancel_at_period_end: boolean | null;
          canceled_at: string | null;
          created: string;
          current_period_end: string;
          current_period_start: string;
          ended_at: string | null;
          id: string;
          metadata: Json | null;
          price_id: string | null;
          quantity: number | null;
          status: Database["public"]["Enums"]["subscription_status"] | null;
          trial_end: string | null;
          trial_start: string | null;
          user_id: string;
        };
        Insert: {
          cancel_at?: string | null;
          cancel_at_period_end?: boolean | null;
          canceled_at?: string | null;
          created?: string;
          current_period_end?: string;
          current_period_start?: string;
          ended_at?: string | null;
          id: string;
          metadata?: Json | null;
          price_id?: string | null;
          quantity?: number | null;
          status?: Database["public"]["Enums"]["subscription_status"] | null;
          trial_end?: string | null;
          trial_start?: string | null;
          user_id: string;
        };
        Update: {
          cancel_at?: string | null;
          cancel_at_period_end?: boolean | null;
          canceled_at?: string | null;
          created?: string;
          current_period_end?: string;
          current_period_start?: string;
          ended_at?: string | null;
          id?: string;
          metadata?: Json | null;
          price_id?: string | null;
          quantity?: number | null;
          status?: Database["public"]["Enums"]["subscription_status"] | null;
          trial_end?: string | null;
          trial_start?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "subscriptions_price_id_fkey";
            columns: ["price_id"];
            isOneToOne: false;
            referencedRelation: "prices";
            referencedColumns: ["id"];
          },
        ];
      };
      users: {
        Row: {
          avatar_url: string | null;
          billing_address: Json | null;
          full_name: string | null;
          id: string;
          is_admin: boolean;
          payment_method: Json | null;
        };
        Insert: {
          avatar_url?: string | null;
          billing_address?: Json | null;
          full_name?: string | null;
          id: string;
          is_admin?: boolean;
          payment_method?: Json | null;
        };
        Update: {
          avatar_url?: string | null;
          billing_address?: Json | null;
          full_name?: string | null;
          id?: string;
          is_admin?: boolean;
          payment_method?: Json | null;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      binary_quantize: {
        Args: { "": string } | { "": unknown };
        Returns: unknown;
      };
      get_youtube_sources: {
        Args: Record<PropertyKey, never>;
        Returns: {
          domain: string;
          id: string;
          kind: string;
          last_cursor: Json;
          metadata: Json;
          name: string;
          url: string;
        }[];
      };
      halfvec_avg: {
        Args: { "": number[] };
        Returns: unknown;
      };
      halfvec_out: {
        Args: { "": unknown };
        Returns: unknown;
      };
      halfvec_send: {
        Args: { "": unknown };
        Returns: string;
      };
      halfvec_typmod_in: {
        Args: { "": unknown[] };
        Returns: number;
      };
      hnsw_bit_support: {
        Args: { "": unknown };
        Returns: unknown;
      };
      hnsw_halfvec_support: {
        Args: { "": unknown };
        Returns: unknown;
      };
      hnsw_sparsevec_support: {
        Args: { "": unknown };
        Returns: unknown;
      };
      hnswhandler: {
        Args: { "": unknown };
        Returns: unknown;
      };
      ivfflat_bit_support: {
        Args: { "": unknown };
        Returns: unknown;
      };
      ivfflat_halfvec_support: {
        Args: { "": unknown };
        Returns: unknown;
      };
      ivfflathandler: {
        Args: { "": unknown };
        Returns: unknown;
      };
      l2_norm: {
        Args: { "": unknown } | { "": unknown };
        Returns: number;
      };
      l2_normalize: {
        Args: { "": string } | { "": unknown } | { "": unknown };
        Returns: string;
      };
      refresh_source_metrics: {
        Args: { _source_id?: string };
        Returns: undefined;
      };
      sparsevec_out: {
        Args: { "": unknown };
        Returns: unknown;
      };
      sparsevec_send: {
        Args: { "": unknown };
        Returns: string;
      };
      sparsevec_typmod_in: {
        Args: { "": unknown[] };
        Returns: number;
      };
      vector_avg: {
        Args: { "": number[] };
        Returns: string;
      };
      vector_dims: {
        Args: { "": string } | { "": unknown };
        Returns: number;
      };
      vector_norm: {
        Args: { "": string };
        Returns: number;
      };
      vector_out: {
        Args: { "": string };
        Returns: unknown;
      };
      vector_send: {
        Args: { "": string };
        Returns: string;
      };
      vector_typmod_in: {
        Args: { "": unknown[] };
        Returns: number;
      };
    };
    Enums: {
      health_status: "ok" | "warn" | "error";
      pricing_plan_interval: "day" | "week" | "month" | "year";
      pricing_type: "one_time" | "recurring";
      subscription_status:
        | "trialing"
        | "active"
        | "canceled"
        | "incomplete"
        | "incomplete_expired"
        | "past_due"
        | "unpaid"
        | "paused";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<
  keyof Database,
  "public"
>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {
      health_status: ["ok", "warn", "error"],
      pricing_plan_interval: ["day", "week", "month", "year"],
      pricing_type: ["one_time", "recurring"],
      subscription_status: [
        "trialing",
        "active",
        "canceled",
        "incomplete",
        "incomplete_expired",
        "past_due",
        "unpaid",
        "paused",
      ],
    },
  },
} as const;
