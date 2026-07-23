// These types mirror supabase/schema.sql. Once your project is live, you can
// regenerate exact types anytime with:
//   npx supabase gen types typescript --project-id <ref> > src/lib/database.types.ts
//
// IMPORTANT: every Row/Insert/Update shape below is written out literally.
// An earlier version of this file defined Insert/Update as
// `Partial<Database["public"]["Tables"]["x"]["Row"]>` — a self-referential
// lookup into the very interface being declared. That circular reference is
// what caused @supabase/supabase-js v2's query builder generics to collapse
// to `never` everywhere under a real `tsc` build (this is also why the schema
// still needs a `Relationships` array per table/view — without it the same
// generic chain can't resolve either). Do not reintroduce self-references here.

export type BookingStatus = "pending_payment" | "confirmed" | "cancelled" | "rejected" | "completed" | "refunded" | "expired";
export type PaymentStatus = "created" | "authorized" | "captured" | "failed" | "refunded";
export type AvailabilityStatus = "available" | "fully_booked" | "maintenance" | "blocked";
export type AdminRole = "super_admin" | "admin" | "manager";

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string;
          phone: string | null;
          avatar_url: string | null;
          city: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          full_name?: string;
          phone?: string | null;
          avatar_url?: string | null;
          city?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string;
          phone?: string | null;
          avatar_url?: string | null;
          city?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      admin_users: {
        Row: { id: string; user_id: string; role: AdminRole; created_at: string };
        Insert: { id?: string; user_id: string; role?: AdminRole; created_at?: string };
        Update: { id?: string; user_id?: string; role?: AdminRole; created_at?: string };
        Relationships: [];
      };
      rooms: {
        Row: {
          id: string;
          slug: string;
          name: string;
          short_description: string;
          description: string;
          price_per_night: number;
          max_guests: number;
          bed_config: string | null;
          size_sqft: number | null;
          amenities: string[];
          is_active: boolean;
          is_featured: boolean;
          total_units: number;
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          slug: string;
          name: string;
          short_description?: string;
          description?: string;
          price_per_night: number;
          max_guests: number;
          bed_config?: string | null;
          size_sqft?: number | null;
          amenities?: string[];
          is_active?: boolean;
          is_featured?: boolean;
          total_units?: number;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          slug?: string;
          name?: string;
          short_description?: string;
          description?: string;
          price_per_night?: number;
          max_guests?: number;
          bed_config?: string | null;
          size_sqft?: number | null;
          amenities?: string[];
          is_active?: boolean;
          is_featured?: boolean;
          total_units?: number;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "room_images_room_id_fkey";
            columns: ["id"];
            isOneToOne: false;
            referencedRelation: "room_images";
            referencedColumns: ["room_id"];
          },
        ];
      };
      room_images: {
        Row: {
          id: string;
          room_id: string;
          storage_path: string;
          alt_text: string | null;
          sort_order: number;
          is_cover: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          room_id: string;
          storage_path: string;
          alt_text?: string | null;
          sort_order?: number;
          is_cover?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          room_id?: string;
          storage_path?: string;
          alt_text?: string | null;
          sort_order?: number;
          is_cover?: boolean;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "room_images_room_id_fkey";
            columns: ["room_id"];
            isOneToOne: false;
            referencedRelation: "rooms";
            referencedColumns: ["id"];
          },
        ];
      };
      bookings: {
        Row: {
          id: string;
          booking_reference: string;
          user_id: string | null;
          room_id: string;
          guest_name: string;
          guest_email: string;
          guest_phone: string;
          check_in: string;
          check_out: string;
          num_guests: number;
          nights: number;
          room_price_per_night: number;
          subtotal: number;
          tax_amount: number;
          discount_amount: number;
          total_amount: number;
          status: BookingStatus;
          special_requests: string | null;
          cancellation_reason: string | null;
          admin_notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          booking_reference?: string;
          user_id?: string | null;
          room_id: string;
          guest_name: string;
          guest_email: string;
          guest_phone: string;
          check_in: string;
          check_out: string;
          num_guests: number;
          nights?: number;
          room_price_per_night: number;
          subtotal: number;
          tax_amount?: number;
          discount_amount?: number;
          total_amount: number;
          status?: BookingStatus;
          special_requests?: string | null;
          cancellation_reason?: string | null;
          admin_notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          booking_reference?: string;
          user_id?: string | null;
          room_id?: string;
          guest_name?: string;
          guest_email?: string;
          guest_phone?: string;
          check_in?: string;
          check_out?: string;
          num_guests?: number;
          nights?: number;
          room_price_per_night?: number;
          subtotal?: number;
          tax_amount?: number;
          discount_amount?: number;
          total_amount?: number;
          status?: BookingStatus;
          special_requests?: string | null;
          cancellation_reason?: string | null;
          admin_notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "bookings_room_id_fkey";
            columns: ["room_id"];
            isOneToOne: false;
            referencedRelation: "rooms";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "bookings_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      payments: {
        Row: {
          id: string;
          booking_id: string;
          razorpay_order_id: string;
          razorpay_payment_id: string | null;
          razorpay_signature: string | null;
          amount: number;
          currency: string;
          method: string | null;
          status: PaymentStatus;
          refund_amount: number;
          refund_id: string | null;
          raw_response: unknown;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          booking_id: string;
          razorpay_order_id: string;
          razorpay_payment_id?: string | null;
          razorpay_signature?: string | null;
          amount: number;
          currency?: string;
          method?: string | null;
          status?: PaymentStatus;
          refund_amount?: number;
          refund_id?: string | null;
          raw_response?: unknown;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          booking_id?: string;
          razorpay_order_id?: string;
          razorpay_payment_id?: string | null;
          razorpay_signature?: string | null;
          amount?: number;
          currency?: string;
          method?: string | null;
          status?: PaymentStatus;
          refund_amount?: number;
          refund_id?: string | null;
          raw_response?: unknown;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "payments_booking_id_fkey";
            columns: ["booking_id"];
            isOneToOne: false;
            referencedRelation: "bookings";
            referencedColumns: ["id"];
          },
        ];
      };
      reviews: {
        Row: {
          id: string;
          user_id: string | null;
          room_id: string | null;
          booking_id: string | null;
          guest_name: string;
          rating: number;
          title: string | null;
          comment: string;
          is_approved: boolean;
          is_featured: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          room_id?: string | null;
          booking_id?: string | null;
          guest_name: string;
          rating: number;
          title?: string | null;
          comment: string;
          is_approved?: boolean;
          is_featured?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          room_id?: string | null;
          booking_id?: string | null;
          guest_name?: string;
          rating?: number;
          title?: string | null;
          comment?: string;
          is_approved?: boolean;
          is_featured?: boolean;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "reviews_room_id_fkey";
            columns: ["room_id"];
            isOneToOne: false;
            referencedRelation: "rooms";
            referencedColumns: ["id"];
          },
        ];
      };
      gallery_images: {
        Row: {
          id: string;
          category_id: string | null;
          storage_path: string;
          caption: string | null;
          is_featured: boolean;
          sort_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          category_id?: string | null;
          storage_path: string;
          caption?: string | null;
          is_featured?: boolean;
          sort_order?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          category_id?: string | null;
          storage_path?: string;
          caption?: string | null;
          is_featured?: boolean;
          sort_order?: number;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "gallery_images_category_id_fkey";
            columns: ["category_id"];
            isOneToOne: false;
            referencedRelation: "gallery_categories";
            referencedColumns: ["id"];
          },
        ];
      };
      gallery_categories: {
        Row: { id: string; name: string; sort_order: number };
        Insert: { id?: string; name: string; sort_order?: number };
        Update: { id?: string; name?: string; sort_order?: number };
        Relationships: [];
      };
      attractions: {
        Row: {
          id: string;
          name: string;
          description: string;
          distance_km: number | null;
          storage_path: string | null;
          sort_order: number;
          is_active: boolean;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string;
          distance_km?: number | null;
          storage_path?: string | null;
          sort_order?: number;
          is_active?: boolean;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string;
          distance_km?: number | null;
          storage_path?: string | null;
          sort_order?: number;
          is_active?: boolean;
        };
        Relationships: [];
      };
      faqs: {
        Row: { id: string; question: string; answer: string; sort_order: number; is_active: boolean };
        Insert: { id?: string; question: string; answer: string; sort_order?: number; is_active?: boolean };
        Update: { id?: string; question?: string; answer?: string; sort_order?: number; is_active?: boolean };
        Relationships: [];
      };
      contact_messages: {
        Row: {
          id: string;
          name: string;
          email: string;
          phone: string | null;
          subject: string | null;
          message: string;
          is_read: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          email: string;
          phone?: string | null;
          subject?: string | null;
          message: string;
          is_read?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          email?: string;
          phone?: string | null;
          subject?: string | null;
          message?: string;
          is_read?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
      site_settings: {
        Row: { key: string; value: unknown; updated_at: string };
        Insert: { key: string; value: unknown; updated_at?: string };
        Update: { key?: string; value?: unknown; updated_at?: string };
        Relationships: [];
      };
      room_availability: {
        Row: { id: string; room_id: string; date: string; units_blocked: number; reason: string | null; status: AvailabilityStatus; booking_id: string | null; created_at: string };
        Insert: { id?: string; room_id: string; date: string; units_blocked?: number; reason?: string | null; status?: AvailabilityStatus; booking_id?: string | null; created_at?: string };
        Update: { id?: string; room_id?: string; date?: string; units_blocked?: number; reason?: string | null; status?: AvailabilityStatus; booking_id?: string | null; created_at?: string };
        Relationships: [
          {
            foreignKeyName: "room_availability_room_id_fkey";
            columns: ["room_id"];
            isOneToOne: false;
            referencedRelation: "rooms";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "room_availability_booking_id_fkey";
            columns: ["booking_id"];
            isOneToOne: false;
            referencedRelation: "bookings";
            referencedColumns: ["id"];
          },
        ];
      };
      notifications: {
        Row: {
          id: string;
          booking_id: string | null;
          booking_reference: string;
          guest_name: string;
          guest_phone: string;
          guest_email: string;
          check_in: string;
          check_out: string;
          num_guests: number;
          total_amount: number;
          is_read: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          booking_id?: string | null;
          booking_reference: string;
          guest_name: string;
          guest_phone: string;
          guest_email: string;
          check_in: string;
          check_out: string;
          num_guests: number;
          total_amount: number;
          is_read?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          booking_id?: string | null;
          booking_reference?: string;
          guest_name?: string;
          guest_phone?: string;
          guest_email?: string;
          check_in?: string;
          check_out?: string;
          num_guests?: number;
          total_amount?: number;
          is_read?: boolean;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "notifications_booking_id_fkey";
            columns: ["booking_id"];
            isOneToOne: false;
            referencedRelation: "bookings";
            referencedColumns: ["id"];
          },
        ];
      };
      system_logs: {
        Row: {
          id: string;
          actor_id: string | null;
          action: string;
          entity: string | null;
          entity_id: string | null;
          metadata: unknown;
          created_at: string;
        };
        Insert: {
          id?: string;
          actor_id?: string | null;
          action: string;
          entity?: string | null;
          entity_id?: string | null;
          metadata?: unknown;
          created_at?: string;
        };
        Update: {
          id?: string;
          actor_id?: string | null;
          action?: string;
          entity?: string | null;
          entity_id?: string | null;
          metadata?: unknown;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      rooms_public: {
        Row: {
          id: string;
          slug: string;
          name: string;
          short_description: string;
          description: string;
          price_per_night: number;
          max_guests: number;
          bed_config: string | null;
          size_sqft: number | null;
          amenities: string[];
          is_active: boolean;
          is_featured: boolean;
          total_units: number;
          sort_order: number;
          created_at: string;
          updated_at: string;
          cover_image: string | null;
          avg_rating: number;
          review_count: number;
        };
        Relationships: [];
      };
      revenue_by_month: {
        Row: { month: string; bookings_count: number; revenue: number };
        Relationships: [];
      };
      unavailable_dates: {
        Row: {
          date: string;
          room_id: string | null;
          kind: string;
          guest_name: string | null;
          booking_reference: string | null;
          admin_reason: string | null;
        };
        Relationships: [];
      };
    };
    Functions: Record<string, never>;
    Enums: {
      booking_status: BookingStatus;
      payment_status: PaymentStatus;
    };
    CompositeTypes: Record<string, never>;
  };
}
