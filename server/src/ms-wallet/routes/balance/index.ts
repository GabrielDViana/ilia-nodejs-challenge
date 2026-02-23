import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox'
import { Type } from '@sinclair/typebox'
import { BalanceResponseSchema } from '../../schemas/balance'

const plugin: FastifyPluginAsyncTypebox = async (fastify) => {
  
  // GET /balance
  // Returns the stored balance for the authenticated user's wallet.
  fastify.get(
    '/',
    {
      onRequest: [fastify.authenticate],
      schema: {
        tags: ['balance'],
        summary: 'Get the current wallet balance for the authenticated user',
        security: [{ bearerAuth: [] }],
        response: {
          200: BalanceResponseSchema,
          404: Type.Object({ message: Type.String() })
        }
      }
    },
    async (request, reply) => {
      const wallet = await fastify.walletRepository.findByUserId(request.user.sub)

      if (!wallet) {
        return reply.notFound('Wallet not found — make a CREDIT transaction first')
      }

      return { amount: wallet.balance }
    }
  )
}

export default plugin
