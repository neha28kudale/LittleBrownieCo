/**
 * Hand-written types matching supabase/migrations/0001_init.sql.
 * If the schema changes, update this file to match (or regenerate via
 * `supabase gen types typescript` once the Supabase CLI is linked).
 */

export type Database = {
  public: {
    Tables: {
      admin_users: {
        Row: { user_id: string; created_at: string };
        Insert: { user_id: string; created_at?: string };
        Update: { user_id?: string; created_at?: string };
      };
      products: {
        Row: {
          id: string;
          slug: string;
          name: string;
          tagline: string | null;
          category: string;
          description: string | null;
          image_url: string | null;
          square_image_url: string | null;
          is_active: boolean;
          sort_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          slug: string;
          name: string;
          tagline?: string | null;
          category: string;
          description?: string | null;
          image_url?: string | null;
          square_image_url?: string | null;
          is_active?: boolean;
          sort_order?: number;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["products"]["Insert"]>;
      };
      product_variants: {
        Row: {
          id: string;
          product_id: string;
          label: string;
          price: number;
          is_active: boolean;
          sort_order: number;
        };
        Insert: {
          id?: string;
          product_id: string;
          label: string;
          price: number;
          is_active?: boolean;
          sort_order?: number;
        };
        Update: Partial<Database["public"]["Tables"]["product_variants"]["Insert"]>;
      };
      delivery_slabs: {
        Row: {
          id: string;
          min_km: number;
          max_km: number | null;
          fee: number;
          sort_order: number;
        };
        Insert: {
          id?: string;
          min_km: number;
          max_km?: number | null;
          fee: number;
          sort_order?: number;
        };
        Update: Partial<Database["public"]["Tables"]["delivery_slabs"]["Insert"]>;
      };
      orders: {
        Row: {
          id: string;
          order_number: string;
          customer_name: string;
          phone: string;
          email: string | null;
          address: string;
          distance_km: number | null;
          delivery_fee: number;
          subtotal: number;
          total: number;
          delivery_date: string;
          delivery_slot: string;
          notes: string | null;
          payment_status: "pending" | "paid" | "failed";
          order_status: "order_placed" | "order_confirmed" | "rejected";
          cashfree_order_id: string | null;
          cashfree_payment_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          order_number: string;
          customer_name: string;
          phone: string;
          email?: string | null;
          address: string;
          distance_km?: number | null;
          delivery_fee?: number;
          subtotal: number;
          total: number;
          delivery_date: string;
          delivery_slot: string;
          notes?: string | null;
          payment_status?: "pending" | "paid" | "failed";
          order_status?: "order_placed" | "order_confirmed" | "rejected";
          cashfree_order_id?: string | null;
          cashfree_payment_id?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["orders"]["Insert"]>;
      };
      order_items: {
        Row: {
          id: string;
          order_id: string;
          product_id: string | null;
          product_name: string;
          variant_label: string;
          unit_price: number;
          qty: number;
          line_total: number;
        };
        Insert: {
          id?: string;
          order_id: string;
          product_id?: string | null;
          product_name: string;
          variant_label: string;
          unit_price: number;
          qty: number;
          line_total: number;
        };
        Update: Partial<Database["public"]["Tables"]["order_items"]["Insert"]>;
      };
      reviews: {
        Row: {
          id: string;
          customer_name: string;
          location: string | null;
          rating: number;
          body: string;
          status: "pending" | "approved" | "rejected";
          created_at: string;
        };
        Insert: {
          id?: string;
          customer_name: string;
          location?: string | null;
          rating: number;
          body: string;
          status?: "pending" | "approved" | "rejected";
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["reviews"]["Insert"]>;
      };
    };
  };
};
