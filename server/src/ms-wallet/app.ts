import path from 'node:path'
import fastifyAutoload from '@fastify/autoload'
import { FastifyError, FastifyInstance, FastifyPluginOptions } from 'fastify'

export default async function walletApp(
  fastify: FastifyInstance,
  opts: FastifyPluginOptions
) {
  delete opts.skipOverride

  await fastify.register(fastifyAutoload, {
    dir: path.join(__dirname, 'plugins'),
    options: {}
  })

  fastify.register(fastifyAutoload, {
    dir: path.join(__dirname, 'routes'),
    autoHooks: true,
    cascadeHooks: true,
    options: { ...opts }
  })

  fastify.setErrorHandler((err: FastifyError, request, reply) => {
    fastify.log.error({ err, method: request.method, url: request.url }, 'Unhandled error')
    reply.code(err.statusCode ?? 500)
    return { message: err.statusCode && err.statusCode < 500 ? err.message : 'Internal Server Error' }
  })

  fastify.setNotFoundHandler(
    { preHandler: fastify.rateLimit({ max: 5, timeWindow: 500 }) },
    (_request, reply) => reply.code(404).send({ message: 'Not Found' })
  )
}
