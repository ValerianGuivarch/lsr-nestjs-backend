/* eslint-disable no-magic-numbers */
import { PageOrder } from '../../../../domain/models/utils/pages/PageOrder'
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
              value: { example }
            }
          }
        })
      )
    }
  }
}
export function generatePageResponseContent<T>(p: {
  // eslint-disable-next-line @typescript-eslint/ban-types
  types: Function | Function[]
  examples: Record<string, T | T[]>
}): ContentObject {
  if (typeof p.types === 'function') {
    p.types = [p.types]
  }
  return {
    'application/json': {
      schema: {
        type: 'object',
        properties: {
          items: {
            type: 'array',
            items:
              p.types.length === 1
                ? { $ref: getSchemaPath(p.types[0]) }
                : { anyOf: p.types.map((ref) => ({ $ref: getSchemaPath(ref) })) }
          },
          total: { type: 'number' },
          page: { type: 'number' },
          pages: { type: 'number' },
          perPage: { type: 'number' },
          order: {
            type: 'string',
            enum: Object.values(PageOrder)
          }
        }
      },
      examples: Object.assign(
        {},
        ...Object.entries(p.examples).map(([name, example]) => {
          if (Array.isArray(example)) {
            return {
              [name]: {
                value: {
                  items: example.slice(0, 10),
                  total: example.length,
                  page: 1,
                  pages: Math.ceil(example.length / 10),
                  perPage: 10,
                  order: PageOrder.ASC
                }
              }
            }
          } else {
            return {
              [name]: {
                value: {
                  items: [example],
                  total: 1,
                  page: 1,
                  pages: 1,
                  perPage: 10,
                  order: PageOrder.ASC
                }
              }
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
      ...Object.entries(p.examples).map(([name, example]) => {
        return {
          [name]: {
            value: { example }
          }
        }
      })
    )
  }
}
