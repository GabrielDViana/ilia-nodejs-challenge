import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox'
import { Type } from '@sinclair/typebox'
import { AuthRequestSchema, AuthResponseSchema } from '../../schemas/auth'

const plugin: FastifyPluginAsyncTypebox = async (fastify) => {
  
  // POST /auth
  // Authenticates a user and returns a signed JWT.
  fastify.post(
    '/',
    {
      schema: {
        tags: ['auth'],
        summary: 'Authenticate and receive a JWT',
        body: AuthRequestSchema,
        response: {
          200: AuthResponseSchema,
          401: Type.Object({ message: Type.String() })
        }
      }
    },
    async (request, reply) => {
      const { email, password } = request.body

      const user = await fastify.usersRepository.findByEmailWithPassword(email)

      const INVALID_CREDENTIALS = 'Invalid credentials'

      if (!user) {
        return reply.unauthorized(INVALID_CREDENTIALS)
      }

      const valid = await fastify.passwordManager.compare(password, user.password)
      if (!valid) {
        return reply.unauthorized(INVALID_CREDENTIALS)
      }

      const access_token = fastify.jwt.sign({ sub: user.id, email: user.email })

      return {
        user: {
          id:         user.id,
          first_name: user.first_name,
          last_name:  user.last_name,
          email:      user.email,
          created_at: user.created_at,
          updated_at: user.updated_at
        },
        access_token
      }
    }
  )
}

export default plugin
