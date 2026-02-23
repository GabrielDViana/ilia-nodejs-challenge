import { Type } from '@sinclair/typebox'

export const UUIDSchema = Type.String({ format: 'uuid' })

export const EmailSchema = Type.String({
  format: 'email',
  minLength: 1,
  maxLength: 255
})

export const StringSchema = Type.String({ minLength: 1, maxLength: 255 })

export const DateTimeSchema = Type.String({ format: 'date-time' })

export const AmountSchema = Type.String({
  pattern: '^\\d+(\\.\\d{1,4})?$',
  description: 'Positive decimal number with up to 4 decimal places (e.g. "100.00")'
})

export const PaginationQuerySchema = Type.Object({
  page:  Type.Integer({ minimum: 1, default: 1 }),
  limit: Type.Integer({ minimum: 1, maximum: 100, default: 20 })
})
