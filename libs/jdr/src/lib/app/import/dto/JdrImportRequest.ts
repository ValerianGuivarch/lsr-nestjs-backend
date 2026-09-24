import { Allow, IsInt } from 'class-validator'

export interface ImportModifier {
  statSlug: string
  value: number
}

export interface ImportResourceValue {
  resourceSlug: string
  name?: string
  value: number
}

export interface ImportJdrData {
  slug?: string
  name: string
  text?: string
  stats?: Array<{ slug?: string; name: string }>
  resources?: Array<{ slug?: string; name: string; ownerType: 'CHARACTER' | 'GROUP'; defaultValue?: number }>
  classes?: Array<{ slug?: string; name: string; text?: string; levels?: string[] }>
  groups?: Array<{ slug?: string; name: string; text?: string; resources?: ImportResourceValue[] }>
  players?: Array<{ slug?: string; name: string }>
  traits?: Array<{
    slug?: string
    name: string
    type?: 'Normal' | 'Defaut' | 'Secret' | 'Sort'
    level?: number | null
    data?: Record<string, unknown> | null
    modifiers?: ImportModifier[]
  }>
  items?: Array<{
    slug?: string
    name: string
    description?: string
    unique?: boolean
    modifiers?: ImportModifier[]
  }>
  groupItems?: Array<{ itemSlug: string; quantity?: number }>
  characters?: Array<{
    slug?: string
    name: string
    playerSlug?: string
    classSlug?: string
    classLevel?: string
    isPlayable?: boolean
    public?: boolean
    text?: string
    groupSlugs?: string[]
    stats?: Array<{ statSlug: string; value: number }>
    traitSlugs?: string[]
    items?: Array<{ itemSlug: string; quantity?: number }>
    resources?: ImportResourceValue[]
  }>
}

export class JdrImportRequest {
  @IsInt()
  version: number

  @Allow()
  jdr: ImportJdrData
}
