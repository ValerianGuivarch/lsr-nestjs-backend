export class Session {
  chaos: number
  relanceMj: number

  constructor(p: { relanceMj: number; chaos: number }) {
    this.relanceMj = p.relanceMj ?? 0
    this.chaos = p.chaos ?? 0
  }
}
