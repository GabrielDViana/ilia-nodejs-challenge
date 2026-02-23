import fp from 'fastify-plugin'
import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'
import { createHash } from 'node:crypto'

export interface IdempotencyRecord {
  key:             string
  user_id:         string
  request_method:  string
  request_path:    string
  request_hash:    string
  response_status: number
  response_body:   object
  created_at:      string
  expires_at:      string
}

declare module 'fastify' {
  interface FastifyInstance {
    idempotency: {
      lookup: (
        key: string,
        userId: string,
        requestHash: string
      ) => Promise<IdempotencyRecord | null>
      store: (
        key: string,
        userId: string,
        request: FastifyRequest,
        responseStatus: number,
        responseBody: object
      ) => Promise<void>
    }
  }
}

export function hashBody(body: unknown): string {
  const canonical = JSON.stringify(body ?? {})
  return createHash('sha256').update(canonical).digest('hex')
}

export default fp(
  async (fastify: FastifyInstance) => {
    const { knex } = fastify

    fastify.decorate('idempotency', {
      async lookup(key: string, userId: string, requestHash: string) {
        const record = await knex<IdempotencyRecord>('idempotency_keys')
          .where({ key, user_id: userId })
          .where('expires_at', '>', knex.fn.now())
          .first()

        if (!record) return null

        // Key reuse with a different body — surface as a detectable error.
        if (record.request_hash !== requestHash) {
          throw Object.assign(
            new Error('Idempotency key reused with a different request body'),
            { statusCode: 422 }
          )
        }

        return record
      },

      async store(
        key: string,
        userId: string,
        request: FastifyRequest,
        responseStatus: number,
        responseBody: object
      ) {
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000)
          .toISOString()
          .slice(0, 19)
          .replace('T', ' ')

        await knex<IdempotencyRecord>('idempotency_keys')
          .insert({
            key,
            user_id:         userId,
            request_method:  request.method,
            request_path:    request.url,
            request_hash:    hashBody(request.body),
            response_status: responseStatus,
            response_body:   JSON.stringify(responseBody),
            expires_at:      expiresAt
          })
          .onConflict('key')
          .ignore()
      }
    })
  },
  { name: 'idempotency', dependencies: ['knex'] }
)
