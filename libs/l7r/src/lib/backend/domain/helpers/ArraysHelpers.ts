export function uniqueArray<T>(array: T[]): T[] {
  const arrayOut = new Set(array)
  return [...arrayOut]
}

export function pushUnique<T>(elem: T, array: T[]): T[] {
  const arrayOut = new Set(array)
  arrayOut.add(elem)
  return [...arrayOut]
}

export function filterNullAndUndefined<T>(): (v: T | undefined) => v is T {
  return (v: T | undefined): v is T => v !== undefined && v !== null
}

export function filterNullAndUndefinedAndEmpty<T>(): (
  v: T | undefined
) => v is T {
  return (v: T | undefined): v is T => !!v
}

export function ensure<T>(
  argument: T | undefined | null,
  message = 'This value was promised to be there.'
): T {
  if (argument === undefined || argument === null) {
    throw new TypeError(message)
  }

  return argument
}
