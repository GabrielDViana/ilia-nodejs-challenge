import fp from 'fastify-plugin'
import fastifyJwt from '@fastify/jwt'
import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'

declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: { sub: string; email: string }
    user:    { sub: string; email: string }
  }
}

declare module 'fastify' {
  interface FastifyInstance {
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>
  }
}

export default fp(
  async (fastify: FastifyInstance) => {
    await fastify.register(fastifyJwt, {
      secret: fastify.config.JWT_SECRET,
      sign: {
        expiresIn: '1h',
        algorithm: 'HS256'
      }
    })

    fastify.decorate(
      'authenticate',
      async (request: FastifyRequest, reply: FastifyReply) => {
        try {
          await request.jwtVerify()
        } catch (err) {
          reply.send(err)
        }
      }
    )
  },
  { name: 'jwt', dependencies: ['env'] }
)
