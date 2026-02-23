import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox'
import { Type } from '@sinclair/typebox'
import {
  CreateTransactionSchema,
  ListTransactionsQuerySchema,
  TransactionSchema,
  TransactionsListSchema
} from '../../schemas/transaction'
import { hashBody } from '../../plugins/idempotency'

const MAX_OPTIMISTIC_RETRIES = 3

const plugin: FastifyPluginAsyncTypebox = async (fastify) => {
  
  // GET /transactions
  // Returns a paginated list of the authenticated user's transactions.
   
  fastify.get(
    '/',
    {
      onRequest: [fastify.authenticate],
      schema: {
        tags: ['transactions'],
        summary: 'List transactions for the authenticated user',
        security: [{ bearerAuth: [] }],
        querystring: ListTransactionsQuerySchema,
        response: {
          200: TransactionsListSchema
        }
      }
    },
    async (request) => {
      const { type, page, limit } = request.query
      const offset = (page - 1) * limit

      return fastify.transactionRepository.findByUserId(request.user.sub, { type, limit, offset })
    }
  )

  // POST /transactions
  // Credits or debits the authenticated user's wallet.
  
  fastify.post(
    '/',
    {
      onRequest: [fastify.authenticate],
      schema: {
        tags: ['transactions'],
        summary: 'Create a CREDIT or DEBIT transaction',
        security: [{ bearerAuth: [] }],
        headers: Type.Object({
          'idempotency-key': Type.Optional(Type.String({ maxLength: 255 }))
        }),
        body: CreateTransactionSchema,
        response: {
          201: TransactionSchema,
          400: Type.Object({ message: Type.String() }),
          404: Type.Object({ message: Type.String() }),
          409: Type.Object({ message: Type.String() }),
          422: Type.Object({ message: Type.String() }),
          503: Type.Object({ message: Type.String() })
        }
      }
    },
    async (request, reply) => {
      const userId        = request.user.sub
      const { type, amount, description } = request.body
      const idempotencyKey = (request.headers as Record<string, string>)['idempotency-key'] ?? null

      // Idempotency check
      if (idempotencyKey) {
        try {
          const cached = await fastify.idempotency.lookup(
            idempotencyKey,
            userId,
            hashBody(request.body)
          )
          if (cached) {
            return reply
              .status(cached.response_status)
              .send(cached.response_body)
          }
        } catch (err: unknown) {
          const e = err as { statusCode?: number; message?: string }
          return reply
            .status(e.statusCode ?? 422)
            .send({ message: e.message ?? 'Unprocessable Entity' })
        }
      }

      // Optimistic-lock retry loop
      for (let attempt = 0; attempt < MAX_OPTIMISTIC_RETRIES; attempt++) {
        const trx = await fastify.knex.transaction()

        try {
          // Read current wallet state.
          let wallet = await fastify.walletRepository.findByUserId(userId, trx)

          // Auto-create wallet on first CREDIT.
          if (!wallet) {
            if (type === 'DEBIT') {
              await trx.rollback()
              return reply.notFound('Wallet not found — make a CREDIT first to initialise it')
            }
            const walletId = await fastify.walletRepository.create(userId, trx)
            wallet = await fastify.walletRepository.findByUserId(userId, trx)
            if (!wallet) throw new Error(`Failed to create wallet for user ${userId}`)
          }

          // Insufficient funds check
          const currentBalance = parseFloat(wallet.balance)
          const txAmount       = parseFloat(amount)

          if (type === 'DEBIT' && currentBalance < txAmount) {
            await trx.rollback()
            return reply.badRequest('Insufficient funds')
          }

          // Compute new balance
          const newBalance = type === 'CREDIT'
            ? currentBalance + txAmount
            : currentBalance - txAmount

          // Guard: should be impossible due to the check above, but belt-and-suspenders.
          if (newBalance < 0) {
            await trx.rollback()
            return reply.badRequest('Insufficient funds')
          }

          // Atomic write (optimistic lock)
          const updated = await fastify.walletRepository.updateBalance(
            wallet.id,
            newBalance.toFixed(4),
            wallet.version,
            trx
          )

          if (!updated) {
            // Another process updated the wallet between our read and write.
            // Roll back and retry.
            await trx.rollback()
            continue
          }

          // Insert immutable ledger entry
          const transactionId = await fastify.transactionRepository.create(
            {
              wallet_id:       wallet.id,
              user_id:         userId,
              type,
              amount,
              idempotency_key: idempotencyKey,
              description:     description ?? null
            },
            trx
          )

          await trx.commit()

          // Fetch the full row for the response (created_at is DB-generated).
          const transaction = await fastify.transactionRepository.findById(transactionId)

          // Store idempotency result
          if (idempotencyKey && transaction) {
            await fastify.idempotency.store(
              idempotencyKey,
              userId,
              request,
              201,
              transaction
            ).catch((err) => {
              // Non-fatal: idempotency store failure shouldn't fail the request.
              fastify.log.warn({ err, idempotencyKey }, 'Failed to store idempotency result')
            })
          }

          reply.status(201)
          return transaction

        } catch (err) {
          await trx.rollback()
          throw err
        }
      }

      // All retries exhausted — the wallet is under heavy concurrent load.
      return reply.serviceUnavailable(
        'Transaction temporarily unavailable due to high concurrency — please retry'
      )
    }
  )
}

export default plugin
