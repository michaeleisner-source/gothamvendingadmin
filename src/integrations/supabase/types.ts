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
      commission_payouts: {
        Row: {
          amount: number
          calculated_at: string
          created_at: string
          id: string
          location_id: string
          notes: string | null
          org_id: string
          paid: boolean | null
          paid_at: string | null
          period_end: string
          period_start: string
          updated_at: string
        }
        Insert: {
          amount: number
          calculated_at?: string
          created_at?: string
          id?: string
          location_id: string
          notes?: string | null
          org_id: string
          paid?: boolean | null
          paid_at?: string | null
          period_end: string
          period_start: string
          updated_at?: string
        }
        Update: {
          amount?: number
          calculated_at?: string
          created_at?: string
          id?: string
          location_id?: string
          notes?: string | null
          org_id?: string
          paid?: boolean | null
          paid_at?: string | null
          period_end?: string
          period_start?: string
          updated_at?: string
        }
        Relationships: []
      }
      deletion_logs: {
        Row: {
          created_at: string
          deleted_at: string
          deleted_by_name: string
          entity_data: Json | null
          entity_id: string
          entity_type: string
          id: string
          org_id: string
          reason: string | null
        }
        Insert: {
          created_at?: string
          deleted_at?: string
          deleted_by_name: string
          entity_data?: Json | null
          entity_id: string
          entity_type: string
          id?: string
          org_id: string
          reason?: string | null
        }
        Update: {
          created_at?: string
          deleted_at?: string
          deleted_by_name?: string
          entity_data?: Json | null
          entity_id?: string
          entity_type?: string
          id?: string
          org_id?: string
          reason?: string | null
        }
        Relationships: []
      }
      help_article_views: {
        Row: {
          article_id: string | null
          created_at: string
          dwell_ms: number | null
          id: string
          user_id: string | null
        }
        Insert: {
          article_id?: string | null
          created_at?: string
          dwell_ms?: number | null
          id?: string
          user_id?: string | null
        }
        Update: {
          article_id?: string | null
          created_at?: string
          dwell_ms?: number | null
          id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "help_article_views_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "help_articles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "help_article_views_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "v_help_article_perf"
            referencedColumns: ["id"]
          },
        ]
      }
      help_articles: {
        Row: {
          body_md: string
          category_id: string | null
          id: string
          search_tsv: unknown | null
          slug: string | null
          title: string
          updated_at: string
        }
        Insert: {
          body_md: string
          category_id?: string | null
          id?: string
          search_tsv?: unknown | null
          slug?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          body_md?: string
          category_id?: string | null
          id?: string
          search_tsv?: unknown | null
          slug?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "help_articles_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "help_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      help_backlog: {
        Row: {
          article_id: string | null
          assigned_staff_id: string | null
          category_id: string | null
          context_page: string | null
          created_at: string
          escalations_90d: number | null
          id: string
          last_seen: string | null
          misses_90d: number | null
          normalized_q: string | null
          notes: string | null
          priority: number
          q: string
          query_hash: string | null
          status: string
          updated_at: string
        }
        Insert: {
          article_id?: string | null
          assigned_staff_id?: string | null
          category_id?: string | null
          context_page?: string | null
          created_at?: string
          escalations_90d?: number | null
          id?: string
          last_seen?: string | null
          misses_90d?: number | null
          normalized_q?: string | null
          notes?: string | null
          priority?: number
          q: string
          query_hash?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          article_id?: string | null
          assigned_staff_id?: string | null
          category_id?: string | null
          context_page?: string | null
          created_at?: string
          escalations_90d?: number | null
          id?: string
          last_seen?: string | null
          misses_90d?: number | null
          normalized_q?: string | null
          notes?: string | null
          priority?: number
          q?: string
          query_hash?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "help_backlog_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "help_articles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "help_backlog_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "v_help_article_perf"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "help_backlog_assigned_staff_id_fkey"
            columns: ["assigned_staff_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "help_backlog_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "help_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      help_bot_sessions: {
        Row: {
          created_ticket_id: string | null
          ended_at: string | null
          id: string
          resolved: boolean | null
          started_at: string
          user_id: string | null
        }
        Insert: {
          created_ticket_id?: string | null
          ended_at?: string | null
          id?: string
          resolved?: boolean | null
          started_at?: string
          user_id?: string | null
        }
        Update: {
          created_ticket_id?: string | null
          ended_at?: string | null
          id?: string
          resolved?: boolean | null
          started_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      help_categories: {
        Row: {
          id: string
          name: string
          slug: string
          sort_order: number | null
        }
        Insert: {
          id?: string
          name: string
          slug: string
          sort_order?: number | null
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          sort_order?: number | null
        }
        Relationships: []
      }
      help_click_events: {
        Row: {
          created_at: string
          id: string
          rank: number | null
          search_event_id: string | null
          source: string
          target_id: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          rank?: number | null
          search_event_id?: string | null
          source: string
          target_id: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          rank?: number | null
          search_event_id?: string | null
          source?: string
          target_id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "help_click_events_search_event_id_fkey"
            columns: ["search_event_id"]
            isOneToOne: false
            referencedRelation: "help_search_events"
            referencedColumns: ["id"]
          },
        ]
      }
      help_escalations: {
        Row: {
          context_page: string | null
          created_at: string
          created_ticket_id: string | null
          id: string
          q: string
          user_id: string | null
        }
        Insert: {
          context_page?: string | null
          created_at?: string
          created_ticket_id?: string | null
          id?: string
          q: string
          user_id?: string | null
        }
        Update: {
          context_page?: string | null
          created_at?: string
          created_ticket_id?: string | null
          id?: string
          q?: string
          user_id?: string | null
        }
        Relationships: []
      }
      help_faqs: {
        Row: {
          answer_md: string
          id: string
          question: string
          search_tsv: unknown | null
        }
        Insert: {
          answer_md: string
          id?: string
          question: string
          search_tsv?: unknown | null
        }
        Update: {
          answer_md?: string
          id?: string
          question?: string
          search_tsv?: unknown | null
        }
        Relationships: []
      }
      help_feedback: {
        Row: {
          article_id: string | null
          comment: string | null
          created_at: string
          helpful: boolean | null
          id: string
          user_id: string | null
        }
        Insert: {
          article_id?: string | null
          comment?: string | null
          created_at?: string
          helpful?: boolean | null
          id?: string
          user_id?: string | null
        }
        Update: {
          article_id?: string | null
          comment?: string | null
          created_at?: string
          helpful?: boolean | null
          id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "help_feedback_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "help_articles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "help_feedback_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "v_help_article_perf"
            referencedColumns: ["id"]
          },
        ]
      }
      help_search_events: {
        Row: {
          context_page: string | null
          created_at: string
          id: string
          q: string
          result_count: number
          user_id: string | null
        }
        Insert: {
          context_page?: string | null
          created_at?: string
          id?: string
          q: string
          result_count: number
          user_id?: string | null
        }
        Update: {
          context_page?: string | null
          created_at?: string
          id?: string
          q?: string
          result_count?: number
          user_id?: string | null
        }
        Relationships: []
      }
      help_steps: {
        Row: {
          article_id: string | null
          content_md: string
          id: string
          step_no: number
        }
        Insert: {
          article_id?: string | null
          content_md: string
          id?: string
          step_no: number
        }
        Update: {
          article_id?: string | null
          content_md?: string
          id?: string
          step_no?: number
        }
        Relationships: [
          {
            foreignKeyName: "help_steps_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "help_articles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "help_steps_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "v_help_article_perf"
            referencedColumns: ["id"]
          },
        ]
      }
      help_zero_results: {
        Row: {
          context_page: string | null
          created_at: string
          id: string
          q: string
          user_id: string | null
        }
        Insert: {
          context_page?: string | null
          created_at?: string
          id?: string
          q: string
          user_id?: string | null
        }
        Update: {
          context_page?: string | null
          created_at?: string
          id?: string
          q?: string
          user_id?: string | null
        }
        Relationships: []
      }
      location_commissions: {
        Row: {
          created_at: string
          effective_from: string
          effective_to: string | null
          id: string
          location_id: string
          model: string
          org_id: string
          updated_at: string
          value: number
        }
        Insert: {
          created_at?: string
          effective_from: string
          effective_to?: string | null
          id?: string
          location_id: string
          model: string
          org_id: string
          updated_at?: string
          value: number
        }
        Update: {
          created_at?: string
          effective_from?: string
          effective_to?: string | null
          id?: string
          location_id?: string
          model?: string
          org_id?: string
          updated_at?: string
          value?: number
        }
        Relationships: []
      }
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
          search_tsv: unknown | null
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
          search_tsv?: unknown | null
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
          search_tsv?: unknown | null
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
      machine_finance: {
        Row: {
          acquisition_type: string
          apr: number | null
          balloon_payment: number | null
          created_at: string
          data_plan_monthly: number | null
          depreciation_method: string | null
          first_payment_date: string | null
          id: string
          insurance_monthly: number | null
          insurance_policy_no: string | null
          insurance_provider: string | null
          insured: boolean | null
          lender: string | null
          life_months: number | null
          machine_id: string
          monthly_payment: number | null
          notes: string | null
          org_id: string
          purchase_price: number | null
          purchased_at: string | null
          salvage_value: number | null
          supplier_id: string | null
          telemetry_monthly: number | null
          term_months: number | null
          updated_at: string
        }
        Insert: {
          acquisition_type: string
          apr?: number | null
          balloon_payment?: number | null
          created_at?: string
          data_plan_monthly?: number | null
          depreciation_method?: string | null
          first_payment_date?: string | null
          id?: string
          insurance_monthly?: number | null
          insurance_policy_no?: string | null
          insurance_provider?: string | null
          insured?: boolean | null
          lender?: string | null
          life_months?: number | null
          machine_id: string
          monthly_payment?: number | null
          notes?: string | null
          org_id: string
          purchase_price?: number | null
          purchased_at?: string | null
          salvage_value?: number | null
          supplier_id?: string | null
          telemetry_monthly?: number | null
          term_months?: number | null
          updated_at?: string
        }
        Update: {
          acquisition_type?: string
          apr?: number | null
          balloon_payment?: number | null
          created_at?: string
          data_plan_monthly?: number | null
          depreciation_method?: string | null
          first_payment_date?: string | null
          id?: string
          insurance_monthly?: number | null
          insurance_policy_no?: string | null
          insurance_provider?: string | null
          insured?: boolean | null
          lender?: string | null
          life_months?: number | null
          machine_id?: string
          monthly_payment?: number | null
          notes?: string | null
          org_id?: string
          purchase_price?: number | null
          purchased_at?: string | null
          salvage_value?: number | null
          supplier_id?: string | null
          telemetry_monthly?: number | null
          term_months?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      machine_processor_mappings: {
        Row: {
          created_at: string
          fixed_fee: number | null
          id: string
          machine_id: string
          monthly_fee: number | null
          org_id: string
          percent_fee: number | null
          processor_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          fixed_fee?: number | null
          id?: string
          machine_id: string
          monthly_fee?: number | null
          org_id: string
          percent_fee?: number | null
          processor_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          fixed_fee?: number | null
          id?: string
          machine_id?: string
          monthly_fee?: number | null
          org_id?: string
          percent_fee?: number | null
          processor_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      machine_slots: {
        Row: {
          capacity: number | null
          col: number
          id: string
          label: string
          machine_id: string
          org_id: string
          row: number
        }
        Insert: {
          capacity?: number | null
          col: number
          id?: string
          label: string
          machine_id: string
          org_id: string
          row: number
        }
        Update: {
          capacity?: number | null
          col?: number
          id?: string
          label?: string
          machine_id?: string
          org_id?: string
          row?: number
        }
        Relationships: [
          {
            foreignKeyName: "machine_slots_machine_id_fkey"
            columns: ["machine_id"]
            isOneToOne: false
            referencedRelation: "machines"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "machine_slots_org_id_fkey"
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
          search_tsv: unknown | null
          status: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          location?: string | null
          location_id?: string | null
          name: string
          org_id?: string | null
          search_tsv?: unknown | null
          status?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          location?: string | null
          location_id?: string | null
          name?: string
          org_id?: string | null
          search_tsv?: unknown | null
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
      maintenance_plans: {
        Row: {
          created_at: string
          id: string
          interval_days: number
          machine_id: string
          next_due: string | null
          org_id: string
          plan_name: string | null
          updated_at: string
          warranty_expires_on: string | null
          warranty_provider: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          interval_days: number
          machine_id: string
          next_due?: string | null
          org_id: string
          plan_name?: string | null
          updated_at?: string
          warranty_expires_on?: string | null
          warranty_provider?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          interval_days?: number
          machine_id?: string
          next_due?: string | null
          org_id?: string
          plan_name?: string | null
          updated_at?: string
          warranty_expires_on?: string | null
          warranty_provider?: string | null
        }
        Relationships: []
      }
      maintenance_work_orders: {
        Row: {
          closed_at: string | null
          created_at: string
          id: string
          issue: string
          labor_cost: number | null
          labor_hours: number | null
          machine_id: string
          opened_at: string
          org_id: string
          parts_cost: number | null
          priority: string | null
          resolution: string | null
          technician_id: string | null
          updated_at: string
        }
        Insert: {
          closed_at?: string | null
          created_at?: string
          id?: string
          issue: string
          labor_cost?: number | null
          labor_hours?: number | null
          machine_id: string
          opened_at?: string
          org_id: string
          parts_cost?: number | null
          priority?: string | null
          resolution?: string | null
          technician_id?: string | null
          updated_at?: string
        }
        Update: {
          closed_at?: string | null
          created_at?: string
          id?: string
          issue?: string
          labor_cost?: number | null
          labor_hours?: number | null
          machine_id?: string
          opened_at?: string
          org_id?: string
          parts_cost?: number | null
          priority?: string | null
          resolution?: string | null
          technician_id?: string | null
          updated_at?: string
        }
        Relationships: []
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
      par_rules: {
        Row: {
          created_at: string
          id: string
          max_qty: number | null
          min_qty: number
          org_id: string
          product_id: string | null
          reorder_qty: number | null
          scope_id: string | null
          scope_type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          max_qty?: number | null
          min_qty?: number
          org_id: string
          product_id?: string | null
          reorder_qty?: number | null
          scope_id?: string | null
          scope_type: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          max_qty?: number | null
          min_qty?: number
          org_id?: string
          product_id?: string | null
          reorder_qty?: number | null
          scope_id?: string | null
          scope_type?: string
          updated_at?: string
        }
        Relationships: []
      }
      payment_processors: {
        Row: {
          created_at: string
          default_fixed_fee: number | null
          default_percent_fee: number | null
          id: string
          monthly_fee: number | null
          name: string
          org_id: string
          processor_type: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          default_fixed_fee?: number | null
          default_percent_fee?: number | null
          id?: string
          monthly_fee?: number | null
          name: string
          org_id: string
          processor_type?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          default_fixed_fee?: number | null
          default_percent_fee?: number | null
          id?: string
          monthly_fee?: number | null
          name?: string
          org_id?: string
          processor_type?: string | null
          updated_at?: string
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
      product_lots: {
        Row: {
          created_at: string
          expires_at: string | null
          id: string
          lot_no: string | null
          org_id: string
          product_id: string
          received_at: string | null
          supplier_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          expires_at?: string | null
          id?: string
          lot_no?: string | null
          org_id: string
          product_id: string
          received_at?: string | null
          supplier_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          expires_at?: string | null
          id?: string
          lot_no?: string | null
          org_id?: string
          product_id?: string
          received_at?: string | null
          supplier_id?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      products: {
        Row: {
          category: string | null
          cost: number | null
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          manufacturer: string | null
          name: string
          org_id: string | null
          price: number | null
          search_tsv: unknown | null
          size_ml: number | null
          size_oz: number | null
          sku: string
          updated_at: string
        }
        Insert: {
          category?: string | null
          cost?: number | null
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          manufacturer?: string | null
          name: string
          org_id?: string | null
          price?: number | null
          search_tsv?: unknown | null
          size_ml?: number | null
          size_oz?: number | null
          sku: string
          updated_at?: string
        }
        Update: {
          category?: string | null
          cost?: number | null
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          manufacturer?: string | null
          name?: string
          org_id?: string | null
          price?: number | null
          search_tsv?: unknown | null
          size_ml?: number | null
          size_oz?: number | null
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
      restock_lines: {
        Row: {
          added_qty: number | null
          id: string
          new_qty: number | null
          org_id: string
          prev_qty: number | null
          product_id: string
          session_id: string
          slot_id: string
        }
        Insert: {
          added_qty?: number | null
          id?: string
          new_qty?: number | null
          org_id: string
          prev_qty?: number | null
          product_id: string
          session_id: string
          slot_id: string
        }
        Update: {
          added_qty?: number | null
          id?: string
          new_qty?: number | null
          org_id?: string
          prev_qty?: number | null
          product_id?: string
          session_id?: string
          slot_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "restock_lines_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "restock_lines_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "restock_lines_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "restock_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "restock_lines_slot_id_fkey"
            columns: ["slot_id"]
            isOneToOne: false
            referencedRelation: "machine_slots"
            referencedColumns: ["id"]
          },
        ]
      }
      restock_sessions: {
        Row: {
          completed_at: string | null
          id: string
          machine_id: string
          note: string | null
          org_id: string
          started_at: string
        }
        Insert: {
          completed_at?: string | null
          id?: string
          machine_id: string
          note?: string | null
          org_id: string
          started_at?: string
        }
        Update: {
          completed_at?: string | null
          id?: string
          machine_id?: string
          note?: string | null
          org_id?: string
          started_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "restock_sessions_machine_id_fkey"
            columns: ["machine_id"]
            isOneToOne: false
            referencedRelation: "machines"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "restock_sessions_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      route_assignments: {
        Row: {
          assigned_from: string | null
          assigned_to: string | null
          created_at: string
          id: string
          org_id: string
          route_id: string | null
          staff_id: string
          updated_at: string
        }
        Insert: {
          assigned_from?: string | null
          assigned_to?: string | null
          created_at?: string
          id?: string
          org_id: string
          route_id?: string | null
          staff_id: string
          updated_at?: string
        }
        Update: {
          assigned_from?: string | null
          assigned_to?: string | null
          created_at?: string
          id?: string
          org_id?: string
          route_id?: string | null
          staff_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      sales: {
        Row: {
          id: string
          machine_id: string
          occurred_at: string
          org_id: string
          product_id: string
          qty: number
          source: string | null
          unit_cost_cents: number | null
          unit_price_cents: number
        }
        Insert: {
          id?: string
          machine_id: string
          occurred_at?: string
          org_id: string
          product_id: string
          qty: number
          source?: string | null
          unit_cost_cents?: number | null
          unit_price_cents: number
        }
        Update: {
          id?: string
          machine_id?: string
          occurred_at?: string
          org_id?: string
          product_id?: string
          qty?: number
          source?: string | null
          unit_cost_cents?: number | null
          unit_price_cents?: number
        }
        Relationships: [
          {
            foreignKeyName: "sales_machine_id_fkey"
            columns: ["machine_id"]
            isOneToOne: false
            referencedRelation: "machines"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      slot_assignments: {
        Row: {
          id: string
          max_qty: number | null
          org_id: string
          product_id: string
          restock_threshold: number | null
          slot_id: string
        }
        Insert: {
          id?: string
          max_qty?: number | null
          org_id: string
          product_id: string
          restock_threshold?: number | null
          slot_id: string
        }
        Update: {
          id?: string
          max_qty?: number | null
          org_id?: string
          product_id?: string
          restock_threshold?: number | null
          slot_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "slot_assignments_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "slot_assignments_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "slot_assignments_slot_id_fkey"
            columns: ["slot_id"]
            isOneToOne: true
            referencedRelation: "machine_slots"
            referencedColumns: ["id"]
          },
        ]
      }
      staff: {
        Row: {
          active: boolean | null
          created_at: string
          email: string | null
          full_name: string
          id: string
          org_id: string
          phone: string | null
          role: string | null
          search_tsv: unknown | null
          updated_at: string
        }
        Insert: {
          active?: boolean | null
          created_at?: string
          email?: string | null
          full_name: string
          id?: string
          org_id: string
          phone?: string | null
          role?: string | null
          search_tsv?: unknown | null
          updated_at?: string
        }
        Update: {
          active?: boolean | null
          created_at?: string
          email?: string | null
          full_name?: string
          id?: string
          org_id?: string
          phone?: string | null
          role?: string | null
          search_tsv?: unknown | null
          updated_at?: string
        }
        Relationships: []
      }
      suppliers: {
        Row: {
          contact: string | null
          created_at: string
          id: string
          name: string
          org_id: string | null
          search_tsv: unknown | null
          updated_at: string
        }
        Insert: {
          contact?: string | null
          created_at?: string
          id?: string
          name: string
          org_id?: string | null
          search_tsv?: unknown | null
          updated_at?: string
        }
        Update: {
          contact?: string | null
          created_at?: string
          id?: string
          name?: string
          org_id?: string | null
          search_tsv?: unknown | null
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
      tax_configs: {
        Row: {
          applies_to: string | null
          created_at: string
          effective_from: string
          effective_to: string | null
          id: string
          jurisdiction: string
          org_id: string
          rate: number
          updated_at: string
        }
        Insert: {
          applies_to?: string | null
          created_at?: string
          effective_from: string
          effective_to?: string | null
          id?: string
          jurisdiction: string
          org_id: string
          rate: number
          updated_at?: string
        }
        Update: {
          applies_to?: string | null
          created_at?: string
          effective_from?: string
          effective_to?: string | null
          id?: string
          jurisdiction?: string
          org_id?: string
          rate?: number
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      v_help_article_perf: {
        Row: {
          clicks: number | null
          feedback_count: number | null
          helpful_rate: number | null
          id: string | null
          title: string | null
          updated_at: string | null
        }
        Relationships: []
      }
      v_help_bot_outcomes: {
        Row: {
          escalated: number | null
          escalated_pct: number | null
          resolved: number | null
          resolved_pct: number | null
          sessions: number | null
          week: string | null
        }
        Relationships: []
      }
      v_help_top_queries: {
        Row: {
          avg_results: number | null
          q: string | null
          searches: number | null
        }
        Relationships: []
      }
      v_help_zero_results: {
        Row: {
          misses: number | null
          q: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      _normalize_range: {
        Args: { p_end: string; p_start: string }
        Returns: {
          end_at: string
          start_at: string
        }[]
      }
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
      dashboard_metrics: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      delete_purchase_order_item_with_log: {
        Args: {
          p_deleted_by_name: string
          p_item_id: string
          p_reason?: string
        }
        Returns: undefined
      }
      delete_purchase_order_with_log: {
        Args: { p_deleted_by_name: string; p_po_id: string; p_reason?: string }
        Returns: undefined
      }
      generate_machine_slots: {
        Args: { p_cols: number; p_machine_id: string; p_rows: number }
        Returns: number
      }
      is_org_member: {
        Args: { row_org: string }
        Returns: boolean
      }
      is_org_owner: {
        Args: { target_org_id: string }
        Returns: boolean
      }
      list_products: {
        Args: { p_limit?: number; p_offset?: number; p_search?: string }
        Returns: {
          category: string | null
          cost: number | null
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          manufacturer: string | null
          name: string
          org_id: string | null
          price: number | null
          search_tsv: unknown | null
          size_ml: number | null
          size_oz: number | null
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
          search_tsv: unknown | null
          updated_at: string
        }[]
      }
      normalize_help_query: {
        Args: { input_text: string }
        Returns: string
      }
      record_sale: {
        Args: {
          p_machine_id: string
          p_occurred_at?: string
          p_product_id: string
          p_qty: number
          p_source?: string
          p_unit_cost_cents?: number
          p_unit_price_cents: number
        }
        Returns: string
      }
      report_financial_kpis: {
        Args: { p_end?: string; p_start?: string }
        Returns: {
          cost_cents: number
          gross_revenue_cents: number
          net_profit_cents: number
          profit_pct: number
        }[]
      }
      report_low_stock: {
        Args: Record<PropertyKey, never>
        Returns: {
          current_qty: number
          machine_id: string
          machine_name: string
          product_id: string
          product_name: string
          restock_threshold: number
          slot_label: string
        }[]
      }
      report_orders_per_day: {
        Args: { p_end?: string; p_start?: string }
        Returns: {
          day: string
          orders: number
        }[]
      }
      report_products_sold_per_day: {
        Args: { p_end?: string; p_start?: string }
        Returns: {
          day: string
          qty_sold: number
        }[]
      }
      report_products_sold_per_month: {
        Args: { p_end?: string; p_start?: string }
        Returns: {
          month: string
          qty_sold: number
        }[]
      }
      report_profit_per_machine: {
        Args: { p_end?: string; p_start?: string }
        Returns: {
          cost_cents: number
          gross_revenue_cents: number
          machine_id: string
          machine_name: string
          net_profit_cents: number
          profit_pct: number
        }[]
      }
      report_purchase_orders: {
        Args: { p_days?: number; p_status?: string }
        Returns: {
          created_at: string
          po_id: string
          status: string
          supplier_id: string
          supplier_name: string
          total_amount: number
        }[]
      }
      report_restock_history: {
        Args: { p_days?: number; p_machine_id: string }
        Returns: Json
      }
      report_revenue_per_machine: {
        Args: { p_end?: string; p_start?: string }
        Returns: {
          cost_cents: number
          gross_revenue_cents: number
          machine_id: string
          machine_name: string
          net_profit_cents: number
          orders: number
          profit_pct: number
          qty_sold: number
        }[]
      }
      report_revenue_per_product: {
        Args: { p_end?: string; p_start?: string }
        Returns: {
          gross_revenue_cents: number
          orders: number
          product_id: string
          product_name: string
          qty_sold: number
        }[]
      }
      rpc_log_help_click: {
        Args: {
          _rank: number
          _search_id: string
          _source: string
          _target: string
        }
        Returns: undefined
      }
      rpc_log_help_escalation: {
        Args: { _context: string; _q: string; _ticket: string }
        Returns: undefined
      }
      rpc_log_help_feedback: {
        Args: { _article: string; _comment: string; _helpful: boolean }
        Returns: undefined
      }
      rpc_log_help_search: {
        Args: { _context: string; _count: number; _q: string }
        Returns: string
      }
      rpc_merge_backlog: {
        Args: { _duplicate: string; _primary: string }
        Returns: undefined
      }
      rpc_promote_backlog_to_article: {
        Args: { _backlog_id: string }
        Returns: string
      }
      rpc_refresh_help_backlog: {
        Args: { days_back?: number }
        Returns: undefined
      }
      save_restock_session: {
        Args: { p_complete: boolean; p_lines: Json; p_session_id: string }
        Returns: number
      }
      search_all: {
        Args: { limit_count?: number; q: string }
        Returns: {
          entity: string
          id: string
          rank: number
          subtitle: string
          title: string
          url: string
        }[]
      }
      search_help: {
        Args: { limit_count?: number; q: string }
        Returns: {
          id: string
          rank: number
          snippet: string
          source: string
          title: string
          url: string
        }[]
      }
      start_restock_session: {
        Args: { p_machine_id: string; p_note?: string }
        Returns: string
      }
      upsert_product: {
        Args: { p: Json }
        Returns: string
      }
      upsert_slot_assignments: {
        Args: { p_assignments: Json; p_machine_id: string }
        Returns: number
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
