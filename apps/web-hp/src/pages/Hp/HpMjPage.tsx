import React, { useEffect, useState } from 'react'
import styled from 'styled-components'
import { Wizard } from '../../domain/models/hp/Wizard'
import { Flip } from '../../domain/models/hp/Flip'
import { ApiL7RProvider } from '../../data/api/ApiL7RProvider'
import { HpMjWizardCard } from '../../components/Hp/HpMjWizardCard'
import FlipCard from '../../components/Hp/FlipCard'
import { HpMjHousePointsModal, HousePoints } from '../../components/Hp/HpMjHousePointsModal'
import { useNavigate } from 'react-router-dom'

interface HpMjSession {
  selectedWizards: string[]
  housePoints: HousePoints
}

export function HpMjPage() {
  const navigate = useNavigate()
  const [session, setSession] = useState<HpMjSession>({
    selectedWizards: [],
    housePoints: {
      Gryffondor: 0,
      Serdaigle: 0,
      Poufsouffle: 0,
      Serpentard: 0,
    },
  })

  const [wizards, setWizards] = useState<Map<string, Wizard>>(new Map())
  const [showHousePointsModal, setShowHousePointsModal] = useState(false)
  const [allWizards, setAllWizards] = useState<string[]>([])
  const [mjFlips, setMjFlips] = useState<Flip[]>([])

  // Charger la liste des persos
  useEffect(() => {
    const fetchWizardsList = async () => {
      try {
        const names = await ApiL7RProvider.getAllWizardNames()
        setAllWizards(names)
      } catch (e) {
        console.error('Failed to fetch wizards list', e)
      }
    }
    fetchWizardsList()
  }, [])

  // Charger les flips de MJ Helluin
  useEffect(() => {
    const fetchMjFlips = async () => {
      try {
        const allFlips = await ApiL7RProvider.getFlips()
        const mjFlips = allFlips.filter((flip) => flip.wizardName === 'MJ Helluin').slice(0, 10)
        setMjFlips(mjFlips)
      } catch (e) {
        console.error('Failed to fetch MJ flips', e)
      }
    }

    const interval = setInterval(() => {
      fetchMjFlips()
    }, 3000) // Refresh every 3 seconds

    fetchMjFlips()
    return () => clearInterval(interval)
  }, [])

  // Charger la session depuis localStorage
  useEffect(() => {
    const stored = localStorage.getItem('hp_mj_session')
    if (stored) {
      try {
        setSession(JSON.parse(stored))
      } catch (e) {
        console.warn('Failed to parse hp_mj_session', e)
      }
    }
  }, [])

  useEffect(() => {
    const fetchHouses = async () => {
      try {
        const houses = await ApiL7RProvider.getHouses()
        const pointsByHouse = houses.reduce<HousePoints>((acc, house) => {
          acc[house.name] = house.points
          return acc
        }, {})
        setSession((prev) => ({
          ...prev,
          housePoints: pointsByHouse
        }))
      } catch (e) {
        console.error('Failed to fetch houses points', e)
      }
    }

    fetchHouses()
  }, [])

  // Sauvegarder la session dans localStorage
  useEffect(() => {
    localStorage.setItem('hp_mj_session', JSON.stringify(session))
  }, [session])

  // Charger les détails des persos sélectionnés
  useEffect(() => {
    const fetchWizards = async () => {
      const newWizards = new Map<string, Wizard>()
      for (const wizardName of session.selectedWizards) {
        if (!wizards.has(wizardName)) {
          try {
            const wizard = await ApiL7RProvider.getWizardByName(wizardName)
            newWizards.set(wizardName, wizard)
          } catch (e) {
            console.error(`Failed to fetch wizard ${wizardName}`, e)
          }
        } else {
          newWizards.set(wizardName, wizards.get(wizardName)!)
        }
      }
      if (newWizards.size > 0) {
        setWizards(newWizards)
      }
    }

    if (session.selectedWizards.length > 0) {
      fetchWizards()
    }
  }, [session.selectedWizards])

  const handleAddWizard = (wizardName: string) => {
    if (wizardName && !session.selectedWizards.includes(wizardName)) {
      setSession((prev) => ({
        ...prev,
        selectedWizards: [...prev.selectedWizards, wizardName],
      }))
    }
  }

  const handleRemoveWizard = (wizardName: string) => {
    setSession((prev) => ({
      ...prev,
      selectedWizards: prev.selectedWizards.filter((name) => name !== wizardName),
    }))
  }

  const handleRefresh = () => {
    window.location.reload()
  }

  return (
    <>
      <MjHeader>
        <SelectContainer>
          <label htmlFor="wizard-select">Ajouter un perso: </label>
          <Select
            id="wizard-select"
            onChange={(e) => {
              handleAddWizard(e.target.value)
              e.target.value = ''
            }}
          >
            <option value="">Sélectionner...</option>
            {allWizards
              .filter((name) => !session.selectedWizards.includes(name))
              .sort()
              .map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
          </Select>
        </SelectContainer>
        <SelectContainer>
          <button onClick={() => navigate('/hp/create')}>
            Créer perso
          </button>
        </SelectContainer>
        <SelectContainer>
          <button onClick={() => setShowHousePointsModal(true)}>
            Points maisons
          </button>
        </SelectContainer>
        <SelectContainer>
          <button onClick={() => ApiL7RProvider.rollFlip('MJ Helluin', 'knowledge')}>
            D20 MJ
          </button>
        </SelectContainer>
        <SelectContainer>
          <button onClick={handleRefresh}>
            Actualiser
          </button>
        </SelectContainer>
      </MjHeader>

      <MjPageContainer>
        <CardsSection>
          <CardsGrid>
            {session.selectedWizards.length > 0 ? (
              session.selectedWizards.map((wizardName) => {
                const wizard = wizards.get(wizardName)
                return (
                  <HpMjWizardCard
                    key={wizardName}
                    wizard={wizard}
                    wizardName={wizardName}
                    onRemove={() => handleRemoveWizard(wizardName)}
                  />
                )
              })
            ) : (
              <EmptyStateMessage>Aucun perso sélectionné</EmptyStateMessage>
            )}
          </CardsGrid>
        </CardsSection>

        <FlipsSection>
          <FlipsTitle>Flips - MJ Helluin</FlipsTitle>
          <FlipsList>
            {mjFlips.length > 0 ? (
              mjFlips.map((flip) => (
                <FlipCardWrapper key={flip.id}>
                  <FlipCard flip={flip} />
                </FlipCardWrapper>
              ))
            ) : (
              <NoFlipsMessage>Aucun flip pour le moment</NoFlipsMessage>
            )}
          </FlipsList>
        </FlipsSection>
      </MjPageContainer>

      {showHousePointsModal && (
        <HpMjHousePointsModal
          points={session.housePoints}
          onClose={() => setShowHousePointsModal(false)}
          onSave={async (points) => {
            try {
              await ApiL7RProvider.updateHousePoints(points)
              setSession((prev) => ({
                ...prev,
                housePoints: points,
              }))
              setShowHousePointsModal(false)
            } catch (e) {
              console.error('Failed to update house points', e)
              throw e
            }
          }}
        />
      )}
    </>
  )
}

const MjHeader = styled.div`
  display: flex;
  flex-direction: row;
  position: fixed;
  padding: 10px;
  justify-content: flex-start;
  gap: 10px;
  top: 0;
  left: 0;
  width: 100%;
  background-color: white;
  z-index: 100;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  border-bottom: 1px solid #ccc;
  flex-wrap: wrap;
`

const SelectContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  
  label {
    font-size: 14px;
    font-weight: 500;
  }
  
  button {
    padding: 6px 12px;
    border: 1px solid #ddd;
    border-radius: 4px;
    background-color: #f5f5f5;
    cursor: pointer;
    font-size: 14px;
    
    &:hover {
      background-color: #e0e0e0;
    }
  }
`

const Select = styled.select`
  padding: 6px 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
  background-color: white;
  cursor: pointer;
  
  &:hover {
    border-color: #999;
  }
`

const MjPageContainer = styled.div`
  display: flex;
  flex-direction: row;
  position: fixed;
  top: 60px;
  height: calc(100vh - 60px);
  left: 0;
  width: 100%;
  background-color: white;
  z-index: 90;

  @media (max-width: 800px) {
    flex-direction: column;
  }
`

const CardsSection = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  padding: 20px;
  border-right: 1px solid #ccc;

  @media (max-width: 800px) {
    border-right: none;
    border-bottom: 1px solid #ccc;
  }
`

const CardsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 15px;

  @media (max-width: 500px) {
    grid-template-columns: 1fr;
  }
`

const FlipsSection = styled.div`
  width: 560px;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  padding: 20px;
  background-color: #f9f9f9;

  @media (max-width: 800px) {
    width: 100%;
    background-color: white;
  }
`

const FlipsTitle = styled.h3`
  margin-top: 0;
  margin-bottom: 15px;
  font-size: 16px;
  text-align: center;
  color: #333;
`

const FlipsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
`

const FlipCardWrapper = styled.div`
  display: flex;
  justify-content: center;
`

const NoFlipsMessage = styled.div`
  text-align: center;
  color: #999;
  padding: 20px;
  font-size: 13px;
`

const EmptyStateMessage = styled.div`
  text-align: center;
  padding: 40px 20px;
  color: #999;
  font-size: 16px;
`
