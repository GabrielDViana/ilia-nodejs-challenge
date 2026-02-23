import { Static, Type } from '@sinclair/typebox'
import { AmountSchema, DateTimeSchema, UUIDSchema } from '../../shared/schemas/common'

export const TransactionTypeSchema = Type.Union([
  Type.Literal('CREDIT'),
  Type.Literal('DEBIT')
])

export const TransactionStatusSchema = Type.Union([
  Type.Literal('PENDING'),
  Type.Literal('COMPLETED'),
  Type.Literal('FAILED')
])

// Request
export const CreateTransactionSchema = Type.Object({
  type:        TransactionTypeSchema,
  amount:      AmountSchema,
  description: Type.Optional(Type.String({ maxLength: 500 }))
})

// Response
export const TransactionSchema = Type.Object({
  id:              UUIDSchema,
  wallet_id:       UUIDSchema,
  user_id:         UUIDSchema,
  type:            TransactionTypeSchema,
  amount:          AmountSchema,
  idempotency_key: Type.Union([Type.String(), Type.Null()]),
  description:     Type.Union([Type.String(), Type.Null()]),
  status:          TransactionStatusSchema,
  created_at:      DateTimeSchema,
  updated_at:      DateTimeSchema
})

export const TransactionsListSchema = Type.Array(TransactionSchema)

export const ListTransactionsQuerySchema = Type.Object({
  type:   Type.Optional(TransactionTypeSchema),
  page:   Type.Integer({ minimum: 1, default: 1 }),
  limit:  Type.Integer({ minimum: 1, maximum: 100, default: 20 })
})

export type CreateTransactionInput  = Static<typeof CreateTransactionSchema>
export type TransactionResponse     = Static<typeof TransactionSchema>
export type ListTransactionsQuery   = Static<typeof ListTransactionsQuerySchema>
