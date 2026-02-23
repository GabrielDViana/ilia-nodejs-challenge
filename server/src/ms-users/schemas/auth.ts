import { Static, Type } from '@sinclair/typebox'
import { EmailSchema } from '../../shared/schemas/common'
import { UserResponseSchema } from './user'

// Request
export const AuthRequestSchema = Type.Object({
  email:    EmailSchema,
  password: Type.String({ minLength: 1 })
})

// Response
export const AuthResponseSchema = Type.Object({
  user:         UserResponseSchema,
  access_token: Type.String()
})

export type AuthRequest  = Static<typeof AuthRequestSchema>
export type AuthResponse = Static<typeof AuthResponseSchema>
