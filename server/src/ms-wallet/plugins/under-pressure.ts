import fp from 'fastify-plugin'
import { FastifyInstance } from 'fastify'
import fastifyUnderPressure from '@fastify/under-pressure'

export const autoConfig = (fastify: FastifyInstance) => ({
  maxEventLoopDelay: 1000,
  maxHeapUsedBytes: 100_000_000,
  maxRssBytes: 1_000_000_000,
  maxEventLoopUtilization: 0.98,
  message: 'Server under pressure — retry later',
  retryAfter: 50,
  healthCheck: async () => {
    await fastify.knex.raw('SELECT 1')
    return true
  },
  healthCheckInterval: 5000
})

export default fp(fastifyUnderPressure, { dependencies: ['knex'] })
