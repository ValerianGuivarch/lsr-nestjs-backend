/* eslint-disable no-magic-numbers */
import { getSchemaPath } from '@nestjs/swagger'
import { ContentObject, ReferenceObject, SchemaObject } from '@nestjs/swagger/dist/interfaces/open-api-spec.interface'

export function generateResponseContent<T>(p: {
  // eslint-disable-next-line @typescript-eslint/ban-types
  types: Function | Function[]
  examples: Record<string, T>
}): ContentObject {
  if (typeof p.types === 'function') {
    p.types = [p.types]
  }
  return {
    'application/json': {
      schema:
        p.types.length === 1
          ? { $ref: getSchemaPath(p.types[0]) }
          : { anyOf: p.types.map((ref) => ({ $ref: getSchemaPath(ref) })) },
      examples: Object.assign(
        {},
        ...Object.entries(p.examples).map(([name, example]) => {
          return {
            [name]: {
              value: example
            }
          }
        })
      )
    }
  }
}

export function generateRequestSchemasAndExamples<T>(p: {
  // eslint-disable-next-line @typescript-eslint/ban-types
  types: Function | Function[]
  examples: Record<string, T>
}): {
  schema: SchemaObject | ReferenceObject
  examples: Record<string, T>
} {
  if (typeof p.types === 'function') {
    p.types = [p.types]
  }
  return {
    schema:
      p.types.length === 1
        ? { $ref: getSchemaPath(p.types[0]) }
        : { oneOf: p.types.map((ref) => ({ $ref: getSchemaPath(ref) })) },
    examples: Object.assign(
      {},
      ...Object.entries(p.examples).map(([name, exaample]) => {
        return {
          [name]: {
            value: exaample
          }
        }
      })
    )
  }
}
