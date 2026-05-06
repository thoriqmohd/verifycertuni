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
      api_logs: {
        Row: {
          created_at: string
          endpoint: string | null
          id: string
          ip_address: string | null
          method: string | null
          request_payload: Json | null
          response_status: number | null
          university_id: string | null
        }
        Insert: {
          created_at?: string
          endpoint?: string | null
          id?: string
          ip_address?: string | null
          method?: string | null
          request_payload?: Json | null
          response_status?: number | null
          university_id?: string | null
        }
        Update: {
          created_at?: string
          endpoint?: string | null
          id?: string
          ip_address?: string | null
          method?: string | null
          request_payload?: Json | null
          response_status?: number | null
          university_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "api_logs_university_id_fkey"
            columns: ["university_id"]
            isOneToOne: false
            referencedRelation: "universities"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string | null
          created_at: string
          description: string | null
          id: string
          module: string | null
          user_id: string | null
        }
        Insert: {
          action?: string | null
          created_at?: string
          description?: string | null
          id?: string
          module?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string | null
          created_at?: string
          description?: string | null
          id?: string
          module?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      certificates: {
        Row: {
          award_type: string | null
          certificate_file_url: string | null
          certificate_number: string
          certificate_status: Database["public"]["Enums"]["cert_status"]
          convocation_date: string | null
          created_at: string
          faculty: string | null
          graduation_date: string | null
          ic_passport: string | null
          id: string
          matric_number: string | null
          programme_name: string | null
          qr_code_url: string | null
          student_name: string
          university_id: string
          updated_at: string
        }
        Insert: {
          award_type?: string | null
          certificate_file_url?: string | null
          certificate_number: string
          certificate_status?: Database["public"]["Enums"]["cert_status"]
          convocation_date?: string | null
          created_at?: string
          faculty?: string | null
          graduation_date?: string | null
          ic_passport?: string | null
          id?: string
          matric_number?: string | null
          programme_name?: string | null
          qr_code_url?: string | null
          student_name: string
          university_id: string
          updated_at?: string
        }
        Update: {
          award_type?: string | null
          certificate_file_url?: string | null
          certificate_number?: string
          certificate_status?: Database["public"]["Enums"]["cert_status"]
          convocation_date?: string | null
          created_at?: string
          faculty?: string | null
          graduation_date?: string | null
          ic_passport?: string | null
          id?: string
          matric_number?: string | null
          programme_name?: string | null
          qr_code_url?: string | null
          student_name?: string
          university_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "certificates_university_id_fkey"
            columns: ["university_id"]
            isOneToOne: false
            referencedRelation: "universities"
            referencedColumns: ["id"]
          },
        ]
      }
      companies: {
        Row: {
          address: string | null
          company_name: string
          contact_email: string | null
          contact_person: string | null
          created_at: string
          id: string
          registration_no: string | null
          status: Database["public"]["Enums"]["entity_status"]
        }
        Insert: {
          address?: string | null
          company_name: string
          contact_email?: string | null
          contact_person?: string | null
          created_at?: string
          id?: string
          registration_no?: string | null
          status?: Database["public"]["Enums"]["entity_status"]
        }
        Update: {
          address?: string | null
          company_name?: string
          contact_email?: string | null
          contact_person?: string | null
          created_at?: string
          id?: string
          registration_no?: string | null
          status?: Database["public"]["Enums"]["entity_status"]
        }
        Relationships: []
      }
      payment_settings: {
        Row: {
          billplz_api_key: string | null
          billplz_collection_id: string | null
          billplz_sandbox: boolean
          billplz_x_signature: string | null
          created_at: string
          id: string
          payment_gateway_name: string
          platform_commission_rate: number
          status: Database["public"]["Enums"]["entity_status"]
          verification_fee: number
        }
        Insert: {
          billplz_api_key?: string | null
          billplz_collection_id?: string | null
          billplz_sandbox?: boolean
          billplz_x_signature?: string | null
          created_at?: string
          id?: string
          payment_gateway_name?: string
          platform_commission_rate?: number
          status?: Database["public"]["Enums"]["entity_status"]
          verification_fee?: number
        }
        Update: {
          billplz_api_key?: string | null
          billplz_collection_id?: string | null
          billplz_sandbox?: boolean
          billplz_x_signature?: string | null
          created_at?: string
          id?: string
          payment_gateway_name?: string
          platform_commission_rate?: number
          status?: Database["public"]["Enums"]["entity_status"]
          verification_fee?: number
        }
        Relationships: []
      }
      settlements: {
        Row: {
          created_at: string
          id: string
          paid_at: string | null
          settlement_month: string | null
          settlement_status: Database["public"]["Enums"]["settle_status"]
          total_amount: number
          total_transactions: number
          university_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          paid_at?: string | null
          settlement_month?: string | null
          settlement_status?: Database["public"]["Enums"]["settle_status"]
          total_amount?: number
          total_transactions?: number
          university_id: string
        }
        Update: {
          created_at?: string
          id?: string
          paid_at?: string | null
          settlement_month?: string | null
          settlement_status?: Database["public"]["Enums"]["settle_status"]
          total_amount?: number
          total_transactions?: number
          university_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "settlements_university_id_fkey"
            columns: ["university_id"]
            isOneToOne: false
            referencedRelation: "universities"
            referencedColumns: ["id"]
          },
        ]
      }
      transactions: {
        Row: {
          amount: number
          created_at: string
          gateway_fee: number
          id: string
          paid_at: string | null
          payment_gateway: string | null
          payment_reference: string | null
          payment_status: Database["public"]["Enums"]["pay_status"]
          platform_share: number
          university_share: number
          verification_request_id: string | null
        }
        Insert: {
          amount: number
          created_at?: string
          gateway_fee?: number
          id?: string
          paid_at?: string | null
          payment_gateway?: string | null
          payment_reference?: string | null
          payment_status?: Database["public"]["Enums"]["pay_status"]
          platform_share: number
          university_share: number
          verification_request_id?: string | null
        }
        Update: {
          amount?: number
          created_at?: string
          gateway_fee?: number
          id?: string
          paid_at?: string | null
          payment_gateway?: string | null
          payment_reference?: string | null
          payment_status?: Database["public"]["Enums"]["pay_status"]
          platform_share?: number
          university_share?: number
          verification_request_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "transactions_verification_request_id_fkey"
            columns: ["verification_request_id"]
            isOneToOne: false
            referencedRelation: "verification_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      universities: {
        Row: {
          address: string | null
          api_key: string | null
          api_secret: string | null
          commission_rate: number
          contact_email: string | null
          contact_person: string | null
          created_at: string
          id: string
          logo_url: string | null
          name: string
          registration_no: string | null
          status: Database["public"]["Enums"]["entity_status"]
        }
        Insert: {
          address?: string | null
          api_key?: string | null
          api_secret?: string | null
          commission_rate?: number
          contact_email?: string | null
          contact_person?: string | null
          created_at?: string
          id?: string
          logo_url?: string | null
          name: string
          registration_no?: string | null
          status?: Database["public"]["Enums"]["entity_status"]
        }
        Update: {
          address?: string | null
          api_key?: string | null
          api_secret?: string | null
          commission_rate?: number
          contact_email?: string | null
          contact_person?: string | null
          created_at?: string
          id?: string
          logo_url?: string | null
          name?: string
          registration_no?: string | null
          status?: Database["public"]["Enums"]["entity_status"]
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      users_profile: {
        Row: {
          company_id: string | null
          created_at: string
          email: string
          full_name: string
          id: string
          status: Database["public"]["Enums"]["entity_status"]
          university_id: string | null
          user_id: string
        }
        Insert: {
          company_id?: string | null
          created_at?: string
          email: string
          full_name: string
          id?: string
          status?: Database["public"]["Enums"]["entity_status"]
          university_id?: string | null
          user_id: string
        }
        Update: {
          company_id?: string | null
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          status?: Database["public"]["Enums"]["entity_status"]
          university_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "users_profile_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "users_profile_university_id_fkey"
            columns: ["university_id"]
            isOneToOne: false
            referencedRelation: "universities"
            referencedColumns: ["id"]
          },
        ]
      }
      verification_requests: {
        Row: {
          certificate_id: string
          company_id: string | null
          created_at: string
          id: string
          payment_status: Database["public"]["Enums"]["pay_status"]
          report_reference_no: string | null
          report_url: string | null
          requested_by: string | null
          status: Database["public"]["Enums"]["verif_status"]
        }
        Insert: {
          certificate_id: string
          company_id?: string | null
          created_at?: string
          id?: string
          payment_status?: Database["public"]["Enums"]["pay_status"]
          report_reference_no?: string | null
          report_url?: string | null
          requested_by?: string | null
          status?: Database["public"]["Enums"]["verif_status"]
        }
        Update: {
          certificate_id?: string
          company_id?: string | null
          created_at?: string
          id?: string
          payment_status?: Database["public"]["Enums"]["pay_status"]
          report_reference_no?: string | null
          report_url?: string | null
          requested_by?: string | null
          status?: Database["public"]["Enums"]["verif_status"]
        }
        Relationships: [
          {
            foreignKeyName: "verification_requests_certificate_id_fkey"
            columns: ["certificate_id"]
            isOneToOne: false
            referencedRelation: "certificates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "verification_requests_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      current_user_company: { Args: never; Returns: string }
      current_user_university: { Args: never; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role:
        | "super_admin"
        | "university_admin"
        | "employer"
        | "finance_admin"
        | "public_verifier"
      cert_status: "valid" | "revoked" | "suspended" | "pending"
      entity_status: "active" | "pending" | "suspended" | "inactive"
      pay_status: "unpaid" | "paid" | "refunded" | "failed"
      settle_status: "pending" | "processing" | "paid"
      verif_status: "pending" | "completed" | "failed" | "cancelled"
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
      app_role: [
        "super_admin",
        "university_admin",
        "employer",
        "finance_admin",
        "public_verifier",
      ],
      cert_status: ["valid", "revoked", "suspended", "pending"],
      entity_status: ["active", "pending", "suspended", "inactive"],
      pay_status: ["unpaid", "paid", "refunded", "failed"],
      settle_status: ["pending", "processing", "paid"],
      verif_status: ["pending", "completed", "failed", "cancelled"],
    },
  },
} as const
