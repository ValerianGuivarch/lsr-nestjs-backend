import { ChangeEvent, useState } from 'react'
import { Button, Card, CardContent, Typography } from '@mui/material'
import { Title, useNotify } from 'react-admin'
import { jdrAggregateStore } from '../data/aggregateStore'
import { jdrApi } from '../data/jdrApi'

export function ImportJsonPage() {
  const notify = useNotify()
  const [file, setFile] = useState<File | null>(null)
  const [busy, setBusy] = useState(false)

  const chooseFile = (event: ChangeEvent<HTMLInputElement>) => setFile(event.target.files?.[0] ?? null)

  const importFile = async () => {
    if (!file) return
    setBusy(true)
    try {
      const document = JSON.parse(await file.text()) as unknown
      const aggregate = await jdrApi.importJdr(document)
      jdrAggregateStore.setSelectedSlug(aggregate.slug)
      jdrAggregateStore.setAggregate(aggregate)
      notify(`JdR « ${aggregate.name} » importé`, { type: 'success' })
      window.location.hash = '#/characters'
    } catch (error) {
      notify(error instanceof Error ? error.message : String(error), { type: 'error', multiLine: true })
    } finally {
      setBusy(false)
    }
  }

  return (
    <Card sx={{ maxWidth: 720, margin: 3 }}>
      <Title title="Import JSON" />
      <CardContent>
        <Typography variant="h5" gutterBottom>
          Importer un JdR complet
        </Typography>
        <Typography paragraph>
          Le fichier crée un nouveau JdR avec ses joueurs, classes, groupes, personnages, stats, traits, objets et
          ressources. Un slug déjà existant est refusé.
        </Typography>
        <input type="file" accept="application/json,.json" onChange={chooseFile} />
        <Button
          variant="contained"
          sx={{ display: 'block', marginTop: 2 }}
          disabled={!file || busy}
          onClick={importFile}
        >
          {busy ? 'Import en cours…' : 'Importer'}
        </Button>
      </CardContent>
    </Card>
  )
}
