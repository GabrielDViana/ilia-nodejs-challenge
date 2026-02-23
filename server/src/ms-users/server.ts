import Fastify from 'fastify'
import fp from 'fastify-plugin'
import closeWithGrace from 'close-with-grace'
import usersApp from './app'

const app = Fastify({
  logger: { level: process.env.LOG_LEVEL ?? 'info' }
})

async function init() {
  app.register(fp(usersApp))

  await app.ready()

  const port = Number(app.config.USERS_PORT ?? 3002)

  await app.listen({ port, host: '0.0.0.0' })
}

closeWithGrace({ delay: 1000 }, async ({ err }) => {
  if (err) app.log.error(err)
  await app.close()
})

init().catch((err) => {
  console.error(err)
  process.exit(1)
})
