import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox'
import { Type } from '@sinclair/typebox'
import { UUIDSchema } from '../../../../shared/schemas/common'
import { UpdateUserSchema, UserResponseSchema } from '../../../schemas/user'

const ParamsSchema = Type.Object({ id: UUIDSchema })

const plugin: FastifyPluginAsyncTypebox = async (fastify) => {

  // GET /users/:id
  // Returns public profile of the user identified by :id.
  fastify.get(
    '/',
    {
      onRequest: [fastify.authenticate],
      schema: {
        tags: ['users'],
        summary: 'Get a user by id',
        security: [{ bearerAuth: [] }],
        params: ParamsSchema,
        response: {
          200: UserResponseSchema,
          403: Type.Object({ message: Type.String() }),
          404: Type.Object({ message: Type.String() })
        }
      }
    },
    async (request, reply) => {
      const { id } = request.params

      if (request.user.sub !== id) {
        return reply.forbidden('Access denied')
      }

      const user = await fastify.usersRepository.findById(id)
      if (!user) return reply.notFound('User not found')

      return user
    }
  )

  // PATCH /users/:id
  // Partially updates user fields (first_name, last_name, email).
  fastify.patch(
    '/',
    {
      onRequest: [fastify.authenticate],
      schema: {
        tags: ['users'],
        summary: 'Update a user',
        security: [{ bearerAuth: [] }],
        params: ParamsSchema,
        body: UpdateUserSchema,
        response: {
          200: UserResponseSchema,
          403: Type.Object({ message: Type.String() }),
          404: Type.Object({ message: Type.String() }),
          409: Type.Object({ message: Type.String() })
        }
      }
    },
    async (request, reply) => {
      const { id } = request.params

      if (request.user.sub !== id) {
        return reply.forbidden('Access denied')
      }

      // If the new email is already taken by another user, return 409.
      if (request.body.email) {
        const existing = await fastify.usersRepository.findByEmailWithPassword(request.body.email)
        if (existing && existing.id !== id) {
          return reply.conflict('Email already in use')
        }
      }

      const updated = await fastify.usersRepository.update(id, request.body)
      if (!updated) return reply.notFound('User not found')

      return fastify.usersRepository.findById(id)
    }
  )

  // DELETE /users/:id
  // Deletes the authenticated user's account.
  fastify.delete(
    '/',
    {
      onRequest: [fastify.authenticate],
      schema: {
        tags: ['users'],
        summary: 'Delete a user',
        security: [{ bearerAuth: [] }],
        params: ParamsSchema,
        response: {
          204: Type.Null(),
          403: Type.Object({ message: Type.String() }),
          404: Type.Object({ message: Type.String() })
        }
      }
    },
    async (request, reply) => {
      const { id } = request.params

      if (request.user.sub !== id) {
        return reply.forbidden('Access denied')
      }

      const deleted = await fastify.usersRepository.delete(id)
      if (!deleted) return reply.notFound('User not found')

      reply.status(204)
    }
  )
}

export default plugin
