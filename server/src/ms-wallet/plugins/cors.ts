import cors, { FastifyCorsOptions } from '@fastify/cors'

export const autoConfig: FastifyCorsOptions = {
  methods: ['GET', 'POST', 'OPTIONS']
}

export default cors
