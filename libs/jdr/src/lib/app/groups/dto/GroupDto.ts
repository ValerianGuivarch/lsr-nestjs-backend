export class JdrGroupDto {
  slug: string
  name: string
  text: string
  resources: Array<{ resourceSlug: string; name: string; value: number }>
}
