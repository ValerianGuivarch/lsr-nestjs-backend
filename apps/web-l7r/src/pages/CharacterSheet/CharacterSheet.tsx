import React, { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import RollCard from "../../components/RollCard/RollCard";
import { Roll } from "../../domain/models/Roll";
import { ApiL7RProvider } from "../../data/api/ApiL7RProvider";
import { CharacterPanel } from "../../components/Character/CharacterPanel/CharacterPanel";
import { CharacterBanner } from "../../components/Character/CharacterBanner/CharacterBanner";
import { CharacterNotes } from "../../components/Character/CharacterNotes/CharacterNotes";
import styled from "styled-components";
import { UtilsRules } from "../../utils/UtilsRules";
import { Character } from "../../domain/models/Character";
import { CharacterState } from "../../domain/models/CharacterState";
import { CharacterPreview } from "../../domain/models/CharacterPreview";
import { Skill } from "../../domain/models/Skill";
import CharacterSynchro from "../../components/Character/CharacterSynchro";

export function CharacterSheet() {
  const { characterName } = useParams();
  const [characterState, setCharacterState] = useState<CharacterState>(
    new CharacterState({}),
  );
  const [rolls, setRolls] = useState<Roll[]>([]);
  const [character, setCharacter] = useState<Character | undefined>(undefined);
  const [charactersSession, setCharactersSession] = useState<
    CharacterPreview[]
  >([]);

  // ====== QUEUES / COALESCING ======
  // 1) PV/PF/PP → updateCharacter sérialisé
  const inFlightCharUpdateRef = useRef(false);
  const pendingStatsRef = useRef<{ pv: number; pf: number; pp: number }>({
    pv: 0,
    pf: 0,
    pp: 0,
  });
  const pollingPausedRef = useRef(false);

  // 2) Bonus/Malus (UI only)
  const pendingUiRef = useRef<{ bonus: number; malus: number }>({
    bonus: 0,
    malus: 0,
  });
  const uiFlushTimerRef = useRef<number | null>(null);

  // 3) Dette d’arcane (par skill)
  type DebtKey = string; // skill.id
  const debtInFlightRef = useRef<Record<DebtKey, boolean>>({});
  const debtPendingRef = useRef<Record<DebtKey, number>>({});

  // ====== HELPERS ======
  function clamp(v: number, min: number, max: number) {
    return Math.max(min, Math.min(max, v));
  }

  async function fetchCharacter() {
    try {
      const c = await ApiL7RProvider.getCharacterByName(characterName ?? "");
      setCharacter(c);
    } catch (error) {
      console.error("Error fetching character:", error);
    }
  }

  async function fetchCharactersSession() {
    try {
      const characters = await ApiL7RProvider.getSessionCharacters();
      setCharactersSession(characters);
    } catch (error) {
      console.error("Error fetching characters:", error);
    }
  }

  async function fetchRolls(name: string) {
    try {
      const r = await ApiL7RProvider.getRolls(name);
      setRolls(r);
    } catch (error) {
      console.error("Error fetching rolls:", error);
    }
  }

  useEffect(() => {
    // initial fetch
    fetchCharacter().then(() => {});
    fetchCharactersSession().then(() => {});
    fetchRolls(characterName ?? "").then(() => {});

    // polling (1s) — on le met en pause pendant les flushs DB
    const interval = setInterval(() => {
      if (!pollingPausedRef.current) {
        fetchCharacter().then(() => {});
        fetchRolls(characterName ?? "").then(() => {});
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [characterName]);

  // ====== QUEUE: PV/PF/PP ======
  async function queueCharacterDelta(
    d: Partial<{ pv: number; pf: number; pp: number }>,
  ) {
    const p = pendingStatsRef.current;
    pendingStatsRef.current = {
      pv: p.pv + (d.pv ?? 0),
      pf: p.pf + (d.pf ?? 0),
      pp: p.pp + (d.pp ?? 0),
    };
    if (!inFlightCharUpdateRef.current) {
      await flushCharacterDelta();
    }
  }

  async function flushCharacterDelta() {
    if (inFlightCharUpdateRef.current) return;
    const deltas = pendingStatsRef.current;
    if (deltas.pv === 0 && deltas.pf === 0 && deltas.pp === 0) return;

    // “prendre” les deltas
    pendingStatsRef.current = { pv: 0, pf: 0, pp: 0 };
    inFlightCharUpdateRef.current = true;
    pollingPausedRef.current = true;

    try {
      // Variante B (sûre) : read-modify-write → repart de l’état serveur
      const fresh = await ApiL7RProvider.getCharacterByName(
        characterName ?? "",
      );
      const next = {
        ...fresh,
        pv: clamp(fresh.pv + deltas.pv, 0, fresh.pvMax),
        pf:
          fresh.pfMax !== undefined
            ? clamp((fresh.pf ?? 0) + deltas.pf, 0, fresh.pfMax)
            : fresh.pf ?? 0,
        pp:
          fresh.ppMax !== undefined
            ? clamp((fresh.pp ?? 0) + deltas.pp, 0, fresh.ppMax)
            : fresh.pp ?? 0,
      };

      if (
        next.pv !== fresh.pv ||
        next.pf !== (fresh.pf ?? 0) ||
        next.pp !== (fresh.pp ?? 0)
      ) {
        await ApiL7RProvider.updateCharacter(next);
      }

      setCharacter(next); // maj optimiste locale
    } catch (e) {
      // remet les deltas pour ne pas perdre les clics
      const p = pendingStatsRef.current;
      pendingStatsRef.current = {
        pv: p.pv + deltas.pv,
        pf: p.pf + deltas.pf,
        pp: p.pp + deltas.pp,
      };
      console.error("Character stats update failed", e);
    } finally {
      inFlightCharUpdateRef.current = false;
      pollingPausedRef.current = false;
      // s'il reste des deltas, relance
      if (
        pendingStatsRef.current.pv !== 0 ||
        pendingStatsRef.current.pf !== 0 ||
        pendingStatsRef.current.pp !== 0
      ) {
        flushCharacterDelta();
      }
    }
  }

  // ====== QUEUE: bonus/malus (UI only) ======
  function queueUiDelta(d: Partial<{ bonus: number; malus: number }>) {
    pendingUiRef.current = {
      bonus: pendingUiRef.current.bonus + (d.bonus ?? 0),
      malus: pendingUiRef.current.malus + (d.malus ?? 0),
    };
    if (uiFlushTimerRef.current !== null) return;

    uiFlushTimerRef.current = window.setTimeout(() => {
      const { bonus, malus } = pendingUiRef.current;
      pendingUiRef.current = { bonus: 0, malus: 0 };
      uiFlushTimerRef.current = null;

      setCharacterState((prev) => ({
        ...prev,
        bonus: (prev.bonus ?? 0) + bonus,
        malus: (prev.malus ?? 0) + malus,
      }));
    }, 120);
  }

  // ====== QUEUE: dette d’arcane (par skill) ======
  async function queueArcaneDebt(
    skillId: string,
    delta: number,
    characterNameArg: string,
    skill: Skill,
  ) {
    debtPendingRef.current[skillId] =
      (debtPendingRef.current[skillId] ?? 0) + delta;
    if (debtInFlightRef.current[skillId]) return;
    await flushArcaneDebt(skillId, characterNameArg, skill);
  }

  async function flushArcaneDebt(
    skillId: string,
    characterNameArg: string,
    skill: Skill,
  ) {
    if (debtInFlightRef.current[skillId]) return;
    const delta = debtPendingRef.current[skillId] ?? 0;
    if (delta === 0) return;

    debtPendingRef.current[skillId] = 0;
    debtInFlightRef.current[skillId] = true;

    try {
      const newDette = Math.max(0, (skill.arcaneDette ?? 0) + delta);
      await ApiL7RProvider.updateCharacterSkillsAttribution(
        characterNameArg,
        skillId,
        skill.dailyUse,
        skill.dailyUseMax,
        true,
        newDette,
      );
      // (Optionnel) refetch character si ces infos sont lues dessus
      // await fetchCharacter();
    } catch (e) {
      // remet le delta pour retenter
      debtPendingRef.current[skillId] =
        (debtPendingRef.current[skillId] ?? 0) + delta;
      console.error("Arcane debt update failed", e);
    } finally {
      debtInFlightRef.current[skillId] = false;
      if ((debtPendingRef.current[skillId] ?? 0) !== 0) {
        flushArcaneDebt(skillId, characterNameArg, skill);
      }
    }
  }

  // ====== HANDLERS ======
  async function handleSendRoll(p: {
    skillId: string;
    empiriqueRoll?: string;
  }) {
    try {
      if (character) {
        const bonus =
          characterState.bonus +
          (characterState.lux ? 1 : 0) +
          (characterState.secunda ? 1 : 0);
        const malus = characterState.malus + (characterState.umbra ? 1 : 0);
        const hasProficiency = Array.from(
          characterState.proficiencies.values(),
        ).some(Boolean);

        await ApiL7RProvider.sendRoll({
          skillId: p.skillId,
          characterName: character.name,
          focus: characterState.focusActivated,
          power: characterState.powerActivated,
          proficiency: hasProficiency,
          secret: characterState.secret,
          bonus,
          malus,
          empiriqueRoll: p.empiriqueRoll,
          avantage:
            characterState.avantage === "avantage"
              ? true
              : characterState.avantage === "désavantage"
              ? false
              : undefined,
        });
      }
    } catch (error) {
      console.error("ERROR");
      console.error("Error sending roll:", error);
      alert(error);
    }
  }

  async function handleUpdateState(newState: CharacterState) {
    setCharacterState(newState);
  }

  async function handleArcaneDette(charName: string, skill: Skill) {
    // coalescer la dette d’arcane (−1 ici)
    await queueArcaneDebt(skill.id, -1, charName, skill);
  }

  async function handleRest() {
    try {
      if (character) {
        await ApiL7RProvider.rest(character.name);
        await fetchCharacter(); // resync
      }
    } catch (error) {
      console.error("Error resting character:", error);
    }
  }

  async function handleUpdateCharacter(newCharacter: Character) {
    try {
      if (character) {
        await ApiL7RProvider.updateCharacter(newCharacter);
        setCharacter(newCharacter);
      }
    } catch (error) {
      console.error("Error updating character:", error);
    }
  }

  async function handleSubir(p: { roll: Roll; originRoll?: Roll }) {
    try {
      if (character) {
        let degats = UtilsRules.getDegats(p.roll, p.originRoll);
        if (character.name === "Aeryl" && degats > 0) {
          degats = degats - 1;
        }
        await queueCharacterDelta({ pv: -degats });
      }
    } catch (error) {
      console.error("Error updating character:", error);
    }
  }

  async function handleHelp(p: { bonus: number; malus: number }) {
    queueUiDelta({ bonus: p.bonus, malus: p.malus });
  }

  async function handleHealOnClick(p: { roll: Roll; characterName: string }) {
    try {
      const healPoint = p.roll.healPoint;
      if (healPoint && healPoint > 0) {
        const characterToHeal = await ApiL7RProvider.getCharacterByName(
          p.characterName,
        );
        await ApiL7RProvider.updateRoll({
          id: p.roll.id,
          healPoint: healPoint - 1,
        });
        // +1 PV coalescé
        await queueCharacterDelta({ pv: +1 });

        // Optionnel : si tu veux afficher le heal sur la carte ciblée précisément,
        // tu peux aussi forcer un refetch ici pour ce perso.
      }
    } catch (error) {
      console.error("Error updating character:", error);
    }
  }

  async function handleResist(p: {
    stat: "chair" | "esprit" | "essence";
    resistRoll: string;
  }) {
    try {
      if (character) {
        await ApiL7RProvider.sendRoll({
          skillId:
            character.skills.find((skill) => skill.name === p.stat)?.id ?? "",
          characterName: character.name,
          focus: characterState.focusActivated,
          power: characterState.powerActivated,
          proficiency: Array.from(characterState.proficiencies.values()).some(
            Boolean,
          ),
          secret: characterState.secret,
          bonus: characterState.bonus,
          malus: characterState.malus,
          resistRoll: p.resistRoll,
        });
      }
    } catch (error) {
      console.error("ERROR");
      console.error("Error sending resist roll:", error);
    }
  }

  function handleUpdateCharacterNotes(text: string) {
    if (character) {
      ApiL7RProvider.updateCharacter({
        ...character,
        notes: text,
      }).then(() => setCharacter({ ...character, notes: text }));
    }
  }

  return (
    <>
      {!character ? (
        <p>Loading...</p>
      ) : (
        <MainContainer>
          <CharacterBanner character={character} />
          {character.vr === -1 ? (
            <CharacterNotes
              text={character.notes}
              setText={handleUpdateCharacterNotes}
            />
          ) : (
            <CharacterSynchro character={character} />
          )}
          <CharacterPanel
            characterState={characterState}
            cardDisplay={false}
            character={character}
            sendRoll={handleSendRoll}
            updateCharacter={handleUpdateCharacter}
            updateState={handleUpdateState}
            rest={handleRest}
            clickArcaneDette={handleArcaneDette}
          />
          <Rolls>
            {rolls.map((roll: Roll) => (
              <div key={roll.id}>
                <RollCard
                  mjDisplay={false}
                  roll={roll}
                  clickOnResist={handleResist}
                  clickOnSubir={handleSubir}
                  charactersSession={charactersSession}
                  onHealClick={handleHealOnClick}
                  clickOnHelp={handleHelp}
                />
              </div>
            ))}
          </Rolls>
        </MainContainer>
      )}
    </>
  );
}

const MainContainer = styled.div``;

const Rolls = styled.div``;
