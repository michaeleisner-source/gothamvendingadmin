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
      location_types: {
        Row: {
          id: string
          name: string
          org_id: string | null
        }
        Insert: {
          id?: string
          name: string
          org_id?: string | null
        }
        Update: {
          id?: string
          name?: string
          org_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "location_types_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      locations: {
        Row: {
          address_line1: string | null
          address_line2: string | null
          city: string | null
          contact_email: string | null
          contact_name: string | null
          contact_phone: string | null
          created_at: string | null
          from_prospect_id: string | null
          id: string
          location_type_id: string | null
          name: string
          org_id: string | null
          postal_code: string | null
          state: string | null
          traffic_daily_est: number | null
          traffic_monthly_est: number | null
        }
        Insert: {
          address_line1?: string | null
          address_line2?: string | null
          city?: string | null
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          created_at?: string | null
          from_prospect_id?: string | null
          id?: string
          location_type_id?: string | null
          name: string
          org_id?: string | null
          postal_code?: string | null
          state?: string | null
          traffic_daily_est?: number | null
          traffic_monthly_est?: number | null
        }
        Update: {
          address_line1?: string | null
          address_line2?: string | null
          city?: string | null
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          created_at?: string | null
          from_prospect_id?: string | null
          id?: string
          location_type_id?: string | null
          name?: string
          org_id?: string | null
          postal_code?: string | null
          state?: string | null
          traffic_daily_est?: number | null
          traffic_monthly_est?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "locations_from_prospect_id_fkey"
            columns: ["from_prospect_id"]
            isOneToOne: false
            referencedRelation: "prospects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "locations_location_type_id_fkey"
            columns: ["location_type_id"]
            isOneToOne: false
            referencedRelation: "location_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "locations_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      machines: {
        Row: {
          created_at: string | null
          id: string
          location: string | null
          location_id: string | null
          name: string
          org_id: string | null
          status: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          location?: string | null
          location_id?: string | null
          name: string
          org_id?: string | null
          status?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          location?: string | null
          location_id?: string | null
          name?: string
          org_id?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "machines_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "machines_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      memberships: {
        Row: {
          org_id: string
          role: string
          user_id: string
        }
        Insert: {
          org_id: string
          role?: string
          user_id: string
        }
        Update: {
          org_id?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "memberships_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          created_at: string
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      product_categories: {
        Row: {
          id: string
          name: string
          org_id: string
        }
        Insert: {
          id?: string
          name: string
          org_id: string
        }
        Update: {
          id?: string
          name?: string
          org_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_categories_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          category: string | null
          cost: number | null
          created_at: string
          id: string
          name: string
          org_id: string | null
          price: number | null
          sku: string
          updated_at: string
        }
        Insert: {
          category?: string | null
          cost?: number | null
          created_at?: string
          id?: string
          name: string
          org_id?: string | null
          price?: number | null
          sku: string
          updated_at?: string
        }
        Update: {
          category?: string | null
          cost?: number | null
          created_at?: string
          id?: string
          name?: string
          org_id?: string | null
          price?: number | null
          sku?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          full_name: string | null
          id: string
          org_id: string
        }
        Insert: {
          created_at?: string
          full_name?: string | null
          id: string
          org_id: string
        }
        Update: {
          created_at?: string
          full_name?: string | null
          id?: string
          org_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      prospects: {
        Row: {
          address_line1: string | null
          address_line2: string | null
          business_name: string
          city: string | null
          contact_email: string | null
          contact_name: string | null
          contact_phone: string | null
          created_at: string | null
          id: string
          location_type_id: string | null
          notes: string | null
          org_id: string | null
          postal_code: string | null
          state: string | null
          status: string | null
          traffic_daily_est: number | null
          traffic_monthly_est: number | null
        }
        Insert: {
          address_line1?: string | null
          address_line2?: string | null
          business_name: string
          city?: string | null
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          created_at?: string | null
          id?: string
          location_type_id?: string | null
          notes?: string | null
          org_id?: string | null
          postal_code?: string | null
          state?: string | null
          status?: string | null
          traffic_daily_est?: number | null
          traffic_monthly_est?: number | null
        }
        Update: {
          address_line1?: string | null
          address_line2?: string | null
          business_name?: string
          city?: string | null
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          created_at?: string | null
          id?: string
          location_type_id?: string | null
          notes?: string | null
          org_id?: string | null
          postal_code?: string | null
          state?: string | null
          status?: string | null
          traffic_daily_est?: number | null
          traffic_monthly_est?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "prospects_location_type_id_fkey"
            columns: ["location_type_id"]
            isOneToOne: false
            referencedRelation: "location_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prospects_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      purchase_order_items: {
        Row: {
          id: string
          org_id: string | null
          po_id: string
          product_id: string
          qty_ordered: number
          unit_cost: number
        }
        Insert: {
          id?: string
          org_id?: string | null
          po_id: string
          product_id: string
          qty_ordered: number
          unit_cost: number
        }
        Update: {
          id?: string
          org_id?: string | null
          po_id?: string
          product_id?: string
          qty_ordered?: number
          unit_cost?: number
        }
        Relationships: [
          {
            foreignKeyName: "purchase_order_items_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_order_items_po_id_fkey"
            columns: ["po_id"]
            isOneToOne: false
            referencedRelation: "purchase_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      purchase_orders: {
        Row: {
          created_at: string
          id: string
          notes: string | null
          org_id: string | null
          status: string | null
          supplier_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          notes?: string | null
          org_id?: string | null
          status?: string | null
          supplier_id: string
        }
        Update: {
          created_at?: string
          id?: string
          notes?: string | null
          org_id?: string | null
          status?: string | null
          supplier_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "purchase_orders_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_orders_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      suppliers: {
        Row: {
          contact: string | null
          created_at: string
          id: string
          name: string
          org_id: string | null
          updated_at: string
        }
        Insert: {
          contact?: string | null
          created_at?: string
          id?: string
          name: string
          org_id?: string | null
          updated_at?: string
        }
        Update: {
          contact?: string | null
          created_at?: string
          id?: string
          name?: string
          org_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "suppliers_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      bootstrap_org_for_me: {
        Args: { p_org_name?: string }
        Returns: string
      }
      convert_prospect_to_location: {
        Args: { p_prospect_id: string }
        Returns: string
      }
      create_po_with_items: {
        Args: { p_items: Json; p_supplier_id: string }
        Returns: string
      }
      current_org: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      is_org_member: {
        Args: { row_org: string }
        Returns: boolean
      }
      list_products: {
        Args: { p_limit?: number; p_offset?: number; p_search?: string }
        Returns: {
          category: string | null
          cost: number | null
          created_at: string
          id: string
          name: string
          org_id: string | null
          price: number | null
          sku: string
          updated_at: string
        }[]
      }
      list_suppliers: {
        Args: { p_limit?: number; p_offset?: number; p_search?: string }
        Returns: {
          contact: string | null
          created_at: string
          id: string
          name: string
          org_id: string | null
          updated_at: string
        }[]
      }
      upsert_product: {
        Args: { p: Json }
        Returns: string
      }
      upsert_supplier: {
        Args: { p: Json }
        Returns: string
      }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
