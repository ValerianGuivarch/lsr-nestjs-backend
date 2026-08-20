import React, { useMemo, useState } from "react";
import styled, { createGlobalStyle } from "styled-components";

const CRAMPILLONS_PAR_BOITE = 1800;
const AGRAFEUSE_URL = "/agrafeuse.png"; // public/

const GlobalStyle = createGlobalStyle`
  html, body, #root {
    margin: 0;
    width: 100%;
    max-width: 100%;
    overflow-x: hidden;
    background: #0f0f14;
    color: rgba(255,255,255,0.92);
  }
  *, *::before, *::after { box-sizing: border-box; }
`;

const Foussier: React.FC = () => {
  const [metres, setMetres] = useState("");
  const [distance, setDistance] = useState("");
  const [crampillonsParPoteau, setCrampillonsParPoteau] = useState("");

  const calc = useMemo(() => {
    const allPresent =
      metres.trim() !== "" &&
      distance.trim() !== "" &&
      crampillonsParPoteau.trim() !== "";

    if (!allPresent) return { kind: "empty" as const };

    const m = parseNumberFR(metres);
    const d = parseNumberFR(distance);
    const c = parseNumberFR(crampillonsParPoteau);

    if (!Number.isFinite(m) || !Number.isFinite(d) || !Number.isFinite(c)) {
      return {
        kind: "err" as const,
        message: "Valeurs invalides (virgule ou point).",
      };
    }
    if (m <= 0 || d <= 0 || c < 0) {
      return {
        kind: "err" as const,
        message: "Vérifie : mètres > 0, distance > 0, crampillons ≥ 0.",
      };
    }

    const nbPoteaux = Math.ceil(m / d) + 1;
    const nbCrampillons = nbPoteaux * c;

    const nbBoites = Math.ceil(nbCrampillons / CRAMPILLONS_PAR_BOITE);
    const boiteLabel = nbBoites > 1 ? "boîtes" : "boîte";

    return {
      kind: "ok" as const,
      nbPoteaux: Math.trunc(nbPoteaux),
      nbCrampillons: Math.ceil(nbCrampillons),
      nbBoites,
      boiteLabel,
    };
  }, [metres, distance, crampillonsParPoteau]);

  return (
    <>
      <GlobalStyle />
      <Page>
        <Shell>
          {/* HERO */}
          <Hero>
            <HeroTop>
              <Badge>ST315i</Badge>
              <Title>Agrafeuse gaz pour clôtures et grillages</Title>
              <Sub>
                Calcul des poteaux + boîtes de crampillons (
                {CRAMPILLONS_PAR_BOITE} / boîte).
              </Sub>
            </HeroTop>

            <HeroMedia>
              <MediaFrame>
                <MediaImg
                  src={AGRAFEUSE_URL}
                  alt="Agrafeuse ST315i"
                  loading="lazy"
                />
              </MediaFrame>
            </HeroMedia>
          </Hero>

          {/* CALC */}
          <Card>
            <CardTitle>Calcul des besoins</CardTitle>

            <FormGrid>
              <Field>
                <Label htmlFor="m">Mètres linéaires</Label>
                <Input
                  id="m"
                  inputMode="decimal"
                  placeholder="ex : 120"
                  value={metres}
                  onChange={(e) => setMetres(e.target.value)}
                />
              </Field>

              <Field>
                <Label htmlFor="d">Distance entre poteaux (m)</Label>
                <Input
                  id="d"
                  inputMode="decimal"
                  placeholder="ex : 2,5"
                  value={distance}
                  onChange={(e) => setDistance(e.target.value)}
                />
              </Field>

              <Field>
                <Label htmlFor="c">Crampillons par poteau</Label>
                <Input
                  id="c"
                  inputMode="decimal"
                  placeholder="ex : 6"
                  value={crampillonsParPoteau}
                  onChange={(e) => setCrampillonsParPoteau(e.target.value)}
                />
              </Field>
            </FormGrid>

            {calc.kind === "err" && (
              <Status>
                <StatusDot />
                <span>{calc.message}</span>
              </Status>
            )}

            {calc.kind === "ok" && (
              <Results>
                <ResultTile>
                  <ResultK>Poteaux</ResultK>
                  <ResultV>{calc.nbPoteaux}</ResultV>
                </ResultTile>

                <ResultTile $accent>
                  <ResultK>Crampillons</ResultK>
                  <ResultV>{calc.nbCrampillons}</ResultV>
                  <ResultSmall>estimés</ResultSmall>
                </ResultTile>

                <ResultTile $accent>
                  <ResultK>Boîtes</ResultK>
                  <ResultV>
                    {calc.nbBoites}{" "}
                    <span style={{ fontWeight: 900 }}>{calc.boiteLabel}</span>
                  </ResultV>
                  <ResultSmall>{CRAMPILLONS_PAR_BOITE} / boîte</ResultSmall>
                </ResultTile>
              </Results>
            )}
          </Card>

          {/* CONTACT */}
          <ContactCard>
            <ContactTop>
              <ContactLabel>Mon technico-commercial</ContactLabel>
              <ContactName>Laurent GUIVARCH</ContactName>
            </ContactTop>

            <ContactList>
              <ContactItem>
                <Icon>📞</Icon>
                <a href="tel:+33665821484">06 65 82 14 84</a>
              </ContactItem>
              <ContactItem>
                <Icon>✉️</Icon>
                <a href="mailto:l.guivarch@foussier.fr">
                  l.guivarch@foussier.fr
                </a>
              </ContactItem>
            </ContactList>

            <LogoBar aria-label="Foussier">
              <LogoText>FOUSSIER</LogoText>
            </LogoBar>
          </ContactCard>
        </Shell>
      </Page>
    </>
  );
};

export default Foussier;

/* ---------- utils ---------- */
function parseNumberFR(s: string): number {
  const cleaned = (s ?? "").trim().replace(/\s+/g, "").replace(",", ".");
  if (!cleaned) return Number.NaN;
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : Number.NaN;
}

/* ---------- styles ---------- */

const Page = styled.div`
  min-height: 100vh;
  background: radial-gradient(
      1100px 520px at 15% -10%,
      rgba(255, 140, 60, 0.55),
      transparent 60%
    ),
    radial-gradient(
      900px 520px at 110% 0%,
      rgba(255, 92, 0, 0.4),
      transparent 55%
    ),
    linear-gradient(180deg, #ff7a1a 0%, #ff5c00 34%, #151827 78%, #0f1320 100%);
`;

const Shell = styled.div`
  max-width: 920px; /* mono-colonne mais plus large sur PC */
  margin: 0 auto;
  padding: max(16px, env(safe-area-inset-top))
    max(14px, env(safe-area-inset-right)) max(18px, env(safe-area-inset-bottom))
    max(14px, env(safe-area-inset-left));
  display: grid;
  gap: 14px;

  @media (min-width: 1100px) {
    max-width: 980px;
  }
`;

const glass = `
  background: rgba(18, 22, 34, 0.58);
  border: 1px solid rgba(255,255,255,0.10);
  box-shadow: 0 18px 60px rgba(0,0,0,0.35);
  backdrop-filter: blur(12px);
`;

const Hero = styled.div`
  ${glass}
  border-radius: 18px;
  overflow: hidden;
`;

const HeroTop = styled.div`
  padding: 16px 16px 14px;
`;

const Badge = styled.span`
  display: inline-flex;
  align-items: center;
  padding: 6px 10px;
  border-radius: 999px;
  font-weight: 950;
  letter-spacing: 0.2px;
  color: rgba(255, 255, 255, 0.96);
  background: linear-gradient(
    90deg,
    rgba(255, 92, 0, 0.95),
    rgba(255, 170, 90, 0.72)
  );
  border: 1px solid rgba(255, 255, 255, 0.18);
`;

const Title = styled.h1`
  margin: 10px 0 6px;
  font-size: 20px;
  line-height: 1.15;
  color: rgba(255, 255, 255, 0.96);

  @media (min-width: 520px) {
    font-size: 24px;
  }
`;

const Sub = styled.div`
  font-size: 13px;
  line-height: 1.25rem;
  opacity: 0.85;
  max-width: 70ch;
`;

const HeroMedia = styled.div`
  padding: 0 12px 14px;
`;

const MediaFrame = styled.div`
  border-radius: 16px;
  overflow: hidden;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.14);
  display: grid;
  place-items: center;
  padding: 10px;
`;

const MediaImg = styled.img`
  width: min(360px, 70%); /* ~70% de l’ancien rendu */
  height: auto;
  max-height: 200px;
  object-fit: contain;
  filter: drop-shadow(0 18px 28px rgba(0, 0, 0, 0.35));

  @media (min-width: 520px) {
    max-height: 220px;
    width: min(420px, 70%);
  }
`;

const Card = styled.div`
  ${glass}
  border-radius: 18px;
  padding: 16px;
`;

const CardTitle = styled.div`
  font-weight: 950;
  letter-spacing: 0.2px;
  margin-bottom: 12px;
`;

const FormGrid = styled.div`
  display: grid;
  gap: 12px;

  @media (min-width: 720px) {
    grid-template-columns: 1fr 1fr;
  }
`;

const Field = styled.div`
  min-width: 0;
`;

const Label = styled.label`
  display: block;
  font-size: 12.5px;
  opacity: 0.92;
  margin-bottom: 6px;
`;

const Input = styled.input`
  width: 100%;
  min-width: 0;
  padding: 12px 12px;
  border-radius: 14px;

  border: 1px solid rgba(255, 255, 255, 0.16);
  background: rgba(255, 255, 255, 0.07);
  color: rgba(255, 255, 255, 0.92);
  outline: none;
  font-size: 16px;

  &::placeholder {
    color: rgba(255, 255, 255, 0.44);
  }

  &:focus {
    border-color: rgba(255, 160, 90, 0.55);
    box-shadow: 0 0 0 3px rgba(255, 92, 0, 0.18);
  }
`;

const Status = styled.div`
  margin-top: 12px;
  padding: 10px 12px;
  border-radius: 14px;
  display: flex;
  gap: 10px;
  align-items: flex-start;
  border: 1px solid rgba(255, 80, 80, 0.26);
  background: rgba(255, 255, 255, 0.06);

  span {
    line-height: 1.25rem;
    opacity: 0.94;
  }
`;

const StatusDot = styled.div`
  width: 10px;
  height: 10px;
  border-radius: 999px;
  margin-top: 3px;
  background: rgba(255, 80, 80, 0.95);
`;

const Results = styled.div`
  margin-top: 12px;
  display: grid;
  gap: 10px;

  @media (min-width: 520px) {
    grid-template-columns: 1fr 1fr 1fr;
  }
`;

const ResultTile = styled.div<{ $accent?: boolean }>`
  border-radius: 16px;
  padding: 12px 12px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: ${({ $accent }) =>
    $accent
      ? "linear-gradient(180deg, rgba(255,92,0,0.22), rgba(255,255,255,0.05))"
      : "rgba(255,255,255,0.06)"};
`;

const ResultK = styled.div`
  font-size: 12px;
  opacity: 0.8;
`;

const ResultV = styled.div`
  margin-top: 8px;
  font-size: 20px;
  font-weight: 950;
`;

const ResultSmall = styled.div`
  margin-top: 6px;
  font-size: 12px;
  opacity: 0.72;
`;

const ContactCard = styled.div`
  background: rgba(255, 255, 255, 0.95);
  color: rgba(18, 20, 26, 0.92);
  border-radius: 18px;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.18);
  box-shadow: 0 18px 60px rgba(0, 0, 0, 0.35);
`;

const ContactTop = styled.div`
  padding: 16px 16px 10px;
`;

const ContactLabel = styled.div`
  font-size: 13px;
  opacity: 0.7;
  font-weight: 700;
`;

const ContactName = styled.div`
  margin-top: 6px;
  font-size: 22px;
  font-weight: 950;
  letter-spacing: 0.2px;
`;

const ContactList = styled.div`
  padding: 0 16px 16px;
  display: grid;
  gap: 10px;
`;

const ContactItem = styled.div`
  display: flex;
  gap: 10px;
  align-items: center;
  font-size: 16px;

  a {
    color: inherit;
    text-decoration: none;
    font-weight: 800;
    opacity: 0.92;
  }

  a:hover {
    text-decoration: underline;
  }
`;

const Icon = styled.span`
  width: 22px;
  display: inline-grid;
  place-items: center;
  opacity: 0.85;
`;

const LogoBar = styled.div`
  padding: 14px 16px;
  background: linear-gradient(90deg, #ff5c00, #ff7a1a);
  display: grid;
  place-items: center;
`;

const LogoText = styled.div`
  color: white;
  font-weight: 950;
  letter-spacing: 1px;
  font-size: 18px;
`;
