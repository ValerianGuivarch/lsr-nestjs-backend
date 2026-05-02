import React, { useState } from 'react'
import styled from 'styled-components'
import { Wizard } from '../../domain/models/hp/Wizard'
import { ApiL7RProvider } from '../../data/api/ApiL7RProvider'

export function HpMjWizardCard(props: { wizard: Wizard | undefined; wizardName: string; onRemove: () => void }) {
  const [selectedKnowledge, setSelectedKnowledge] = useState('')
  const [selectedSpell, setSelectedSpell] = useState('')
  const [portraitHidden, setPortraitHidden] = useState(false)

  if (!props.wizard) {
    return (
      <CardContainer>
        <LoadingText>Chargement de {props.wizardName}...</LoadingText>
      </CardContainer>
    )
  }

  const wizard = props.wizard
  const portraitName = wizard.displayName || wizard.name || 'wizard'
  const portraitSrc = `/l7r/${portraitName}.png`

  const wizardStats = (wizard.stats || []).filter((stat) => stat?.stat?.name)
  const wizardKnowledges = (wizard.knowledges || []).filter((knowledge) => knowledge?.knowledge?.name)
  const wizardSpells = (wizard.spells || []).filter((spell) => spell?.spell?.name)

  const handleLaunchKnowledge = async () => {
    if (selectedKnowledge) {
      try {
        await ApiL7RProvider.rollFlip(wizard.name, selectedKnowledge)
        setSelectedKnowledge('')
      } catch (e) {
        console.error('Failed to launch knowledge', e)
      }
    }
  }

  const handleLaunchSpell = async () => {
    if (selectedSpell) {
      try {
        await ApiL7RProvider.rollFlip(wizard.name, selectedSpell)
        setSelectedSpell('')
      } catch (e) {
        console.error('Failed to launch spell', e)
      }
    }
  }

  const getHouseColor = (houseName: string) => {
    switch (houseName?.toLowerCase()) {
      case 'gryffondor':
        return '#d32f2f'
      case 'serdaigle':
        return '#1976d2'
      case 'poufsouffle':
        return '#f57f17'
      case 'serpentard':
        return '#388e3c'
      default:
        return '#757575'
    }
  }

  return (
    <CardContainer houseColor={getHouseColor(wizard.houseName || '')}>
      <CardTop>
        <PortraitSection>
          {!portraitHidden ? (
            <Portrait
              src={portraitSrc}
              alt={portraitName}
              onError={() => setPortraitHidden(true)}
            />
          ) : (
            <PortraitFallback>🧙</PortraitFallback>
          )}
          <RemoveButton onClick={props.onRemove}>✕</RemoveButton>
        </PortraitSection>
        
        <InfoSection>
          <WizardName>{wizard.displayName || wizard.name || 'Unknown'}</WizardName>
          <HouseName>{wizard.houseName || '--'}</HouseName>
          
          <HealthSection>
            <HealthBar>
              <HealthFill percentage={(wizard.pv && wizard.pvMax) ? (wizard.pv / wizard.pvMax) * 100 : 0} />
            </HealthBar>
            <HealthText>{wizard.pv || 0}/{wizard.pvMax || 0}</HealthText>
          </HealthSection>
        </InfoSection>
      </CardTop>

      <StatsButtonsGroup>
        {wizardStats.length > 0 ? (
          wizardStats.map((stat) => {
            const statName = stat.stat.name
            return (
              <StatButton key={statName} title={statName}>
                {statName} ({stat.level ?? 0})
              </StatButton>
            )
          })
        ) : null}
      </StatsButtonsGroup>

      <SelectsSection>
        <SelectGroup>
          <label>Connaissance:</label>
          <SelectRowContainer>
            <Select
              value={selectedKnowledge}
              onChange={(e) => setSelectedKnowledge(e.target.value)}
            >
              <option value="">--</option>
              {wizardKnowledges.length > 0 ? (
                wizardKnowledges.map((knowledge) => (
                  <option key={knowledge.knowledge.name} value={knowledge.knowledge.name}>
                    {knowledge.knowledge.name}
                  </option>
                ))
              ) : null}
            </Select>
            <LaunchButton onClick={handleLaunchKnowledge} disabled={!selectedKnowledge}>
              Lancer
            </LaunchButton>
          </SelectRowContainer>
        </SelectGroup>

        <SelectGroup>
          <label>Sort:</label>
          <SelectRowContainer>
            <Select
              value={selectedSpell}
              onChange={(e) => setSelectedSpell(e.target.value)}
            >
              <option value="">--</option>
              {wizardSpells.length > 0 ? (
                wizardSpells.map((spell) => (
                  <option key={spell.spell.name} value={spell.spell.name}>
                    {spell.spell.name}
                  </option>
                ))
              ) : null}
            </Select>
            <LaunchButton onClick={handleLaunchSpell} disabled={!selectedSpell}>
              Lancer
            </LaunchButton>
          </SelectRowContainer>
        </SelectGroup>
      </SelectsSection>
    </CardContainer>
  )
}

const CardContainer = styled.div<{ houseColor?: string }>`
  background: white;
  border-radius: 8px;
  padding: 14px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  border-left: 4px solid ${(props) => props.houseColor || '#ddd'};
  display: flex;
  flex-direction: column;
  gap: 12px;
`

const LoadingText = styled.div`
  color: #999;
  text-align: center;
  padding: 40px 20px;
  font-size: 14px;
`

const CardTop = styled.div`
  display: flex;
  gap: 12px;
`

const PortraitSection = styled.div`
  position: relative;
  flex-shrink: 0;
`

const Portrait = styled.img`
  width: 80px;
  height: 100px;
  object-fit: cover;
  border-radius: 4px;
  background-color: #eee;
`

const PortraitFallback = styled.div`
  width: 80px;
  height: 100px;
  border-radius: 4px;
  background-color: #eee;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
`

const RemoveButton = styled.button`
  position: absolute;
  top: -8px;
  right: -8px;
  background: #e74c3c;
  color: white;
  border: none;
  border-radius: 50%;
  width: 24px;
  height: 24px;
  cursor: pointer;
  font-size: 14px;
  font-weight: bold;
  transition: background 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover {
    background: #c0392b;
  }
`

const InfoSection = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  min-width: 0;
`

const WizardName = styled.h3`
  margin: 0 0 4px 0;
  font-size: 16px;
  color: #333;
  font-weight: 700;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`

const HouseName = styled.div`
  font-size: 12px;
  color: #666;
  font-weight: 500;
  margin-bottom: 6px;
`

const HealthSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
`

const HealthBar = styled.div`
  background: #eee;
  border-radius: 3px;
  height: 16px;
  overflow: hidden;
  border: 1px solid #ddd;
`

const HealthFill = styled.div<{ percentage: number }>`
  background: linear-gradient(90deg, #2ecc71, #27ae60);
  height: 100%;
  width: ${(props) => props.percentage}%;
  transition: width 0.3s ease;
`

const HealthText = styled.div`
  font-size: 11px;
  color: #666;
  text-align: center;
  font-weight: 500;
`

const StatsButtonsGroup = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 6px;
`

const StatButton = styled.button`
  padding: 6px 8px;
  background-color: #f0f0f0;
  border: 1px solid #ddd;
  border-radius: 3px;
  font-size: 11px;
  font-weight: 600;
  color: #333;
  cursor: pointer;
  transition: background-color 0.2s;

  &:hover {
    background-color: #e0e0e0;
  }
`

const SelectsSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`

const SelectGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;

  label {
    font-size: 11px;
    font-weight: 600;
    color: #666;
  }
`

const SelectRowContainer = styled.div`
  display: flex;
  gap: 4px;
`

const Select = styled.select`
  flex: 1;
  padding: 4px 6px;
  border: 1px solid #ddd;
  border-radius: 3px;
  font-size: 11px;
  background-color: white;
  cursor: pointer;

  &:hover {
    border-color: #999;
  }

  &:focus {
    outline: none;
    border-color: #4a90e2;
  }
`

const LaunchButton = styled.button`
  padding: 4px 8px;
  background: #9b59b6;
  color: white;
  border: none;
  border-radius: 3px;
  cursor: pointer;
  font-size: 11px;
  font-weight: 600;
  white-space: nowrap;
  transition: background 0.2s;

  &:hover:not(:disabled) {
    background: #8e44ad;
  }

  &:disabled {
    background: #bdc3c7;
    cursor: not-allowed;
  }
`
