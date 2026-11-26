import { ScheduleSearch, parseScheduleFilters } from './DiscordScheduleWeb'

describe('exact schedule search',()=>{
  const dates=[{key:'0',label:'Lundi'},{key:'1',label:'Mardi'},{key:'2',label:'Mercredi'}]
  const players=Array.from({length:9},(_,i)=>({id:String(i),name:i===8?'Augustin':String(i),played:i===0?1:8}))
  const availability=new Map(dates.map(d=>[d.key,players]))
  const filters={count:2,required:[],excluded:[],all:true}
  it('counts every distinct partition and ranks by score',()=>{
    const s=new ScheduleSearch(dates,availability,filters)
    expect(s.total).toBe(3*126*5)
    expect(s.optimal).toBe(3*112*5)
    const first=s.at(0),last=s.at(s.total-1)
    expect(first.score).toBe(57)
    expect(last.score).toBe(64)
    expect(new Set(first.groups.flatMap(g=>g.players.map(p=>p.id))).size).toBe(8)
    const keys=new Set(Array.from({length:s.total},(_,i)=>s.at(i).groups.map(g=>g.key+':'+g.players.map(p=>p.id).sort().join(',')).join('|')))
    expect(keys.size).toBe(s.total)
    expect([...Array(s.optimal).keys()].some(i=>s.at(i).groups.some(g=>g.players.some(p=>p.name==='Augustin')))).toBe(true)
  })
  it('filters dates before optimizing and recalculates for one session',()=>{
    const s=new ScheduleSearch(dates,availability,{...filters,count:1,required:['2'],excluded:['1'],all:false})
    expect(s.total).toBe(126)
    expect(s.optimal).toBe(56)
    expect(s.at(0).groups[0].key).toBe('2')
    expect(new ScheduleSearch(dates,availability,{...filters,count:1,required:['0','1']}).total).toBe(0)
    expect(()=>parseScheduleFilters({...filters,required:['0'],excluded:['0']},dates)).toThrow()
  })
  it('handles conflicting availability without reusing players',()=>{
    const a=new Map(dates.map(d=>[d.key,players.slice(0,4)]))
    expect(new ScheduleSearch(dates,a,filters).total).toBe(0)
  })
})
