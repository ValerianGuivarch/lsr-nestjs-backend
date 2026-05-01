import React, { useRef, useState } from "react";
import styled, { keyframes, createGlobalStyle } from "styled-components";
import axios, { AxiosProgressEvent } from "axios";
import {
  FaCloudUploadAlt,
  FaCheckCircle,
  FaExclamationTriangle,
} from "react-icons/fa";

const API_URL = `/apil7r/v1/wedding-photos`;
const GOLF_URL_1 = `https://l7r.fr/l7r/golf1.png`;
const GOLF_URL_2 = `https://l7r.fr/l7r/golf2.png`;
const GOLF_URL = Math.random() < 0.5 ? GOLF_URL_1 : GOLF_URL_2;

const MAX_DIMENSION = 2000;
const JPEG_QUALITY = 0.82;
const PREVIEW_DIMENSION = 520;

type StatusKind = "idle" | "ok" | "err";
type Status = { kind: StatusKind; text: string };

const GlobalStyle = createGlobalStyle`
  html, body, #root {
    margin: 0;
    width: 100%;
    max-width: 100%;
    overflow-x: hidden;
    background: #121522;
    color: rgba(255,255,255,0.92);
  }
  *, *::before, *::after { box-sizing: border-box; }
`;

const WeddingGolf: React.FC = () => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [jpegBlob, setJpegBlob] = useState<Blob | null>(null);

  const [status, setStatus] = useState<Status>({ kind: "idle", text: "" });
  const [isUploading, setIsUploading] = useState(false);
  const [uploadPct, setUploadPct] = useState<number>(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const openCamera = () => {
    if (!isUploading) fileInputRef.current?.click();
  };

  const onPick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setStatus({ kind: "idle", text: "" });
    setUploadPct(0);

    const file = e.target.files?.[0];
    if (!file) return;

    // 🔥 preview immédiate
    setPreviewUrl(URL.createObjectURL(file));

    setIsProcessing(true);

    try {
      const { blob, previewDataUrl } = await fileToJpegAndPreview(
        file,
        MAX_DIMENSION,
        JPEG_QUALITY,
        PREVIEW_DIMENSION,
      );

      setJpegBlob(blob);

      // optionnel (remplace par version compressée)
      setPreviewUrl(previewDataUrl);
    } catch (err: any) {
      setStatus({
        kind: "err",
        text: `Impossible de préparer la photo : ${err?.message ?? err}`,
      });
    }

    setIsProcessing(false);
  };

  const upload = async () => {
    if (!jpegBlob || isUploading) return;

    setIsUploading(true);
    setUploadPct(0);
    setStatus({ kind: "idle", text: "Envoi en cours…" });

    try {
      const fd = new FormData();
      fd.append("file", jpegBlob, "photo.jpg");

      const response = await axios.post(`${API_URL}/upload-golf`, fd, {
        timeout: 60_000,
        onUploadProgress: (evt: AxiosProgressEvent) => {
          if (!evt.total) return;
          const pct = Math.round((evt.loaded * 100) / evt.total);
          setUploadPct(Math.max(0, Math.min(100, pct)));
        },
      });

      if (!response.data?.ok) throw new Error("Réponse API inattendue");
      setStatus({ kind: "ok", text: "Merci ! Photo envoyée ✅" });
    } catch (err: any) {
      setStatus({
        kind: "err",
        text: `Échec de l’envoi : ${
          err?.response?.data?.message ?? err?.message ?? err
        }`,
      });
      setIsUploading(false);
      return;
    }

    setIsUploading(false);
  };

  const canSend = Boolean(jpegBlob) && !isUploading;

  return (
    <>
      <GlobalStyle />

      <Page>
        <Card>
          <Header>
            <Logo
              src={GOLF_URL}
              alt=""
              onError={(e) =>
                ((e.currentTarget as HTMLImageElement).style.display = "none")
              }
            />
            <HeaderText>
              <Title>Photo - Mini Golf</Title>
              <Subtitle>
                Appuie sur l’image pour prendre (ou refaire) une photo.
              </Subtitle>
            </HeaderText>
          </Header>

          <HiddenInput
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={onPick}
          />

          <PhotoPanel
            role="button"
            tabIndex={0}
            aria-label="Prendre une photo"
            onClick={openCamera}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") openCamera();
            }}
          >
            {previewUrl ? (
              <>
                <PhotoBg $src={previewUrl} />
                <PhotoShade />
                <PhotoHint>
                  <HintPill>↺ Appuie pour refaire</HintPill>
                </PhotoHint>
              </>
            ) : (
              <Empty>
                <EmptyIcon>📷</EmptyIcon>
                <EmptyTitle>Appuie ici</EmptyTitle>
                <EmptyText>pour prendre une photo</EmptyText>
              </Empty>
            )}

            {isUploading && (
              <Overlay onClick={(e) => e.stopPropagation()}>
                <Spinner />
                <OverlayTitle>Envoi…</OverlayTitle>
                <ProgressWrap aria-label={`Progression ${uploadPct}%`}>
                  <ProgressFill style={{ width: `${uploadPct}%` }} />
                </ProgressWrap>
                <OverlaySub>{uploadPct}%</OverlaySub>
              </Overlay>
            )}
            {isProcessing && (
              <Overlay onClick={(e) => e.stopPropagation()}>
                <Spinner />
                <OverlayTitle>Préparation de la photo…</OverlayTitle>
              </Overlay>
            )}
          </PhotoPanel>

          {status.text && (
            <StatusLine $kind={status.kind}>
              {status.kind === "ok" ? (
                <FaCheckCircle />
              ) : status.kind === "err" ? (
                <FaExclamationTriangle />
              ) : null}
              <span>{status.text}</span>
            </StatusLine>
          )}

          <StickyBottom>
            <SendButton onClick={upload} disabled={!canSend} $ready={canSend}>
              <FaCloudUploadAlt /> {isUploading ? "Envoi…" : "Envoyer"}
            </SendButton>
          </StickyBottom>
        </Card>
      </Page>
    </>
  );
};

export default WeddingGolf;

/* ---------- image utils ---------- */

async function fileToJpegAndPreview(
  file: File,
  uploadMaxDim: number,
  uploadQuality: number,
  previewMaxDim: number,
): Promise<{ blob: Blob; previewDataUrl: string }> {
  const dataUrl = await readAsDataURL(file);
  const img = await loadImage(dataUrl);

  const up = fitWithin(img.naturalWidth, img.naturalHeight, uploadMaxDim);
  const upCanvas = document.createElement("canvas");
  upCanvas.width = up.width;
  upCanvas.height = up.height;

  const upCtx = upCanvas.getContext("2d");
  if (!upCtx) throw new Error("Canvas non disponible");
  upCtx.drawImage(img, 0, 0, up.width, up.height);

  const blob: Blob = await new Promise((resolve, reject) => {
    upCanvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("canvas.toBlob a échoué"))),
      "image/jpeg",
      uploadQuality,
    );
  });

  const pv = fitWithin(img.naturalWidth, img.naturalHeight, previewMaxDim);
  const pvCanvas = document.createElement("canvas");
  pvCanvas.width = pv.width;
  pvCanvas.height = pv.height;

  const pvCtx = pvCanvas.getContext("2d");
  if (!pvCtx) throw new Error("Canvas non disponible");
  pvCtx.drawImage(img, 0, 0, pv.width, pv.height);

  const previewDataUrl = pvCanvas.toDataURL("image/jpeg", 0.78);
  return { blob, previewDataUrl };
}

function fitWithin(w: number, h: number, maxDim: number) {
  const scale = Math.min(1, maxDim / Math.max(w, h));
  return { width: Math.round(w * scale), height: Math.round(h * scale) };
}

function readAsDataURL(file: File) {
  return new Promise<string>((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = () => reject(new Error("Lecture fichier impossible"));
    r.readAsDataURL(file);
  });
}

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Image illisible"));
    img.src = src;
  });
}

/* ---------- styles ---------- */

const Page = styled.div`
  position: fixed;
  inset: 0;
  overflow-x: hidden;
  overflow-y: auto;

  background:
    radial-gradient(
      1100px 520px at 18% -10%,
      rgba(255, 255, 255, 0.18),
      transparent 60%
    ),
    radial-gradient(
      1000px 520px at 100% 0%,
      rgba(255, 255, 255, 0.12),
      transparent 55%
    ),
    linear-gradient(180deg, #171a27 0%, #121522 100%);

  padding-top: max(12px, env(safe-area-inset-top));
  padding-bottom: max(12px, env(safe-area-inset-bottom));
  padding-left: max(12px, env(safe-area-inset-left));
  padding-right: max(12px, env(safe-area-inset-right));
`;

const Card = styled.div`
  width: 100%;
  max-width: 680px;
  margin: 0 auto;
  min-width: 0;

  padding: 14px;
  border-radius: 18px;

  color: rgba(255, 255, 255, 0.92);
  background: rgba(26, 30, 44, 0.72);
  border: 1px solid rgba(255, 255, 255, 0.12);
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.35);
  backdrop-filter: blur(12px);
  overflow: hidden;
`;

const Header = styled.div`
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 12px;
  align-items: center;
  min-width: 0;
`;

const Logo = styled.img`
  width: 52px;
  height: 52px;
  border-radius: 14px;
  object-fit: cover;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.18);
`;

const HeaderText = styled.div`
  min-width: 0;
`;

const Title = styled.h1`
  margin: 0;
  font-size: 20px;
  line-height: 1.1;
  color: rgba(255, 255, 255, 0.96);
`;

const Subtitle = styled.div`
  margin-top: 4px;
  opacity: 0.86;
  font-size: 13px;
  line-height: 1.2;
  overflow-wrap: anywhere;
`;

const HiddenInput = styled.input`
  display: none;
`;

const PhotoPanel = styled.div`
  position: relative;
  margin-top: 14px;
  width: 100%;
  border-radius: 18px;
  overflow: hidden;

  border: 1px solid rgba(255, 255, 255, 0.14);
  background: rgba(255, 255, 255, 0.06);
  cursor: pointer;
  outline: none;

  aspect-ratio: 4 / 5;
  min-height: 240px;

  @media (min-width: 520px) {
    aspect-ratio: 16 / 10;
    min-height: 300px;
  }

  &:focus-visible {
    box-shadow: 0 0 0 3px rgba(255, 255, 255, 0.2);
  }
`;

const PhotoBg = styled.div<{ $src: string }>`
  position: absolute;
  inset: 0;
  background-image: url(${(p) => p.$src});
  background-size: cover;
  background-position: center;
  transform: scale(1.001);
`;

const PhotoShade = styled.div`
  position: absolute;
  inset: 0;
  background: linear-gradient(
    to bottom,
    rgba(0, 0, 0, 0) 35%,
    rgba(0, 0, 0, 0.3) 100%
  );
`;

const PhotoHint = styled.div`
  position: absolute;
  left: 12px;
  right: 12px;
  bottom: 12px;
  display: flex;
  justify-content: flex-end;
`;

const HintPill = styled.div`
  max-width: 100%;
  padding: 8px 12px;
  border-radius: 999px;
  background: rgba(0, 0, 0, 0.35);
  border: 1px solid rgba(255, 255, 255, 0.16);
  backdrop-filter: blur(8px);
  font-size: 12.5px;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.92);
  overflow-wrap: anywhere;
`;

const Empty = styled.div`
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  text-align: center;
  padding: 14px;
  color: rgba(255, 255, 255, 0.92);
`;

const EmptyIcon = styled.div`
  font-size: 34px;
`;

const EmptyTitle = styled.div`
  margin-top: 8px;
  font-weight: 900;
  font-size: 16px;
  color: rgba(255, 255, 255, 0.96);
`;

const EmptyText = styled.div`
  margin-top: 4px;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.82);
`;

const StickyBottom = styled.div`
  position: sticky;
  bottom: 0;
  margin-top: 14px;
  padding-top: 10px;
  background: linear-gradient(
    to bottom,
    rgba(26, 30, 44, 0) 0%,
    rgba(26, 30, 44, 0.86) 30%,
    rgba(26, 30, 44, 0.96) 100%
  );
`;

const SendButton = styled.button<{ $ready: boolean }>`
  width: 100%;
  padding: 12px 14px;
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.16);

  background: ${(p) =>
    p.$ready ? "rgba(255, 255, 255, 0.18)" : "rgba(255, 255, 255, 0.08)"};

  color: rgba(255, 255, 255, 0.92);
  display: inline-flex;
  gap: 10px;
  align-items: center;
  justify-content: center;
  font-weight: 900;
  cursor: pointer;

  &:disabled {
    opacity: 0.55;
    cursor: not-allowed;
  }
`;

const FinePrint = styled.div`
  margin-top: 8px;
  opacity: 0.75;
  font-size: 12.5px;
  line-height: 1.2rem;
  text-align: center;
`;

const StatusLine = styled.div<{ $kind: StatusKind }>`
  margin-top: 12px;
  padding: 10px 12px;
  border-radius: 14px;
  display: flex;
  gap: 10px;
  align-items: flex-start;

  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(255, 255, 255, 0.06);

  ${(p) =>
    p.$kind === "ok"
      ? `border-color: rgba(0, 255, 120, 0.24);`
      : p.$kind === "err"
        ? `border-color: rgba(255, 80, 80, 0.26);`
        : ""}

  span {
    white-space: pre-wrap;
    line-height: 1.25rem;
    overflow-wrap: anywhere;
  }
`;

const spin = keyframes`
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
`;

const Overlay = styled.div`
  position: absolute;
  inset: 0;
  background: rgba(10, 12, 16, 0.62);
  display: grid;
  place-items: center;
  align-content: center;
  gap: 10px;
  padding: 16px;
`;

const Spinner = styled.div`
  width: 42px;
  height: 42px;
  border-radius: 50%;
  border: 3px solid rgba(255, 255, 255, 0.22);
  border-top-color: rgba(255, 255, 255, 0.92);
  animation: ${spin} 0.9s linear infinite;
`;

const OverlayTitle = styled.div`
  font-weight: 900;
`;

const OverlaySub = styled.div`
  opacity: 0.78;
  font-size: 13px;
`;

const ProgressWrap = styled.div`
  width: min(320px, 88%);
  height: 10px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.12);
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.14);
`;

const ProgressFill = styled.div`
  height: 100%;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.72);
  width: 0%;
  transition: width 140ms ease;
`;
