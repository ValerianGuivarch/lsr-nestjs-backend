const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

export class Slug {
  static readonly FALLBACK = 'item'

  static from(input: string): string {
    const normalized = input
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .replace(/-{2,}/g, '-')

    const result = normalized.length > 0 ? normalized : Slug.FALLBACK
    Slug.assertValid(result)
    return result
  }

  static ensureUnique(baseInput: string, isUsed: (slug: string) => boolean): string {
    const base = Slug.from(baseInput)

    if (!isUsed(base)) {
      return base
    }

    let attempt = 2
    // Increment suffix until a free slug is found.
    while (isUsed(`${base}-${attempt}`)) {
      attempt += 1
    }

    return `${base}-${attempt}`
  }

  static assertValid(slug: string): void {
    if (!SLUG_PATTERN.test(slug)) {
      throw new Error(`Invalid slug: ${slug}`)
    }
  }
}

export const isValidSlug = (slug: string): boolean => SLUG_PATTERN.test(slug)