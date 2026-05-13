import React, { useEffect, useMemo, useState } from 'react'
import styled, { createGlobalStyle } from 'styled-components'

const LOGO_URL =
  'https://mariage-mickael-valerian.fr/wp-content/uploads/2025/09/B-Photo-e1757072293536.png'

type MomentType = 'text' | 'link' | 'video' | 'music'

type WeddingMoment = {
  time: string
  title: string
  description: string
  type: MomentType
  linkLabel?: string
  linkUrl?: string
  videoUrl?: string
  audioUrl?: string
}

const WEDDING_MOMENTS: WeddingMoment[] = [
  {
    time: '10:30',
    title: 'Preparatifs',
    description:
      'Le debut de la journee. Ajoute ici une note perso, une photo ou un petit souvenir.',
    type: 'text'
  },
  {
    time: '12:00',
    title: 'Ceremonie',
    description:
      'Tu peux mettre un lien vers un album, un drive ou une page externe.',
    type: 'link',
    linkLabel: 'Voir l album ceremonie',
    linkUrl: 'https://photos.mariage-mickael-valerian.fr/golf'
  },
  {
    time: '16:00',
    title: 'Temps forts en video',
    description: 'Zone video. Remplace l URL par celle de ton reel ou de ta video souvenir.',
    type: 'video',
    videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ'
  },
  {
    time: '20:30',
    title: 'Ouverture de bal',
    description:
      'Ajoute ici le morceau de la journee. Le lecteur est pret, il suffit de mettre un mp3.',
    type: 'music',
    audioUrl: ''
  },
  {
    time: '23:30',
    title: 'Photos des invites',
    description: 'Fin de soiree. Redirige vers les photos partagees par tout le monde.',
    type: 'link',
    linkLabel: 'Voir les photos des invites',
    linkUrl: 'https://photos.mariage-mickael-valerian.fr/wall'
  }
]

const GlobalStyle = createGlobalStyle`
  html, body, #root {
    margin: 0;
    width: 100%;
    max-width: 100%;
    overflow-x: hidden;
    background: transparent;
    color: #1f2937;
  }

  *, *::before, *::after { box-sizing: border-box; }
`

function parseMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number)
  return h * 60 + m
}

function nowInMinutes(): number {
  const now = new Date()
  return now.getHours() * 60 + now.getMinutes()
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

const WeddingSouvenirs: React.FC = () => {
  const [timelineProgress, setTimelineProgress] = useState(0)

  const minuteRange = useMemo(() => {
    const points = WEDDING_MOMENTS.map(m => parseMinutes(m.time)).sort((a, b) => a - b)
    return { start: points[0], end: points[points.length - 1] }
  }, [])

  useEffect(() => {
    const updateProgress = () => {
      const current = nowInMinutes()
      const raw = (current - minuteRange.start) / (minuteRange.end - minuteRange.start)
      setTimelineProgress(clamp(raw, 0, 1))
    }

    updateProgress()
    const interval = window.setInterval(updateProgress, 30_000)
    return () => window.clearInterval(interval)
  }, [minuteRange.end, minuteRange.start])

  useEffect(() => {
    const sendHeight = () => {
      const height = Math.max(
        document.body.scrollHeight,
        document.documentElement.scrollHeight,
        document.body.offsetHeight,
        document.documentElement.offsetHeight
      )

      if (window.parent && window.parent !== window) {
        window.parent.postMessage(
          {
            type: 'souvenirs:resize',
            height
          },
          '*'
        )
      }
    }

    sendHeight()
    window.addEventListener('load', sendHeight)
    window.addEventListener('resize', sendHeight)

    const observer = new ResizeObserver(() => sendHeight())
    observer.observe(document.body)

    return () => {
      observer.disconnect()
      window.removeEventListener('load', sendHeight)
      window.removeEventListener('resize', sendHeight)
    }
  }, [])

  return (
    <>
      <GlobalStyle />

      <Page>
        <Hero>
          <Eyebrow>Souvenirs du mariage</Eyebrow>
          <Title>La journee, heure par heure</Title>
          <Lead>
            Une frise vivante pour raconter votre histoire: textes, liens, videos et musique.
            Modifie les contenus a ta guise.
          </Lead>
        </Hero>

        <TimelineSection>
          <TimelineRail>
            <RailLine />
            <MovingIcon style={{ top: `${timelineProgress * 100}%` }}>
              <MovingIconImage src={LOGO_URL} alt="icone timeline" />
            </MovingIcon>
          </TimelineRail>

          <Moments>
            {WEDDING_MOMENTS.map(moment => (
              <MomentCard key={`${moment.time}-${moment.title}`}>
                <MomentTime>{moment.time}</MomentTime>
                <MomentTitle>{moment.title}</MomentTitle>
                <MomentDescription>{moment.description}</MomentDescription>

                {moment.type === 'link' && moment.linkUrl && moment.linkLabel && (
                  <ActionLink href={moment.linkUrl}>{moment.linkLabel}</ActionLink>
                )}

                {moment.type === 'video' && moment.videoUrl && (
                  <VideoWrap>
                    <VideoFrame
                      src={moment.videoUrl}
                      title={`video-${moment.title}`}
                      loading="lazy"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </VideoWrap>
                )}

                {moment.type === 'music' && (
                  <MusicWrap>
                    {moment.audioUrl ? (
                      <audio controls preload="none" src={moment.audioUrl} style={{ width: '100%' }} />
                    ) : (
                      <MusicPlaceholder>
                        Ajoute un URL mp3 dans <code>audioUrl</code> pour activer le player.
                      </MusicPlaceholder>
                    )}
                  </MusicWrap>
                )}
              </MomentCard>
            ))}
          </Moments>
        </TimelineSection>
      </Page>
    </>
  )
}

export default WeddingSouvenirs

const Page = styled.div`
  width: 100%;
  padding: 20px 14px 34px;
  background:
    radial-gradient(1100px 450px at 0% 0%, rgba(220, 252, 231, 0.9), transparent 60%),
    radial-gradient(1000px 400px at 100% 0%, rgba(209, 250, 229, 0.8), transparent 58%),
    #f9fafb;
`

const Hero = styled.header`
  width: 100%;
  max-width: 940px;
  margin: 0 auto 18px;
  padding: 20px 18px;
  border-radius: 20px;
  background: linear-gradient(140deg, #0f3d35 0%, #1e6a57 55%, #59b996 100%);
  color: #ffffff;
  box-shadow: 0 18px 40px rgba(15, 61, 53, 0.25);
`

const Eyebrow = styled.p`
  margin: 0;
  font-size: 0.86rem;
  opacity: 0.88;
  letter-spacing: 0.08em;
  text-transform: uppercase;
`

const Title = styled.h1`
  margin: 8px 0 0;
  font-size: clamp(1.45rem, 4.2vw, 2.1rem);
`

const Lead = styled.p`
  margin: 10px 0 0;
  max-width: 700px;
  line-height: 1.6;
  opacity: 0.95;
`

const TimelineSection = styled.section`
  width: 100%;
  max-width: 940px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: 72px minmax(0, 1fr);
  gap: 12px;

  @media (max-width: 720px) {
    grid-template-columns: 54px minmax(0, 1fr);
    gap: 10px;
  }
`

const TimelineRail = styled.div`
  position: relative;
  min-height: 100%;
`

const RailLine = styled.div`
  position: absolute;
  left: 50%;
  top: 0;
  bottom: 0;
  width: 4px;
  transform: translateX(-50%);
  border-radius: 999px;
  background: linear-gradient(180deg, #1f7a62 0%, #4bb494 100%);
`

const MovingIcon = styled.div`
  position: absolute;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 44px;
  height: 44px;
  border-radius: 50%;
  border: 3px solid #ffffff;
  background: #ffffff;
  box-shadow: 0 10px 24px rgba(13, 64, 57, 0.25);
  overflow: hidden;
  transition: top 700ms ease;

  @media (max-width: 720px) {
    width: 36px;
    height: 36px;
  }
`

const MovingIconImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
`

const Moments = styled.div`
  display: grid;
  gap: 12px;
`

const MomentCard = styled.article`
  background: #ffffff;
  border: 1px solid #d7e4dd;
  border-radius: 16px;
  padding: 14px;
  box-shadow: 0 8px 20px rgba(15, 61, 53, 0.08);
`

const MomentTime = styled.p`
  margin: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 72px;
  padding: 4px 10px;
  border-radius: 999px;
  background: #e9f8f1;
  color: #0f6c53;
  font-weight: 700;
  font-size: 0.9rem;
`

const MomentTitle = styled.h2`
  margin: 10px 0 0;
  font-size: 1.08rem;
  color: #123f35;
`

const MomentDescription = styled.p`
  margin: 8px 0 0;
  color: #3a4b46;
  line-height: 1.55;
`

const ActionLink = styled.a`
  margin-top: 12px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  text-decoration: none;
  padding: 10px 14px;
  border-radius: 10px;
  background: #1f7a62;
  color: #ffffff;
  font-weight: 600;

  &:hover {
    background: #19634f;
  }
`

const VideoWrap = styled.div`
  margin-top: 12px;
  width: 100%;
  border-radius: 12px;
  overflow: hidden;
  background: #0f172a;
`

const VideoFrame = styled.iframe`
  width: 100%;
  aspect-ratio: 16 / 9;
  border: 0;
`

const MusicWrap = styled.div`
  margin-top: 12px;
`

const MusicPlaceholder = styled.p`
  margin: 0;
  padding: 10px 12px;
  border-radius: 10px;
  background: #f3f4f6;
  color: #475569;
  font-size: 0.95rem;
`