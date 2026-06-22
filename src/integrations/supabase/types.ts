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
      accounts: {
        Row: {
          account_number: string | null
          account_type: string
          archived: boolean
          bank_name: string | null
          created_at: string
          currency: string
          id: string
          name: string
          notes: string | null
          opening_balance: number
          updated_at: string
        }
        Insert: {
          account_number?: string | null
          account_type?: string
          archived?: boolean
          bank_name?: string | null
          created_at?: string
          currency?: string
          id?: string
          name: string
          notes?: string | null
          opening_balance?: number
          updated_at?: string
        }
        Update: {
          account_number?: string | null
          account_type?: string
          archived?: boolean
          bank_name?: string | null
          created_at?: string
          currency?: string
          id?: string
          name?: string
          notes?: string | null
          opening_balance?: number
          updated_at?: string
        }
        Relationships: []
      }
      attendance: {
        Row: {
          check_in: string | null
          check_out: string | null
          created_at: string
          date: string
          employee_id: string
          id: string
          notes: string | null
          status: string
        }
        Insert: {
          check_in?: string | null
          check_out?: string | null
          created_at?: string
          date: string
          employee_id: string
          id?: string
          notes?: string | null
          status?: string
        }
        Update: {
          check_in?: string | null
          check_out?: string | null
          created_at?: string
          date?: string
          employee_id?: string
          id?: string
          notes?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "attendance_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          created_at: string
          id: string
          new_data: Json | null
          old_data: Json | null
          record_id: string | null
          table_name: string
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          id?: string
          new_data?: Json | null
          old_data?: Json | null
          record_id?: string | null
          table_name: string
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          id?: string
          new_data?: Json | null
          old_data?: Json | null
          record_id?: string | null
          table_name?: string
          user_id?: string | null
        }
        Relationships: []
      }
      comments: {
        Row: {
          author_id: string
          body: string
          created_at: string
          entity_id: string
          entity_type: string
          id: string
        }
        Insert: {
          author_id: string
          body: string
          created_at?: string
          entity_id: string
          entity_type: string
          id?: string
        }
        Update: {
          author_id?: string
          body?: string
          created_at?: string
          entity_id?: string
          entity_type?: string
          id?: string
        }
        Relationships: []
      }
      contracts: {
        Row: {
          created_at: string
          deposit: number | null
          end_date: string
          id: string
          monthly_rent: number
          notes: string | null
          start_date: string
          status: Database["public"]["Enums"]["contract_status"]
          tenant_id: string
          unit_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          deposit?: number | null
          end_date: string
          id?: string
          monthly_rent: number
          notes?: string | null
          start_date: string
          status?: Database["public"]["Enums"]["contract_status"]
          tenant_id: string
          unit_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          deposit?: number | null
          end_date?: string
          id?: string
          monthly_rent?: number
          notes?: string | null
          start_date?: string
          status?: Database["public"]["Enums"]["contract_status"]
          tenant_id?: string
          unit_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "contracts_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contracts_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      custom_fields: {
        Row: {
          active: boolean
          created_at: string
          display_order: number
          entity_type: string
          field_key: string
          field_type: string
          id: string
          label: string
          options: Json | null
          required: boolean
        }
        Insert: {
          active?: boolean
          created_at?: string
          display_order?: number
          entity_type: string
          field_key: string
          field_type?: string
          id?: string
          label: string
          options?: Json | null
          required?: boolean
        }
        Update: {
          active?: boolean
          created_at?: string
          display_order?: number
          entity_type?: string
          field_key?: string
          field_type?: string
          id?: string
          label?: string
          options?: Json | null
          required?: boolean
        }
        Relationships: []
      }
      departments: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      documents: {
        Row: {
          category: string | null
          contract_id: string | null
          created_at: string
          entity_id: string | null
          entity_type: string | null
          expiry_date: string | null
          file_url: string | null
          id: string
          property_id: string | null
          tenant_id: string | null
          title: string
          unit_id: string | null
        }
        Insert: {
          category?: string | null
          contract_id?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          expiry_date?: string | null
          file_url?: string | null
          id?: string
          property_id?: string | null
          tenant_id?: string | null
          title: string
          unit_id?: string | null
        }
        Update: {
          category?: string | null
          contract_id?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          expiry_date?: string | null
          file_url?: string | null
          id?: string
          property_id?: string | null
          tenant_id?: string | null
          title?: string
          unit_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "documents_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      employees: {
        Row: {
          address: string | null
          archived: boolean
          basic_salary: number | null
          created_at: string
          department_id: string | null
          email: string | null
          full_name: string
          hire_date: string | null
          id: string
          national_id: string | null
          notes: string | null
          phone: string | null
          photo_url: string | null
          position: string | null
          status: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          address?: string | null
          archived?: boolean
          basic_salary?: number | null
          created_at?: string
          department_id?: string | null
          email?: string | null
          full_name: string
          hire_date?: string | null
          id?: string
          national_id?: string | null
          notes?: string | null
          phone?: string | null
          photo_url?: string | null
          position?: string | null
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          address?: string | null
          archived?: boolean
          basic_salary?: number | null
          created_at?: string
          department_id?: string | null
          email?: string | null
          full_name?: string
          hire_date?: string | null
          id?: string
          national_id?: string | null
          notes?: string | null
          phone?: string | null
          photo_url?: string | null
          position?: string | null
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "employees_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
        ]
      }
      employment_contracts: {
        Row: {
          allowances: number | null
          contract_type: string | null
          created_at: string
          employee_id: string
          end_date: string | null
          id: string
          monthly_salary: number
          notes: string | null
          start_date: string
          status: string
          updated_at: string
        }
        Insert: {
          allowances?: number | null
          contract_type?: string | null
          created_at?: string
          employee_id: string
          end_date?: string | null
          id?: string
          monthly_salary: number
          notes?: string | null
          start_date: string
          status?: string
          updated_at?: string
        }
        Update: {
          allowances?: number | null
          contract_type?: string | null
          created_at?: string
          employee_id?: string
          end_date?: string | null
          id?: string
          monthly_salary?: number
          notes?: string | null
          start_date?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "employment_contracts_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      expenses: {
        Row: {
          amount: number
          category: string
          created_at: string
          description: string | null
          expense_date: string
          id: string
          property_id: string | null
        }
        Insert: {
          amount: number
          category: string
          created_at?: string
          description?: string | null
          expense_date?: string
          id?: string
          property_id?: string | null
        }
        Update: {
          amount?: number
          category?: string
          created_at?: string
          description?: string | null
          expense_date?: string
          id?: string
          property_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "expenses_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      lands: {
        Row: {
          archived: boolean
          area_sqm: number | null
          city: string | null
          coordinates: string | null
          created_at: string
          created_by: string | null
          current_value: number | null
          deed_number: string | null
          id: string
          location: string | null
          name: string
          notes: string | null
          ownership_type: string | null
          photos: string[] | null
          purchase_date: string | null
          purchase_value: number | null
          region: string | null
          status: string
          updated_at: string
        }
        Insert: {
          archived?: boolean
          area_sqm?: number | null
          city?: string | null
          coordinates?: string | null
          created_at?: string
          created_by?: string | null
          current_value?: number | null
          deed_number?: string | null
          id?: string
          location?: string | null
          name: string
          notes?: string | null
          ownership_type?: string | null
          photos?: string[] | null
          purchase_date?: string | null
          purchase_value?: number | null
          region?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          archived?: boolean
          area_sqm?: number | null
          city?: string | null
          coordinates?: string | null
          created_at?: string
          created_by?: string | null
          current_value?: number | null
          deed_number?: string | null
          id?: string
          location?: string | null
          name?: string
          notes?: string | null
          ownership_type?: string | null
          photos?: string[] | null
          purchase_date?: string | null
          purchase_value?: number | null
          region?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      leaves: {
        Row: {
          created_at: string
          employee_id: string
          end_date: string
          id: string
          leave_type: string
          reason: string | null
          start_date: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          employee_id: string
          end_date: string
          id?: string
          leave_type: string
          reason?: string | null
          start_date: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          employee_id?: string
          end_date?: string
          id?: string
          leave_type?: string
          reason?: string | null
          start_date?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "leaves_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      maintenance_requests: {
        Row: {
          assigned_to: string | null
          completed_at: string | null
          cost: number | null
          created_at: string
          description: string | null
          entity_id: string | null
          entity_type: string | null
          id: string
          property_id: string | null
          reported_at: string
          status: Database["public"]["Enums"]["maintenance_status"]
          title: string
          unit_id: string | null
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          completed_at?: string | null
          cost?: number | null
          created_at?: string
          description?: string | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          property_id?: string | null
          reported_at?: string
          status?: Database["public"]["Enums"]["maintenance_status"]
          title: string
          unit_id?: string | null
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          completed_at?: string | null
          cost?: number | null
          created_at?: string
          description?: string | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          property_id?: string | null
          reported_at?: string
          status?: Database["public"]["Enums"]["maintenance_status"]
          title?: string
          unit_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "maintenance_requests_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "maintenance_requests_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          body: string
          created_at: string
          id: string
          read: boolean
          recipient_id: string
          sender_id: string
          subject: string | null
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          read?: boolean
          recipient_id: string
          sender_id: string
          subject?: string | null
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          read?: boolean
          recipient_id?: string
          sender_id?: string
          subject?: string | null
        }
        Relationships: []
      }
      module_visibility: {
        Row: {
          id: string
          module_key: string
          role: Database["public"]["Enums"]["app_role"]
          visible: boolean
        }
        Insert: {
          id?: string
          module_key: string
          role: Database["public"]["Enums"]["app_role"]
          visible?: boolean
        }
        Update: {
          id?: string
          module_key?: string
          role?: Database["public"]["Enums"]["app_role"]
          visible?: boolean
        }
        Relationships: []
      }
      notifications: {
        Row: {
          body: string | null
          category: string
          created_at: string
          id: string
          link: string | null
          read: boolean
          title: string
          user_id: string | null
        }
        Insert: {
          body?: string | null
          category?: string
          created_at?: string
          id?: string
          link?: string | null
          read?: boolean
          title: string
          user_id?: string | null
        }
        Update: {
          body?: string | null
          category?: string
          created_at?: string
          id?: string
          link?: string | null
          read?: boolean
          title?: string
          user_id?: string | null
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount: number
          contract_id: string
          created_at: string
          due_date: string
          id: string
          notes: string | null
          paid_date: string | null
          payment_method: string | null
          status: Database["public"]["Enums"]["payment_status"]
          updated_at: string
        }
        Insert: {
          amount: number
          contract_id: string
          created_at?: string
          due_date: string
          id?: string
          notes?: string | null
          paid_date?: string | null
          payment_method?: string | null
          status?: Database["public"]["Enums"]["payment_status"]
          updated_at?: string
        }
        Update: {
          amount?: number
          contract_id?: string
          created_at?: string
          due_date?: string
          id?: string
          notes?: string | null
          paid_date?: string | null
          payment_method?: string | null
          status?: Database["public"]["Enums"]["payment_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string | null
          id: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      properties: {
        Row: {
          address: string | null
          created_at: string
          description: string | null
          id: string
          location: string | null
          name: string
          photos: string[] | null
          status: Database["public"]["Enums"]["property_status"]
          type: Database["public"]["Enums"]["property_type"]
          updated_at: string
        }
        Insert: {
          address?: string | null
          created_at?: string
          description?: string | null
          id?: string
          location?: string | null
          name: string
          photos?: string[] | null
          status?: Database["public"]["Enums"]["property_status"]
          type?: Database["public"]["Enums"]["property_type"]
          updated_at?: string
        }
        Update: {
          address?: string | null
          created_at?: string
          description?: string | null
          id?: string
          location?: string | null
          name?: string
          photos?: string[] | null
          status?: Database["public"]["Enums"]["property_status"]
          type?: Database["public"]["Enums"]["property_type"]
          updated_at?: string
        }
        Relationships: []
      }
      quick_access_items: {
        Row: {
          created_at: string
          display_order: number
          icon: string | null
          id: string
          label: string
          link: string
          module_key: string
          user_id: string
        }
        Insert: {
          created_at?: string
          display_order?: number
          icon?: string | null
          id?: string
          label: string
          link: string
          module_key: string
          user_id: string
        }
        Update: {
          created_at?: string
          display_order?: number
          icon?: string | null
          id?: string
          label?: string
          link?: string
          module_key?: string
          user_id?: string
        }
        Relationships: []
      }
      system_settings: {
        Row: {
          company_logo_url: string | null
          company_name: string | null
          default_currency: string | null
          id: number
          primary_color: string | null
          updated_at: string
        }
        Insert: {
          company_logo_url?: string | null
          company_name?: string | null
          default_currency?: string | null
          id?: number
          primary_color?: string | null
          updated_at?: string
        }
        Update: {
          company_logo_url?: string | null
          company_name?: string | null
          default_currency?: string | null
          id?: number
          primary_color?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      tasks: {
        Row: {
          assigned_to: string | null
          completed_at: string | null
          created_at: string
          created_by: string | null
          description: string | null
          due_date: string | null
          entity_id: string | null
          entity_type: string | null
          id: string
          priority: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          priority?: string
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          priority?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      tenants: {
        Row: {
          address: string | null
          created_at: string
          email: string | null
          full_name: string
          id: string
          id_document_url: string | null
          national_id: string | null
          notes: string | null
          phone: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          created_at?: string
          email?: string | null
          full_name: string
          id?: string
          id_document_url?: string | null
          national_id?: string | null
          notes?: string | null
          phone?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          created_at?: string
          email?: string | null
          full_name?: string
          id?: string
          id_document_url?: string | null
          national_id?: string | null
          notes?: string | null
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      transactions: {
        Row: {
          account_id: string
          amount: number
          category: string | null
          created_at: string
          created_by: string | null
          description: string | null
          entity_id: string | null
          entity_type: string | null
          id: string
          payment_id: string | null
          txn_date: string
          txn_type: string
          updated_at: string
        }
        Insert: {
          account_id: string
          amount: number
          category?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          payment_id?: string | null
          txn_date?: string
          txn_type: string
          updated_at?: string
        }
        Update: {
          account_id?: string
          amount?: number
          category?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          payment_id?: string | null
          txn_date?: string
          txn_type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "transactions_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "payments"
            referencedColumns: ["id"]
          },
        ]
      }
      units: {
        Row: {
          area_sqm: number | null
          bathrooms: number | null
          bedrooms: number | null
          created_at: string
          id: string
          notes: string | null
          photos: string[] | null
          property_id: string
          rent_amount: number
          status: Database["public"]["Enums"]["unit_status"]
          type: Database["public"]["Enums"]["unit_type"]
          unit_number: string
          updated_at: string
        }
        Insert: {
          area_sqm?: number | null
          bathrooms?: number | null
          bedrooms?: number | null
          created_at?: string
          id?: string
          notes?: string | null
          photos?: string[] | null
          property_id: string
          rent_amount?: number
          status?: Database["public"]["Enums"]["unit_status"]
          type?: Database["public"]["Enums"]["unit_type"]
          unit_number: string
          updated_at?: string
        }
        Update: {
          area_sqm?: number | null
          bathrooms?: number | null
          bedrooms?: number | null
          created_at?: string
          id?: string
          notes?: string | null
          photos?: string[] | null
          property_id?: string
          rent_amount?: number
          status?: Database["public"]["Enums"]["unit_status"]
          type?: Database["public"]["Enums"]["unit_type"]
          unit_number?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "units_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
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
      vehicles: {
        Row: {
          archived: boolean
          brand: string | null
          chassis_number: string | null
          created_at: string
          created_by: string | null
          current_value: number | null
          driver_name: string | null
          driver_phone: string | null
          id: string
          insurance_company: string | null
          insurance_expiry: string | null
          license_expiry: string | null
          model: string | null
          name: string
          notes: string | null
          photos: string[] | null
          plate_number: string | null
          purchase_date: string | null
          purchase_value: number | null
          status: string
          updated_at: string
          vehicle_type: string | null
          year: number | null
        }
        Insert: {
          archived?: boolean
          brand?: string | null
          chassis_number?: string | null
          created_at?: string
          created_by?: string | null
          current_value?: number | null
          driver_name?: string | null
          driver_phone?: string | null
          id?: string
          insurance_company?: string | null
          insurance_expiry?: string | null
          license_expiry?: string | null
          model?: string | null
          name: string
          notes?: string | null
          photos?: string[] | null
          plate_number?: string | null
          purchase_date?: string | null
          purchase_value?: number | null
          status?: string
          updated_at?: string
          vehicle_type?: string | null
          year?: number | null
        }
        Update: {
          archived?: boolean
          brand?: string | null
          chassis_number?: string | null
          created_at?: string
          created_by?: string | null
          current_value?: number | null
          driver_name?: string | null
          driver_phone?: string | null
          id?: string
          insurance_company?: string | null
          insurance_expiry?: string | null
          license_expiry?: string | null
          model?: string | null
          name?: string
          notes?: string | null
          photos?: string[] | null
          plate_number?: string | null
          purchase_date?: string | null
          purchase_value?: number | null
          status?: string
          updated_at?: string
          vehicle_type?: string | null
          year?: number | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      dashboard_totals: { Args: never; Returns: Json }
      generate_alert_notifications: { Args: never; Returns: undefined }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      refresh_payment_statuses: { Args: never; Returns: undefined }
    }
    Enums: {
      app_role:
        | "admin"
        | "manager"
        | "user"
        | "super_admin"
        | "accountant"
        | "hr"
      contract_status: "نشط" | "منتهي" | "ملغي"
      maintenance_status: "جديد" | "قيد التنفيذ" | "مكتمل" | "ملغي"
      payment_status: "مدفوع" | "متأخر" | "غير مدفوع"
      property_status: "مؤجر" | "خاصة" | "متاح"
      property_type: "عمارة" | "فيلا" | "مجمع" | "أرض" | "محل" | "مكتب"
      unit_status: "مؤجرة" | "فارغة" | "صيانة"
      unit_type: "شقة" | "محل" | "مكتب" | "مستودع" | "استوديو"
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
      app_role: ["admin", "manager", "user", "super_admin", "accountant", "hr"],
      contract_status: ["نشط", "منتهي", "ملغي"],
      maintenance_status: ["جديد", "قيد التنفيذ", "مكتمل", "ملغي"],
      payment_status: ["مدفوع", "متأخر", "غير مدفوع"],
      property_status: ["مؤجر", "خاصة", "متاح"],
      property_type: ["عمارة", "فيلا", "مجمع", "أرض", "محل", "مكتب"],
      unit_status: ["مؤجرة", "فارغة", "صيانة"],
      unit_type: ["شقة", "محل", "مكتب", "مستودع", "استوديو"],
    },
  },
} as const
