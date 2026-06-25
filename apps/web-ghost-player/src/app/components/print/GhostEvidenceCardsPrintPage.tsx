import React, { useEffect, useMemo, useState } from 'react'
import styled from 'styled-components'

type TemperatureValue = 'COLD' | 'VERY_COLD' | 'NORMAL' | 'HOT'
type AppearanceValue = 'RED' | 'WHITE'

type GhostJsonItem = {
  name: string
  portrait?: string
  emf: number
  temperature: TemperatureValue
  uv: boolean
  spiritBox: boolean
  orbs: boolean
  appearance: AppearanceValue
  description: string
}

type GhostCardData = {
  id: string
  name: string
  portraitUrl: string
  description: string
  emf: number
  temperature: TemperatureValue
  uv: boolean
  spiritBox: boolean
  ghostOrbs: boolean
  appearance: AppearanceValue
}

const GHOST_PORTRAIT_URL = 'https://l7r.fr/l7r/Colin2.png'
const ghostsJsonUrl = new URL('../../../assets/ghosts.json', import.meta.url).href

function formatTemperature(value: TemperatureValue): string {
  if (value === 'VERY_COLD') return 'Tres froid'
  if (value === 'COLD') return 'Froid'
  if (value === 'HOT') return 'Chaud'
  return 'Normal'
}

function boolLabel(value: boolean): string {
  return value ? 'Oui' : 'Non'
}

function formatAppearance(value: AppearanceValue): string {
  return value === 'RED' ? 'Rouge' : 'Blanc'
}

function clampEmf(value: number): number {
  return Math.max(1, Math.min(5, Math.round(value)))
}

function normalizeGhosts(raw: GhostJsonItem[]): GhostCardData[] {
  return raw.map((item, index) => ({
    id: `${item.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${index}`,
    name: item.name,
    portraitUrl: item.portrait || GHOST_PORTRAIT_URL,
    description: item.description,
    emf: item.emf,
    temperature: item.temperature,
    uv: item.uv,
    spiritBox: item.spiritBox,
    ghostOrbs: item.orbs,
    appearance: item.appearance,
  }))
}

export function GhostEvidenceCardsPrintPage(): JSX.Element {
  const [ghosts, setGhosts] = useState<GhostCardData[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    const load = async (): Promise<void> => {
      try {
        const response = await fetch(ghostsJsonUrl)
        if (!response.ok) {
          throw new Error(`Echec du chargement JSON des fantomes: ${response.status}`)
        }

        const json = (await response.json()) as GhostJsonItem[]
        if (!cancelled) {
          setGhosts(normalizeGhosts(json))
          setLoadError(null)
        }
      } catch {
        if (!cancelled) {
          setLoadError('Impossible de charger les donnees des cartes fantomes.')
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    void load()

    return () => {
      cancelled = true
    }
  }, [])

  const totalLabel = useMemo(() => `${ghosts.length} cartes`, [ghosts.length])

  return (
    <Page>
      <ScreenToolbar>
        <Title>Dossiers d'investigation paranormale {loading ? '' : `- ${totalLabel}`}</Title>
        <PrintButton type="button" onClick={() => window.print()} disabled={loading}>
          Imprimer les cartes
        </PrintButton>
      </ScreenToolbar>

      {loadError && <LoadState>{loadError}</LoadState>}
      {loading && <LoadState>Chargement des cartes...</LoadState>}

      <CardsGrid>
        {ghosts.map(ghost => {
          const emf = clampEmf(ghost.emf)
          return (
            <Card key={ghost.id}>
              <Body>
                <PortraitColumn>
                  <GhostName>{ghost.name}</GhostName>
                  <PortraitPlaceholder>
                    <PortraitImage src={ghost.portraitUrl} alt={`Portrait ${ghost.name}`} />
                  </PortraitPlaceholder>
                </PortraitColumn>

                <Details>
                  <EvidenceList>
                    <EvidenceItem>
                      <EvidenceLabelGroup>
                        <EvidenceIcon>EMF</EvidenceIcon>
                        <EvidenceLabel>EMF</EvidenceLabel>
                      </EvidenceLabelGroup>
                      <EmfMeterWrap>
                        <EmfNumber style={{ left: `${((emf - 0.5) / 5) * 100}%` }}>{emf}</EmfNumber>
                        <EmfBars>
                          {[1, 2, 3, 4, 5].map(level => (
                            <EmfBar key={level} $active={level <= emf} $level={level} />
                          ))}
                        </EmfBars>
                      </EmfMeterWrap>
                    </EvidenceItem>

                    <EvidenceItem>
                      <EvidenceLabelGroup>
                        <EvidenceIcon>T</EvidenceIcon>
                        <EvidenceLabel>Temperature</EvidenceLabel>
                      </EvidenceLabelGroup>
                      <TemperatureBadge $temperature={ghost.temperature}>{formatTemperature(ghost.temperature)}</TemperatureBadge>
                    </EvidenceItem>

                    <EvidenceItem>
                      <EvidenceLabelGroup>
                        <EvidenceIcon>UV</EvidenceIcon>
                        <EvidenceLabel>UV</EvidenceLabel>
                      </EvidenceLabelGroup>
                      <BooleanBadge $state={ghost.uv ? 'uv-yes' : 'no'}>{boolLabel(ghost.uv)}</BooleanBadge>
                    </EvidenceItem>

                    <EvidenceItem>
                      <EvidenceLabelGroup>
                        <EvidenceIcon>SB</EvidenceIcon>
                        <EvidenceLabel>Spirit Box</EvidenceLabel>
                      </EvidenceLabelGroup>
                      <BooleanBadge $state={ghost.spiritBox ? 'yes' : 'no'}>{boolLabel(ghost.spiritBox)}</BooleanBadge>
                    </EvidenceItem>

                    <EvidenceItem>
                      <EvidenceLabelGroup>
                        <EvidenceIcon>ORB</EvidenceIcon>
                        <EvidenceLabel>Ghost Orbs</EvidenceLabel>
                      </EvidenceLabelGroup>
                      <BooleanBadge $state={ghost.ghostOrbs ? 'yes' : 'no'}>{boolLabel(ghost.ghostOrbs)}</BooleanBadge>
                    </EvidenceItem>

                    <EvidenceItem>
                      <EvidenceLabelGroup>
                        <EvidenceIcon>APP</EvidenceIcon>
                        <EvidenceLabel>Couleur d'apparition</EvidenceLabel>
                      </EvidenceLabelGroup>
                      <AppearanceBadge $appearance={ghost.appearance}>
                        <AppearanceDot $appearance={ghost.appearance} />
                        {formatAppearance(ghost.appearance)}
                      </AppearanceBadge>
                    </EvidenceItem>
                  </EvidenceList>
                </Details>
              </Body>
            </Card>
          )
        })}
      </CardsGrid>
    </Page>
  )
}

const Page = styled.main`
  min-height: 100vh;
  background: #ffffff;
  color: #1a1a1a;
  padding: 14mm 10mm;
  font-family: 'Times New Roman', serif;

  @media print {
    background: #ffffff;
    padding: 0;
  }
`

const ScreenToolbar = styled.div`
  width: min(190mm, 100%);
  margin: 0 auto 10mm auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;

  @media print {
    display: none;
  }
`

const Title = styled.h1`
  margin: 0;
  color: #a82a2e;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  font-size: 18px;
`

const PrintButton = styled.button`
  border: 1px solid #2f8d5d;
  background: linear-gradient(180deg, #11291f 0%, #0a1712 100%);
  color: #d8f7e8;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  padding: 10px 14px;
  cursor: pointer;

  &:hover {
    filter: brightness(1.12);
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.6;
  }
`

const LoadState = styled.div`
  width: min(190mm, 100%);
  margin: 0 auto 4mm auto;
  color: #4a3a26;
  letter-spacing: 0.05em;
`

const CardsGrid = styled.section`
  width: min(190mm, 100%);
  margin: 0 auto;
  display: grid;
  grid-template-columns: 1fr;
  gap: 5mm;
`

const Card = styled.article`
  min-height: 86mm;
  background: #ffffff;
  border: 1.5px solid #6e4a2c;
  box-shadow:
    inset 0 0 0 1px rgba(110, 74, 44, 0.15),
    0 2px 6px rgba(0, 0, 0, 0.08);
  padding: 3mm;
  break-inside: avoid;
  page-break-inside: avoid;
  display: flex;
  flex-direction: column;
  color: #1a1a1a;
  -webkit-print-color-adjust: exact;
  print-color-adjust: exact;

  & * {
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
`


const GhostName = styled.h2`
  margin: 8;
  width: 50mm;
  text-align: center;
  color: #6e1b1b;
  font-size: 16px;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  line-height: 1.2;
`

const Body = styled.div`
  display: grid;
  grid-template-columns: 50mm 1fr;
  align-items: start;
  gap: 3mm;
  min-height: 0;
  flex: 1;
`

const PortraitColumn = styled.div`
  width: 50mm;
  display: flex;
  flex-direction: column;
  gap: 1.2mm;
  align-items: center;
`

const PortraitPlaceholder = styled.div`
  width: 50mm;
  height: 50mm;
  align-self: start;
  border: 1px solid #a0764e;
  background: #f5efe5;
  overflow: hidden;
`

const PortraitImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  filter: grayscale(100%) contrast(1.05) brightness(1);
`

const Details = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.8mm;
`


const EvidenceList = styled.ul`
  margin: 0;
  padding: 0;
  list-style: none;
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.2mm;
`

const EvidenceItem = styled.li`
  border: 1px solid #b9c8bf;
  background: #ffffff;
  padding: 2.2mm 1.2mm;
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  column-gap: 0.35rem;
`

const EvidenceLabelGroup = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
`

const EvidenceIcon = styled.span`
  min-width: 26px;
  text-align: center;
  font-size: 8px;
  font-weight: 800;
  letter-spacing: 0.08em;
  color: #1f5c3c;
  border: 1px solid #5fa37e;
  background: #ffffff;
  border-radius: 999px;
  padding: 0.15rem 0.35rem;
`

const EvidenceLabel = styled.div`
  color: #1f5c3c;
  letter-spacing: 0.07em;
  text-transform: uppercase;
  font-size: 8px;
`

const BooleanBadge = styled.span<{ $state: 'yes' | 'no' | 'uv-yes' }>`
  min-width: 36px;
  text-align: center;
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  border-radius: 999px;
  padding: 0.12rem 0.4rem;
  border: 1px solid
    ${({ $state }) => {
      if ($state === 'uv-yes') return '#7e5cc0'
      if ($state === 'yes') return '#3f9f71'
      return '#c0494b'
    }};
  color: ${({ $state }) => {
    if ($state === 'uv-yes') return '#3a1f6e'
    if ($state === 'yes') return '#0f4427'
    return '#6e1b1b'
  }};
  background: #ffffff;
`

const EmfMeterWrap = styled.div`
  position: relative;
  width: 108px;
  padding-top: 0.75rem;
`

const EmfBars = styled.div`
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  align-items: end;
  gap: 3px;
  height: 24px;
`

const EmfBar = styled.span<{ $active: boolean; $level: number }>`
  height: ${({ $level }) => 8 + $level * 4}px;
  border-radius: 3px 3px 1px 1px;
  border: 1px solid ${({ $active }) => ($active ? '#3f9f71' : '#cfd7d2')};
  background: ${({ $active, $level }) =>
    $active
      ? $level <= 3
        ? '#6de2a8'
        : '#f2b26d'
      : '#ffffff'};
`

const EmfNumber = styled.span`
  position: absolute;
  top: 0;
  transform: translateX(-50%);
  font-size: 10px;
  font-weight: 800;
  color: #4a2a18;
  border: 1px solid #a0764e;
  background: #ffffff;
  border-radius: 999px;
  padding: 0 0.34rem;
`

const TemperatureBadge = styled.span<{ $temperature: TemperatureValue }>`
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 0.07em;
  text-transform: uppercase;
  border-radius: 999px;
  padding: 0.12rem 0.4rem;
  border: 1px solid
    ${({ $temperature }) => {
      if ($temperature === 'VERY_COLD') return '#2a5da8'
      if ($temperature === 'COLD') return '#4c84c4'
      if ($temperature === 'HOT') return '#c6543a'
      return '#a98839'
    }};
  color: ${({ $temperature }) => {
    if ($temperature === 'VERY_COLD') return '#15355e'
    if ($temperature === 'COLD') return '#1f4470'
    if ($temperature === 'HOT') return '#6e2a18'
    return '#5a4516'
  }};
  background: #ffffff;
`

const AppearanceBadge = styled.span<{ $appearance: AppearanceValue }>`
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 0.07em;
  text-transform: uppercase;
  border-radius: 999px;
  padding: 0.12rem 0.4rem;
  border: 1px solid ${({ $appearance }) => ($appearance === 'RED' ? '#c0494b' : '#8c8c8c')};
  color: ${({ $appearance }) => ($appearance === 'RED' ? '#6e1b1b' : '#3a3a3a')};
  background: #ffffff;
`

const AppearanceDot = styled.span<{ $appearance: AppearanceValue }>`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  border: 1px solid #1a1a1a;
  background: ${({ $appearance }) => ($appearance === 'RED' ? '#d94545' : '#ffffff')};
`
