import { Static, Type } from '@sinclair/typebox'
import { AmountSchema } from '../../shared/schemas/common'

export const BalanceResponseSchema = Type.Object({
  amount: AmountSchema
})

export type BalanceResponse = Static<typeof BalanceResponseSchema>
