import { z } from 'zod'

export const emailSchema = z.string().email('Enter a valid email address')

export const passwordSchema = z.string().min(8, 'Password must be at least 8 characters')

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
})

export const waybillSchema = z.object({
  recipientName: z.string().min(1, 'Recipient name is required'),
  recipientAddress: z.string().min(1, 'Recipient address is required'),
  recipientPhone: z.string().min(1, 'Recipient phone is required'),
  origin: z.string().min(1, 'Origin is required'),
  destination: z.string().min(1, 'Destination is required'),
  weight: z.string().refine(v => !isNaN(parseFloat(v)) && parseFloat(v) > 0, 'Weight must be a positive number'),
  dimensions: z.string().optional(),
  serviceType: z.string().optional(),
})

export const userSchema = z.object({
  email: emailSchema,
  name: z.string().min(1, 'Name is required'),
  password: passwordSchema,
  role: z.enum(['SHIPPER', 'COURIER', 'OPS', 'ADMIN'], { message: 'Select a valid role' }),
})

export const carrierSchema = z.object({
  name: z.string().min(1, 'Carrier name is required'),
  code: z.string().min(1, 'Carrier code is required'),
  contactEmail: z.string().email('Enter a valid email').or(z.literal('')),
  contactPhone: z.string().optional(),
  apiEndpoint: z.string().url('Enter a valid URL').or(z.literal('')),
})

export interface FieldErrors {
  [key: string]: string | undefined
}

export function validate<T>(schema: z.ZodSchema<T>, data: unknown): { data?: T; errors: FieldErrors } {
  const result = schema.safeParse(data)
  if (result.success) {
    return { data: result.data, errors: {} }
  }
  const errors: FieldErrors = {}
  for (const issue of result.error.issues) {
    const path = issue.path.join('.')
    if (!errors[path]) {
      errors[path] = issue.message
    }
  }
  return { errors }
}

export function validateField<T>(schema: z.ZodSchema<T>, value: unknown): string | undefined {
  const result = schema.safeParse(value)
  if (result.success) return undefined
  return result.error.issues[0]?.message
}
