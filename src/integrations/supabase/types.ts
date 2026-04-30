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
      activity_log: {
        Row: {
          created_at: string
          event_id: string
          id: string
          text: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          event_id: string
          id?: string
          text: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string
          event_id?: string
          id?: string
          text?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "activity_log_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      app_settings: {
        Row: {
          created_at: string
          id: string
          key: string
          label: string | null
          updated_at: string
          value: string
        }
        Insert: {
          created_at?: string
          id?: string
          key: string
          label?: string | null
          updated_at?: string
          value?: string
        }
        Update: {
          created_at?: string
          id?: string
          key?: string
          label?: string | null
          updated_at?: string
          value?: string
        }
        Relationships: []
      }
      budget_items: {
        Row: {
          actual_cost: number
          category: string
          created_at: string
          estimated_cost: number
          event_id: string
          id: string
          label: string
          paid: boolean
          user_id: string
        }
        Insert: {
          actual_cost?: number
          category?: string
          created_at?: string
          estimated_cost?: number
          event_id: string
          id?: string
          label: string
          paid?: boolean
          user_id: string
        }
        Update: {
          actual_cost?: number
          category?: string
          created_at?: string
          estimated_cost?: number
          event_id?: string
          id?: string
          label?: string
          paid?: boolean
          user_id?: string
        }
        Relationships: []
      }
      community_events: {
        Row: {
          city: string | null
          created_at: string
          description: string | null
          event_date: string | null
          id: string
          image_url: string | null
          location: string | null
          title: string
        }
        Insert: {
          city?: string | null
          created_at?: string
          description?: string | null
          event_date?: string | null
          id?: string
          image_url?: string | null
          location?: string | null
          title: string
        }
        Update: {
          city?: string | null
          created_at?: string
          description?: string | null
          event_date?: string | null
          id?: string
          image_url?: string | null
          location?: string | null
          title?: string
        }
        Relationships: []
      }
      email_send_log: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          message_id: string | null
          metadata: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email?: string
          status?: string
          template_name?: string
        }
        Relationships: []
      }
      email_send_state: {
        Row: {
          auth_email_ttl_minutes: number
          batch_size: number
          id: number
          retry_after_until: string | null
          send_delay_ms: number
          transactional_email_ttl_minutes: number
          updated_at: string
        }
        Insert: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Update: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Relationships: []
      }
      email_unsubscribe_tokens: {
        Row: {
          created_at: string
          email: string
          id: string
          token: string
          used_at: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          token: string
          used_at?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          token?: string
          used_at?: string | null
        }
        Relationships: []
      }
      event_members: {
        Row: {
          event_id: string
          id: string
          joined_at: string
          role: string
          user_id: string
        }
        Insert: {
          event_id: string
          id?: string
          joined_at?: string
          role?: string
          user_id: string
        }
        Update: {
          event_id?: string
          id?: string
          joined_at?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_members_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      event_vendors: {
        Row: {
          category: string | null
          cost: number | null
          created_at: string
          event_id: string
          id: string
          name: string
          notes: string | null
          status: string
          user_id: string
          vendor_id: string | null
        }
        Insert: {
          category?: string | null
          cost?: number | null
          created_at?: string
          event_id: string
          id?: string
          name: string
          notes?: string | null
          status?: string
          user_id: string
          vendor_id?: string | null
        }
        Update: {
          category?: string | null
          cost?: number | null
          created_at?: string
          event_id?: string
          id?: string
          name?: string
          notes?: string | null
          status?: string
          user_id?: string
          vendor_id?: string | null
        }
        Relationships: []
      }
      events: {
        Row: {
          city: string | null
          clear_wrapping: boolean | null
          created_at: string
          due_date: string | null
          event_date: string | null
          event_image_url: string | null
          event_type: string
          first_time_parent: boolean | null
          gift_note: string | null
          gift_policy: string | null
          gift_preferences: Json | null
          honoree_name: string | null
          id: string
          invite_image_url: string | null
          invite_message: string | null
          invite_template: string | null
          invite_time_range: string | null
          invite_title: string | null
          journey: string | null
          multiples: boolean
          registry_name: string | null
          registry_private: boolean | null
          role: string | null
          surprise_mode: boolean | null
          theme: string | null
          total_budget: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          city?: string | null
          clear_wrapping?: boolean | null
          created_at?: string
          due_date?: string | null
          event_date?: string | null
          event_image_url?: string | null
          event_type?: string
          first_time_parent?: boolean | null
          gift_note?: string | null
          gift_policy?: string | null
          gift_preferences?: Json | null
          honoree_name?: string | null
          id?: string
          invite_image_url?: string | null
          invite_message?: string | null
          invite_template?: string | null
          invite_time_range?: string | null
          invite_title?: string | null
          journey?: string | null
          multiples?: boolean
          registry_name?: string | null
          registry_private?: boolean | null
          role?: string | null
          surprise_mode?: boolean | null
          theme?: string | null
          total_budget?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          city?: string | null
          clear_wrapping?: boolean | null
          created_at?: string
          due_date?: string | null
          event_date?: string | null
          event_image_url?: string | null
          event_type?: string
          first_time_parent?: boolean | null
          gift_note?: string | null
          gift_policy?: string | null
          gift_preferences?: Json | null
          honoree_name?: string | null
          id?: string
          invite_image_url?: string | null
          invite_message?: string | null
          invite_template?: string | null
          invite_time_range?: string | null
          invite_title?: string | null
          journey?: string | null
          multiples?: boolean
          registry_name?: string | null
          registry_private?: boolean | null
          role?: string | null
          surprise_mode?: boolean | null
          theme?: string | null
          total_budget?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      gifts_received: {
        Row: {
          created_at: string
          donor_name: string
          event_id: string
          id: string
          item_description: string
          thank_you_sent: boolean | null
          user_id: string
        }
        Insert: {
          created_at?: string
          donor_name: string
          event_id: string
          id?: string
          item_description: string
          thank_you_sent?: boolean | null
          user_id: string
        }
        Update: {
          created_at?: string
          donor_name?: string
          event_id?: string
          id?: string
          item_description?: string
          thank_you_sent?: boolean | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "gifts_received_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      guests: {
        Row: {
          created_at: string
          dietary_notes: string | null
          email: string | null
          event_id: string
          group_label: string | null
          id: string
          invite_sent: boolean | null
          invite_sent_at: string | null
          name: string
          phone: string | null
          plus_one: boolean | null
          sms_opt_in: boolean | null
          status: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          dietary_notes?: string | null
          email?: string | null
          event_id: string
          group_label?: string | null
          id?: string
          invite_sent?: boolean | null
          invite_sent_at?: string | null
          name: string
          phone?: string | null
          plus_one?: boolean | null
          sms_opt_in?: boolean | null
          status?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          dietary_notes?: string | null
          email?: string | null
          event_id?: string
          group_label?: string | null
          id?: string
          invite_sent?: boolean | null
          invite_sent_at?: string | null
          name?: string
          phone?: string | null
          plus_one?: boolean | null
          sms_opt_in?: boolean | null
          status?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "guests_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      invite_codes: {
        Row: {
          code: string
          created_at: string
          created_by: string
          event_id: string
          expires_at: string | null
          id: string
          max_uses: number | null
          use_count: number
        }
        Insert: {
          code: string
          created_at?: string
          created_by: string
          event_id: string
          expires_at?: string | null
          id?: string
          max_uses?: number | null
          use_count?: number
        }
        Update: {
          code?: string
          created_at?: string
          created_by?: string
          event_id?: string
          expires_at?: string | null
          id?: string
          max_uses?: number | null
          use_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "invite_codes_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      planning_tasks: {
        Row: {
          assignee: string | null
          completed: boolean | null
          created_at: string
          due_date: string | null
          event_id: string
          id: string
          title: string
          user_id: string
        }
        Insert: {
          assignee?: string | null
          completed?: boolean | null
          created_at?: string
          due_date?: string | null
          event_id: string
          id?: string
          title: string
          user_id: string
        }
        Update: {
          assignee?: string | null
          completed?: boolean | null
          created_at?: string
          due_date?: string | null
          event_id?: string
          id?: string
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "planning_tasks_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      potluck_items: {
        Row: {
          category: string
          claimed_by: string | null
          created_at: string
          event_id: string
          id: string
          label: string
          notes: string | null
          quantity_needed: number
          user_id: string
        }
        Insert: {
          category?: string
          claimed_by?: string | null
          created_at?: string
          event_id: string
          id?: string
          label: string
          notes?: string | null
          quantity_needed?: number
          user_id: string
        }
        Update: {
          category?: string
          claimed_by?: string | null
          created_at?: string
          event_id?: string
          id?: string
          label?: string
          notes?: string | null
          quantity_needed?: number
          user_id?: string
        }
        Relationships: []
      }
      predictions: {
        Row: {
          created_at: string
          event_id: string
          guest_name: string
          id: string
          is_winner: boolean | null
          predicted_date: string | null
          predicted_gender: string | null
          predicted_name: string | null
          predicted_weight: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          event_id: string
          guest_name: string
          id?: string
          is_winner?: boolean | null
          predicted_date?: string | null
          predicted_gender?: string | null
          predicted_name?: string | null
          predicted_weight?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          event_id?: string
          guest_name?: string
          id?: string
          is_winner?: boolean | null
          predicted_date?: string | null
          predicted_gender?: string | null
          predicted_name?: string | null
          predicted_weight?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "predictions_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          city: string | null
          created_at: string
          display_name: string | null
          email_notifications: boolean
          id: string
          push_notifications: boolean
          role: string | null
          sms_opt_in: boolean
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          city?: string | null
          created_at?: string
          display_name?: string | null
          email_notifications?: boolean
          id: string
          push_notifications?: boolean
          role?: string | null
          sms_opt_in?: boolean
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          city?: string | null
          created_at?: string
          display_name?: string | null
          email_notifications?: boolean
          id?: string
          push_notifications?: boolean
          role?: string | null
          sms_opt_in?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      registry_items: {
        Row: {
          category: string
          claimed: boolean | null
          claimed_by: string | null
          created_at: string
          emoji: string | null
          event_id: string
          external_url: string | null
          id: string
          image_url: string | null
          name: string
          price: number | null
          priority: boolean
          source: string | null
          user_id: string
        }
        Insert: {
          category?: string
          claimed?: boolean | null
          claimed_by?: string | null
          created_at?: string
          emoji?: string | null
          event_id: string
          external_url?: string | null
          id?: string
          image_url?: string | null
          name: string
          price?: number | null
          priority?: boolean
          source?: string | null
          user_id: string
        }
        Update: {
          category?: string
          claimed?: boolean | null
          claimed_by?: string | null
          created_at?: string
          emoji?: string | null
          event_id?: string
          external_url?: string | null
          id?: string
          image_url?: string | null
          name?: string
          price?: number | null
          priority?: boolean
          source?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "registry_items_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      suppressed_emails: {
        Row: {
          created_at: string
          email: string
          id: string
          metadata: Json | null
          reason: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          metadata?: Json | null
          reason: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          metadata?: Json | null
          reason?: string
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
      vendors: {
        Row: {
          category: string
          city: string | null
          created_at: string
          description: string | null
          discount_code: string | null
          id: string
          image_url: string | null
          name: string
          phone: string | null
          referral_code: string | null
          website: string | null
        }
        Insert: {
          category: string
          city?: string | null
          created_at?: string
          description?: string | null
          discount_code?: string | null
          id?: string
          image_url?: string | null
          name: string
          phone?: string | null
          referral_code?: string | null
          website?: string | null
        }
        Update: {
          category?: string
          city?: string | null
          created_at?: string
          description?: string | null
          discount_code?: string | null
          id?: string
          image_url?: string | null
          name?: string
          phone?: string | null
          referral_code?: string | null
          website?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      delete_email: {
        Args: { message_id: number; queue_name: string }
        Returns: boolean
      }
      enqueue_email: {
        Args: { payload: Json; queue_name: string }
        Returns: number
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      increment_invite_use: { Args: { code_text: string }; Returns: string }
      is_event_member: {
        Args: { _event_id: string; _user_id: string }
        Returns: boolean
      }
      move_to_dlq: {
        Args: {
          dlq_name: string
          message_id: number
          payload: Json
          source_queue: string
        }
        Returns: number
      }
      read_email_batch: {
        Args: { batch_size: number; queue_name: string; vt: number }
        Returns: {
          message: Json
          msg_id: number
          read_ct: number
        }[]
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user" | "super_admin"
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
      app_role: ["admin", "moderator", "user", "super_admin"],
    },
  },
} as const
