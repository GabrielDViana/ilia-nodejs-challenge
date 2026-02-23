import fp from 'fastify-plugin'
import { FastifyInstance } from 'fastify'
import { Knex } from 'knex'

export interface Wallet {
  id:         string
  user_id:    string
  balance:    string
  version:    number
  created_at: string
  updated_at: string
}

declare module 'fastify' {
  interface FastifyInstance {
    walletRepository: ReturnType<typeof createWalletRepository>
  }
}

function createWalletRepository(fastify: FastifyInstance) {
  const { knex } = fastify

  return {
    async findByUserId(userId: string, trx?: Knex.Transaction): Promise<Wallet | undefined> {
      return (trx ?? knex)<Wallet>('wallets').where({ user_id: userId }).first()
    },

    async create(userId: string, trx?: Knex.Transaction): Promise<string> {
      const id = crypto.randomUUID()
      await (trx ?? knex)<Wallet>('wallets').insert({ id, user_id: userId })
      return id
    },

    async updateBalance(
      walletId: string,
      newBalance: string,
      currentVersion: number,
      trx: Knex.Transaction
    ): Promise<boolean> {
      const affected = await trx<Wallet>('wallets')
        .where({ id: walletId, version: currentVersion })
        .update({
          balance: newBalance,
          version: currentVersion + 1
        })

      return affected > 0
    }
  }
}

export default fp(
  async (fastify: FastifyInstance) => {
    fastify.decorate('walletRepository', createWalletRepository(fastify))
  },
  { name: 'wallet-repository', dependencies: ['knex'] }
)
