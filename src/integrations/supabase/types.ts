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
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      admin_pages: {
        Row: {
          created_at: string
          id: string
          number: number
          path: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          number: number
          path: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          number?: number
          path?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      affiliate_applications: {
        Row: {
          affiliate_id: string
          applied_at: string
          approved_at: string | null
          approved_by: string | null
          id: string
          program_id: string
          status: string
        }
        Insert: {
          affiliate_id: string
          applied_at?: string
          approved_at?: string | null
          approved_by?: string | null
          id?: string
          program_id: string
          status?: string
        }
        Update: {
          affiliate_id?: string
          applied_at?: string
          approved_at?: string | null
          approved_by?: string | null
          id?: string
          program_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "affiliate_applications_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "affiliate_programs"
            referencedColumns: ["id"]
          },
        ]
      }
      affiliate_links: {
        Row: {
          affiliate_id: string
          affiliate_url: string
          clicks_count: number | null
          conversions_count: number | null
          created_at: string
          description: string | null
          id: string
          link_type: string
          original_url: string
          program_id: string
          title: string | null
          tracking_code: string
          updated_at: string
        }
        Insert: {
          affiliate_id: string
          affiliate_url: string
          clicks_count?: number | null
          conversions_count?: number | null
          created_at?: string
          description?: string | null
          id?: string
          link_type?: string
          original_url: string
          program_id: string
          title?: string | null
          tracking_code: string
          updated_at?: string
        }
        Update: {
          affiliate_id?: string
          affiliate_url?: string
          clicks_count?: number | null
          conversions_count?: number | null
          created_at?: string
          description?: string | null
          id?: string
          link_type?: string
          original_url?: string
          program_id?: string
          title?: string | null
          tracking_code?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "affiliate_links_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "affiliate_programs"
            referencedColumns: ["id"]
          },
        ]
      }
      affiliate_programs: {
        Row: {
          commission_fixed: number | null
          commission_rate: number | null
          commission_type: string
          cookie_duration: number | null
          created_at: string
          description: string | null
          id: string
          merchant_id: string
          name: string
          status: string
          terms_and_conditions: string | null
          updated_at: string
        }
        Insert: {
          commission_fixed?: number | null
          commission_rate?: number | null
          commission_type?: string
          cookie_duration?: number | null
          created_at?: string
          description?: string | null
          id?: string
          merchant_id: string
          name: string
          status?: string
          terms_and_conditions?: string | null
          updated_at?: string
        }
        Update: {
          commission_fixed?: number | null
          commission_rate?: number | null
          commission_type?: string
          cookie_duration?: number | null
          created_at?: string
          description?: string | null
          id?: string
          merchant_id?: string
          name?: string
          status?: string
          terms_and_conditions?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "affiliate_programs_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "merchants"
            referencedColumns: ["id"]
          },
        ]
      }
      automation_workflows: {
        Row: {
          actions: Json | null
          company_id: string | null
          created_at: string
          description: string | null
          id: string
          name: string
          runs_count: number | null
          status: string
          success_rate: number | null
          trigger_config: Json | null
          trigger_type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          actions?: Json | null
          company_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name: string
          runs_count?: number | null
          status?: string
          success_rate?: number | null
          trigger_config?: Json | null
          trigger_type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          actions?: Json | null
          company_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          runs_count?: number | null
          status?: string
          success_rate?: number | null
          trigger_config?: Json | null
          trigger_type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      blocked_users: {
        Row: {
          created_at: string
          email: string
          id: string
          reason: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          reason?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          reason?: string | null
        }
        Relationships: []
      }
      campaigns: {
        Row: {
          ad_collateral: string[] | null
          budget: number | null
          company_id: string | null
          created_at: string
          description: string | null
          end_date: string | null
          execution_methods: string[] | null
          goals: string | null
          id: string
          metrics: Json | null
          platforms: string[] | null
          start_date: string | null
          status: string
          target_audience: string | null
          title: string
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          ad_collateral?: string[] | null
          budget?: number | null
          company_id?: string | null
          created_at?: string
          description?: string | null
          end_date?: string | null
          execution_methods?: string[] | null
          goals?: string | null
          id?: string
          metrics?: Json | null
          platforms?: string[] | null
          start_date?: string | null
          status?: string
          target_audience?: string | null
          title: string
          type?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          ad_collateral?: string[] | null
          budget?: number | null
          company_id?: string | null
          created_at?: string
          description?: string | null
          end_date?: string | null
          execution_methods?: string[] | null
          goals?: string | null
          id?: string
          metrics?: Json | null
          platforms?: string[] | null
          start_date?: string | null
          status?: string
          target_audience?: string | null
          title?: string
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      clicks: {
        Row: {
          clicked_at: string
          id: string
          ip_address: unknown | null
          link_id: string
          referrer: string | null
          user_agent: string | null
        }
        Insert: {
          clicked_at?: string
          id?: string
          ip_address?: unknown | null
          link_id: string
          referrer?: string | null
          user_agent?: string | null
        }
        Update: {
          clicked_at?: string
          id?: string
          ip_address?: unknown | null
          link_id?: string
          referrer?: string | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "clicks_link_id_fkey"
            columns: ["link_id"]
            isOneToOne: false
            referencedRelation: "affiliate_links"
            referencedColumns: ["id"]
          },
        ]
      }
      companies: {
        Row: {
          branding_config: Json | null
          created_at: string
          domain: string | null
          id: string
          name: string
          subscription_tier: string
          updated_at: string
          white_label_enabled: boolean | null
        }
        Insert: {
          branding_config?: Json | null
          created_at?: string
          domain?: string | null
          id?: string
          name: string
          subscription_tier?: string
          updated_at?: string
          white_label_enabled?: boolean | null
        }
        Update: {
          branding_config?: Json | null
          created_at?: string
          domain?: string | null
          id?: string
          name?: string
          subscription_tier?: string
          updated_at?: string
          white_label_enabled?: boolean | null
        }
        Relationships: []
      }
      content_items: {
        Row: {
          company_id: string | null
          content: string | null
          content_type: string
          created_at: string
          excerpt: string | null
          featured_image_url: string | null
          id: string
          published_at: string | null
          seo_description: string | null
          seo_title: string | null
          status: string
          tags: string[] | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          company_id?: string | null
          content?: string | null
          content_type?: string
          created_at?: string
          excerpt?: string | null
          featured_image_url?: string | null
          id?: string
          published_at?: string | null
          seo_description?: string | null
          seo_title?: string | null
          status?: string
          tags?: string[] | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          company_id?: string | null
          content?: string | null
          content_type?: string
          created_at?: string
          excerpt?: string | null
          featured_image_url?: string | null
          id?: string
          published_at?: string | null
          seo_description?: string | null
          seo_title?: string | null
          status?: string
          tags?: string[] | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      conversions: {
        Row: {
          approved_at: string | null
          click_id: string | null
          commission_amount: number
          commission_rate: number | null
          converted_at: string
          id: string
          link_id: string
          order_id: string | null
          paid_at: string | null
          sale_amount: number
          status: string
        }
        Insert: {
          approved_at?: string | null
          click_id?: string | null
          commission_amount: number
          commission_rate?: number | null
          converted_at?: string
          id?: string
          link_id: string
          order_id?: string | null
          paid_at?: string | null
          sale_amount: number
          status?: string
        }
        Update: {
          approved_at?: string | null
          click_id?: string | null
          commission_amount?: number
          commission_rate?: number | null
          converted_at?: string
          id?: string
          link_id?: string
          order_id?: string | null
          paid_at?: string | null
          sale_amount?: number
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversions_click_id_fkey"
            columns: ["click_id"]
            isOneToOne: false
            referencedRelation: "clicks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversions_link_id_fkey"
            columns: ["link_id"]
            isOneToOne: false
            referencedRelation: "affiliate_links"
            referencedColumns: ["id"]
          },
        ]
      }
      cuisine_types: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          sort_order: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          sort_order?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          sort_order?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      disputes: {
        Row: {
          affiliate_id: string | null
          amount: number | null
          conversion_id: string | null
          created_at: string
          description: string
          id: string
          merchant_id: string | null
          resolution: string | null
          resolved_at: string | null
          status: string
          type: string
        }
        Insert: {
          affiliate_id?: string | null
          amount?: number | null
          conversion_id?: string | null
          created_at?: string
          description: string
          id?: string
          merchant_id?: string | null
          resolution?: string | null
          resolved_at?: string | null
          status?: string
          type: string
        }
        Update: {
          affiliate_id?: string | null
          amount?: number | null
          conversion_id?: string | null
          created_at?: string
          description?: string
          id?: string
          merchant_id?: string | null
          resolution?: string | null
          resolved_at?: string | null
          status?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "disputes_conversion_id_fkey"
            columns: ["conversion_id"]
            isOneToOne: false
            referencedRelation: "conversions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "disputes_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "merchants"
            referencedColumns: ["id"]
          },
        ]
      }
      email_campaigns: {
        Row: {
          click_rate: number | null
          company_id: string | null
          content_html: string | null
          content_text: string | null
          created_at: string
          from_email: string
          from_name: string | null
          id: string
          name: string
          open_rate: number | null
          recipient_count: number | null
          scheduled_at: string | null
          sent_at: string | null
          status: string
          subject: string
          updated_at: string
          user_id: string
        }
        Insert: {
          click_rate?: number | null
          company_id?: string | null
          content_html?: string | null
          content_text?: string | null
          created_at?: string
          from_email: string
          from_name?: string | null
          id?: string
          name: string
          open_rate?: number | null
          recipient_count?: number | null
          scheduled_at?: string | null
          sent_at?: string | null
          status?: string
          subject: string
          updated_at?: string
          user_id: string
        }
        Update: {
          click_rate?: number | null
          company_id?: string | null
          content_html?: string | null
          content_text?: string | null
          created_at?: string
          from_email?: string
          from_name?: string | null
          id?: string
          name?: string
          open_rate?: number | null
          recipient_count?: number | null
          scheduled_at?: string | null
          sent_at?: string | null
          status?: string
          subject?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      event_rsvps: {
        Row: {
          attendee_email: string
          attendee_name: string | null
          event_id: string
          guest_count: number | null
          id: string
          responded_at: string
          response: string
          response_message: string | null
        }
        Insert: {
          attendee_email: string
          attendee_name?: string | null
          event_id: string
          guest_count?: number | null
          id?: string
          responded_at?: string
          response: string
          response_message?: string | null
        }
        Update: {
          attendee_email?: string
          attendee_name?: string | null
          event_id?: string
          guest_count?: number | null
          id?: string
          responded_at?: string
          response?: string
          response_message?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "event_rsvps_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          created_at: string
          created_by: string
          description: string | null
          end_date: string | null
          event_date: string
          event_type: string
          id: string
          max_attendees: number | null
          rsvp_deadline: string | null
          status: string
          title: string
          updated_at: string
          venue_id: string | null
        }
        Insert: {
          created_at?: string
          created_by: string
          description?: string | null
          end_date?: string | null
          event_date: string
          event_type?: string
          id?: string
          max_attendees?: number | null
          rsvp_deadline?: string | null
          status?: string
          title: string
          updated_at?: string
          venue_id?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string
          description?: string | null
          end_date?: string | null
          event_date?: string
          event_type?: string
          id?: string
          max_attendees?: number | null
          rsvp_deadline?: string | null
          status?: string
          title?: string
          updated_at?: string
          venue_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "events_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "venues"
            referencedColumns: ["id"]
          },
        ]
      }
      group_invitations: {
        Row: {
          approval_status: string | null
          created_at: string
          creator_id: string | null
          custom_message: string | null
          group_name: string
          id: string
          invite_token: string | null
          proposed_date: string | null
          rsvp_deadline: string | null
          status: string | null
          updated_at: string
          venue_id: string | null
        }
        Insert: {
          approval_status?: string | null
          created_at?: string
          creator_id?: string | null
          custom_message?: string | null
          group_name: string
          id?: string
          invite_token?: string | null
          proposed_date?: string | null
          rsvp_deadline?: string | null
          status?: string | null
          updated_at?: string
          venue_id?: string | null
        }
        Update: {
          approval_status?: string | null
          created_at?: string
          creator_id?: string | null
          custom_message?: string | null
          group_name?: string
          id?: string
          invite_token?: string | null
          proposed_date?: string | null
          rsvp_deadline?: string | null
          status?: string | null
          updated_at?: string
          venue_id?: string | null
        }
        Relationships: []
      }
      invitation_rsvps: {
        Row: {
          created_at: string
          guest_count: number | null
          id: string
          invitation_id: string
          invitee_email: string
          response: string | null
          response_date: string | null
          response_message: string | null
        }
        Insert: {
          created_at?: string
          guest_count?: number | null
          id?: string
          invitation_id: string
          invitee_email: string
          response?: string | null
          response_date?: string | null
          response_message?: string | null
        }
        Update: {
          created_at?: string
          guest_count?: number | null
          id?: string
          invitation_id?: string
          invitee_email?: string
          response?: string | null
          response_date?: string | null
          response_message?: string | null
        }
        Relationships: []
      }
      marketing_materials: {
        Row: {
          created_at: string
          dimensions: string | null
          file_size: number | null
          file_url: string | null
          id: string
          program_id: string
          title: string
          type: string
        }
        Insert: {
          created_at?: string
          dimensions?: string | null
          file_size?: number | null
          file_url?: string | null
          id?: string
          program_id: string
          title: string
          type: string
        }
        Update: {
          created_at?: string
          dimensions?: string | null
          file_size?: number | null
          file_url?: string | null
          id?: string
          program_id?: string
          title?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "marketing_materials_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "affiliate_programs"
            referencedColumns: ["id"]
          },
        ]
      }
      menu_items: {
        Row: {
          created_at: string
          depth: number
          description: string | null
          href: string
          icon_name: string | null
          id: string
          is_visible: boolean
          menu_type: string
          name: string
          page_id: string | null
          parent_id: string | null
          sort_order: number
          target_blank: boolean
          updated_at: string
        }
        Insert: {
          created_at?: string
          depth?: number
          description?: string | null
          href: string
          icon_name?: string | null
          id?: string
          is_visible?: boolean
          menu_type?: string
          name: string
          page_id?: string | null
          parent_id?: string | null
          sort_order: number
          target_blank?: boolean
          updated_at?: string
        }
        Update: {
          created_at?: string
          depth?: number
          description?: string | null
          href?: string
          icon_name?: string | null
          id?: string
          is_visible?: boolean
          menu_type?: string
          name?: string
          page_id?: string | null
          parent_id?: string | null
          sort_order?: number
          target_blank?: boolean
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "menu_items_page_id_fkey"
            columns: ["page_id"]
            isOneToOne: false
            referencedRelation: "pages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "menu_items_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "menu_items"
            referencedColumns: ["id"]
          },
        ]
      }
      merchants: {
        Row: {
          company_name: string
          contact_email: string
          created_at: string
          description: string | null
          id: string
          status: string
          total_revenue: number | null
          updated_at: string
          user_id: string
          website_url: string | null
        }
        Insert: {
          company_name: string
          contact_email: string
          created_at?: string
          description?: string | null
          id?: string
          status?: string
          total_revenue?: number | null
          updated_at?: string
          user_id: string
          website_url?: string | null
        }
        Update: {
          company_name?: string
          contact_email?: string
          created_at?: string
          description?: string | null
          id?: string
          status?: string
          total_revenue?: number | null
          updated_at?: string
          user_id?: string
          website_url?: string | null
        }
        Relationships: []
      }
      message_replies: {
        Row: {
          author_email: string
          author_name: string
          created_at: string
          id: string
          message_id: string
          reply_text: string
        }
        Insert: {
          author_email: string
          author_name: string
          created_at?: string
          id?: string
          message_id: string
          reply_text: string
        }
        Update: {
          author_email?: string
          author_name?: string
          created_at?: string
          id?: string
          message_id?: string
          reply_text?: string
        }
        Relationships: []
      }
      messages: {
        Row: {
          author_email: string
          author_id: string | null
          author_name: string
          created_at: string
          id: string
          is_approved: boolean
          message_text: string
          message_type: string
          updated_at: string
        }
        Insert: {
          author_email: string
          author_id?: string | null
          author_name: string
          created_at?: string
          id?: string
          is_approved?: boolean
          message_text: string
          message_type?: string
          updated_at?: string
        }
        Update: {
          author_email?: string
          author_id?: string | null
          author_name?: string
          created_at?: string
          id?: string
          is_approved?: boolean
          message_text?: string
          message_type?: string
          updated_at?: string
        }
        Relationships: []
      }
      page_templates: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          template_data: Json
          thumbnail_url: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          template_data?: Json
          thumbnail_url?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          template_data?: Json
          thumbnail_url?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      pages: {
        Row: {
          content: Json
          created_at: string
          created_by: string | null
          id: string
          is_published: boolean
          meta_description: string | null
          meta_title: string | null
          slug: string
          template_id: string | null
          title: string
          updated_at: string
        }
        Insert: {
          content?: Json
          created_at?: string
          created_by?: string | null
          id?: string
          is_published?: boolean
          meta_description?: string | null
          meta_title?: string | null
          slug: string
          template_id?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          content?: Json
          created_at?: string
          created_by?: string | null
          id?: string
          is_published?: boolean
          meta_description?: string | null
          meta_title?: string | null
          slug?: string
          template_id?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      payouts: {
        Row: {
          affiliate_id: string
          amount: number
          id: string
          paid_at: string | null
          payment_details: Json | null
          payment_method: string | null
          processed_at: string | null
          requested_at: string
          status: string
        }
        Insert: {
          affiliate_id: string
          amount: number
          id?: string
          paid_at?: string | null
          payment_details?: Json | null
          payment_method?: string | null
          processed_at?: string | null
          requested_at?: string
          status?: string
        }
        Update: {
          affiliate_id?: string
          amount?: number
          id?: string
          paid_at?: string | null
          payment_details?: Json | null
          payment_method?: string | null
          processed_at?: string | null
          requested_at?: string
          status?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          company_id: string | null
          created_at: string
          email: string | null
          first_name: string | null
          id: string
          is_admin: boolean | null
          last_active: string | null
          last_name: string | null
          marketing_role: Database["public"]["Enums"]["marketing_role"] | null
          phone: string | null
          role: string
          status: string
          timezone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          company_id?: string | null
          created_at?: string
          email?: string | null
          first_name?: string | null
          id?: string
          is_admin?: boolean | null
          last_active?: string | null
          last_name?: string | null
          marketing_role?: Database["public"]["Enums"]["marketing_role"] | null
          phone?: string | null
          role?: string
          status?: string
          timezone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          company_id?: string | null
          created_at?: string
          email?: string | null
          first_name?: string | null
          id?: string
          is_admin?: boolean | null
          last_active?: string | null
          last_name?: string | null
          marketing_role?: Database["public"]["Enums"]["marketing_role"] | null
          phone?: string | null
          role?: string
          status?: string
          timezone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      simple_members: {
        Row: {
          address: string | null
          created_at: string
          display_name: string | null
          email: string
          emergency_contact_name: string | null
          emergency_contact_phone: string | null
          first_name: string | null
          id: string
          is_active: boolean | null
          joined_at: string | null
          last_name: string | null
          phone: string | null
          receive_notifications: boolean | null
          status: string
          updated_at: string
        }
        Insert: {
          address?: string | null
          created_at?: string
          display_name?: string | null
          email: string
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          first_name?: string | null
          id?: string
          is_active?: boolean | null
          joined_at?: string | null
          last_name?: string | null
          phone?: string | null
          receive_notifications?: boolean | null
          status?: string
          updated_at?: string
        }
        Update: {
          address?: string | null
          created_at?: string
          display_name?: string | null
          email?: string
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          first_name?: string | null
          id?: string
          is_active?: boolean | null
          joined_at?: string | null
          last_name?: string | null
          phone?: string | null
          receive_notifications?: boolean | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      social_posts: {
        Row: {
          company_id: string | null
          content: string
          created_at: string
          engagement_metrics: Json | null
          hashtags: string[] | null
          id: string
          media_urls: string[] | null
          platform: string
          published_at: string | null
          scheduled_at: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          company_id?: string | null
          content: string
          created_at?: string
          engagement_metrics?: Json | null
          hashtags?: string[] | null
          id?: string
          media_urls?: string[] | null
          platform: string
          published_at?: string | null
          scheduled_at?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          company_id?: string | null
          content?: string
          created_at?: string
          engagement_metrics?: Json | null
          hashtags?: string[] | null
          id?: string
          media_urls?: string[] | null
          platform?: string
          published_at?: string | null
          scheduled_at?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      venue_ratings: {
        Row: {
          author_email: string | null
          author_name: string | null
          created_at: string
          id: string
          rating: number
          review: string | null
          venue_id: string
        }
        Insert: {
          author_email?: string | null
          author_name?: string | null
          created_at?: string
          id?: string
          rating: number
          review?: string | null
          venue_id: string
        }
        Update: {
          author_email?: string | null
          author_name?: string | null
          created_at?: string
          id?: string
          rating?: number
          review?: string | null
          venue_id?: string
        }
        Relationships: []
      }
      venues: {
        Row: {
          address: string
          average_rating: number | null
          business_name: string | null
          created_at: string
          created_by: string | null
          cuisine_types: string[] | null
          description: string | null
          facebook_link: string | null
          features: string[] | null
          google_maps_link: string | null
          hours: string | null
          id: string
          image_1_url: string | null
          image_2_url: string | null
          image_3_url: string | null
          image_url: string | null
          name: string
          phone: string | null
          price_range: string | null
          rating: number | null
          rating_count: number | null
          status: string
          updated_at: string
          venue_type: string
          website: string | null
        }
        Insert: {
          address: string
          average_rating?: number | null
          business_name?: string | null
          created_at?: string
          created_by?: string | null
          cuisine_types?: string[] | null
          description?: string | null
          facebook_link?: string | null
          features?: string[] | null
          google_maps_link?: string | null
          hours?: string | null
          id?: string
          image_1_url?: string | null
          image_2_url?: string | null
          image_3_url?: string | null
          image_url?: string | null
          name: string
          phone?: string | null
          price_range?: string | null
          rating?: number | null
          rating_count?: number | null
          status?: string
          updated_at?: string
          venue_type: string
          website?: string | null
        }
        Update: {
          address?: string
          average_rating?: number | null
          business_name?: string | null
          created_at?: string
          created_by?: string | null
          cuisine_types?: string[] | null
          description?: string | null
          facebook_link?: string | null
          features?: string[] | null
          google_maps_link?: string | null
          hours?: string | null
          id?: string
          image_1_url?: string | null
          image_2_url?: string | null
          image_3_url?: string | null
          image_url?: string | null
          name?: string
          phone?: string | null
          price_range?: string | null
          rating?: number | null
          rating_count?: number | null
          status?: string
          updated_at?: string
          venue_type?: string
          website?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_menu_hierarchy: {
        Args: { menu_type_param?: string }
        Returns: {
          depth: number
          description: string
          href: string
          icon_name: string
          id: string
          name: string
          page_id: string
          page_slug: string
          page_title: string
          parent_id: string
          sort_order: number
          target_blank: boolean
        }[]
      }
    }
    Enums: {
      marketing_role:
        | "marketing_director"
        | "content_marketing_manager"
        | "digital_advertising_specialist"
        | "email_marketing_specialist"
        | "social_media_manager"
        | "seo_sem_specialist"
        | "customer_retention_specialist"
        | "data_analytics_manager"
        | "marketing_automation_specialist"
        | "creative_director"
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
      marketing_role: [
        "marketing_director",
        "content_marketing_manager",
        "digital_advertising_specialist",
        "email_marketing_specialist",
        "social_media_manager",
        "seo_sem_specialist",
        "customer_retention_specialist",
        "data_analytics_manager",
        "marketing_automation_specialist",
        "creative_director",
      ],
    },
  },
} as const
