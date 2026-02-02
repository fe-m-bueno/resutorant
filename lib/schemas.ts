import { z } from 'zod'

// Venue Types Enum
export const VENUE_TYPES = [
  'restaurante',
  'café',
  'bar',
  'lanchonete',
  'delivery',
  'mercado',
  'bistrô',
  'izakaya',
  'rotisseria',
  'padaria',
  'pub',
] as const

export const venueTypeSchema = z.enum(VENUE_TYPES)

// Location Schema
export const locationSchema = z.object({
  city: z.string().optional(),
  neighborhood: z.string().optional(),
  address: z.string().optional(),
  country: z.string().optional(),
})

// Venue Schema
export const venueSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  type: venueTypeSchema,
  location: locationSchema,
  google_place_id: z.string().optional(),
})

export type VenueFormData = z.infer<typeof venueSchema>

// Review Schema
export const reviewSchema = z.object({
  venue_id: z.string().uuid('Selecione um local'),
  rating: z
    .number()
    .min(0.5, 'Nota mínima é 0.5')
    .max(5, 'Nota máxima é 5.0')
    .refine((val) => val % 0.5 === 0, 'Nota deve ser múltiplo de 0.5'),
  text_review: z.string().optional(),
  visited_at: z.string().optional(),
  is_private: z.boolean().default(false),
  tag_ids: z.array(z.string().uuid()).optional(),
})

export type ReviewFormData = z.infer<typeof reviewSchema>

// Create Review with New Venue
export const createLogSchema = z.object({
  // Venue info (can be existing or new)
  venue_id: z.string().uuid().optional(),
  venue_name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres').optional(),
  venue_type: venueTypeSchema.optional(),
  venue_location: locationSchema.optional(),
  
  // Review info
  rating: z
    .number()
    .min(0.5, 'Nota mínima é 0.5')
    .max(5, 'Nota máxima é 5.0')
    .refine((val) => val % 0.5 === 0, 'Nota deve ser múltiplo de 0.5'),
  text_review: z.string().optional(),
  visited_at: z.string().optional(),
  is_private: z.boolean().default(false),
  tag_ids: z.array(z.string().uuid()).optional(),
  cuisine_ids: z.array(z.string().uuid()).optional(),
}).refine(
  (data) => data.venue_id || data.venue_name,
  { message: 'Selecione ou crie um local', path: ['venue_name'] }
)

export type CreateLogFormData = z.infer<typeof createLogSchema>

// Profile Schema
export const profileSchema = z.object({
  username: z
    .string()
    .min(3, 'Username deve ter pelo menos 3 caracteres')
    .max(30, 'Username deve ter no máximo 30 caracteres')
    .regex(/^[a-zA-Z0-9_]+$/, 'Apenas letras, números e underscore'),
  bio: z.string().max(160, 'Bio deve ter no máximo 160 caracteres').optional(),
  website: z.string().url('URL inválida').optional().or(z.literal('')),
  avatar_url: z.string().url().optional(),
})

export type ProfileFormData = z.infer<typeof profileSchema>

// Tag Schema
export const tagSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório').max(30, 'Nome muito longo'),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Cor inválida').default('#6366f1'),
})

export type TagFormData = z.infer<typeof tagSchema>

// List Schema
export const listSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório').max(50, 'Nome muito longo'),
  description: z.string().max(200, 'Descrição muito longa').optional(),
  icon: z.string().optional(),
  is_public: z.boolean().default(true),
})

export type ListFormData = z.infer<typeof listSchema>

