import { Static, Type } from '@sinclair/typebox'
import { DateTimeSchema, EmailSchema, UUIDSchema } from '../../shared/schemas/common'

const PasswordSchema = Type.String({
  pattern: '^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$%^&*\\-]).{8,}$',
  minLength: 8,
  description: 'Min 8 chars, upper, lower, digit and special character required'
})

// Request
export const CreateUserSchema = Type.Object({
  first_name: Type.String({ minLength: 1, maxLength: 255 }),
  last_name:  Type.String({ minLength: 1, maxLength: 255 }),
  email:      EmailSchema,
  password:   PasswordSchema
})

export const UpdateUserSchema = Type.Object({
  first_name: Type.Optional(Type.String({ minLength: 1, maxLength: 255 })),
  last_name:  Type.Optional(Type.String({ minLength: 1, maxLength: 255 })),
  email:      Type.Optional(EmailSchema)
})

// Response
export const UserResponseSchema = Type.Object({
  id:         UUIDSchema,
  first_name: Type.String(),
  last_name:  Type.String(),
  email:      EmailSchema,
  created_at: DateTimeSchema,
  updated_at: DateTimeSchema
})

export const UsersListResponseSchema = Type.Array(UserResponseSchema)

export type CreateUserInput  = Static<typeof CreateUserSchema>
export type UpdateUserInput  = Static<typeof UpdateUserSchema>
export type UserResponse     = Static<typeof UserResponseSchema>
