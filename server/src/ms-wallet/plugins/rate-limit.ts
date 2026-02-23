import fastifyRateLimit from '@fastify/rate-limit'
import { FastifyInstance } from 'fastify'

export const autoConfig = (fastify: FastifyInstance) => ({
  max: fastify.config.RATE_LIMIT_MAX,
  timeWindow: '1 minute'
})

export default fastifyRateLimit
