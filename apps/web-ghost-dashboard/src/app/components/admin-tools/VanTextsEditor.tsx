import React from 'react'
import styled from 'styled-components'
import { VanTextConfig, DEFAULT_VAN_TEXT_CONFIG } from 'ghost/frontend'

type Props = {
  value: VanTextConfig
  onChange: (next: VanTextConfig) => void
  onSave: () => void
  isSaving?: boolean
  saveError?: string
}

export function VanTextsEditor({ value, onChange, onSave, isSaving, saveError }: Props) {
  const set =
    <S extends keyof VanTextConfig>(section: S) =>
    (field: keyof VanTextConfig[S]) =>
    (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      onChange({
        ...value,
        [section]: {
          ...(value[section] as Record<string, string>),
          [field]: event.target.value,
        },
      } as VanTextConfig)
    }

  const reset = () => {
    onChange({
      intro: { ...DEFAULT_VAN_TEXT_CONFIG.intro },
      banners: { ...DEFAULT_VAN_TEXT_CONFIG.banners },
      hints: { ...DEFAULT_VAN_TEXT_CONFIG.hints },
      identification: { ...DEFAULT_VAN_TEXT_CONFIG.identification },
      banish: { ...DEFAULT_VAN_TEXT_CONFIG.banish },
      victory: { ...DEFAULT_VAN_TEXT_CONFIG.victory },
    })
  }

  return (
    <EditorRoot>
      <EditorHeader>
        <h2>Édition des textes du van</h2>
        <HeaderActions>
          <ResetButton type="button" onClick={reset}>
            Réinitialiser
          </ResetButton>
          <SaveButton type="button" onClick={onSave} disabled={isSaving}>
            {isSaving ? 'Sauvegarde…' : 'Sauvegarder'}
          </SaveButton>
        </HeaderActions>
      </EditorHeader>

      {saveError && <ErrorBox>{saveError}</ErrorBox>}

      {/* ─── INTRO ─────────────────────────────────────────────── */}
      <Section>
        <SectionTitle>Écran d'intro (step 1)</SectionTitle>
        <FieldRow>
          <Label>Titre</Label>
          <Input value={value.intro.title} onChange={set('intro')('title')} />
        </FieldRow>
        <FieldRow>
          <Label>Corps du message</Label>
          <Textarea rows={3} value={value.intro.body} onChange={set('intro')('body')} />
        </FieldRow>
        <FieldRow>
          <Label>Bouton « Initialiser »</Label>
          <Input value={value.intro.buttonIdle} onChange={set('intro')('buttonIdle')} />
        </FieldRow>
        <FieldRow>
          <Label>Bouton « En cours »</Label>
          <Input value={value.intro.buttonPlaying} onChange={set('intro')('buttonPlaying')} />
        </FieldRow>
      </Section>

      {/* ─── BANNIÈRES ─────────────────────────────────────────── */}
      <Section>
        <SectionTitle>Bannières d'étape (bandeau)</SectionTitle>
        {(['step1', 'step2', 'step3', 'step4', 'step5', 'step6', 'step7'] as const).map(s => (
          <FieldRow key={s}>
            <Label>Étape {s.replace('step', '')}</Label>
            <Input value={value.banners[s]} onChange={set('banners')(s)} />
          </FieldRow>
        ))}
      </Section>

      {/* ─── INDICES ───────────────────────────────────────────── */}
      <Section>
        <SectionTitle>Indices d'objectif</SectionTitle>
        <FieldRow>
          <Label>Matériel de localisation</Label>
          <Textarea rows={2} value={value.hints.material} onChange={set('hints')('material')} />
        </FieldRow>
        <FieldRow>
          <Label>Zone d'activité</Label>
          <Textarea rows={2} value={value.hints.locate} onChange={set('hints')('locate')} />
        </FieldRow>
        <FieldRow>
          <Label>Matériel d'identification</Label>
          <Textarea rows={2} value={value.hints.identificationGear} onChange={set('hints')('identificationGear')} />
        </FieldRow>
        <FieldRow>
          <Label>Identification fantôme</Label>
          <Textarea rows={2} value={value.hints.ghost} onChange={set('hints')('ghost')} />
        </FieldRow>
      </Section>

      {/* ─── IDENTIFICATION ────────────────────────────────────── */}
      <Section>
        <SectionTitle>Formulaire d'identification</SectionTitle>
        <FieldRow>
          <Label>Titre du formulaire</Label>
          <Input value={value.identification.formTitle} onChange={set('identification')('formTitle')} />
        </FieldRow>
        <FieldRow>
          <Label>Placeholder saisie</Label>
          <Input value={value.identification.placeholder} onChange={set('identification')('placeholder')} />
        </FieldRow>
        <FieldRow>
          <Label>Bouton Valider</Label>
          <Input value={value.identification.buttonLabel} onChange={set('identification')('buttonLabel')} />
        </FieldRow>
      </Section>

      {/* ─── BANNISSEMENT ──────────────────────────────────────── */}
      <Section>
        <SectionTitle>Bannissement</SectionTitle>
        <FieldRow>
          <Label>Titre latéral (dans la liste des objectifs)</Label>
          <Input value={value.banish.sideTitle} onChange={set('banish')('sideTitle')} />
        </FieldRow>
        <FieldRow>
          <Label>Description latérale</Label>
          <Textarea rows={4} value={value.banish.sideDescription} onChange={set('banish')('sideDescription')} />
        </FieldRow>
        <FieldRow>
          <Label>Titre pleine page</Label>
          <Input value={value.banish.fullTitle} onChange={set('banish')('fullTitle')} />
        </FieldRow>
        <FieldRow>
          <Label>URL image</Label>
          <Input value={value.banish.imageUrl} onChange={set('banish')('imageUrl')} />
        </FieldRow>
        <FieldRow>
          <Label>Instruction pleine page</Label>
          <Textarea rows={3} value={value.banish.fullInstruction} onChange={set('banish')('fullInstruction')} />
        </FieldRow>
      </Section>

      {/* ─── VICTOIRE ──────────────────────────────────────────── */}
      <Section>
        <SectionTitle>Écran de victoire</SectionTitle>
        <FieldRow>
          <Label>Titre</Label>
          <Input value={value.victory.title} onChange={set('victory')('title')} />
        </FieldRow>
        <FieldRow>
          <Label>Sous-titre</Label>
          <Input value={value.victory.subtitle} onChange={set('victory')('subtitle')} />
        </FieldRow>
        <FieldRow>
          <Label>Placeholder photo</Label>
          <Input value={value.victory.photoPlaceholder} onChange={set('victory')('photoPlaceholder')} />
        </FieldRow>
      </Section>

      <SaveBottom>
        <ResetButton type="button" onClick={reset}>
          Réinitialiser
        </ResetButton>
        <SaveButton type="button" onClick={onSave} disabled={isSaving}>
          {isSaving ? 'Sauvegarde…' : 'Sauvegarder'}
        </SaveButton>
      </SaveBottom>
    </EditorRoot>
  )
}

const EditorRoot = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  padding: 1.5rem;
  max-width: 760px;
`

const EditorHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  h2 {
    margin: 0;
    font-size: 1.3rem;
    color: #5ec8ff;
  }
`

const HeaderActions = styled.div`
  display: flex;
  gap: 0.75rem;
`

const Section = styled.div`
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 6px;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
`

const SectionTitle = styled.h3`
  margin: 0 0 0.25rem;
  font-size: 0.85rem;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: #5ec8ff;
  opacity: 0.8;
`

const FieldRow = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
`

const Label = styled.label`
  font-size: 0.8rem;
  color: #aab;
`

const Input = styled.input`
  background: rgba(0, 0, 0, 0.4);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 4px;
  color: #e8f0ff;
  padding: 0.4rem 0.6rem;
  font-size: 0.9rem;
  font-family: inherit;
  &:focus {
    outline: none;
    border-color: #5ec8ff;
  }
`

const Textarea = styled.textarea`
  background: rgba(0, 0, 0, 0.4);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 4px;
  color: #e8f0ff;
  padding: 0.4rem 0.6rem;
  font-size: 0.9rem;
  font-family: inherit;
  resize: vertical;
  &:focus {
    outline: none;
    border-color: #5ec8ff;
  }
`

const SaveButton = styled.button`
  background: #5ec8ff22;
  border: 1px solid #5ec8ff55;
  border-radius: 4px;
  color: #5ec8ff;
  padding: 0.45rem 1.1rem;
  font-size: 0.85rem;
  cursor: pointer;
  &:hover:not(:disabled) {
    background: #5ec8ff33;
  }
  &:disabled {
    opacity: 0.5;
    cursor: default;
  }
`

const ResetButton = styled.button`
  background: transparent;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 4px;
  color: #aab;
  padding: 0.45rem 1.1rem;
  font-size: 0.85rem;
  cursor: pointer;
  &:hover {
    background: rgba(255, 255, 255, 0.06);
  }
`

const SaveBottom = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  padding-top: 0.5rem;
`

const ErrorBox = styled.div`
  color: #ff6b6b;
  border: 1px solid #ff6b6b44;
  border-radius: 4px;
  padding: 0.5rem 0.75rem;
  font-size: 0.85rem;
`
