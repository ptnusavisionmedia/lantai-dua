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
          action: string
          actor_id: string | null
          after: Json | null
          before: Json | null
          created_at: string
          id: number
          row_id: string
          table_name: string
        }
        Insert: {
          action: string
          actor_id?: string | null
          after?: Json | null
          before?: Json | null
          created_at?: string
          id?: never
          row_id: string
          table_name: string
        }
        Update: {
          action?: string
          actor_id?: string | null
          after?: Json | null
          before?: Json | null
          created_at?: string
          id?: never
          row_id?: string
          table_name?: string
        }
        Relationships: []
      }
      brands: {
        Row: {
          id: string
          name: string
          slug: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
        }
        Relationships: []
      }
      categories: {
        Row: {
          created_at: string
          group_id: string
          hygiene_note: string | null
          id: string
          is_active: boolean
          name: string
          slug: string
          sort_order: number
          try_mode: Database["public"]["Enums"]["try_mode"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          group_id: string
          hygiene_note?: string | null
          id?: string
          is_active?: boolean
          name: string
          slug: string
          sort_order?: number
          try_mode: Database["public"]["Enums"]["try_mode"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          group_id?: string
          hygiene_note?: string | null
          id?: string
          is_active?: boolean
          name?: string
          slug?: string
          sort_order?: number
          try_mode?: Database["public"]["Enums"]["try_mode"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "categories_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "category_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      category_attributes: {
        Row: {
          category_id: string
          created_at: string
          id: string
          is_comparable: boolean
          is_filterable: boolean
          key: string
          label: string
          options: string[] | null
          scope: Database["public"]["Enums"]["attribute_scope"]
          sort_order: number
          type: Database["public"]["Enums"]["attribute_type"]
          unit: string | null
          updated_at: string
        }
        Insert: {
          category_id: string
          created_at?: string
          id?: string
          is_comparable?: boolean
          is_filterable?: boolean
          key: string
          label: string
          options?: string[] | null
          scope?: Database["public"]["Enums"]["attribute_scope"]
          sort_order?: number
          type: Database["public"]["Enums"]["attribute_type"]
          unit?: string | null
          updated_at?: string
        }
        Update: {
          category_id?: string
          created_at?: string
          id?: string
          is_comparable?: boolean
          is_filterable?: boolean
          key?: string
          label?: string
          options?: string[] | null
          scope?: Database["public"]["Enums"]["attribute_scope"]
          sort_order?: number
          type?: Database["public"]["Enums"]["attribute_type"]
          unit?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "category_attributes_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      category_groups: {
        Row: {
          id: string
          name: string
          slug: string
          sort_order: number
        }
        Insert: {
          id?: string
          name: string
          slug: string
          sort_order?: number
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          sort_order?: number
        }
        Relationships: []
      }
      demo_areas: {
        Row: {
          capacity: number
          created_at: string
          id: string
          is_active: boolean
          is_reservable: boolean
          kind: Database["public"]["Enums"]["demo_area_kind"]
          name: string
          slug: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          capacity: number
          created_at?: string
          id?: string
          is_active?: boolean
          is_reservable: boolean
          kind: Database["public"]["Enums"]["demo_area_kind"]
          name: string
          slug: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          capacity?: number
          created_at?: string
          id?: string
          is_active?: boolean
          is_reservable?: boolean
          kind?: Database["public"]["Enums"]["demo_area_kind"]
          name?: string
          slug?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      demo_units: {
        Row: {
          area_id: string
          code: string
          created_at: string
          id: string
          status: Database["public"]["Enums"]["demo_unit_status"]
          updated_at: string
          variant_id: string
        }
        Insert: {
          area_id: string
          code: string
          created_at?: string
          id?: string
          status?: Database["public"]["Enums"]["demo_unit_status"]
          updated_at?: string
          variant_id: string
        }
        Update: {
          area_id?: string
          code?: string
          created_at?: string
          id?: string
          status?: Database["public"]["Enums"]["demo_unit_status"]
          updated_at?: string
          variant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "demo_units_area_id_fkey"
            columns: ["area_id"]
            isOneToOne: false
            referencedRelation: "demo_areas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "demo_units_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "demo_units_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "variant_availability"
            referencedColumns: ["id"]
          },
        ]
      }
      opening_hours: {
        Row: {
          closes_at: string | null
          isodow: number
          opens_at: string | null
        }
        Insert: {
          closes_at?: string | null
          isodow: number
          opens_at?: string | null
        }
        Update: {
          closes_at?: string | null
          isodow?: number
          opens_at?: string | null
        }
        Relationships: []
      }
      product_images: {
        Row: {
          alt: string
          id: string
          kind: Database["public"]["Enums"]["image_kind"]
          product_id: string
          sort_order: number
          storage_path: string
          variant_id: string | null
        }
        Insert: {
          alt?: string
          id?: string
          kind?: Database["public"]["Enums"]["image_kind"]
          product_id: string
          sort_order?: number
          storage_path: string
          variant_id?: string | null
        }
        Update: {
          alt?: string
          id?: string
          kind?: Database["public"]["Enums"]["image_kind"]
          product_id?: string
          sort_order?: number
          storage_path?: string
          variant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "product_images_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "catalog_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_images_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_images_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_images_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "variant_availability"
            referencedColumns: ["id"]
          },
        ]
      }
      product_variants: {
        Row: {
          attributes: Json
          created_at: string
          id: string
          is_active: boolean
          name: string
          price_idr: number
          product_id: string
          sku: string
          sort_order: number
          stock_qty: number
          updated_at: string
        }
        Insert: {
          attributes?: Json
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          price_idr: number
          product_id: string
          sku: string
          sort_order?: number
          stock_qty?: number
          updated_at?: string
        }
        Update: {
          attributes?: Json
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          price_idr?: number
          product_id?: string
          sku?: string
          sort_order?: number
          stock_qty?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_variants_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "catalog_items"
            referencedColumns: ["id"]
          },
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
          brand_id: string
          category_id: string
          contour_side_svg: string | null
          contour_top_svg: string | null
          created_at: string
          description: string
          eloshapes_url: string | null
          id: string
          is_active: boolean
          is_for_sale: boolean
          model_name: string
          slug: string
          spec_source_url: string | null
          specs: Json
          updated_at: string
        }
        Insert: {
          brand_id: string
          category_id: string
          contour_side_svg?: string | null
          contour_top_svg?: string | null
          created_at?: string
          description?: string
          eloshapes_url?: string | null
          id?: string
          is_active?: boolean
          is_for_sale?: boolean
          model_name: string
          slug: string
          spec_source_url?: string | null
          specs?: Json
          updated_at?: string
        }
        Update: {
          brand_id?: string
          category_id?: string
          contour_side_svg?: string | null
          contour_top_svg?: string | null
          created_at?: string
          description?: string
          eloshapes_url?: string | null
          id?: string
          is_active?: boolean
          is_for_sale?: boolean
          model_name?: string
          slug?: string
          spec_source_url?: string | null
          specs?: Json
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
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
          created_at: string
          full_name: string
          id: string
          is_active: boolean
          role: Database["public"]["Enums"]["app_role"]
          updated_at: string
          whatsapp: string | null
        }
        Insert: {
          created_at?: string
          full_name?: string
          id: string
          is_active?: boolean
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
          whatsapp?: string | null
        }
        Update: {
          created_at?: string
          full_name?: string
          id?: string
          is_active?: boolean
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
          whatsapp?: string | null
        }
        Relationships: []
      }
      store_closures: {
        Row: {
          date: string
          reason: string
        }
        Insert: {
          date: string
          reason?: string
        }
        Update: {
          date?: string
          reason?: string
        }
        Relationships: []
      }
      store_settings: {
        Row: {
          address: string
          cancel_cutoff_minutes: number
          id: boolean
          maps_url: string | null
          max_active_reservations: number
          max_days_ahead: number
          min_lead_minutes: number
          pickup_hours: number
          session_minutes: number
          updated_at: string
          whatsapp: string | null
        }
        Insert: {
          address: string
          cancel_cutoff_minutes?: number
          id?: boolean
          maps_url?: string | null
          max_active_reservations?: number
          max_days_ahead?: number
          min_lead_minutes?: number
          pickup_hours?: number
          session_minutes?: number
          updated_at?: string
          whatsapp?: string | null
        }
        Update: {
          address?: string
          cancel_cutoff_minutes?: number
          id?: boolean
          maps_url?: string | null
          max_active_reservations?: number
          max_days_ahead?: number
          min_lead_minutes?: number
          pickup_hours?: number
          session_minutes?: number
          updated_at?: string
          whatsapp?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      catalog_items: {
        Row: {
          brand_name: string | null
          brand_slug: string | null
          category_name: string | null
          category_slug: string | null
          created_at: string | null
          demo_status: string | null
          demo_variant_name: string | null
          demo_variant_sku: string | null
          group_name: string | null
          group_slug: string | null
          group_sort_order: number | null
          id: string | null
          image_path: string | null
          model_name: string | null
          price_max: number | null
          price_min: number | null
          slug: string | null
          specs: Json | null
          stock_total: number | null
          try_mode: Database["public"]["Enums"]["try_mode"] | null
          variant_attributes: Json | null
        }
        Relationships: []
      }
      counted_demo_units: {
        Row: {
          code: string | null
          id: string | null
          product_id: string | null
          rank: number | null
          status: Database["public"]["Enums"]["demo_unit_status"] | null
          variant_id: string | null
          variant_name: string | null
          variant_sku: string | null
        }
        Relationships: [
          {
            foreignKeyName: "demo_units_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "demo_units_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "variant_availability"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_variants_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "catalog_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_variants_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      variant_availability: {
        Row: {
          attributes: Json | null
          demo_status: string | null
          id: string | null
          image_path: string | null
          name: string | null
          price_idr: number | null
          product_id: string | null
          sku: string | null
          sort_order: number | null
          stock_qty: number | null
        }
        Relationships: [
          {
            foreignKeyName: "product_variants_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "catalog_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_variants_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      current_app_role: {
        Args: never
        Returns: Database["public"]["Enums"]["app_role"]
      }
      is_owner: { Args: never; Returns: boolean }
      is_staff: { Args: never; Returns: boolean }
      revalidate_category_values: {
        Args: { p_category_id: string }
        Returns: undefined
      }
      validate_spec_values: {
        Args: {
          p_category_id: string
          p_scope: Database["public"]["Enums"]["attribute_scope"]
          p_values: Json
        }
        Returns: undefined
      }
    }
    Enums: {
      app_role: "customer" | "operator" | "owner"
      attribute_scope: "product" | "variant"
      attribute_type: "number" | "enum" | "multi_enum" | "boolean" | "text"
      demo_area_kind: "desk" | "station" | "free"
      demo_unit_status: "available" | "in_use" | "servicing" | "retired"
      image_kind: "main" | "side" | "detail"
      try_mode: "unit" | "station" | "free"
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
      app_role: ["customer", "operator", "owner"],
      attribute_scope: ["product", "variant"],
      attribute_type: ["number", "enum", "multi_enum", "boolean", "text"],
      demo_area_kind: ["desk", "station", "free"],
      demo_unit_status: ["available", "in_use", "servicing", "retired"],
      image_kind: ["main", "side", "detail"],
      try_mode: ["unit", "station", "free"],
    },
  },
} as const
