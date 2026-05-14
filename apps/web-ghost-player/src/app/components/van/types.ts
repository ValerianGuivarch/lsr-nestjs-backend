export type VanObjective = {
  objective: string
  completed: boolean
}

export type VanFeedMessage = {
  id: string
  kind: 'audio' | 'text' | 'text_image'
  title: string
  text?: string
  audioUrl?: string
  imageUrl?: string
  sentAt: string
}
