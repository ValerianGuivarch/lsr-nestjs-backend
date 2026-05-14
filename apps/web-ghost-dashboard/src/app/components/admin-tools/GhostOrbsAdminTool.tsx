import React from 'react'
import { ToolPlaceholderProps } from './types'

export function GhostOrbsAdminTool({ toolLabel }: ToolPlaceholderProps): JSX.Element {
  return (
    <div>
      <p>Page admin {toolLabel}</p>
      <small>Controles dedies a venir.</small>
    </div>
  )
}
