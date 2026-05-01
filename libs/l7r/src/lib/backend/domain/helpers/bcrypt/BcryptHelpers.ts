import { compare, hash } from 'bcryptjs'
import { promisify } from 'util'

export const hashPromise = promisify<string, number, string>(hash)
export const comparePasswordPromise = promisify<string, string, boolean>(compare)
