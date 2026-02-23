import fp from 'fastify-plugin'
import { scrypt, timingSafeEqual, randomBytes } from 'node:crypto'

declare module 'fastify' {
  interface FastifyInstance {
    passwordManager: {
      hash:    (value: string) => Promise<string>
      compare: (value: string, hash: string) => Promise<boolean>
    }
  }
}

const KEYLEN          = 32
const COST            = 65536
const BLOCK_SIZE      = 8
const PARALLELIZATION = 2
const MAXMEM          = 128 * COST * BLOCK_SIZE * 2

async function hash(value: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const salt = randomBytes(16)
    scrypt(value, salt, KEYLEN, { cost: COST, blockSize: BLOCK_SIZE, parallelization: PARALLELIZATION, maxmem: MAXMEM }, (err, key) => {
      if (err) return reject(err)
      resolve(`${salt.toString('hex')}.${key.toString('hex')}`)
    })
  })
}

async function compare(value: string, stored: string): Promise<boolean> {
  const [saltHex, keyHex] = stored.split('.')
  const salt      = Buffer.from(saltHex, 'hex')
  const storedKey = Buffer.from(keyHex,  'hex')

  return new Promise((resolve) => {
    scrypt(value, salt, KEYLEN, { cost: COST, blockSize: BLOCK_SIZE, parallelization: PARALLELIZATION, maxmem: MAXMEM }, (err, key) => {
      if (err) {
        timingSafeEqual(storedKey, storedKey)
        return resolve(false)
      }
      resolve(timingSafeEqual(key, storedKey))
    })
  })
}

export default fp(
  async (fastify) => {
    fastify.decorate('passwordManager', { hash, compare })
  },
  { name: 'password-manager' }
)
