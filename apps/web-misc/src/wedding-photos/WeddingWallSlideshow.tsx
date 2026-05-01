import React, { useEffect, useRef, useState } from "react";
import styled, { createGlobalStyle } from "styled-components";
import axios from "axios";
import config from "../config/config";

const API_URL = `/apil7r/v1/wedding-photos`;

type PhotoItem = {
  id: string;
  createdAt: string;
  url: string;
  thumbUrl: string;
};

type LatestResponse = { ok: true; items: PhotoItem[] };

const DISPLAY_MS = 6500;
const FADE_MS = 900;
const CONTROLS_AUTOHIDE_MS = 2500;

const GlobalStyle = createGlobalStyle`
  html, body, #root {
    margin: 0;
    width: 100%;
    max-width: 100%;
    overflow: hidden;
    background: #000;
  }
  *, *::before, *::after { box-sizing: border-box; }
`;

function normalizeUrl(u: string): string {
  if (!u) return u;
  if (u.startsWith("http://") || u.startsWith("https://")) return u;
  if (u.startsWith("/")) return `${config.BASE_URL}${u}`;
  return u;
}

function preloadImage(src: string): Promise<void> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve();
    img.onerror = () => resolve();
    img.src = src;
  });
}

function pickRandomDifferent(items: PhotoItem[], lastId?: string): PhotoItem {
  if (items.length <= 1) return items[0];
  const candidates = lastId ? items.filter((it) => it.id !== lastId) : items;
  const pool = candidates.length ? candidates : items;
  return pool[Math.floor(Math.random() * pool.length)];
}

export default function WeddingWallSlideshow() {
  const stageRef = useRef<HTMLDivElement | null>(null);

  const [current, setCurrent] = useState<PhotoItem | null>(null);

  // couche “next” par-dessus current, qui fade-in
  const [next, setNext] = useState<PhotoItem | null>(null);
  const [nextOpacity, setNextOpacity] = useState(0);

  const [status, setStatus] = useState<string>("Chargement…");

  const [playing, setPlaying] = useState(true);

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [currentOpacity, setCurrentOpacity] = useState(1);

  const runningRef = useRef(false);
  const currentRef = useRef<PhotoItem | null>(null);
  const timerRef = useRef<number | null>(null);
  const hideCtlTimerRef = useRef<number | null>(null);

  const fetchItems = async (): Promise<PhotoItem[]> => {
    const res = await axios.get<LatestResponse>(`${API_URL}/latest`, {
      params: { limit: 200 },
      timeout: 20_000,
    });
    const items = res.data?.items ?? [];
    return items.map((it) => ({
      ...it,
      url: normalizeUrl(it.url),
      thumbUrl: normalizeUrl(it.thumbUrl),
    }));
  };

  const scheduleHideControls = () => {
    if (!isFullscreen) return;
    if (hideCtlTimerRef.current) window.clearTimeout(hideCtlTimerRef.current);
    hideCtlTimerRef.current = window.setTimeout(() => {
      setShowControls(false);
    }, CONTROLS_AUTOHIDE_MS);
  };

  const ensureControlsVisible = () => {
    setShowControls(true);
    scheduleHideControls();
  };

  const showFirst = async () => {
    try {
      const items = await fetchItems();
      if (items.length === 0) {
        setStatus("En attente de photos…");
        return;
      }
      const first = items[0]; // dernière prise (plus récente)
      await preloadImage(first.url);

      currentRef.current = first;
      setCurrent(first);
      setStatus("");
    } catch (e: any) {
      setStatus(`Erreur latest: ${e?.message ?? e}`);
    }
  };

  const crossfadeTo = async (chosen: PhotoItem) => {
    await preloadImage(chosen.url);

    // Prépare la couche next
    setNext(chosen);
    setNextOpacity(0);

    // Prépare le fade-out du current
    setCurrentOpacity(1);

    // Lance les transitions au frame suivant
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setNextOpacity(1); // fade-in next
        setCurrentOpacity(0); // fade-out current
      });
    });

    window.setTimeout(() => {
      // IMPORTANT: commit SANS transition visible
      // 1) on met le nouveau current
      currentRef.current = chosen;
      setCurrent(chosen);

      // 2) on retire next
      setNext(null);
      setNextOpacity(0);

      // 3) on remet l’opacité du current à 1 SANS transition
      // Pour ça, on passe Layer current en transition=false (voir plus bas)
      setCurrentOpacity(1);

      runningRef.current = false;
    }, FADE_MS);
  };

  const advance = async (opts?: { preferLatest?: boolean }) => {
    if (runningRef.current) return;
    runningRef.current = true;

    try {
      const items = await fetchItems();
      if (items.length === 0) {
        setStatus("En attente de photos…");
        runningRef.current = false;
        return;
      }

      const last = currentRef.current;

      // si aucune photo affichée : on force “dernière prise”
      if (!last) {
        const first = items[0];
        await preloadImage(first.url);
        currentRef.current = first;
        setCurrent(first);
        setStatus("");
        runningRef.current = false;
        return;
      }

      const chosen = opts?.preferLatest
        ? items[0].id === last.id
          ? pickRandomDifferent(items, last.id)
          : items[0]
        : pickRandomDifferent(items, last.id);

      await crossfadeTo(chosen);
    } catch (e: any) {
      setStatus(`Erreur: ${e?.message ?? e}`);
      runningRef.current = false;
    }
  };

  // Loop play/pause
  useEffect(() => {
    if (!playing) {
      if (timerRef.current) window.clearInterval(timerRef.current);
      timerRef.current = null;
      return;
    }

    if (timerRef.current) window.clearInterval(timerRef.current);
    timerRef.current = window.setInterval(() => {
      void advance();
    }, DISPLAY_MS);

    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
      timerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing]);

  // Init
  useEffect(() => {
    void showFirst();
    return () => {
      if (hideCtlTimerRef.current) window.clearTimeout(hideCtlTimerRef.current);
    };
  }, []);

  // Fullscreen tracking
  useEffect(() => {
    const onFs = () => {
      const fs = Boolean(document.fullscreenElement);
      setIsFullscreen(fs);
      setShowControls(true);
      if (fs) scheduleHideControls();
    };
    document.addEventListener("fullscreenchange", onFs);
    return () => document.removeEventListener("fullscreenchange", onFs);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isFullscreen]);

  const enterFullscreen = async () => {
    ensureControlsVisible();
    const el = stageRef.current;
    if (!el) return;
    try {
      await el.requestFullscreen();
    } catch {
      // ignore
    }
  };

  const exitFullscreen = async () => {
    ensureControlsVisible();
    try {
      await document.exitFullscreen();
    } catch {
      // ignore
    }
  };

  const onStageClick = () => {
    // plein écran : clic => affiche/masque contrôles (comme tu veux)
    if (isFullscreen) {
      if (showControls) {
        setShowControls(false);
      } else {
        ensureControlsVisible();
      }
      return;
    }

    // mode normal : clic => prochaine photo (utile en pause)
    void advance();
  };

  return (
    <>
      <GlobalStyle />
      <Page>
        <Stage ref={stageRef} onClick={onStageClick}>
          {/* current stable */}
          {current && (
            <Layer
              $src={current.url}
              $opacity={currentOpacity}
              $transition={Boolean(next)} // ✅ transition uniquement pendant un crossfade
            />
          )}

          {/* next fade-in */}
          {next && <Layer $src={next.url} $opacity={nextOpacity} $transition />}

          {!current && (
            <Empty>
              <EmptyText>{status}</EmptyText>
            </Empty>
          )}

          {/* Controls */}
          {showControls && (
            <Controls onClick={(e) => e.stopPropagation()}>
              {!isFullscreen && (
                <Left>
                  <Btn onClick={() => setPlaying((p) => !p)}>
                    {playing ? "Pause" : "Play"}
                  </Btn>
                </Left>
              )}

              <Right>
                {!isFullscreen ? (
                  <Btn onClick={() => void enterFullscreen()}>Plein écran</Btn>
                ) : (
                  <Btn onClick={() => void exitFullscreen()}>
                    Quitter plein écran
                  </Btn>
                )}
              </Right>
            </Controls>
          )}
        </Stage>
      </Page>
    </>
  );
}

/* ===== styles ===== */

const Page = styled.div`
  position: fixed;
  inset: 0;
  background: #000;
  overflow: hidden;
`;

const Stage = styled.div`
  position: absolute;
  inset: 0;
  overflow: hidden;
  cursor: pointer;
`;

const Layer = styled.div<{
  $src: string;
  $opacity: number;
  $transition: boolean;
}>`
  position: absolute;
  inset: 0;
  background-image: url(${(p) => p.$src});
  background-size: contain;
  background-position: center;
  background-repeat: no-repeat;

  opacity: ${(p) => p.$opacity};
  transition: ${(p) => (p.$transition ? `opacity ${FADE_MS}ms ease` : "none")};
  will-change: opacity;
`;

const Controls = styled.div`
  position: absolute;
  left: 14px;
  right: 14px;
  bottom: 14px;
  display: flex;
  justify-content: space-between;
  gap: 10px;
  pointer-events: auto;
`;

const Left = styled.div`
  display: flex;
  gap: 10px;
`;

const Right = styled.div`
  display: flex;
  gap: 10px;
`;

const Btn = styled.button<{ $danger?: boolean }>`
  appearance: none;
  border: 1px solid rgba(255, 255, 255, 0.16);
  background: ${(p) =>
    p.$danger ? "rgba(255, 70, 70, 0.22)" : "rgba(0, 0, 0, 0.45)"};
  color: rgba(255, 255, 255, 0.92);
  border-radius: 999px;
  padding: 10px 14px;
  font-weight: 800;
  backdrop-filter: blur(10px);
  cursor: pointer;
`;

const Empty = styled.div`
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  color: #fff;
  text-align: center;
  padding: 16px;
`;

const EmptyText = styled.div`
  opacity: 0.85;
  font-size: 14px;
  overflow-wrap: anywhere;
`;
