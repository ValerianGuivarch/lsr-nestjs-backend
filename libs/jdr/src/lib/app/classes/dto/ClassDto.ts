export class JdrClassResourceDto {
  resourceSlug: string
  resourceType: string
  defaultValue: number
  behavior: 'fixed' | 'scalable'
}

export class JdrClassDto {
  slug: string
  name: string
  text: string
  level: number
  resources: JdrClassResourceDto[]
}
