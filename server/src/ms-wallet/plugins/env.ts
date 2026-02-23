import fp from 'fastify-plugin'
import fastifyEnv from '@fastify/env'
import { FastifyInstance } from 'fastify'

declare module 'fastify' {
  interface FastifyInstance {
    config: {
      NODE_ENV: string
      WALLET_PORT: number
      MYSQL_HOST: string
      MYSQL_PORT: number
      MYSQL_USER: string
      MYSQL_PASSWORD: string
      MYSQL_DATABASE: string
      JWT_SECRET: string
      RATE_LIMIT_MAX: number
    }
  }
}

const schema = {
  type: 'object',
  required: [
    'MYSQL_HOST', 'MYSQL_PORT', 'MYSQL_USER', 'MYSQL_PASSWORD', 'MYSQL_DATABASE',
    'JWT_SECRET'
  ],
  properties: {
    NODE_ENV:       { type: 'string', default: 'development' },
    WALLET_PORT:    { type: 'number', default: 3001 },
    MYSQL_HOST:     { type: 'string', default: 'localhost' },
    MYSQL_PORT:     { type: 'number', default: 3306 },
    MYSQL_USER:     { type: 'string' },
    MYSQL_PASSWORD: { type: 'string' },
    MYSQL_DATABASE: { type: 'string' },
    JWT_SECRET:     { type: 'string', default: 'ILIACHALLENGE' },
    RATE_LIMIT_MAX: { type: 'number', default: 100 }
  }
}

export const autoConfig = {
  confKey: 'config',
  schema,
  dotenv: true,
  data: process.env
}

export default fp(
  async (fastify: FastifyInstance, opts) => {
    await fastify.register(fastifyEnv, opts)
  },
  { name: 'env' }
)
