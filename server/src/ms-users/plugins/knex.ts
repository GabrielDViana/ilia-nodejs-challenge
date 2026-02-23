import fp from 'fastify-plugin'
import { FastifyInstance } from 'fastify'
import knex, { Knex } from 'knex'

declare module 'fastify' {
  interface FastifyInstance {
    knex: Knex
  }
}

export const autoConfig = (fastify: FastifyInstance) => ({
  client: 'mysql2',
  connection: {
    host:     fastify.config.MYSQL_HOST,
    port:     Number(fastify.config.MYSQL_PORT),
    user:     fastify.config.MYSQL_USER,
    password: fastify.config.MYSQL_PASSWORD,
    database: fastify.config.MYSQL_DATABASE
  },
  pool: { min: 2, max: 10 }
})

export default fp(
  async (fastify: FastifyInstance, opts) => {
    fastify.decorate('knex', knex(opts))
    fastify.addHook('onClose', (instance) => instance.knex.destroy())
  },
  { name: 'knex', dependencies: ['env'] }
)
