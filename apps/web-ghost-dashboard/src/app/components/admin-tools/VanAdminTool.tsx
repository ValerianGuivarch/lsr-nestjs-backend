import React from 'react'
import styled from 'styled-components'
import { VanAdminToolProps } from './types'

export function VanAdminTool({
  vanGhostActivity,
  onVanGhostActivityChange,
  vanObjectives,
  onToggleObjective
}: VanAdminToolProps): JSX.Element {
  return (
    <Wrapper>
      <Section>
        <Label>Niveau d'activité fantomatique : <strong>{vanGhostActivity}/10</strong></Label>
        <input
          type="range"
          min={0}
          max={10}
          step={1}
          value={vanGhostActivity}
          onChange={(e) => onVanGhostActivityChange(Number(e.target.value))}
        />
      </Section>

      <Section>
        <Label>Objectifs de mission</Label>
        {vanObjectives.length === 0 && <Empty>Aucun objectif défini.</Empty>}
        <ObjectiveList>
          {vanObjectives.map((obj) => (
            <ObjectiveItem key={obj.objective}>
              <input
                type="checkbox"
                checked={obj.completed}
                onChange={() => onToggleObjective(obj.objective)}
              />
              <span style={{ textDecoration: obj.completed ? 'line-through' : 'none' }}>{obj.objective}</span>
            </ObjectiveItem>
          ))}
        </ObjectiveList>
      </Section>
    </Wrapper>
  )
}

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
`

const Section = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`

const Label = styled.label`
  font-weight: 600;
`

const Empty = styled.small`
  color: #888;
`

const ObjectiveList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
`

const ObjectiveItem = styled.label`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
`
