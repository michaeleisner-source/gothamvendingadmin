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
      cash_collections: {
        Row: {
          collected_amount_cents: number
          collection_date: string
          collection_notes: string | null
          collector_id: string | null
          created_at: string
          deposit_reference: string | null
          deposited_amount_cents: number | null
          deposited_at: string | null
          discrepancy_cents: number | null
          expected_amount_cents: number | null
          id: string
          machine_id: string
          org_id: string
          route_id: string | null
          updated_at: string
        }
        Insert: {
          collected_amount_cents?: number
          collection_date: string
          collection_notes?: string | null
          collector_id?: string | null
          created_at?: string
          deposit_reference?: string | null
          deposited_amount_cents?: number | null
          deposited_at?: string | null
          discrepancy_cents?: number | null
          expected_amount_cents?: number | null
          id?: string
          machine_id: string
          org_id: string
          route_id?: string | null
          updated_at?: string
        }
        Update: {
          collected_amount_cents?: number
          collection_date?: string
          collection_notes?: string | null
          collector_id?: string | null
          created_at?: string
          deposit_reference?: string | null
          deposited_amount_cents?: number | null
          deposited_at?: string | null
          discrepancy_cents?: number | null
          expected_amount_cents?: number | null
          id?: string
          machine_id?: string
          org_id?: string
          route_id?: string | null
          updated_at?: string
        }
        Relationships: []
      }
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
      commission_settings: {
        Row: {
          commission_base: string | null
          commission_flat_cents: number | null
          commission_min_guarantee_cents: number | null
          commission_rate: number | null
          commission_tiers_json: Json | null
          commission_type: string | null
          created_at: string | null
          effective_from: string | null
          effective_to: string | null
          location_id: string
          org_id: string | null
          updated_at: string | null
        }
        Insert: {
          commission_base?: string | null
          commission_flat_cents?: number | null
          commission_min_guarantee_cents?: number | null
          commission_rate?: number | null
          commission_tiers_json?: Json | null
          commission_type?: string | null
          created_at?: string | null
          effective_from?: string | null
          effective_to?: string | null
          location_id: string
          org_id?: string | null
          updated_at?: string | null
        }
        Update: {
          commission_base?: string | null
          commission_flat_cents?: number | null
          commission_min_guarantee_cents?: number | null
          commission_rate?: number | null
          commission_tiers_json?: Json | null
          commission_type?: string | null
          created_at?: string | null
          effective_from?: string | null
          effective_to?: string | null
          location_id?: string
          org_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "commission_settings_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: true
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
        ]
      }
      commission_statements: {
        Row: {
          base: string | null
          base_amount_cents: number | null
          commission_cents: number | null
          cost_cents: number | null
          created_at: string | null
          fees_cents: number | null
          flat_cents: number | null
          gross_cents: number | null
          id: string
          location_id: string | null
          method: string | null
          min_guarantee_cents: number | null
          month: string
          net_cents: number | null
          org_id: string | null
          rate_pct: number | null
          status: string | null
          tiers_json: Json | null
          updated_at: string | null
        }
        Insert: {
          base?: string | null
          base_amount_cents?: number | null
          commission_cents?: number | null
          cost_cents?: number | null
          created_at?: string | null
          fees_cents?: number | null
          flat_cents?: number | null
          gross_cents?: number | null
          id?: string
          location_id?: string | null
          method?: string | null
          min_guarantee_cents?: number | null
          month: string
          net_cents?: number | null
          org_id?: string | null
          rate_pct?: number | null
          status?: string | null
          tiers_json?: Json | null
          updated_at?: string | null
        }
        Update: {
          base?: string | null
          base_amount_cents?: number | null
          commission_cents?: number | null
          cost_cents?: number | null
          created_at?: string | null
          fees_cents?: number | null
          flat_cents?: number | null
          gross_cents?: number | null
          id?: string
          location_id?: string | null
          method?: string | null
          min_guarantee_cents?: number | null
          month?: string
          net_cents?: number | null
          org_id?: string | null
          rate_pct?: number | null
          status?: string | null
          tiers_json?: Json | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "commission_statements_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
        ]
      }
      contracts: {
        Row: {
          auto_renew: boolean | null
          body_html: string
          cancellation_notice_days: number | null
          commission_flat_cents: number | null
          contract_number: string | null
          created_at: string
          html: string | null
          id: string
          location_id: string
          machine_id: string | null
          org_id: string
          pdf_url: string | null
          prospect_id: string | null
          revenue_share_pct: number | null
          signed_at: string | null
          signed_email: string | null
          signed_name: string | null
          status: string | null
          term_months: number | null
          title: string
          updated_at: string
          version: number | null
        }
        Insert: {
          auto_renew?: boolean | null
          body_html: string
          cancellation_notice_days?: number | null
          commission_flat_cents?: number | null
          contract_number?: string | null
          created_at?: string
          html?: string | null
          id?: string
          location_id: string
          machine_id?: string | null
          org_id: string
          pdf_url?: string | null
          prospect_id?: string | null
          revenue_share_pct?: number | null
          signed_at?: string | null
          signed_email?: string | null
          signed_name?: string | null
          status?: string | null
          term_months?: number | null
          title?: string
          updated_at?: string
          version?: number | null
        }
        Update: {
          auto_renew?: boolean | null
          body_html?: string
          cancellation_notice_days?: number | null
          commission_flat_cents?: number | null
          contract_number?: string | null
          created_at?: string
          html?: string | null
          id?: string
          location_id?: string
          machine_id?: string | null
          org_id?: string
          pdf_url?: string | null
          prospect_id?: string | null
          revenue_share_pct?: number | null
          signed_at?: string | null
          signed_email?: string | null
          signed_name?: string | null
          status?: string | null
          term_months?: number | null
          title?: string
          updated_at?: string
          version?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "contracts_prospect_id_fkey"
            columns: ["prospect_id"]
            isOneToOne: false
            referencedRelation: "prospects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_contracts_location"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_contracts_machine"
            columns: ["machine_id"]
            isOneToOne: false
            referencedRelation: "machines"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_contracts_machine"
            columns: ["machine_id"]
            isOneToOne: false
            referencedRelation: "v_machine_health"
            referencedColumns: ["machine_id"]
          },
        ]
      }
      customer_interactions: {
        Row: {
          amount_cents: number | null
          customer_feedback: string | null
          error_code: string | null
          id: string
          interaction_type: string
          machine_id: string
          occurred_at: string
          org_id: string
          payment_method: string | null
          product_id: string | null
          session_duration_seconds: number | null
        }
        Insert: {
          amount_cents?: number | null
          customer_feedback?: string | null
          error_code?: string | null
          id?: string
          interaction_type: string
          machine_id: string
          occurred_at?: string
          org_id: string
          payment_method?: string | null
          product_id?: string | null
          session_duration_seconds?: number | null
        }
        Update: {
          amount_cents?: number | null
          customer_feedback?: string | null
          error_code?: string | null
          id?: string
          interaction_type?: string
          machine_id?: string
          occurred_at?: string
          org_id?: string
          payment_method?: string | null
          product_id?: string | null
          session_duration_seconds?: number | null
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
      delivery_routes: {
        Row: {
          created_at: string
          driver_id: string | null
          estimated_duration: unknown | null
          id: string
          name: string
          org_id: string
          route_day: string | null
          start_time: string | null
          status: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          driver_id?: string | null
          estimated_duration?: unknown | null
          id?: string
          name: string
          org_id: string
          route_day?: string | null
          start_time?: string | null
          status?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          driver_id?: string | null
          estimated_duration?: unknown | null
          id?: string
          name?: string
          org_id?: string
          route_day?: string | null
          start_time?: string | null
          status?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "delivery_routes_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
        ]
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
      insurance_allocations: {
        Row: {
          allocated_pct_bps: number | null
          created_at: string
          effective_end: string | null
          effective_start: string | null
          flat_monthly_cents: number | null
          id: string
          level: string
          location_id: string | null
          machine_id: string | null
          org_id: string
          policy_id: string
          updated_at: string
        }
        Insert: {
          allocated_pct_bps?: number | null
          created_at?: string
          effective_end?: string | null
          effective_start?: string | null
          flat_monthly_cents?: number | null
          id?: string
          level: string
          location_id?: string | null
          machine_id?: string | null
          org_id: string
          policy_id: string
          updated_at?: string
        }
        Update: {
          allocated_pct_bps?: number | null
          created_at?: string
          effective_end?: string | null
          effective_start?: string | null
          flat_monthly_cents?: number | null
          id?: string
          level?: string
          location_id?: string | null
          machine_id?: string | null
          org_id?: string
          policy_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "insurance_allocations_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "insurance_allocations_machine_id_fkey"
            columns: ["machine_id"]
            isOneToOne: false
            referencedRelation: "machines"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "insurance_allocations_machine_id_fkey"
            columns: ["machine_id"]
            isOneToOne: false
            referencedRelation: "v_machine_health"
            referencedColumns: ["machine_id"]
          },
          {
            foreignKeyName: "insurance_allocations_policy_id_fkey"
            columns: ["policy_id"]
            isOneToOne: false
            referencedRelation: "insurance_policies"
            referencedColumns: ["id"]
          },
        ]
      }
      insurance_certificates: {
        Row: {
          certificate_url: string
          created_at: string
          expires_at: string | null
          id: string
          issued_at: string
          location_id: string
          notes: string | null
          org_id: string
          policy_id: string
          updated_at: string
        }
        Insert: {
          certificate_url: string
          created_at?: string
          expires_at?: string | null
          id?: string
          issued_at?: string
          location_id: string
          notes?: string | null
          org_id: string
          policy_id: string
          updated_at?: string
        }
        Update: {
          certificate_url?: string
          created_at?: string
          expires_at?: string | null
          id?: string
          issued_at?: string
          location_id?: string
          notes?: string | null
          org_id?: string
          policy_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "insurance_certificates_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "insurance_certificates_policy_id_fkey"
            columns: ["policy_id"]
            isOneToOne: false
            referencedRelation: "insurance_policies"
            referencedColumns: ["id"]
          },
        ]
      }
      insurance_policies: {
        Row: {
          carrier: string | null
          coverage_end: string
          coverage_start: string
          created_at: string
          document_url: string | null
          id: string
          monthly_premium_cents: number
          name: string
          notes: string | null
          org_id: string
          policy_number: string | null
          updated_at: string
        }
        Insert: {
          carrier?: string | null
          coverage_end: string
          coverage_start: string
          created_at?: string
          document_url?: string | null
          id?: string
          monthly_premium_cents: number
          name: string
          notes?: string | null
          org_id: string
          policy_number?: string | null
          updated_at?: string
        }
        Update: {
          carrier?: string | null
          coverage_end?: string
          coverage_start?: string
          created_at?: string
          document_url?: string | null
          id?: string
          monthly_premium_cents?: number
          name?: string
          notes?: string | null
          org_id?: string
          policy_number?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      inventory_levels: {
        Row: {
          created_at: string
          current_qty: number
          days_of_supply: number | null
          id: string
          last_restocked_at: string | null
          machine_id: string
          org_id: string
          par_level: number | null
          product_id: string
          reorder_point: number | null
          sales_velocity: number | null
          slot_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          current_qty?: number
          days_of_supply?: number | null
          id?: string
          last_restocked_at?: string | null
          machine_id: string
          org_id: string
          par_level?: number | null
          product_id: string
          reorder_point?: number | null
          sales_velocity?: number | null
          slot_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          current_qty?: number
          days_of_supply?: number | null
          id?: string
          last_restocked_at?: string | null
          machine_id?: string
          org_id?: string
          par_level?: number | null
          product_id?: string
          reorder_point?: number | null
          sales_velocity?: number | null
          slot_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_levels_machine_id_fkey"
            columns: ["machine_id"]
            isOneToOne: false
            referencedRelation: "machines"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_levels_machine_id_fkey"
            columns: ["machine_id"]
            isOneToOne: false
            referencedRelation: "v_machine_health"
            referencedColumns: ["machine_id"]
          },
          {
            foreignKeyName: "inventory_levels_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_levels_slot_id_fkey"
            columns: ["slot_id"]
            isOneToOne: true
            referencedRelation: "machine_slots"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_transactions: {
        Row: {
          created_at: string
          id: string
          location_id: string | null
          machine_id: string | null
          occurred_at: string
          org_id: string
          product_id: string
          qty_change: number
          reason: string
          ref_id: string | null
          ref_type: string | null
          slot_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          location_id?: string | null
          machine_id?: string | null
          occurred_at?: string
          org_id: string
          product_id: string
          qty_change: number
          reason: string
          ref_id?: string | null
          ref_type?: string | null
          slot_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          location_id?: string | null
          machine_id?: string | null
          occurred_at?: string
          org_id?: string
          product_id?: string
          qty_change?: number
          reason?: string
          ref_id?: string | null
          ref_type?: string | null
          slot_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inventory_transactions_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_transactions_machine_id_fkey"
            columns: ["machine_id"]
            isOneToOne: false
            referencedRelation: "machines"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_transactions_machine_id_fkey"
            columns: ["machine_id"]
            isOneToOne: false
            referencedRelation: "v_machine_health"
            referencedColumns: ["machine_id"]
          },
          {
            foreignKeyName: "inventory_transactions_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          address: string
          city: string
          company: string | null
          contact_method: string
          created_at: string
          email: string | null
          estimated_foot_traffic: number
          follow_up_date: string | null
          id: string
          location_type: string
          name: string
          notes: string | null
          org_id: string
          phone: string | null
          revenue_split: number | null
          state: string
          status: string
          updated_at: string
          zip_code: string
        }
        Insert: {
          address: string
          city: string
          company?: string | null
          contact_method: string
          created_at?: string
          email?: string | null
          estimated_foot_traffic: number
          follow_up_date?: string | null
          id?: string
          location_type: string
          name: string
          notes?: string | null
          org_id: string
          phone?: string | null
          revenue_split?: number | null
          state: string
          status?: string
          updated_at?: string
          zip_code: string
        }
        Update: {
          address?: string
          city?: string
          company?: string | null
          contact_method?: string
          created_at?: string
          email?: string | null
          estimated_foot_traffic?: number
          follow_up_date?: string | null
          id?: string
          location_type?: string
          name?: string
          notes?: string | null
          org_id?: string
          phone?: string | null
          revenue_split?: number | null
          state?: string
          status?: string
          updated_at?: string
          zip_code?: string
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
          commission_flat_cents: number | null
          commission_min_cents: number | null
          commission_model: string | null
          commission_notes: string | null
          commission_pct_bps: number | null
          contact_email: string | null
          contact_name: string | null
          contact_phone: string | null
          contract_id: string | null
          contract_signed_at: string | null
          contract_url: string | null
          contract_version: string | null
          created_at: string | null
          from_prospect_id: string | null
          id: string
          location_type_id: string | null
          name: string
          org_id: string | null
          postal_code: string | null
          revenue_share_pct: number | null
          search_tsv: unknown | null
          state: string | null
          traffic_daily_est: number | null
          traffic_monthly_est: number | null
        }
        Insert: {
          address_line1?: string | null
          address_line2?: string | null
          city?: string | null
          commission_flat_cents?: number | null
          commission_min_cents?: number | null
          commission_model?: string | null
          commission_notes?: string | null
          commission_pct_bps?: number | null
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          contract_id?: string | null
          contract_signed_at?: string | null
          contract_url?: string | null
          contract_version?: string | null
          created_at?: string | null
          from_prospect_id?: string | null
          id?: string
          location_type_id?: string | null
          name: string
          org_id?: string | null
          postal_code?: string | null
          revenue_share_pct?: number | null
          search_tsv?: unknown | null
          state?: string | null
          traffic_daily_est?: number | null
          traffic_monthly_est?: number | null
        }
        Update: {
          address_line1?: string | null
          address_line2?: string | null
          city?: string | null
          commission_flat_cents?: number | null
          commission_min_cents?: number | null
          commission_model?: string | null
          commission_notes?: string | null
          commission_pct_bps?: number | null
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          contract_id?: string | null
          contract_signed_at?: string | null
          contract_url?: string | null
          contract_version?: string | null
          created_at?: string | null
          from_prospect_id?: string | null
          id?: string
          location_type_id?: string | null
          name?: string
          org_id?: string | null
          postal_code?: string | null
          revenue_share_pct?: number | null
          search_tsv?: unknown | null
          state?: string | null
          traffic_daily_est?: number | null
          traffic_monthly_est?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "locations_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
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
          cc_processing_fee_cents: number | null
          cc_processing_fee_percent: number | null
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
          monthly_software_cost: number | null
          notes: string | null
          org_id: string
          other_onetime_costs: number | null
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
          cc_processing_fee_cents?: number | null
          cc_processing_fee_percent?: number | null
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
          monthly_software_cost?: number | null
          notes?: string | null
          org_id: string
          other_onetime_costs?: number | null
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
          cc_processing_fee_cents?: number | null
          cc_processing_fee_percent?: number | null
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
          monthly_software_cost?: number | null
          notes?: string | null
          org_id?: string
          other_onetime_costs?: number | null
          purchase_price?: number | null
          purchased_at?: string | null
          salvage_value?: number | null
          supplier_id?: string | null
          telemetry_monthly?: number | null
          term_months?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "machine_finance_machine_id_fkey"
            columns: ["machine_id"]
            isOneToOne: true
            referencedRelation: "machines"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "machine_finance_machine_id_fkey"
            columns: ["machine_id"]
            isOneToOne: true
            referencedRelation: "v_machine_health"
            referencedColumns: ["machine_id"]
          },
        ]
      }
      machine_health_alerts: {
        Row: {
          alert_type: string
          auto_resolved: boolean
          created_at: string
          description: string | null
          id: string
          machine_id: string
          org_id: string
          resolution_notes: string | null
          resolved_at: string | null
          resolved_by: string | null
          severity: string
          title: string
          triggered_at: string
          updated_at: string
        }
        Insert: {
          alert_type: string
          auto_resolved?: boolean
          created_at?: string
          description?: string | null
          id?: string
          machine_id: string
          org_id: string
          resolution_notes?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: string
          title: string
          triggered_at?: string
          updated_at?: string
        }
        Update: {
          alert_type?: string
          auto_resolved?: boolean
          created_at?: string
          description?: string | null
          id?: string
          machine_id?: string
          org_id?: string
          resolution_notes?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: string
          title?: string
          triggered_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      machine_performance_metrics: {
        Row: {
          cash_collected_cents: number
          created_at: string
          downtime_minutes: number
          energy_consumption_kwh: number | null
          failed_transactions: number
          id: string
          machine_id: string
          metric_date: string
          org_id: string
          products_dispensed: number
          temperature_avg: number | null
          total_sales_cents: number
          total_transactions: number
          uptime_minutes: number
        }
        Insert: {
          cash_collected_cents?: number
          created_at?: string
          downtime_minutes?: number
          energy_consumption_kwh?: number | null
          failed_transactions?: number
          id?: string
          machine_id: string
          metric_date: string
          org_id: string
          products_dispensed?: number
          temperature_avg?: number | null
          total_sales_cents?: number
          total_transactions?: number
          uptime_minutes?: number
        }
        Update: {
          cash_collected_cents?: number
          created_at?: string
          downtime_minutes?: number
          energy_consumption_kwh?: number | null
          failed_transactions?: number
          id?: string
          machine_id?: string
          metric_date?: string
          org_id?: string
          products_dispensed?: number
          temperature_avg?: number | null
          total_sales_cents?: number
          total_transactions?: number
          uptime_minutes?: number
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
        Relationships: [
          {
            foreignKeyName: "machine_processor_mappings_machine_id_fkey"
            columns: ["machine_id"]
            isOneToOne: true
            referencedRelation: "machines"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "machine_processor_mappings_machine_id_fkey"
            columns: ["machine_id"]
            isOneToOne: true
            referencedRelation: "v_machine_health"
            referencedColumns: ["machine_id"]
          },
          {
            foreignKeyName: "machine_processor_mappings_processor_id_fkey"
            columns: ["processor_id"]
            isOneToOne: false
            referencedRelation: "payment_processors"
            referencedColumns: ["id"]
          },
        ]
      }
      machine_product_pricing: {
        Row: {
          created_at: string
          effective_from: string
          effective_to: string | null
          id: string
          machine_id: string
          org_id: string
          price_cents: number
          product_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          effective_from?: string
          effective_to?: string | null
          id?: string
          machine_id: string
          org_id: string
          price_cents: number
          product_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          effective_from?: string
          effective_to?: string | null
          id?: string
          machine_id?: string
          org_id?: string
          price_cents?: number
          product_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      machine_slot_pars: {
        Row: {
          created_at: string
          id: string
          machine_id: string
          org_id: string
          par_qty: number
          product_id: string | null
          slot_code: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          machine_id: string
          org_id: string
          par_qty?: number
          product_id?: string | null
          slot_code: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          machine_id?: string
          org_id?: string
          par_qty?: number
          product_id?: string | null
          slot_code?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "machine_slot_pars_machine_id_fkey"
            columns: ["machine_id"]
            isOneToOne: false
            referencedRelation: "machines"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "machine_slot_pars_machine_id_fkey"
            columns: ["machine_id"]
            isOneToOne: false
            referencedRelation: "v_machine_health"
            referencedColumns: ["machine_id"]
          },
          {
            foreignKeyName: "machine_slot_pars_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
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
            foreignKeyName: "machine_slots_machine_id_fkey"
            columns: ["machine_id"]
            isOneToOne: false
            referencedRelation: "v_machine_health"
            referencedColumns: ["machine_id"]
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
      machine_telemetry: {
        Row: {
          bill_jam_count: number | null
          cash_level_cents: number | null
          coin_jam_count: number | null
          door_open_alerts: number | null
          error_codes: string[] | null
          id: string
          last_sale_at: string | null
          machine_id: string
          network_status: string | null
          org_id: string
          power_cycles: number | null
          recorded_at: string
          temperature: number | null
        }
        Insert: {
          bill_jam_count?: number | null
          cash_level_cents?: number | null
          coin_jam_count?: number | null
          door_open_alerts?: number | null
          error_codes?: string[] | null
          id?: string
          last_sale_at?: string | null
          machine_id: string
          network_status?: string | null
          org_id: string
          power_cycles?: number | null
          recorded_at?: string
          temperature?: number | null
        }
        Update: {
          bill_jam_count?: number | null
          cash_level_cents?: number | null
          coin_jam_count?: number | null
          door_open_alerts?: number | null
          error_codes?: string[] | null
          id?: string
          last_sale_at?: string | null
          machine_id?: string
          network_status?: string | null
          org_id?: string
          power_cycles?: number | null
          recorded_at?: string
          temperature?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "machine_telemetry_machine_id_fkey"
            columns: ["machine_id"]
            isOneToOne: false
            referencedRelation: "machines"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "machine_telemetry_machine_id_fkey"
            columns: ["machine_id"]
            isOneToOne: false
            referencedRelation: "v_machine_health"
            referencedColumns: ["machine_id"]
          },
        ]
      }
      machines: {
        Row: {
          created_at: string | null
          id: string
          location: string | null
          location_id: string | null
          manufacturer: string | null
          name: string
          org_id: string | null
          search_tsv: unknown | null
          serial_number: string | null
          status: string | null
          wifi_type: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          location?: string | null
          location_id?: string | null
          manufacturer?: string | null
          name: string
          org_id?: string | null
          search_tsv?: unknown | null
          serial_number?: string | null
          status?: string | null
          wifi_type?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          location?: string | null
          location_id?: string | null
          manufacturer?: string | null
          name?: string
          org_id?: string | null
          search_tsv?: unknown | null
          serial_number?: string | null
          status?: string | null
          wifi_type?: string | null
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
      maintenance_schedules: {
        Row: {
          assigned_technician_id: string | null
          created_at: string
          estimated_cost_cents: number | null
          frequency_days: number
          id: string
          is_active: boolean
          last_service_date: string | null
          machine_id: string
          next_service_date: string
          org_id: string
          priority: string
          schedule_type: string
          service_description: string | null
          updated_at: string
        }
        Insert: {
          assigned_technician_id?: string | null
          created_at?: string
          estimated_cost_cents?: number | null
          frequency_days?: number
          id?: string
          is_active?: boolean
          last_service_date?: string | null
          machine_id: string
          next_service_date: string
          org_id: string
          priority?: string
          schedule_type: string
          service_description?: string | null
          updated_at?: string
        }
        Update: {
          assigned_technician_id?: string | null
          created_at?: string
          estimated_cost_cents?: number | null
          frequency_days?: number
          id?: string
          is_active?: boolean
          last_service_date?: string | null
          machine_id?: string
          next_service_date?: string
          org_id?: string
          priority?: string
          schedule_type?: string
          service_description?: string | null
          updated_at?: string
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
      notifications: {
        Row: {
          action_label: string | null
          action_url: string | null
          created_at: string
          expires_at: string | null
          id: string
          message: string
          metadata: Json | null
          notification_type: string
          org_id: string
          priority: string
          read_at: string | null
          title: string
          user_id: string | null
        }
        Insert: {
          action_label?: string | null
          action_url?: string | null
          created_at?: string
          expires_at?: string | null
          id?: string
          message: string
          metadata?: Json | null
          notification_type?: string
          org_id: string
          priority?: string
          read_at?: string | null
          title: string
          user_id?: string | null
        }
        Update: {
          action_label?: string | null
          action_url?: string | null
          created_at?: string
          expires_at?: string | null
          id?: string
          message?: string
          metadata?: Json | null
          notification_type?: string
          org_id?: string
          priority?: string
          read_at?: string | null
          title?: string
          user_id?: string | null
        }
        Relationships: []
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
      processor_fee_rules: {
        Row: {
          created_at: string
          effective_date: string
          fixed_cents: number
          id: string
          org_id: string
          percent_bps: number
          processor_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          effective_date?: string
          fixed_cents?: number
          id?: string
          org_id: string
          percent_bps?: number
          processor_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          effective_date?: string
          fixed_cents?: number
          id?: string
          org_id?: string
          percent_bps?: number
          processor_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "processor_fee_rules_processor_id_fkey"
            columns: ["processor_id"]
            isOneToOne: false
            referencedRelation: "payment_processors"
            referencedColumns: ["id"]
          },
        ]
      }
      processor_settlements: {
        Row: {
          created_at: string
          fees_cents: number
          gross_cents: number
          id: string
          net_cents: number
          notes: string | null
          org_id: string
          payout_date: string | null
          period_end: string
          period_start: string
          processor_id: string
          reference: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          fees_cents?: number
          gross_cents?: number
          id?: string
          net_cents?: number
          notes?: string | null
          org_id: string
          payout_date?: string | null
          period_end: string
          period_start: string
          processor_id: string
          reference?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          fees_cents?: number
          gross_cents?: number
          id?: string
          net_cents?: number
          notes?: string | null
          org_id?: string
          payout_date?: string | null
          period_end?: string
          period_start?: string
          processor_id?: string
          reference?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "processor_settlements_processor_id_fkey"
            columns: ["processor_id"]
            isOneToOne: false
            referencedRelation: "payment_processors"
            referencedColumns: ["id"]
          },
        ]
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
          cost_cents: number | null
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
          cost_cents?: number | null
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
          cost_cents?: number | null
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
      prospect_activities: {
        Row: {
          body: string | null
          created_at: string | null
          id: string
          org_id: string | null
          prospect_id: string
          type: string | null
        }
        Insert: {
          body?: string | null
          created_at?: string | null
          id?: string
          org_id?: string | null
          prospect_id: string
          type?: string | null
        }
        Update: {
          body?: string | null
          created_at?: string | null
          id?: string
          org_id?: string | null
          prospect_id?: string
          type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "prospect_activities_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prospect_activities_prospect_id_fkey"
            columns: ["prospect_id"]
            isOneToOne: false
            referencedRelation: "prospects"
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
          company: string | null
          contact_email: string | null
          contact_name: string | null
          contact_phone: string | null
          converted_location_id: string | null
          created_at: string | null
          id: string
          location_type_id: string | null
          name: string | null
          next_follow_up_at: string | null
          notes: string | null
          org_id: string | null
          owner_id: string | null
          postal_code: string | null
          source: string | null
          stage: string | null
          state: string | null
          status: string | null
          traffic_daily_est: number | null
          traffic_monthly_est: number | null
          updated_at: string | null
        }
        Insert: {
          address_line1?: string | null
          address_line2?: string | null
          business_name: string
          city?: string | null
          company?: string | null
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          converted_location_id?: string | null
          created_at?: string | null
          id?: string
          location_type_id?: string | null
          name?: string | null
          next_follow_up_at?: string | null
          notes?: string | null
          org_id?: string | null
          owner_id?: string | null
          postal_code?: string | null
          source?: string | null
          stage?: string | null
          state?: string | null
          status?: string | null
          traffic_daily_est?: number | null
          traffic_monthly_est?: number | null
          updated_at?: string | null
        }
        Update: {
          address_line1?: string | null
          address_line2?: string | null
          business_name?: string
          city?: string | null
          company?: string | null
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          converted_location_id?: string | null
          created_at?: string | null
          id?: string
          location_type_id?: string | null
          name?: string | null
          next_follow_up_at?: string | null
          notes?: string | null
          org_id?: string | null
          owner_id?: string | null
          postal_code?: string | null
          source?: string | null
          stage?: string | null
          state?: string | null
          status?: string | null
          traffic_daily_est?: number | null
          traffic_monthly_est?: number | null
          updated_at?: string | null
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
            foreignKeyName: "restock_sessions_machine_id_fkey"
            columns: ["machine_id"]
            isOneToOne: false
            referencedRelation: "v_machine_health"
            referencedColumns: ["machine_id"]
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
      route_stops: {
        Row: {
          actual_arrival: string | null
          completed: boolean | null
          estimated_arrival: string | null
          id: string
          machine_id: string
          notes: string | null
          org_id: string
          route_id: string
          service_type: string | null
          stop_order: number
        }
        Insert: {
          actual_arrival?: string | null
          completed?: boolean | null
          estimated_arrival?: string | null
          id?: string
          machine_id: string
          notes?: string | null
          org_id: string
          route_id: string
          service_type?: string | null
          stop_order: number
        }
        Update: {
          actual_arrival?: string | null
          completed?: boolean | null
          estimated_arrival?: string | null
          id?: string
          machine_id?: string
          notes?: string | null
          org_id?: string
          route_id?: string
          service_type?: string | null
          stop_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "route_stops_machine_id_fkey"
            columns: ["machine_id"]
            isOneToOne: false
            referencedRelation: "machines"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "route_stops_machine_id_fkey"
            columns: ["machine_id"]
            isOneToOne: false
            referencedRelation: "v_machine_health"
            referencedColumns: ["machine_id"]
          },
          {
            foreignKeyName: "route_stops_route_id_fkey"
            columns: ["route_id"]
            isOneToOne: false
            referencedRelation: "delivery_routes"
            referencedColumns: ["id"]
          },
        ]
      }
      sales: {
        Row: {
          id: string
          machine_id: string
          occurred_at: string
          org_id: string
          payment_method: string | null
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
          payment_method?: string | null
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
          payment_method?: string | null
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
            foreignKeyName: "sales_machine_id_fkey"
            columns: ["machine_id"]
            isOneToOne: false
            referencedRelation: "v_machine_health"
            referencedColumns: ["machine_id"]
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
      support_tickets: {
        Row: {
          assigned_to: string | null
          body: string | null
          created_at: string | null
          email: string | null
          id: string
          org_id: string
          priority: string | null
          resolved_at: string | null
          status: string | null
          subject: string
          updated_at: string | null
        }
        Insert: {
          assigned_to?: string | null
          body?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          org_id: string
          priority?: string | null
          resolved_at?: string | null
          status?: string | null
          subject: string
          updated_at?: string | null
        }
        Update: {
          assigned_to?: string | null
          body?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          org_id?: string
          priority?: string | null
          resolved_at?: string | null
          status?: string | null
          subject?: string
          updated_at?: string | null
        }
        Relationships: []
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
      ticket_sla_policies: {
        Row: {
          active: boolean
          created_at: string
          id: string
          minutes_to_ack: number
          minutes_to_resolve: number
          org_id: string
          priority: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          id?: string
          minutes_to_ack: number
          minutes_to_resolve: number
          org_id: string
          priority: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          id?: string
          minutes_to_ack?: number
          minutes_to_resolve?: number
          org_id?: string
          priority?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ticket_sla_policies_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      tickets: {
        Row: {
          acknowledged_at: string | null
          assigned_to: string | null
          category: string | null
          closed_at: string | null
          created_at: string
          created_by: string | null
          description: string | null
          due_at: string | null
          first_response_at: string | null
          id: string
          labor_cost_cents: number | null
          labor_hours: number | null
          location_id: string | null
          machine_id: string | null
          org_id: string
          parts_cost_cents: number | null
          priority: string
          resolution: string | null
          resolved_at: string | null
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          acknowledged_at?: string | null
          assigned_to?: string | null
          category?: string | null
          closed_at?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          due_at?: string | null
          first_response_at?: string | null
          id?: string
          labor_cost_cents?: number | null
          labor_hours?: number | null
          location_id?: string | null
          machine_id?: string | null
          org_id: string
          parts_cost_cents?: number | null
          priority?: string
          resolution?: string | null
          resolved_at?: string | null
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          acknowledged_at?: string | null
          assigned_to?: string | null
          category?: string | null
          closed_at?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          due_at?: string | null
          first_response_at?: string | null
          id?: string
          labor_cost_cents?: number | null
          labor_hours?: number | null
          location_id?: string | null
          machine_id?: string | null
          org_id?: string
          parts_cost_cents?: number | null
          priority?: string
          resolution?: string | null
          resolved_at?: string | null
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tickets_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tickets_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tickets_machine_id_fkey"
            columns: ["machine_id"]
            isOneToOne: false
            referencedRelation: "machines"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tickets_machine_id_fkey"
            columns: ["machine_id"]
            isOneToOne: false
            referencedRelation: "v_machine_health"
            referencedColumns: ["machine_id"]
          },
          {
            foreignKeyName: "tickets_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
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
      v_machine_health: {
        Row: {
          last_sale_at: string | null
          location_id: string | null
          machine_id: string | null
          machine_name: string | null
          silent_flag: boolean | null
          since_last_sale: unknown | null
        }
        Relationships: [
          {
            foreignKeyName: "machines_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      _normalize_range: {
        Args: { p_end?: string; p_start?: string }
        Returns: {
          end_at: string
          start_at: string
        }[]
      }
      bootstrap_org_for_me: {
        Args: { p_org_name?: string }
        Returns: string
      }
      bootstrap_qa_org: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      calculate_processor_fees: {
        Args: {
          p_amount_cents: number
          p_machine_id: string
          p_transaction_date?: string
        }
        Returns: {
          fixed_fee_cents: number
          percent_fee: number
          processor_name: string
          total_fee_cents: number
        }[]
      }
      check_machine_health_and_create_tickets: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      check_org_member: {
        Args: { target_org_id: string }
        Returns: boolean
      }
      check_org_owner: {
        Args: { target_org_id: string }
        Returns: boolean
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
      get_current_org_safe: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_current_user_org_id: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_machine_health_data: {
        Args: Record<PropertyKey, never>
        Returns: {
          last_sale_at: string
          location_id: string
          machine_id: string
          machine_name: string
          silent_flag: boolean
          since_last_sale: unknown
        }[]
      }
      get_machine_product_price: {
        Args:
          | { p_date?: string; p_machine_id: string; p_product_id: string }
          | { p_machine_id: string; p_product_id: string }
        Returns: number
      }
      is_org_member: {
        Args: { row_org: string }
        Returns: boolean
      }
      is_org_member_safe: {
        Args: { target_org_id: string }
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
          cost_cents: number | null
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
      rpc_machine_silence_alerts: {
        Args: { _hours?: number }
        Returns: {
          hours_since_last_sale: number
          last_sale_at: string
          machine_id: string
          machine_name: string
        }[]
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
      unaccent: {
        Args: { "": string }
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
