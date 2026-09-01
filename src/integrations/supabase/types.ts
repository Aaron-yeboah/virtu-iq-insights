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
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      admin_bootstrap_emails: {
        Row: {
          created_at: string
          email: string
        }
        Insert: {
          created_at?: string
          email: string
        }
        Update: {
          created_at?: string
          email?: string
        }
        Relationships: []
      }
      analyses: {
        Row: {
          completed_at: string | null
          created_at: string
          credits_used: number
          error_message: string | null
          id: string
          image_path: string
          prompt: string | null
          result: Json | null
          status: Database["public"]["Enums"]["analysis_status"]
          summary: string | null
          title: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          credits_used?: number
          error_message?: string | null
          id?: string
          image_path: string
          prompt?: string | null
          result?: Json | null
          status?: Database["public"]["Enums"]["analysis_status"]
          summary?: string | null
          title?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          credits_used?: number
          error_message?: string | null
          id?: string
          image_path?: string
          prompt?: string | null
          result?: Json | null
          status?: Database["public"]["Enums"]["analysis_status"]
          summary?: string | null
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      audit_logs: {
        Row: {
          action: string
          actor_id: string | null
          created_at: string
          entity: string
          entity_id: string | null
          id: string
          meta: Json
        }
        Insert: {
          action: string
          actor_id?: string | null
          created_at?: string
          entity: string
          entity_id?: string | null
          id?: string
          meta?: Json
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string
          entity?: string
          entity_id?: string | null
          id?: string
          meta?: Json
        }
        Relationships: []
      }
      credit_transactions: {
        Row: {
          created_at: string
          delta: number
          id: string
          reason: string
          ref_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          delta: number
          id?: string
          reason: string
          ref_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          delta?: number
          id?: string
          reason?: string
          ref_id?: string | null
          user_id?: string
        }
        Relationships: []
      }
      packages: {
        Row: {
          created_at: string
          credits: number
          id: string
          is_active: boolean
          is_popular: boolean
          max_verdicts: number
          name: string
          perks: Json
          price_ghs: number
          slug: string
          sort_order: number
        }
        Insert: {
          created_at?: string
          credits: number
          id?: string
          is_active?: boolean
          is_popular?: boolean
          max_verdicts?: number
          name: string
          perks?: Json
          price_ghs: number
          slug: string
          sort_order?: number
        }
        Update: {
          created_at?: string
          credits?: number
          id?: string
          is_active?: boolean
          is_popular?: boolean
          max_verdicts?: number
          name?: string
          perks?: Json
          price_ghs?: number
          slug?: string
          sort_order?: number
        }
        Relationships: []
      }
      partner_applications: {
        Row: {
          admin_note: string | null
          audience: string
          created_at: string
          id: string
          motivation: string
          payout_details: string
          payout_method: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: Database["public"]["Enums"]["application_status"]
          user_id: string
        }
        Insert: {
          admin_note?: string | null
          audience: string
          created_at?: string
          id?: string
          motivation: string
          payout_details: string
          payout_method: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["application_status"]
          user_id: string
        }
        Update: {
          admin_note?: string | null
          audience?: string
          created_at?: string
          id?: string
          motivation?: string
          payout_details?: string
          payout_method?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["application_status"]
          user_id?: string
        }
        Relationships: []
      }
      partner_commissions: {
        Row: {
          amount_ghs: number
          created_at: string
          id: string
          partner_id: string
          payment_id: string
          referred_user_id: string
        }
        Insert: {
          amount_ghs: number
          created_at?: string
          id?: string
          partner_id: string
          payment_id: string
          referred_user_id: string
        }
        Update: {
          amount_ghs?: number
          created_at?: string
          id?: string
          partner_id?: string
          payment_id?: string
          referred_user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "partner_commissions_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "payments"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_settings: {
        Row: {
          id: boolean
          instructions: string
          momo_number: string
          network: string
          recipient_name: string
          registration_fee_ghs: number
          updated_at: string
        }
        Insert: {
          id?: boolean
          instructions?: string
          momo_number?: string
          network?: string
          recipient_name?: string
          registration_fee_ghs?: number
          updated_at?: string
        }
        Update: {
          id?: boolean
          instructions?: string
          momo_number?: string
          network?: string
          recipient_name?: string
          registration_fee_ghs?: number
          updated_at?: string
        }
        Relationships: []
      }
      payments: {
        Row: {
          admin_note: string | null
          amount_ghs: number
          created_at: string
          credits: number
          id: string
          kind: string
          method: string
          package_id: string | null
          reference: string
          reviewed_at: string | null
          reviewed_by: string | null
          sender_name: string | null
          status: Database["public"]["Enums"]["payment_status"]
          user_id: string
        }
        Insert: {
          admin_note?: string | null
          amount_ghs: number
          created_at?: string
          credits: number
          id?: string
          kind?: string
          method: string
          package_id?: string | null
          reference: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          sender_name?: string | null
          status?: Database["public"]["Enums"]["payment_status"]
          user_id: string
        }
        Update: {
          admin_note?: string | null
          amount_ghs?: number
          created_at?: string
          credits?: number
          id?: string
          kind?: string
          method?: string
          package_id?: string | null
          reference?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          sender_name?: string | null
          status?: Database["public"]["Enums"]["payment_status"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "packages"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          commission_rate: number
          created_at: string
          credits: number
          email: string | null
          full_name: string | null
          id: string
          partner_applicant: boolean
          payout_cleared_at: string | null
          phone: string | null
          referral_code: string
          referred_by: string | null
          registration_paid: boolean
          registration_paid_at: string | null
          updated_at: string
        }
        Insert: {
          commission_rate?: number
          created_at?: string
          credits?: number
          email?: string | null
          full_name?: string | null
          id: string
          partner_applicant?: boolean
          payout_cleared_at?: string | null
          phone?: string | null
          referral_code: string
          referred_by?: string | null
          registration_paid?: boolean
          registration_paid_at?: string | null
          updated_at?: string
        }
        Update: {
          commission_rate?: number
          created_at?: string
          credits?: number
          email?: string | null
          full_name?: string | null
          id?: string
          partner_applicant?: boolean
          payout_cleared_at?: string | null
          phone?: string | null
          referral_code?: string
          referred_by?: string | null
          registration_paid?: boolean
          registration_paid_at?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_referred_by_fkey"
            columns: ["referred_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      admin_adjust_credits: {
        Args: { _delta: number; _reason?: string; _user_id: string }
        Returns: number
      }
      admin_clear_partner_payout: {
        Args: { _user_id: string; _note?: string | null }
        Returns: string
      }
      admin_revert_partner_payout: {
        Args: { _payout_id: string }
        Returns: string | null
      }
      admin_daily_commission_snapshots: {
        Args: Record<PropertyKey, never>
        Returns: {
          date: string
          developer_commission_rate: number
          admin_commission_rate: number
          default_partner_commission_rate: number
          revenue_ghs: number
          dev_commission_ghs: number
          admin_commission_ghs: number
          is_locked: boolean
        }[]
      }
      admin_credit_overview: { Args: never; Returns: Json }
      admin_delete_package: { Args: { _id: string }; Returns: boolean }
      admin_explode_data: { Args: never; Returns: Json }
      admin_member_list: {
        Args: {
          _only_partners?: boolean
          _partner_id?: string
          _search?: string
        }
        Returns: {
          created_at: string
          credits: number
          email: string
          full_name: string
          id: string
          is_admin: boolean
          is_partner: boolean
          last_sign_in_at: string
          phone: string
          referral_code: string
          referral_count: number
          referred_by: string
          referrer_name: string
          registration_paid: boolean
          registration_paid_at: string
          spent_ghs: number
        }[]
      }
      admin_partner_applications: {
        Args: never
        Returns: {
          admin_note: string
          audience: string
          created_at: string
          email: string
          full_name: string
          id: string
          motivation: string
          payout_details: string
          payout_method: string
          phone: string
          status: Database["public"]["Enums"]["application_status"]
          user_id: string
        }[]
      }
      admin_partner_list: {
        Args: { _search?: string }
        Returns: {
          commission_rate: number
          commissions_ghs: number
          email: string
          full_name: string
          id: string
          payout_cleared_at: string
          referral_code: string
          referral_count: number
          revenue_ghs: number
        }[]
      }
      admin_set_admin: {
        Args: { _make: boolean; _user_id: string }
        Returns: boolean
      }
      admin_set_commission_rate: {
        Args: { _rate: number; _user_id: string }
        Returns: number
      }
      admin_set_partner: {
        Args: { _make: boolean; _user_id: string }
        Returns: boolean
      }
      admin_stats: { Args: never; Returns: Json }
      admin_upsert_package: {
        Args: {
          _credits: number
          _id?: string
          _is_active?: boolean
          _max_verdicts?: number
          _name: string
          _perks?: Json
          _price_ghs: number
          _slug: string
          _sort_order?: number
        }
        Returns: {
          created_at: string
          credits: number
          id: string
          is_active: boolean
          max_verdicts: number
          name: string
          perks: Json
          price_ghs: number
          slug: string
          sort_order: number
        }
        SetofOptions: {
          from: "*"
          to: "packages"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_default_admin: { Args: { _user_id: string }; Returns: boolean }
      my_verdict_limit: { Args: never; Returns: number }
      partner_stats: { Args: never; Returns: Json }
      refund_credits: {
        Args: { _amount: number; _reason: string; _ref_id?: string }
        Returns: number
      }
      review_partner_application: {
        Args: { _application_id: string; _approve: boolean; _note?: string }
        Returns: {
          admin_note: string | null
          audience: string
          created_at: string
          id: string
          motivation: string
          payout_details: string
          payout_method: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: Database["public"]["Enums"]["application_status"]
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "partner_applications"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      review_payment: {
        Args: { _approve: boolean; _note?: string; _payment_id: string }
        Returns: {
          admin_note: string | null
          amount_ghs: number
          created_at: string
          credits: number
          id: string
          kind: string
          method: string
          package_id: string | null
          reference: string
          reviewed_at: string | null
          reviewed_by: string | null
          sender_name: string | null
          status: Database["public"]["Enums"]["payment_status"]
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "payments"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      spend_credits: {
        Args: { _amount: number; _reason: string; _ref_id?: string }
        Returns: number
      }
    }
    Enums: {
      analysis_status: "pending" | "processing" | "completed" | "failed"
      app_role: "admin" | "partner" | "member"
      application_status: "pending" | "approved" | "rejected"
      payment_status: "pending" | "approved" | "rejected"
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
      analysis_status: ["pending", "processing", "completed", "failed"],
      app_role: ["admin", "partner", "member"],
      application_status: ["pending", "approved", "rejected"],
      payment_status: ["pending", "approved", "rejected"],
    },
  },
} as const
