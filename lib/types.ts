export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      cuisine_types: {
        Row: {
          created_at: string
          created_by: string | null
          icon: string | null
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          icon?: string | null
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          icon?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      likes: {
        Row: {
          created_at: string
          id: string
          list_id: string | null
          review_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          list_id?: string | null
          review_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          list_id?: string | null
          review_id?: string | null
          user_id?: string
        }
        Relationships: []
      }
      list_venues: {
        Row: {
          added_at: string
          list_id: string
          note: string | null
          venue_id: string
        }
        Insert: {
          added_at?: string
          list_id: string
          note?: string | null
          venue_id: string
        }
        Update: {
          added_at?: string
          list_id?: string
          note?: string | null
          venue_id?: string
        }
        Relationships: []
      }
      lists: {
        Row: {
          created_at: string
          description: string | null
          icon: string | null
          id: string
          is_default: boolean
          is_public: boolean
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          is_default?: boolean
          is_public?: boolean
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          is_default?: boolean
          is_public?: boolean
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string
          id: string
          updated_at: string
          username: string | null
          website: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          id: string
          updated_at?: string
          username?: string | null
          website?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          id?: string
          updated_at?: string
          username?: string | null
          website?: string | null
        }
        Relationships: []
      }
      review_photos: {
        Row: {
          caption: string | null
          created_at: string
          id: string
          order_index: number | null
          review_id: string
          storage_path: string
        }
        Insert: {
          caption?: string | null
          created_at?: string
          id?: string
          order_index?: number | null
          review_id: string
          storage_path: string
        }
        Update: {
          caption?: string | null
          created_at?: string
          id?: string
          order_index?: number | null
          review_id?: string
          storage_path?: string
        }
        Relationships: []
      }
      review_tags: {
        Row: {
          review_id: string
          tag_id: string
        }
        Insert: {
          review_id: string
          tag_id: string
        }
        Update: {
          review_id?: string
          tag_id?: string
        }
        Relationships: []
      }
      reviews: {
        Row: {
          created_at: string
          id: string
          is_private: boolean
          rating: number
          text_review: string | null
          updated_at: string
          user_id: string
          venue_id: string
          visited_at: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          is_private?: boolean
          rating: number
          text_review?: string | null
          updated_at?: string
          user_id: string
          venue_id: string
          visited_at?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          is_private?: boolean
          rating?: number
          text_review?: string | null
          updated_at?: string
          user_id?: string
          venue_id?: string
          visited_at?: string | null
        }
        Relationships: []
      }
      tags: {
        Row: {
          color: string | null
          created_at: string
          created_by: string | null
          id: string
          name: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          name: string
        }
        Update: {
          color?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      venue_cuisines: {
        Row: {
          cuisine_id: string
          venue_id: string
        }
        Insert: {
          cuisine_id: string
          venue_id: string
        }
        Update: {
          cuisine_id?: string
          venue_id?: string
        }
        Relationships: []
      }
      venues: {
        Row: {
          created_at: string
          created_by: string | null
          google_place_id: string | null
          id: string
          location: Json
          name: string
          type: VenueType
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          google_place_id?: string | null
          id?: string
          location?: Json
          name: string
          type?: VenueType
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          google_place_id?: string | null
          id?: string
          location?: Json
          name?: string
          type?: VenueType
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: {
      venue_type: VenueType
    }
    CompositeTypes: Record<string, never>
  }
}

export type VenueType =
  | 'restaurante'
  | 'café'
  | 'bar'
  | 'lanchonete'
  | 'delivery'
  | 'mercado'
  | 'bistrô'
  | 'izakaya'
  | 'rotisseria'
  | 'padaria'
  | 'pub'

// Convenience types
export type Profile = Database['public']['Tables']['profiles']['Row']
export type Venue = Database['public']['Tables']['venues']['Row']
export type Review = Database['public']['Tables']['reviews']['Row']
export type Tag = Database['public']['Tables']['tags']['Row']
export type CuisineType = Database['public']['Tables']['cuisine_types']['Row']
export type List = Database['public']['Tables']['lists']['Row']
export type Like = Database['public']['Tables']['likes']['Row']

// Extended types with relations
export type ReviewWithVenue = Review & {
  venue: Venue
  tags?: Tag[]
  photos?: Database['public']['Tables']['review_photos']['Row'][]
}

export type VenueWithCuisines = Venue & {
  cuisines?: CuisineType[]
}

export type ListWithVenues = List & {
  venues?: VenueWithCuisines[]
}
