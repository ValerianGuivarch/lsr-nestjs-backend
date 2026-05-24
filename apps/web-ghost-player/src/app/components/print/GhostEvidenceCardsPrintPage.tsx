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
  background:
    radial-gradient(circle at 18% 8%, rgba(168, 34, 44, 0.2), transparent 48%),
    radial-gradient(circle at 82% 16%, rgba(26, 126, 79, 0.18), transparent 50%),
    linear-gradient(180deg, #090c11 0%, #0e131b 65%, #0a0d13 100%);
  color: #ece3cc;
  padding: 14mm 10mm;
  font-family: 'Times New Roman', serif;
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
  color: #e56d6d;
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
  color: #d8ccb3;
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
  background:
    linear-gradient(180deg, rgba(50, 30, 22, 0.78) 0%, rgba(27, 18, 15, 0.94) 100%),
    repeating-linear-gradient(
      0deg,
      rgba(255, 255, 255, 0.02) 0,
      rgba(255, 255, 255, 0.02) 2px,
      rgba(0, 0, 0, 0.04) 2px,
      rgba(0, 0, 0, 0.04) 4px
    );
  border: 1px solid #b68969;
  box-shadow:
    inset 0 0 0 1px rgba(38, 139, 87, 0.22),
    0 0 0 1px rgba(160, 43, 43, 0.26),
    0 8px 20px rgba(0, 0, 0, 0.35);
  padding: 3mm;
  break-inside: avoid;
  page-break-inside: avoid;
  display: flex;
  flex-direction: column;
`


const GhostName = styled.h2`
  margin: 8;
  width: 50mm;
  text-align: center;
  color: #f1c1b9;
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
  border: 1px solid rgba(198, 156, 114, 0.75);
  background:
    radial-gradient(circle at 35% 24%, rgba(194, 52, 52, 0.2), transparent 55%),
    linear-gradient(150deg, rgba(18, 36, 29, 0.8), rgba(15, 18, 24, 0.88));
  overflow: hidden;
`

const PortraitImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  filter: grayscale(100%) contrast(1.1) brightness(0.86);
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
  border: 1px solid rgba(66, 121, 89, 0.6);
  background: rgba(11, 24, 19, 0.72);
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
  color: #d4ffe5;
  border: 1px solid rgba(95, 201, 138, 0.55);
  background: rgba(17, 59, 39, 0.8);
  border-radius: 999px;
  padding: 0.15rem 0.35rem;
`

const EvidenceLabel = styled.div`
  color: #73d5a1;
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
      if ($state === 'uv-yes') return 'rgba(173, 128, 255, 0.92)'
      if ($state === 'yes') return 'rgba(95, 201, 138, 0.85)'
      return 'rgba(214, 90, 90, 0.85)'
    }};
  color: ${({ $state }) => {
    if ($state === 'uv-yes') return '#efe4ff'
    if ($state === 'yes') return '#d4ffe5'
    return '#ffd8d8'
  }};
  background: ${({ $state }) => {
    if ($state === 'uv-yes') return 'rgba(82, 46, 122, 0.9)'
    if ($state === 'yes') return 'rgba(18, 67, 43, 0.8)'
    return 'rgba(82, 22, 26, 0.8)'
  }};
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
  border: 1px solid ${({ $active }) => ($active ? 'rgba(138, 245, 187, 0.95)' : 'rgba(88, 133, 106, 0.55)')};
  background: ${({ $active, $level }) =>
    $active
      ? $level <= 3
        ? 'linear-gradient(180deg, #6de2a8 0%, #3f9f71 100%)'
        : 'linear-gradient(180deg, #f2b26d 0%, #e76c48 100%)'
      : 'rgba(14, 28, 20, 0.72)'};
  box-shadow: ${({ $active }) => ($active ? '0 0 6px rgba(120, 232, 171, 0.45)' : 'none')};
`

const EmfNumber = styled.span`
  position: absolute;
  top: 0;
  transform: translateX(-50%);
  font-size: 10px;
  font-weight: 800;
  color: #f6e6ce;
  border: 1px solid rgba(192, 154, 121, 0.65);
  background: rgba(58, 35, 24, 0.9);
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
      if ($temperature === 'VERY_COLD') return 'rgba(127, 189, 255, 0.92)'
      if ($temperature === 'COLD') return 'rgba(98, 165, 255, 0.86)'
      if ($temperature === 'HOT') return 'rgba(255, 144, 112, 0.92)'
      return 'rgba(215, 188, 120, 0.82)'
    }};
  color: ${({ $temperature }) => {
    if ($temperature === 'VERY_COLD') return '#e8f5ff'
    if ($temperature === 'COLD') return '#e2efff'
    if ($temperature === 'HOT') return '#ffe3dc'
    return '#fbeec7'
  }};
  background: ${({ $temperature }) => {
    if ($temperature === 'VERY_COLD') return 'rgba(37, 72, 118, 0.9)'
    if ($temperature === 'COLD') return 'rgba(35, 64, 103, 0.88)'
    if ($temperature === 'HOT') return 'rgba(114, 47, 30, 0.88)'
    return 'rgba(92, 74, 29, 0.8)'
  }};
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
  border: 1px solid ${({ $appearance }) => ($appearance === 'RED' ? 'rgba(234, 104, 104, 0.88)' : 'rgba(225, 225, 225, 0.9)')};
  color: ${({ $appearance }) => ($appearance === 'RED' ? '#ffe0e0' : '#f1f1f1')};
  background: ${({ $appearance }) => ($appearance === 'RED' ? 'rgba(102, 30, 34, 0.9)' : 'rgba(78, 78, 78, 0.85)')};
`

const AppearanceDot = styled.span<{ $appearance: AppearanceValue }>`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  border: 1px solid rgba(20, 20, 20, 0.7);
  background: ${({ $appearance }) => ($appearance === 'RED' ? '#ff5b5b' : '#ffffff')};
`
