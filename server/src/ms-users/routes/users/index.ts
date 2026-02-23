import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox'
import { Type } from '@sinclair/typebox'
import {
  CreateUserSchema,
  UserResponseSchema,
  UsersListResponseSchema
} from '../../schemas/user'

const plugin: FastifyPluginAsyncTypebox = async (fastify) => {
  
  // GET /users
  // Returns all users (public fields only).
  fastify.get(
    '/',
    {
      onRequest: [fastify.authenticate],
      schema: {
        tags: ['users'],
        summary: 'List all users',
        security: [{ bearerAuth: [] }],
        response: {
          200: UsersListResponseSchema
        }
      }
    },
    async () => {
      return fastify.usersRepository.findAll()
    }
  )

  // POST /users
  // Creates a new user account.
  fastify.post(
    '/',
    {
      schema: {
        tags: ['users'],
        summary: 'Create a new user',
        body: CreateUserSchema,
        response: {
          201: UserResponseSchema,
          409: Type.Object({ message: Type.String() })
        }
      }
    },
    async (request, reply) => {
      const { first_name, last_name, email, password } = request.body

      const existing = await fastify.usersRepository.findByEmailWithPassword(email)
      if (existing) {
        return reply.conflict('Email already in use')
      }

      const hashedPassword = await fastify.passwordManager.hash(password)

      const id = await fastify.usersRepository.create({
        first_name,
        last_name,
        email,
        password: hashedPassword
      })

      reply.status(201)
      return fastify.usersRepository.findById(id)
    }
  )
}

export default plugin
