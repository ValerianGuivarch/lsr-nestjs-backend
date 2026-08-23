import { useQueryClient } from '@tanstack/react-query'
import { MenuItem, Select } from '@mui/material'
import { useGetList } from 'react-admin'
import { jdrAggregateStore } from '../data/aggregateStore'
import { useSelectedJdrSlug } from './useSelectedJdrSlug'

/** Lets the admin pick which JdR to manage; all nested resources (characters, groups, ...) are scoped to this selection. */
export function JdrSwitcher() {
  const queryClient = useQueryClient()
  const selectedSlug = useSelectedJdrSlug()
  const { data: jdrs, isPending } = useGetList('jdrs', {
    pagination: { page: 1, perPage: 100 },
    sort: { field: 'name', order: 'ASC' }
  })

  if (isPending) return null

  return (
    <Select
      size="small"
      displayEmpty
      value={selectedSlug ?? ''}
      onChange={(event) => {
        jdrAggregateStore.setSelectedSlug(event.target.value || null)
        queryClient.invalidateQueries()
      }}
      sx={{ color: 'inherit', ml: 2, minWidth: 200, '& .MuiSelect-icon': { color: 'inherit' } }}
    >
      <MenuItem value="">
        <em>Choisir un JdR...</em>
      </MenuItem>
      {(jdrs ?? []).map((jdr) => (
        <MenuItem key={jdr.id} value={String(jdr.id)}>
          {jdr.name}
        </MenuItem>
      ))}
    </Select>
  )
}
