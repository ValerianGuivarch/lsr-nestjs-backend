export class EntityUtils {
  static newObjectId(): string {
    // eslint-disable-next-line no-magic-numbers
    const h = 16
    const s = (s: number) => Math.floor(s).toString(h)
    // eslint-disable-next-line no-magic-numbers
    return s(Date.now() / 1000) + ' '.repeat(h).replace(/./g, () => s(Math.random() * h))
  }
}

export function mergeNonNull<T>(original: T, update: Partial<T>): T {
  const result = { ...original }
  // Utilisez keyof T pour s'assurer que la clé est une clé valide de T
  Object.keys(update).forEach((key) => {
    const updateKey = key as keyof T
    if (
      update[updateKey] !== undefined &&
      update[updateKey] !== null &&
      (update[updateKey] !== '' || typeof update[updateKey] === 'number')
    ) {
      result[updateKey] = update[updateKey] ?? result[updateKey]
    }
  })

  return result
}
