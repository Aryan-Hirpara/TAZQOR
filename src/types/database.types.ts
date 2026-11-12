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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      audit_logs: {
        Row: {
          actor_id: string | null
          business_id: string | null
          created_at: string
          id: string
          new_values: Json | null
          old_values: Json | null
          operation: string
          row_id: string | null
          table_name: string
        }
        Insert: {
          actor_id?: string | null
          business_id?: string | null
          created_at?: string
          id?: string
          new_values?: Json | null
          old_values?: Json | null
          operation: string
          row_id?: string | null
          table_name: string
        }
        Update: {
          actor_id?: string | null
          business_id?: string | null
          created_at?: string
          id?: string
          new_values?: Json | null
          old_values?: Json | null
          operation?: string
          row_id?: string | null
          table_name?: string
        }
        Relationships: []
      }
      batches: {
        Row: {
          batch_number: string
          business_id: string
          cost_per_unit: number | null
          created_at: string
          expiry_date: string | null
          id: string
          manufacturing_date: string | null
          notes: string | null
          product_variant_id: string
          quantity_received: number
          reference: string | null
          supplier_id: string | null
          updated_at: string
        }
        Insert: {
          batch_number: string
          business_id: string
          cost_per_unit?: number | null
          created_at?: string
          expiry_date?: string | null
          id?: string
          manufacturing_date?: string | null
          notes?: string | null
          product_variant_id: string
          quantity_received: number
          reference?: string | null
          supplier_id?: string | null
          updated_at?: string
        }
        Update: {
          batch_number?: string
          business_id?: string
          cost_per_unit?: number | null
          created_at?: string
          expiry_date?: string | null
          id?: string
          manufacturing_date?: string | null
          notes?: string | null
          product_variant_id?: string
          quantity_received?: number
          reference?: string | null
          supplier_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "batches_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "batches_product_variant_id_fkey"
            columns: ["product_variant_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "batches_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      business_settings: {
        Row: {
          address_line1: string | null
          address_line2: string | null
          bill_prefix: string
          business_id: string
          city: string | null
          country_code: string
          created_at: string
          email: string | null
          financial_year_start_month: number
          gst_confirmed: boolean
          gst_enabled: boolean
          gstin: string | null
          id: string
          invoice_prefix: string
          legal_name: string | null
          logo_url: string | null
          phone: string | null
          pin: string | null
          round_off_enabled: boolean
          state: string | null
          state_code: string | null
          tax_inclusive: boolean
          timezone: string
          updated_at: string
          website: string | null
        }
        Insert: {
          address_line1?: string | null
          address_line2?: string | null
          bill_prefix?: string
          business_id: string
          city?: string | null
          country_code?: string
          created_at?: string
          email?: string | null
          financial_year_start_month?: number
          gst_confirmed?: boolean
          gst_enabled?: boolean
          gstin?: string | null
          id?: string
          invoice_prefix?: string
          legal_name?: string | null
          logo_url?: string | null
          phone?: string | null
          pin?: string | null
          round_off_enabled?: boolean
          state?: string | null
          state_code?: string | null
          tax_inclusive?: boolean
          timezone?: string
          updated_at?: string
          website?: string | null
        }
        Update: {
          address_line1?: string | null
          address_line2?: string | null
          bill_prefix?: string
          business_id?: string
          city?: string | null
          country_code?: string
          created_at?: string
          email?: string | null
          financial_year_start_month?: number
          gst_confirmed?: boolean
          gst_enabled?: boolean
          gstin?: string | null
          id?: string
          invoice_prefix?: string
          legal_name?: string | null
          logo_url?: string | null
          phone?: string | null
          pin?: string | null
          round_off_enabled?: boolean
          state?: string | null
          state_code?: string | null
          tax_inclusive?: boolean
          timezone?: string
          updated_at?: string
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "business_settings_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: true
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      businesses: {
        Row: {
          created_at: string
          id: string
          is_demo: boolean
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_demo?: boolean
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_demo?: boolean
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      categories: {
        Row: {
          business_id: string
          created_at: string
          description: string | null
          id: string
          name: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          business_id: string
          created_at?: string
          description?: string | null
          id?: string
          name: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          business_id?: string
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "categories_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      credit_notes: {
        Row: {
          business_id: string
          created_at: string
          credit_note_number: string | null
          customer_id: string
          grand_total: number
          id: string
          invoice_id: string | null
          reason: string | null
          status: string
          subtotal: number
          tax_total: number
          updated_at: string
        }
        Insert: {
          business_id: string
          created_at?: string
          credit_note_number?: string | null
          customer_id: string
          grand_total?: number
          id?: string
          invoice_id?: string | null
          reason?: string | null
          status?: string
          subtotal?: number
          tax_total?: number
          updated_at?: string
        }
        Update: {
          business_id?: string
          created_at?: string
          credit_note_number?: string | null
          customer_id?: string
          grand_total?: number
          id?: string
          invoice_id?: string | null
          reason?: string | null
          status?: string
          subtotal?: number
          tax_total?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "credit_notes_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "credit_notes_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "credit_notes_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "v_customer_balances"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "credit_notes_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "credit_notes_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "v_invoice_outstanding"
            referencedColumns: ["invoice_id"]
          },
          {
            foreignKeyName: "credit_notes_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "v_overdue_invoices"
            referencedColumns: ["invoice_id"]
          },
        ]
      }
      customer_addresses: {
        Row: {
          address_line1: string | null
          address_line2: string | null
          business_id: string
          city: string | null
          created_at: string
          customer_id: string
          id: string
          is_default: boolean
          label: string | null
          lat: number | null
          lng: number | null
          pin: string | null
          state: string | null
        }
        Insert: {
          address_line1?: string | null
          address_line2?: string | null
          business_id: string
          city?: string | null
          created_at?: string
          customer_id: string
          id?: string
          is_default?: boolean
          label?: string | null
          lat?: number | null
          lng?: number | null
          pin?: string | null
          state?: string | null
        }
        Update: {
          address_line1?: string | null
          address_line2?: string | null
          business_id?: string
          city?: string | null
          created_at?: string
          customer_id?: string
          id?: string
          is_default?: boolean
          label?: string | null
          lat?: number | null
          lng?: number | null
          pin?: string | null
          state?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "customer_addresses_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_addresses_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_addresses_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "v_customer_balances"
            referencedColumns: ["customer_id"]
          },
        ]
      }
      customer_notes: {
        Row: {
          business_id: string
          created_at: string
          created_by: string | null
          customer_id: string
          id: string
          note: string
        }
        Insert: {
          business_id: string
          created_at?: string
          created_by?: string | null
          customer_id: string
          id?: string
          note: string
        }
        Update: {
          business_id?: string
          created_at?: string
          created_by?: string | null
          customer_id?: string
          id?: string
          note?: string
        }
        Relationships: [
          {
            foreignKeyName: "customer_notes_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_notes_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_notes_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_notes_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "v_customer_balances"
            referencedColumns: ["customer_id"]
          },
        ]
      }
      customer_visits: {
        Row: {
          business_id: string
          created_at: string
          created_by: string | null
          customer_id: string
          gps_lat: number | null
          gps_lng: number | null
          id: string
          notes: string | null
          outcome: string | null
          updated_at: string
          visit_date: string
        }
        Insert: {
          business_id: string
          created_at?: string
          created_by?: string | null
          customer_id: string
          gps_lat?: number | null
          gps_lng?: number | null
          id?: string
          notes?: string | null
          outcome?: string | null
          updated_at?: string
          visit_date?: string
        }
        Update: {
          business_id?: string
          created_at?: string
          created_by?: string | null
          customer_id?: string
          gps_lat?: number | null
          gps_lng?: number | null
          id?: string
          notes?: string | null
          outcome?: string | null
          updated_at?: string
          visit_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "customer_visits_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_visits_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_visits_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_visits_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "v_customer_balances"
            referencedColumns: ["customer_id"]
          },
        ]
      }
      customers: {
        Row: {
          billing_address: string | null
          business_id: string
          city: string | null
          contact_person: string | null
          created_at: string
          customer_code: string | null
          delivery_address: string | null
          district: string | null
          email: string | null
          id: string
          is_demo: boolean
          lat: number | null
          lng: number | null
          name: string
          notes: string | null
          phone: string | null
          pin: string | null
          shop_name: string | null
          state: string | null
          status: string
          type: Database["public"]["Enums"]["customer_type"] | null
          updated_at: string
          whatsapp: string | null
        }
        Insert: {
          billing_address?: string | null
          business_id: string
          city?: string | null
          contact_person?: string | null
          created_at?: string
          customer_code?: string | null
          delivery_address?: string | null
          district?: string | null
          email?: string | null
          id?: string
          is_demo?: boolean
          lat?: number | null
          lng?: number | null
          name: string
          notes?: string | null
          phone?: string | null
          pin?: string | null
          shop_name?: string | null
          state?: string | null
          status?: string
          type?: Database["public"]["Enums"]["customer_type"] | null
          updated_at?: string
          whatsapp?: string | null
        }
        Update: {
          billing_address?: string | null
          business_id?: string
          city?: string | null
          contact_person?: string | null
          created_at?: string
          customer_code?: string | null
          delivery_address?: string | null
          district?: string | null
          email?: string | null
          id?: string
          is_demo?: boolean
          lat?: number | null
          lng?: number | null
          name?: string
          notes?: string | null
          phone?: string | null
          pin?: string | null
          shop_name?: string | null
          state?: string | null
          status?: string
          type?: Database["public"]["Enums"]["customer_type"] | null
          updated_at?: string
          whatsapp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "customers_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      expense_categories: {
        Row: {
          business_id: string | null
          created_at: string
          id: string
          is_default: boolean
          name: string
        }
        Insert: {
          business_id?: string | null
          created_at?: string
          id?: string
          is_default?: boolean
          name: string
        }
        Update: {
          business_id?: string | null
          created_at?: string
          id?: string
          is_default?: boolean
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "expense_categories_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      expenses: {
        Row: {
          amount: number
          business_id: string
          category_id: string | null
          created_at: string
          description: string | null
          expense_date: string
          expense_name: string | null
          id: string
          is_demo: boolean
          paid_by: string
          payment_method: string | null
          receipt_url: string | null
          updated_at: string
          vendor: string | null
        }
        Insert: {
          amount: number
          business_id: string
          category_id?: string | null
          created_at?: string
          description?: string | null
          expense_date?: string
          expense_name?: string | null
          id?: string
          is_demo?: boolean
          paid_by?: string
          payment_method?: string | null
          receipt_url?: string | null
          updated_at?: string
          vendor?: string | null
        }
        Update: {
          amount?: number
          business_id?: string
          category_id?: string | null
          created_at?: string
          description?: string | null
          expense_date?: string
          expense_name?: string | null
          id?: string
          is_demo?: boolean
          paid_by?: string
          payment_method?: string | null
          receipt_url?: string | null
          updated_at?: string
          vendor?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "expenses_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "expense_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      follow_ups: {
        Row: {
          business_id: string
          created_at: string
          customer_id: string
          id: string
          notes: string | null
          scheduled_for: string
          status: Database["public"]["Enums"]["follow_up_status"]
          updated_at: string
          visit_id: string | null
        }
        Insert: {
          business_id: string
          created_at?: string
          customer_id: string
          id?: string
          notes?: string | null
          scheduled_for: string
          status?: Database["public"]["Enums"]["follow_up_status"]
          updated_at?: string
          visit_id?: string | null
        }
        Update: {
          business_id?: string
          created_at?: string
          customer_id?: string
          id?: string
          notes?: string | null
          scheduled_for?: string
          status?: Database["public"]["Enums"]["follow_up_status"]
          updated_at?: string
          visit_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "follow_ups_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "follow_ups_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "follow_ups_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "v_customer_balances"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "follow_ups_visit_id_fkey"
            columns: ["visit_id"]
            isOneToOne: false
            referencedRelation: "customer_visits"
            referencedColumns: ["id"]
          },
        ]
      }
      invoice_item_batches: {
        Row: {
          batch_id: string
          cost_per_unit: number | null
          created_at: string
          id: string
          invoice_item_id: string
          quantity_allocated: number
        }
        Insert: {
          batch_id: string
          cost_per_unit?: number | null
          created_at?: string
          id?: string
          invoice_item_id: string
          quantity_allocated: number
        }
        Update: {
          batch_id?: string
          cost_per_unit?: number | null
          created_at?: string
          id?: string
          invoice_item_id?: string
          quantity_allocated?: number
        }
        Relationships: [
          {
            foreignKeyName: "invoice_item_batches_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "batches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoice_item_batches_invoice_item_id_fkey"
            columns: ["invoice_item_id"]
            isOneToOne: false
            referencedRelation: "invoice_items"
            referencedColumns: ["id"]
          },
        ]
      }
      invoice_items: {
        Row: {
          business_id: string
          cgst_rate: number
          created_at: string
          description: string | null
          discount_percent: number
          hsn_snapshot: string | null
          id: string
          igst_rate: number
          invoice_id: string
          line_subtotal: number
          line_tax: number
          line_total: number
          product_variant_id: string | null
          quantity: number
          sgst_rate: number
          sku_snapshot: string | null
          tax_rate: number
          unit_price: number
        }
        Insert: {
          business_id: string
          cgst_rate?: number
          created_at?: string
          description?: string | null
          discount_percent?: number
          hsn_snapshot?: string | null
          id?: string
          igst_rate?: number
          invoice_id: string
          line_subtotal?: number
          line_tax?: number
          line_total?: number
          product_variant_id?: string | null
          quantity: number
          sgst_rate?: number
          sku_snapshot?: string | null
          tax_rate?: number
          unit_price: number
        }
        Update: {
          business_id?: string
          cgst_rate?: number
          created_at?: string
          description?: string | null
          discount_percent?: number
          hsn_snapshot?: string | null
          id?: string
          igst_rate?: number
          invoice_id?: string
          line_subtotal?: number
          line_tax?: number
          line_total?: number
          product_variant_id?: string | null
          quantity?: number
          sgst_rate?: number
          sku_snapshot?: string | null
          tax_rate?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "invoice_items_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoice_items_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoice_items_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "v_invoice_outstanding"
            referencedColumns: ["invoice_id"]
          },
          {
            foreignKeyName: "invoice_items_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "v_overdue_invoices"
            referencedColumns: ["invoice_id"]
          },
          {
            foreignKeyName: "invoice_items_product_variant_id_fkey"
            columns: ["product_variant_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
            referencedColumns: ["id"]
          },
        ]
      }
      invoice_number_counters: {
        Row: {
          business_id: string
          created_at: string
          financial_year: string
          id: string
          mode: Database["public"]["Enums"]["invoice_mode"]
          prefix: string
          sequence: number
          updated_at: string
        }
        Insert: {
          business_id: string
          created_at?: string
          financial_year: string
          id?: string
          mode: Database["public"]["Enums"]["invoice_mode"]
          prefix: string
          sequence?: number
          updated_at?: string
        }
        Update: {
          business_id?: string
          created_at?: string
          financial_year?: string
          id?: string
          mode?: Database["public"]["Enums"]["invoice_mode"]
          prefix?: string
          sequence?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoice_number_counters_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          business_id: string
          cancelled_at: string | null
          created_at: string
          customer_id: string
          discount_total: number
          due_date: string | null
          finalized_at: string | null
          grand_total: number
          id: string
          idempotency_key: string | null
          invoice_date: string
          invoice_number: string | null
          is_demo: boolean
          mode: Database["public"]["Enums"]["invoice_mode"]
          notes: string | null
          order_id: string | null
          place_of_supply: string | null
          round_off: number
          snapshot_business: Json | null
          snapshot_customer: Json | null
          status: Database["public"]["Enums"]["invoice_status"]
          subtotal: number
          tax_total: number
          terms: string | null
          updated_at: string
        }
        Insert: {
          business_id: string
          cancelled_at?: string | null
          created_at?: string
          customer_id: string
          discount_total?: number
          due_date?: string | null
          finalized_at?: string | null
          grand_total?: number
          id?: string
          idempotency_key?: string | null
          invoice_date?: string
          invoice_number?: string | null
          is_demo?: boolean
          mode: Database["public"]["Enums"]["invoice_mode"]
          notes?: string | null
          order_id?: string | null
          place_of_supply?: string | null
          round_off?: number
          snapshot_business?: Json | null
          snapshot_customer?: Json | null
          status?: Database["public"]["Enums"]["invoice_status"]
          subtotal?: number
          tax_total?: number
          terms?: string | null
          updated_at?: string
        }
        Update: {
          business_id?: string
          cancelled_at?: string | null
          created_at?: string
          customer_id?: string
          discount_total?: number
          due_date?: string | null
          finalized_at?: string | null
          grand_total?: number
          id?: string
          idempotency_key?: string | null
          invoice_date?: string
          invoice_number?: string | null
          is_demo?: boolean
          mode?: Database["public"]["Enums"]["invoice_mode"]
          notes?: string | null
          order_id?: string | null
          place_of_supply?: string | null
          round_off?: number
          snapshot_business?: Json | null
          snapshot_customer?: Json | null
          status?: Database["public"]["Enums"]["invoice_status"]
          subtotal?: number
          tax_total?: number
          terms?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoices_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "v_customer_balances"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "invoices_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      order_items: {
        Row: {
          business_id: string
          created_at: string
          discount_percent: number
          id: string
          invoiced_quantity: number
          order_id: string
          product_variant_id: string
          quantity: number
          tax_rate_id: string | null
          unit_price: number
        }
        Insert: {
          business_id: string
          created_at?: string
          discount_percent?: number
          id?: string
          invoiced_quantity?: number
          order_id: string
          product_variant_id: string
          quantity: number
          tax_rate_id?: string | null
          unit_price: number
        }
        Update: {
          business_id?: string
          created_at?: string
          discount_percent?: number
          id?: string
          invoiced_quantity?: number
          order_id?: string
          product_variant_id?: string
          quantity?: number
          tax_rate_id?: string | null
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_variant_id_fkey"
            columns: ["product_variant_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_tax_rate_id_fkey"
            columns: ["tax_rate_id"]
            isOneToOne: false
            referencedRelation: "tax_rates"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          business_id: string
          created_at: string
          customer_id: string
          id: string
          is_demo: boolean
          notes: string | null
          order_number: string | null
          status: Database["public"]["Enums"]["order_status"]
          updated_at: string
        }
        Insert: {
          business_id: string
          created_at?: string
          customer_id: string
          id?: string
          is_demo?: boolean
          notes?: string | null
          order_number?: string | null
          status?: Database["public"]["Enums"]["order_status"]
          updated_at?: string
        }
        Update: {
          business_id?: string
          created_at?: string
          customer_id?: string
          id?: string
          is_demo?: boolean
          notes?: string | null
          order_number?: string | null
          status?: Database["public"]["Enums"]["order_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "v_customer_balances"
            referencedColumns: ["customer_id"]
          },
        ]
      }
      payment_allocations: {
        Row: {
          amount_allocated: number
          business_id: string
          created_at: string
          id: string
          invoice_id: string
          payment_id: string
        }
        Insert: {
          amount_allocated: number
          business_id: string
          created_at?: string
          id?: string
          invoice_id: string
          payment_id: string
        }
        Update: {
          amount_allocated?: number
          business_id?: string
          created_at?: string
          id?: string
          invoice_id?: string
          payment_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_allocations_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_allocations_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_allocations_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "v_invoice_outstanding"
            referencedColumns: ["invoice_id"]
          },
          {
            foreignKeyName: "payment_allocations_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "v_overdue_invoices"
            referencedColumns: ["invoice_id"]
          },
          {
            foreignKeyName: "payment_allocations_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "payments"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          business_id: string
          created_at: string
          customer_id: string
          id: string
          idempotency_key: string | null
          is_demo: boolean
          method: Database["public"]["Enums"]["payment_method"]
          notes: string | null
          payment_date: string
          receipt_url: string | null
          reference: string | null
          updated_at: string
        }
        Insert: {
          amount: number
          business_id: string
          created_at?: string
          customer_id: string
          id?: string
          idempotency_key?: string | null
          is_demo?: boolean
          method?: Database["public"]["Enums"]["payment_method"]
          notes?: string | null
          payment_date?: string
          receipt_url?: string | null
          reference?: string | null
          updated_at?: string
        }
        Update: {
          amount?: number
          business_id?: string
          created_at?: string
          customer_id?: string
          id?: string
          idempotency_key?: string | null
          is_demo?: boolean
          method?: Database["public"]["Enums"]["payment_method"]
          notes?: string | null
          payment_date?: string
          receipt_url?: string | null
          reference?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "v_customer_balances"
            referencedColumns: ["customer_id"]
          },
        ]
      }
      product_variants: {
        Row: {
          business_id: string
          cost_price: number | null
          created_at: string
          id: string
          name: string
          pack_size: string | null
          product_id: string
          reorder_level: number
          selling_price: number | null
          sku: string | null
          tax_rate_id: string | null
          updated_at: string
        }
        Insert: {
          business_id: string
          cost_price?: number | null
          created_at?: string
          id?: string
          name: string
          pack_size?: string | null
          product_id: string
          reorder_level?: number
          selling_price?: number | null
          sku?: string | null
          tax_rate_id?: string | null
          updated_at?: string
        }
        Update: {
          business_id?: string
          cost_price?: number | null
          created_at?: string
          id?: string
          name?: string
          pack_size?: string | null
          product_id?: string
          reorder_level?: number
          selling_price?: number | null
          sku?: string | null
          tax_rate_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_variants_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_variants_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_variants_tax_rate_id_fkey"
            columns: ["tax_rate_id"]
            isOneToOne: false
            referencedRelation: "tax_rates"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          business_id: string
          category_id: string | null
          created_at: string
          description: string | null
          hsn: string | null
          id: string
          image_url: string | null
          is_demo: boolean
          name: string
          sku: string | null
          status: string
          updated_at: string
        }
        Insert: {
          business_id: string
          category_id?: string | null
          created_at?: string
          description?: string | null
          hsn?: string | null
          id?: string
          image_url?: string | null
          is_demo?: boolean
          name: string
          sku?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          business_id?: string
          category_id?: string | null
          created_at?: string
          description?: string | null
          hsn?: string | null
          id?: string
          image_url?: string | null
          is_demo?: boolean
          name?: string
          sku?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          business_id: string
          created_at: string
          full_name: string | null
          id: string
          phone: string | null
          role: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          business_id: string
          created_at?: string
          full_name?: string | null
          id: string
          phone?: string | null
          role?: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          business_id?: string
          created_at?: string
          full_name?: string | null
          id?: string
          phone?: string | null
          role?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      stock_movements: {
        Row: {
          actor_id: string | null
          batch_id: string | null
          business_id: string
          created_at: string
          id: string
          movement_type: Database["public"]["Enums"]["movement_type"]
          notes: string | null
          product_variant_id: string
          quantity: number
          reason: string | null
          reference_id: string | null
          reference_line_id: string | null
          reference_type: string | null
        }
        Insert: {
          actor_id?: string | null
          batch_id?: string | null
          business_id: string
          created_at?: string
          id?: string
          movement_type: Database["public"]["Enums"]["movement_type"]
          notes?: string | null
          product_variant_id: string
          quantity: number
          reason?: string | null
          reference_id?: string | null
          reference_line_id?: string | null
          reference_type?: string | null
        }
        Update: {
          actor_id?: string | null
          batch_id?: string | null
          business_id?: string
          created_at?: string
          id?: string
          movement_type?: Database["public"]["Enums"]["movement_type"]
          notes?: string | null
          product_variant_id?: string
          quantity?: number
          reason?: string | null
          reference_id?: string | null
          reference_line_id?: string | null
          reference_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "stock_movements_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_movements_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "batches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_movements_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_movements_product_variant_id_fkey"
            columns: ["product_variant_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
            referencedColumns: ["id"]
          },
        ]
      }
      suppliers: {
        Row: {
          address: string | null
          business_id: string
          created_at: string
          email: string | null
          gstin: string | null
          id: string
          name: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          business_id: string
          created_at?: string
          email?: string | null
          gstin?: string | null
          id?: string
          name: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          business_id?: string
          created_at?: string
          email?: string | null
          gstin?: string | null
          id?: string
          name?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "suppliers_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      tax_rates: {
        Row: {
          business_id: string
          created_at: string
          effective_from: string
          id: string
          name: string
          rate: number
        }
        Insert: {
          business_id: string
          created_at?: string
          effective_from?: string
          id?: string
          name: string
          rate: number
        }
        Update: {
          business_id?: string
          created_at?: string
          effective_from?: string
          id?: string
          name?: string
          rate?: number
        }
        Relationships: [
          {
            foreignKeyName: "tax_rates_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      v_batch_stock: {
        Row: {
          batch_id: string | null
          batch_number: string | null
          batch_received_at: string | null
          business_id: string | null
          cost_per_unit: number | null
          expiry_date: string | null
          manufacturing_date: string | null
          product_variant_id: string | null
          quantity_on_hand: number | null
          supplier_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "batches_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_movements_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "batches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_movements_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_movements_product_variant_id_fkey"
            columns: ["product_variant_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
            referencedColumns: ["id"]
          },
        ]
      }
      v_customer_balances: {
        Row: {
          advance: number | null
          business_id: string | null
          customer_id: string | null
          name: string | null
          outstanding: number | null
          status: string | null
          total_allocated: number | null
          total_invoiced: number | null
          total_payments: number | null
        }
        Relationships: [
          {
            foreignKeyName: "customers_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      v_invoice_outstanding: {
        Row: {
          amount_paid: number | null
          business_id: string | null
          customer_id: string | null
          due_date: string | null
          grand_total: number | null
          invoice_date: string | null
          invoice_id: string | null
          invoice_number: string | null
          is_overdue: boolean | null
          outstanding: number | null
        }
        Relationships: [
          {
            foreignKeyName: "invoices_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "v_customer_balances"
            referencedColumns: ["customer_id"]
          },
        ]
      }
      v_overdue_invoices: {
        Row: {
          amount_paid: number | null
          business_id: string | null
          customer_id: string | null
          due_date: string | null
          grand_total: number | null
          invoice_date: string | null
          invoice_id: string | null
          invoice_number: string | null
          is_overdue: boolean | null
          outstanding: number | null
        }
        Relationships: [
          {
            foreignKeyName: "invoices_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "v_customer_balances"
            referencedColumns: ["customer_id"]
          },
        ]
      }
      v_stock_on_hand: {
        Row: {
          batch_id: string | null
          business_id: string | null
          product_variant_id: string | null
          quantity_on_hand: number | null
        }
        Relationships: [
          {
            foreignKeyName: "stock_movements_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "batches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_movements_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_movements_product_variant_id_fkey"
            columns: ["product_variant_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
            referencedColumns: ["id"]
          },
        ]
      }
      v_stock_summary: {
        Row: {
          business_id: string | null
          product_variant_id: string | null
          reorder_level: number | null
          stock_status: string | null
          total_quantity_on_hand: number | null
        }
        Relationships: [
          {
            foreignKeyName: "stock_movements_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_movements_product_variant_id_fkey"
            columns: ["product_variant_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      adjust_stock: {
        Args: {
          p_actor_id?: string
          p_batch_id: string
          p_business_id: string
          p_movement_type: Database["public"]["Enums"]["movement_type"]
          p_product_variant_id: string
          p_quantity: number
          p_reason?: string
        }
        Returns: string
      }
      cancel_invoice: {
        Args: { p_invoice_id: string; p_reason?: string }
        Returns: Json
      }
      current_business_id: { Args: never; Returns: string }
      finalize_invoice: {
        Args: { p_idempotency_key?: string; p_invoice_id: string }
        Returns: Json
      }
      is_authenticated: { Args: never; Returns: boolean }
      next_invoice_number: {
        Args: {
          p_business_id: string
          p_mode: Database["public"]["Enums"]["invoice_mode"]
        }
        Returns: string
      }
      receive_stock: {
        Args: {
          p_batch_id: string
          p_business_id: string
          p_product_variant_id: string
          p_quantity: number
          p_reason?: string
          p_reference_id?: string
          p_reference_type?: string
        }
        Returns: string
      }
      record_payment: {
        Args: {
          p_allocations?: Json
          p_amount: number
          p_business_id: string
          p_customer_id: string
          p_idempotency_key?: string
          p_method: Database["public"]["Enums"]["payment_method"]
          p_notes?: string
          p_payment_date: string
          p_reference?: string
        }
        Returns: Json
      }
    }
    Enums: {
      customer_type:
        | "grocery"
        | "hotel"
        | "mall"
        | "office"
        | "pg"
        | "school"
        | "other"
      follow_up_status: "pending" | "completed" | "missed"
      invoice_mode: "gst" | "non_gst"
      invoice_status: "draft" | "finalized" | "cancelled" | "credited"
      movement_type:
        | "purchase_in"
        | "sale_out"
        | "sales_return_in"
        | "purchase_return_out"
        | "damage_out"
        | "expiry_out"
        | "adjustment_in"
        | "adjustment_out"
        | "opening_stock"
      order_status:
        | "draft"
        | "confirmed"
        | "processing"
        | "dispatched"
        | "delivered"
        | "cancelled"
      payment_method: "cash" | "upi" | "bank_transfer" | "cheque" | "other"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      customer_type: [
        "grocery",
        "hotel",
        "mall",
        "office",
        "pg",
        "school",
        "other",
      ],
      follow_up_status: ["pending", "completed", "missed"],
      invoice_mode: ["gst", "non_gst"],
      invoice_status: ["draft", "finalized", "cancelled", "credited"],
      movement_type: [
        "purchase_in",
        "sale_out",
        "sales_return_in",
        "purchase_return_out",
        "damage_out",
        "expiry_out",
        "adjustment_in",
        "adjustment_out",
        "opening_stock",
      ],
      order_status: [
        "draft",
        "confirmed",
        "processing",
        "dispatched",
        "delivered",
        "cancelled",
      ],
      payment_method: ["cash", "upi", "bank_transfer", "cheque", "other"],
    },
  },
} as const
