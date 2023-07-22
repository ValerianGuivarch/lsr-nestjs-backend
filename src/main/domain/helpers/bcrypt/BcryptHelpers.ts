import { compare, hash } from 'bcrypt'
import { promisify } from 'util'

export const hashPromise = promisify<string, number, string>(hash)
export const comparePasswordPromise = promisify<string, string, boolean>(compare)
