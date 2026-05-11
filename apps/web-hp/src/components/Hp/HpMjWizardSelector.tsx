import React, { useState, useEffect } from 'react'
import styled from 'styled-components'
import { useNavigate } from 'react-router-dom'
import { ApiL7RProvider } from '../../data/api/ApiL7RProvider'
import { Wizard } from '../../domain/models/hp/Wizard'

export function HpMjWizardSelector(props: {
  onSelectWizard: (wizardName: string) => void
  onOpenHousePoints: () => void
}) {
  const [wizardsList, setWizardsList] = useState<Wizard[]>([])
  const [selectedDropdown, setSelectedDropdown] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    const fetchWizards = async () => {
      try {
        const wizards = await ApiL7RProvider.getAllWizards()
        setWizardsList(wizards)
      } catch (e) {
        console.error('Failed to fetch wizards', e)
      }
    }
    fetchWizards()
  }, [])

  const handleAddWizard = () => {
    if (selectedDropdown) {
      props.onSelectWizard(selectedDropdown)
      setSelectedDropdown('')
    }
  }

  const handleRollD20 = async () => {
    try {
      await ApiL7RProvider.rollFlip('MJ Helluin', 'basic')
      alert('D20 lancé pour MJ Helluin!')
    } catch (e) {
      console.error('Failed to roll d20', e)
    }
  }

  return (
    <SelectorContainer>
      <ControlsRow>
        <SelectWrapper>
          <StyledSelect value={selectedDropdown} onChange={(e) => setSelectedDropdown(e.target.value)}>
            <option value="">-- Sélectionner un personnage --</option>
            {wizardsList.map((wizard) => (
              <option key={wizard.name} value={wizard.name}>
                {wizard.displayName || wizard.name}
              </option>
            ))}
          </StyledSelect>
          <AddButton onClick={handleAddWizard} disabled={!selectedDropdown}>
            Ajouter
          </AddButton>
        </SelectWrapper>

        <ButtonGroup>
          <ActionButton onClick={handleRollD20} variant="d20">
            🎲 D20 MJ Helluin
          </ActionButton>
          <ActionButton onClick={() => navigate('/hp/characters/new')} variant="create">
            ➕ Créer perso
          </ActionButton>
          <ActionButton onClick={props.onOpenHousePoints} variant="house">
            🏠 Points de maison
          </ActionButton>
        </ButtonGroup>
      </ControlsRow>
    </SelectorContainer>
  )
}


const SelectorContainer = styled.div`
  background: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  margin-bottom: 20px;
`

const ControlsRow = styled.div`
  display: flex;
  gap: 20px;
  align-items: center;
  flex-wrap: wrap;
`

const SelectWrapper = styled.div`
  display: flex;
  gap: 10px;
  align-items: center;
`

const StyledSelect = styled.select`
  padding: 8px 12px;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 14px;
  min-width: 200px;
  background: white;
  cursor: pointer;

  &:focus {
    outline: none;
    border-color: #4a90e2;
    box-shadow: 0 0 0 2px rgba(74, 144, 226, 0.1);
  }
`

const AddButton = styled.button`
  padding: 8px 16px;
  background: #4a90e2;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 500;
  transition: background 0.2s;

  &:hover:not(:disabled) {
    background: #357abd;
  }

  &:disabled {
    background: #ccc;
    cursor: not-allowed;
  }
`

const ButtonGroup = styled.div`
  display: flex;
  gap: 10px;
`

const ActionButton = styled.button<{ variant?: 'd20' | 'create' | 'house' }>`
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s;

  background: ${(props) => {
    switch (props.variant) {
      case 'd20':
        return '#e74c3c'
      case 'create':
        return '#2ecc71'
      case 'house':
        return '#f39c12'
      default:
        return '#95a5a6'
    }
  }};
  color: white;

  &:hover {
    opacity: 0.9;
    transform: translateY(-1px);
  }
`
