export type SchedulePlayer = { id: string; name: string; played: number }
export type ScheduleGroup = { key: string; label: string; players: SchedulePlayer[] }
export type ScheduleDate = { key: string; label: string }
export type ScheduleFilters = { count: number; required: string[]; excluded: string[]; all: boolean }
type Candidate = ScheduleGroup & { mask: number; score: number }
type Counts = Map<number, number>

/** Exact score histogram and rank-based pagination. No sampling or truncation.
 * Memoization avoids storing every complete partition in memory. */
export class ScheduleSearch {
  private readonly choices: Candidate[][]
  private readonly dates: ScheduleDate[]
  private readonly memo = new Map<string, Counts>()
  private readonly required: Set<string>
  private readonly count: number
  readonly histogram: Counts
  readonly total: number
  readonly optimal: number
  readonly bestScore: number | null

  constructor(dates: ScheduleDate[], availability: Map<string, SchedulePlayer[]>, readonly filters: ScheduleFilters) {
    this.dates = dates.filter(d => !filters.excluded.includes(d.key))
    this.required = new Set(filters.required)
    this.count = filters.count
    const ids = [...new Set([...availability.values()].flat().map(p => p.id))]
    // The campaign has 12 players. Refuse pathological requests rather than block the bot.
    if (ids.length > 20) throw new Error('Trop de joueurs pour le calcul exact : réduis les dates.')
    const masks = new Map(ids.map((id, i) => [id, 1 << i]))
    this.choices = this.dates.map(d => {
      const p = [...new Map((availability.get(d.key) ?? []).map(x => [x.id, x])).values()]
        .sort((a,b) => a.played-b.played || a.name.localeCompare(b.name,'fr') || a.id.localeCompare(b.id))
      const result: Candidate[] = []
      for (let a=0;a<p.length-3;a++) for(let b=a+1;b<p.length-2;b++)
        for(let c=b+1;c<p.length-1;c++) for(let e=c+1;e<p.length;e++) {
          const players=[p[a],p[b],p[c],p[e]]
          result.push({...d,players,mask:players.reduce((m,x)=>m|masks.get(x.id)!,0),score:players.reduce((n,x)=>n+x.played,0)})
        }
      return result
    })
    this.histogram=this.walk(0,0,this.count)
    this.bestScore=this.histogram.size ? Math.min(...this.histogram.keys()) : null
    this.optimal=this.bestScore===null?0:this.histogram.get(this.bestScore)!
    this.total=[...this.histogram.values()].reduce((n,x)=>n+x,0)
  }

  private walk(i:number, used:number, left:number):Counts {
    if(left<0 || left>this.dates.length-i) return new Map()
    if(i===this.dates.length) return left===0?new Map([[0,1]]):new Map()
    const key=i+':'+used.toString()+':'+left
    const existing=this.memo.get(key)
    if(existing) return existing
    const result:Counts=new Map()
    const add=(counts:Counts,shift:number)=>{
      for(const [s,n] of counts) {
        const total=(result.get(s+shift)??0)+n
        if(!Number.isSafeInteger(total)) throw new Error('Trop de combinaisons : réduis les dates.')
        result.set(s+shift,total)
      }
    }
    if(!this.required.has(this.dates[i].key)) add(this.walk(i+1,used,left),0)
    if(left>0) for(const c of this.choices[i]) if(!(c.mask&used)) add(this.walk(i+1,used|c.mask,left-1),c.score)
    this.memo.set(key,result)
    return result
  }

  get visibleCount():number { return this.filters.all?this.total:this.optimal }

  at(index:number):{index:number;score:number;groups:ScheduleGroup[]} {
    if(!Number.isSafeInteger(index)||index<0||index>=this.visibleCount) throw new Error('Proposition inconnue.')
    let rank=index, score=0
    for(const [s,n] of [...this.histogram].sort((a,b)=>a[0]-b[0])) {
      if(rank<n){score=s;break}
      rank-=n
    }
    const groups:ScheduleGroup[]=[]
    let used=0,left=this.count,rest=score
    for(let i=0;i<this.dates.length;i++) {
      if(!this.required.has(this.dates[i].key)){
        const n=this.walk(i+1,used,left).get(rest)??0
        if(rank<n) continue
        rank-=n
      }
      let found=false
      for(const c of this.choices[i]) {
        if(left<=0||(c.mask&used)) continue
        const n=this.walk(i+1,used|c.mask,left-1).get(rest-c.score)??0
        if(rank>=n){rank-=n;continue}
        groups.push({key:c.key,label:c.label,players:c.players})
        used|=c.mask;left--;rest-=c.score;found=true;break
      }
      if(!found) throw new Error('Proposition non résolue.')
    }
    return {index,score,groups}
  }
}

export function parseScheduleFilters(body: unknown, dates: ScheduleDate[]): ScheduleFilters {
  if(!body||typeof body!=='object') throw new Error('Filtres invalides.')
  const b=body as Partial<ScheduleFilters>
  const valid=new Set(dates.map(d=>d.key))
  const keys=(v:unknown)=> {
    if(!Array.isArray(v)||v.some(x=>typeof x!=='string'||!valid.has(x))) throw new Error('Dates invalides.')
    return [...new Set(v)] as string[]
  }
  const required=keys(b.required),excluded=keys(b.excluded)
  if(!Number.isInteger(b.count)||b.count!<1||b.count!>dates.length||required.some(x=>excluded.includes(x))) throw new Error('Nombre de séances ou dates incompatibles.')
  return {count:b.count!,required,excluded,all:b.all===true}
}
