import { Datagrid, DateField, List, NumberField, TextField } from 'react-admin'

// Dice rolls are a gameplay action log, not master data - read-only, no create/edit/delete.
export function RollList() {
  return (
    <List sort={{ field: 'createdDate', order: 'DESC' }} exporter={false}>
      <Datagrid bulkActionButtons={false}>
        <DateField source="createdDate" label="Date" showTime />
        <TextField source="characterName" label="Personnage" />
        <TextField source="statName" label="Stat" />
        <NumberField source="statValue" label="Valeur" />
        <TextField source="rollState" label="État" />
        <TextField source="formula" label="Formule" />
        <TextField source="text" label="Commentaire" />
      </Datagrid>
    </List>
  )
}
