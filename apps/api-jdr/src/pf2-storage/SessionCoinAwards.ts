import { BadRequestException, ConflictException } from '@nestjs/common'
import { randomUUID } from 'node:crypto'
import type { DataSource, EntityManager } from 'typeorm'

export type SessionCoins = { gp: number; sp: number; cp: number }
type CoinAwardRow = { session_id: string; actor_uuid: string; gp: number; sp: number; cp: number; status: 'pending' | 'applying' | 'applied' | 'review'; claim_token: string | null; updated_at: string }
const WORLD = 'test-pf2'
const uuidPattern = /^[a-f0-9-]{36}$/i
const actorPattern = /^Actor\.[A-Za-z0-9]+$/

export function requireCoinWorld(world: unknown): void {
  if (world !== WORLD) throw new BadRequestException('Monde Foundry non autorisé pour les récompenses.')
}

export async function migrateSessionCoinAwards(manager: EntityManager): Promise<void> {
  await manager.query(`CREATE TABLE IF NOT EXISTS pf2_session_coin_award (
    session_id TEXT NOT NULL REFERENCES pf2_session(id) ON DELETE CASCADE,
    actor_uuid TEXT NOT NULL, gp INTEGER NOT NULL CHECK(gp BETWEEN 0 AND 1000000),
    sp INTEGER NOT NULL CHECK(sp BETWEEN 0 AND 1000000), cp INTEGER NOT NULL CHECK(cp BETWEEN 0 AND 1000000),
    status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','applying','applied','review')),
    claim_token TEXT UNIQUE, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY(session_id,actor_uuid)
  )`)
}

export async function enqueueSessionCoins(manager: EntityManager, sessionId: string, actors: string[], coins: SessionCoins): Promise<void> {
  if (!uuidPattern.test(sessionId) || ![coins.gp,coins.sp,coins.cp].every(n => Number.isSafeInteger(n) && n >= 0 && n <= 1000000)) {
    throw new BadRequestException('Récompense de séance invalide.')
  }
  if (!coins.gp && !coins.sp && !coins.cp) return
  for (const actor of new Set(actors)) {
    // Keep invalid/missing IDs visible for manual review instead of losing the reward.
    await manager.query(`INSERT INTO pf2_session_coin_award(session_id,actor_uuid,gp,sp,cp,status)
      VALUES (?,?,?,?,?,?) ON CONFLICT(session_id,actor_uuid) DO NOTHING`,
      [sessionId, actor, coins.gp, coins.sp, coins.cp, actorPattern.test(actor) ? 'pending' : 'review'])
  }
}

function view(row: CoinAwardRow) {
  return { sessionId:row.session_id, actorUuid:row.actor_uuid, coins:{gp:row.gp,sp:row.sp,cp:row.cp}, status:row.status, updatedAt:row.updated_at }
}

export async function listSessionCoinAwards(db: DataSource) {
  const rows = await db.query("SELECT * FROM pf2_session_coin_award WHERE status <> 'applied' ORDER BY CASE status WHEN 'pending' THEN 0 ELSE 1 END, updated_at, session_id, actor_uuid") as CoinAwardRow[]
  return rows.map(view)
}

export async function claimSessionCoinAward(db: DataSource, session: unknown, actor: unknown) {
  if (typeof session !== 'string' || !uuidPattern.test(session) || typeof actor !== 'string' || !actorPattern.test(actor)) throw new BadRequestException('Récompense invalide.')
  const token = randomUUID()
  // Never recycle a claim on timeout: the client may already have credited coins.
  await db.query("UPDATE pf2_session_coin_award SET status='applying',claim_token=?,updated_at=CURRENT_TIMESTAMP WHERE session_id=? AND actor_uuid=? AND status='pending'", [token,session,actor])
  const rows = await db.query('SELECT * FROM pf2_session_coin_award WHERE claim_token=?', [token]) as CoinAwardRow[]
  return rows[0] ? {...view(rows[0]), token} : null
}

export async function finishSessionCoinAward(db: DataSource, token: unknown, status: unknown): Promise<{ saved: true }> {
  if (typeof token !== 'string' || !uuidPattern.test(token) || (status !== 'applied' && status !== 'review')) throw new BadRequestException('Résultat de récompense invalide.')
  // Applied is terminal. A verified applied Actor marker may reconcile a review.
  await db.query("UPDATE pf2_session_coin_award SET status=?,updated_at=CURRENT_TIMESTAMP WHERE claim_token=? AND status IN ('applying','review')", [status,token])
  const rows = await db.query('SELECT status FROM pf2_session_coin_award WHERE claim_token=?', [token]) as Array<{status:string}>
  if (!rows[0] || rows[0].status !== status) throw new ConflictException('Récompense non reconnue ou déjà terminée.')
  return {saved:true}
}
