import fp from 'fastify-plugin'
import { FastifyInstance } from 'fastify'

export interface User {
  id:         string
  first_name: string
  last_name:  string
  email:      string
  password:   string
  created_at: string
  updated_at: string
}

export type UserPublic = Omit<User, 'password'>

export type CreateUserInput = Pick<User, 'first_name' | 'last_name' | 'email' | 'password'>
export type UpdateUserInput = Partial<Pick<User, 'first_name' | 'last_name' | 'email' | 'password'>>

declare module 'fastify' {
  interface FastifyInstance {
    usersRepository: ReturnType<typeof createUsersRepository>
  }
}

function createUsersRepository(fastify: FastifyInstance) {
  const { knex } = fastify

  return {
    async findAll(): Promise<UserPublic[]> {
      return knex<User>('users').select('id', 'first_name', 'last_name', 'email', 'created_at', 'updated_at')
    },

    async findById(id: string): Promise<UserPublic | undefined> {
      return knex<User>('users')
        .select('id', 'first_name', 'last_name', 'email', 'created_at', 'updated_at')
        .where({ id })
        .first()
    },

    async findByEmailWithPassword(email: string): Promise<User | undefined> {
      return knex<User>('users').where({ email }).first()
    },

    async create(data: CreateUserInput): Promise<string> {
      const id = crypto.randomUUID()
      await knex<User>('users').insert({ id, ...data })
      return id
    },

    async update(id: string, data: UpdateUserInput): Promise<boolean> {
      const affected = await knex<User>('users').where({ id }).update(data)
      return affected > 0
    },

    async delete(id: string): Promise<boolean> {
      const affected = await knex<User>('users').where({ id }).delete()
      return affected > 0
    }
  }
}

export default fp(
  async (fastify: FastifyInstance) => {
    fastify.decorate('usersRepository', createUsersRepository(fastify))
  },
  { name: 'users-repository', dependencies: ['knex'] }
)
