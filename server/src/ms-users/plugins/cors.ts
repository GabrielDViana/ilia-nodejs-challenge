import cors, { FastifyCorsOptions } from '@fastify/cors'

export const autoConfig: FastifyCorsOptions = {
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS']
}

export default cors
