import fp from 'fastify-plugin'
import { FastifyInstance } from 'fastify'
import { Knex } from 'knex'

export type TransactionType   = 'CREDIT' | 'DEBIT'
export type TransactionStatus = 'PENDING' | 'COMPLETED' | 'FAILED'

export interface Transaction {
  id:              string
  wallet_id:       string
  user_id:         string
  type:            TransactionType
  amount:          string          // DECIMAL(19,4) — string to prevent float drift
  idempotency_key: string | null
  description:     string | null
  status:          TransactionStatus
  created_at:      string
  updated_at:      string
}

export interface CreateTransactionInput {
  wallet_id:       string
  user_id:         string
  type:            TransactionType
  amount:          string
  idempotency_key: string | null
  description:     string | null
}

declare module 'fastify' {
  interface FastifyInstance {
    transactionRepository: ReturnType<typeof createTransactionRepository>
  }
}

function createTransactionRepository(fastify: FastifyInstance) {
  const { knex } = fastify

  return {
    async findByUserId(
      userId: string,
      opts: { type?: TransactionType; limit: number; offset: number }
    ): Promise<Transaction[]> {
      const query = knex<Transaction>('transactions')
        .where({ user_id: userId })
        .orderBy('created_at', 'desc')
        .limit(opts.limit)
        .offset(opts.offset)

      if (opts.type) {
        query.where({ type: opts.type })
      }

      return query
    },

    async create(data: CreateTransactionInput, trx: Knex.Transaction): Promise<string> {
      const id = crypto.randomUUID()
      await trx<Transaction>('transactions').insert({ id, status: 'COMPLETED', ...data })
      return id
    },

    async findByIdempotencyKey(key: string): Promise<Transaction | undefined> {
      return knex<Transaction>('transactions')
        .where({ idempotency_key: key })
        .whereIn('status', ['COMPLETED'])
        .first()
    },

    async findById(id: string): Promise<Transaction | undefined> {
      return knex<Transaction>('transactions').where({ id }).first()
    }
  }
}

export default fp(
  async (fastify: FastifyInstance) => {
    fastify.decorate('transactionRepository', createTransactionRepository(fastify))
  },
  { name: 'transaction-repository', dependencies: ['knex'] }
)
