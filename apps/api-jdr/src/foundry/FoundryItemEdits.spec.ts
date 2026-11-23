import { FoundryItemEdits, migrateFoundryItemEdits } from './FoundryItemEdits'
import { BadRequestException, ConflictException } from '@nestjs/common'

const uuid='Actor.61T9DNcjAOxx6hJu.Item.xxMLgupYcqKnLGFh'
const patch={itemUuid:uuid,expectedName:'Statuette de la Fille dorée',expectedDescription:'<p>Ancienne.</p>',name:'Statuette ancienne'}

describe('Foundry embedded Item edit queue',()=>{
  it('rejects non-embedded UUIDs, arbitrary fields and invalid payloads before SQLite',async()=>{
    const db={query:jest.fn()}
    const service=new FoundryItemEdits(db as any)
    await expect(service.enqueue({...patch,itemUuid:'Item.xxMLgupYcqKnLGFh'})).rejects.toBeInstanceOf(BadRequestException)
    await expect(service.enqueue({...patch,'system.quantity':1})).rejects.toBeInstanceOf(BadRequestException)
    await expect(service.enqueue({...patch,description:{value:'injection'}})).rejects.toBeInstanceOf(BadRequestException)
    expect(db.query).not.toHaveBeenCalled()
  })
  it('rejects concurrent corrections to the same Item',async()=>{
    const db={query:jest.fn().mockResolvedValueOnce([{id:'previous'}])}
    await expect(new FoundryItemEdits(db as any).enqueue(patch)).rejects.toBeInstanceOf(ConflictException)
    expect(db.query).toHaveBeenCalledTimes(1)
  })
  it('queues a validated edit with a stable id and does not call the Relay',async()=>{
    const db={query:jest.fn().mockResolvedValueOnce([]).mockResolvedValueOnce([])}
    const result=await new FoundryItemEdits(db as any).enqueue(patch)
    expect(result.status).toBe('pending')
    expect(result.id).toMatch(/^[a-f0-9-]{36}$/i)
    expect(db.query.mock.calls[1][1]).toEqual([result.id,uuid,patch.expectedName,patch.expectedDescription,patch.name,null])
  })
  it('rejects wrong world before listing or claiming',async()=>{
    const db={query:jest.fn()}
    const service=new FoundryItemEdits(db as any)
    await expect(service.list('other')).rejects.toBeInstanceOf(BadRequestException)
    await expect(service.claim('other','93e12d5f-3e15-49cb-acb8-5bc0e14e930e')).rejects.toBeInstanceOf(BadRequestException)
    expect(db.query).not.toHaveBeenCalled()
  })
  it('creates an idempotent migration table and index',async()=>{
    const manager={query:jest.fn().mockResolvedValue([])}
    await migrateFoundryItemEdits(manager as any)
    expect(manager.query).toHaveBeenCalledTimes(2)
  })
})
