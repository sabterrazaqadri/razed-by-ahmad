// Generated from the live Supabase schema (project kqziysvumhtdugcdamju).
// Regenerate with: npx supabase gen types typescript --project-id <ref> > src/lib/database.types.ts

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      admin_users: {
        Row: { created_at: string; user_id: string }
        Insert: { created_at?: string; user_id: string }
        Update: { created_at?: string; user_id?: string }
        Relationships: []
      }
      order_intents: {
        Row: {
          code: string
          created_at: string
          free_delivery_applied: boolean
          id: string
          product_id: string | null
          product_name: string
          qty: number
          size_ml: number
          spin_eligible: boolean
          spin_prize_id: string | null
          spin_prize_label: string | null
          spin_used: boolean
          unit_price: number
          variant_id: string | null
        }
        Insert: {
          code: string
          created_at?: string
          free_delivery_applied?: boolean
          id?: string
          product_id?: string | null
          product_name: string
          qty?: number
          size_ml: number
          spin_eligible?: boolean
          spin_prize_id?: string | null
          spin_prize_label?: string | null
          spin_used?: boolean
          unit_price: number
          variant_id?: string | null
        }
        Update: {
          code?: string
          created_at?: string
          free_delivery_applied?: boolean
          id?: string
          product_id?: string | null
          product_name?: string
          qty?: number
          size_ml?: number
          spin_eligible?: boolean
          spin_prize_id?: string | null
          spin_prize_label?: string | null
          spin_used?: boolean
          unit_price?: number
          variant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "order_intents_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_intents_spin_prize_id_fkey"
            columns: ["spin_prize_id"]
            isOneToOne: false
            referencedRelation: "spin_prizes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_intents_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
            referencedColumns: ["id"]
          },
        ]
      }
      product_variants: {
        Row: {
          compare_at_price: number | null
          id: string
          is_default: boolean
          price: number
          product_id: string
          size_ml: number
          stock: number
        }
        Insert: {
          compare_at_price?: number | null
          id?: string
          is_default?: boolean
          price: number
          product_id: string
          size_ml: number
          stock?: number
        }
        Update: {
          compare_at_price?: number | null
          id?: string
          is_default?: boolean
          price?: number
          product_id?: string
          size_ml?: number
          stock?: number
        }
        Relationships: [
          {
            foreignKeyName: "product_variants_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          badge: string | null
          bottle_variant: string
          created_at: string
          description: string | null
          family: string | null
          id: string
          images: string[]
          is_active: boolean
          is_featured: boolean
          name: string
          notes_base: string[]
          notes_heart: string[]
          notes_top: string[]
          slug: string
          sort_order: number
          tagline: string | null
          updated_at: string
        }
        Insert: {
          badge?: string | null
          bottle_variant?: string
          created_at?: string
          description?: string | null
          family?: string | null
          id?: string
          images?: string[]
          is_active?: boolean
          is_featured?: boolean
          name: string
          notes_base?: string[]
          notes_heart?: string[]
          notes_top?: string[]
          slug: string
          sort_order?: number
          tagline?: string | null
          updated_at?: string
        }
        Update: {
          badge?: string | null
          bottle_variant?: string
          created_at?: string
          description?: string | null
          family?: string | null
          id?: string
          images?: string[]
          is_active?: boolean
          is_featured?: boolean
          name?: string
          notes_base?: string[]
          notes_heart?: string[]
          notes_top?: string[]
          slug?: string
          sort_order?: number
          tagline?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      site_settings: {
        Row: {
          about_text: string | null
          announcement_text: string | null
          currency: string
          free_delivery_day: number
          hero_headline: string | null
          hero_sub: string | null
          id: number
          spinner_day: number
          spinner_enabled: boolean
          updated_at: string
          whatsapp_number: string
        }
        Insert: {
          about_text?: string | null
          announcement_text?: string | null
          currency?: string
          free_delivery_day?: number
          hero_headline?: string | null
          hero_sub?: string | null
          id?: number
          spinner_day?: number
          spinner_enabled?: boolean
          updated_at?: string
          whatsapp_number?: string
        }
        Update: {
          about_text?: string | null
          announcement_text?: string | null
          currency?: string
          free_delivery_day?: number
          hero_headline?: string | null
          hero_sub?: string | null
          id?: number
          spinner_day?: number
          spinner_enabled?: boolean
          updated_at?: string
          whatsapp_number?: string
        }
        Relationships: []
      }
      spin_prizes: {
        Row: {
          id: string
          is_active: boolean
          label: string
          short_label: string
          sort_order: number
          weight: number
        }
        Insert: {
          id?: string
          is_active?: boolean
          label: string
          short_label: string
          sort_order?: number
          weight?: number
        }
        Update: {
          id?: string
          is_active?: boolean
          label?: string
          short_label?: string
          sort_order?: number
          weight?: number
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      create_order_intent: {
        Args: { p_product_id: string; p_qty?: number; p_variant_id: string }
        Returns: Json
      }
      gen_order_code: { Args: { len?: number }; Returns: string }
      get_order_intent: { Args: { p_code: string }; Returns: Json }
      is_admin: { Args: never; Returns: boolean }
      karachi_dow: { Args: never; Returns: number }
      spin_order: { Args: { p_code: string }; Returns: Json }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database["public"]

export type Tables<T extends keyof PublicSchema["Tables"]> = PublicSchema["Tables"][T]["Row"]
export type TablesInsert<T extends keyof PublicSchema["Tables"]> = PublicSchema["Tables"][T]["Insert"]
export type TablesUpdate<T extends keyof PublicSchema["Tables"]> = PublicSchema["Tables"][T]["Update"]
