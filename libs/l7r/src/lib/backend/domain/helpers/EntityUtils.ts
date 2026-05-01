export class EntityUtils {
  static newObjectId(): string {
    // eslint-disable-next-line no-magic-numbers
    const h = 16
    const s = (s) => Math.floor(s).toString(h)
    // eslint-disable-next-line no-magic-numbers
    return s(Date.now() / 1000) + ' '.repeat(h).replace(/./g, () => s(Math.random() * h))
  }
}

export function mergeNonNull<T>(original: T, update: Partial<T>): T {
  const result = { ...original }
  Object.keys(update).forEach((key) => {
    if (update[key] !== undefined && update[key] !== null && (update[key] !== '' || typeof update[key] == 'number')) {
      result[key] = update[key]
    }
  })

  return result
}
