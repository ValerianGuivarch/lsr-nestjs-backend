import React, { useEffect, useRef, useState } from 'react'
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

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

const WeddingSouvenirs: React.FC = () => {
  const [timelineProgress, setTimelineProgress] = useState(0)
  const timelineRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    const updateProgress = () => {
      if (!timelineRef.current) return

      // Dans une iframe, on track le scroll du document
      const timelineTop = timelineRef.current.offsetTop
      const timelineHeight = timelineRef.current.scrollHeight
      const currentScroll = window.scrollY

      // Position relative du scroll par rapport au début de la timeline
      const relativeScroll = currentScroll - timelineTop
      const progress = relativeScroll / timelineHeight

      setTimelineProgress(clamp(progress, 0, 1))
    }

    updateProgress()
    window.addEventListener('scroll', updateProgress, { passive: true })
    window.addEventListener('resize', updateProgress)

    return () => {
      window.removeEventListener('scroll', updateProgress)
      window.removeEventListener('resize', updateProgress)
    }
  }, [])

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

        <TimelineSection ref={timelineRef}>
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
  padding: 32px 0 48px;
  background: #f7faf9;
  min-height: 100vh;
  overflow: visible;
`

const Hero = styled.header`
  width: 100%;
  max-width: 900px;
  margin: 0 auto 28px;
  padding: 28px 24px 22px;
  border-radius: 24px;
  background: linear-gradient(120deg, #5fc89a 0%, #3ba87c 100%);
  color: #fff;
  box-shadow: 0 6px 32px rgba(63, 200, 154, 0.10);
  text-align: left;
`

const Eyebrow = styled.p`
  margin: 0;
  font-size: 0.92rem;
  opacity: 0.92;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  font-weight: 600;
`

const Title = styled.h1`
  margin: 10px 0 0;
  font-size: clamp(1.7rem, 4vw, 2.3rem);
  font-weight: 700;
  letter-spacing: -0.5px;
`

const Lead = styled.p`
  margin: 12px 0 0;
  max-width: 700px;
  line-height: 1.6;
  opacity: 0.97;
  font-size: 1.08rem;
`

const TimelineSection = styled.section`
  width: 100%;
  max-width: 900px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: 60px minmax(0, 1fr);
  gap: 18px;
  overflow: visible;

  @media (max-width: 720px) {
    grid-template-columns: 38px minmax(0, 1fr);
    gap: 8px;
  }
`

const TimelineRail = styled.div`
  position: relative;
  min-height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
`

const RailLine = styled.div`
  position: absolute;
  left: 50%;
  top: 0;
  bottom: 0;
  width: 5px;
  transform: translateX(-50%);
  border-radius: 999px;
  background: linear-gradient(180deg, #3ba87c 0%, #5fc89a 100%);
  box-shadow: 0 0 0 2px #e6f4ed;
`

const MovingIcon = styled.div`
  position: absolute;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 38px;
  height: 38px;
  border-radius: 50%;
  border: 2.5px solid #fff;
  background: #fff;
  box-shadow: 0 4px 16px rgba(63, 200, 154, 0.13);
  overflow: hidden;
  transition: top 700ms cubic-bezier(.7,.2,.2,1);

  @media (max-width: 720px) {
    width: 28px;
    height: 28px;
  }
`

const MovingIconImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
`

const Moments = styled.div`
  display: grid;
  gap: 18px;
  overflow: visible;
`

const MomentCard = styled.article`
  background: #fff;
  border: 1.5px solid #e2efe7;
  border-radius: 18px;
  padding: 18px 18px 14px;
  box-shadow: 0 2px 10px rgba(63, 200, 154, 0.07);
  transition: box-shadow 0.2s;
  &:hover {
    box-shadow: 0 6px 24px rgba(63, 200, 154, 0.13);
  }
`

const MomentTime = styled.p`
  margin: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 62px;
  padding: 4px 10px;
  border-radius: 999px;
  background: #e6f4ed;
  color: #3ba87c;
  font-weight: 700;
  font-size: 0.98rem;
  letter-spacing: 0.01em;
`

const MomentTitle = styled.h2`
  margin: 10px 0 0;
  font-size: 1.13rem;
  color: #217a5c;
  font-weight: 700;
`

const MomentDescription = styled.p`
  margin: 8px 0 0;
  color: #3a4b46;
  line-height: 1.55;
  font-size: 1.01rem;
`

const ActionLink = styled.a`
  margin-top: 14px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  text-decoration: none;
  padding: 10px 18px;
  border-radius: 999px;
  background: #3ba87c;
  color: #fff;
  font-weight: 600;
  font-size: 1.01rem;
  box-shadow: 0 1px 4px rgba(63, 200, 154, 0.08);
  transition: background 0.18s;
  &:hover {
    background: #217a5c;
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