/**
 * Camada de persistência via Firebase Firestore.
 *
 * Coleção Firestore: "votes"
 * Cada documento: { id, voterName, timestamp, votes: { [participante]: sentimentKey } }
 *
 * O cooldown continua no localStorage (controle por dispositivo).
 */

import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  serverTimestamp,
  query,
  orderBy,
} from 'firebase/firestore'
import { db } from '../firebase'

const LAST_VOTE_KEY = 'qm_last_vote_ts'
const COOLDOWN_MS   = 60 * 60 * 1000   // 1 hora em milissegundos
const VOTES_COL     = 'votes'

// ─── Cooldown (localStorage — controle por dispositivo) ──────────────────────

/**
 * Retorna o estado do cooldown do votante.
 * @returns {{ canVote: boolean, remainingMs: number }}
 */
export function getCooldownStatus() {
  const raw = localStorage.getItem(LAST_VOTE_KEY)
  if (!raw) return { canVote: true, remainingMs: 0 }
  const elapsed   = Date.now() - parseInt(raw, 10)
  const remaining = COOLDOWN_MS - elapsed
  return {
    canVote:     remaining <= 0,
    remainingMs: Math.max(0, remaining),
  }
}

/** Formata milissegundos restantes em "mm:ss" ou "HH:mm:ss". */
export function formatRemaining(ms) {
  const totalSec = Math.ceil(ms / 1000)
  const h  = Math.floor(totalSec / 3600)
  const m  = Math.floor((totalSec % 3600) / 60)
  const s  = totalSec % 60
  if (h > 0) {
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  }
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

// ─── Leitura ──────────────────────────────────────────────────────────────────

/**
 * Busca todos os votos do Firestore, ordenados por timestamp.
 * @returns {Promise<Array>}
 */
export async function getAllVotes() {
  const q = query(collection(db, VOTES_COL), orderBy('timestamp', 'asc'))
  const snap = await getDocs(q)
  return snap.docs.map(d => {
    const data = d.data()
    return {
      id:        d.id,
      voterName: data.voterName,
      timestamp: data.timestamp?.toDate?.()?.toISOString() ?? data.timestamp,
      votes:     data.votes,
    }
  })
}

// ─── Escrita ──────────────────────────────────────────────────────────────────

/**
 * Salva um voto no Firestore e registra o timestamp de cooldown localmente.
 * @param {string} voterName
 * @param {Object} votes  — { [participantName]: sentimentKey }
 * @returns {Promise<string>} ID do documento criado
 */
export async function saveVote(voterName, votes) {
  const docRef = await addDoc(collection(db, VOTES_COL), {
    voterName: voterName.trim(),
    timestamp: serverTimestamp(),
    votes,
  })
  localStorage.setItem(LAST_VOTE_KEY, String(Date.now()))
  return docRef.id
}

// ─── Agregação (pública — sem nomes) ─────────────────────────────────────────

/**
 * Retorna contagens por participante e sentimento.
 * { [participantName]: { [sentimentKey]: count } }
 * @returns {Promise<Object>}
 */
export async function getAggregateResults() {
  const allVotes = await getAllVotes()
  const results  = {}
  for (const vote of allVotes) {
    for (const [participant, sentiment] of Object.entries(vote.votes)) {
      if (!results[participant]) results[participant] = {}
      results[participant][sentiment] = (results[participant][sentiment] || 0) + 1
    }
  }
  return results
}

/** @returns {Promise<number>} */
export async function getTotalVotes() {
  const snap = await getDocs(collection(db, VOTES_COL))
  return snap.size
}

// ─── Admin ────────────────────────────────────────────────────────────────────

/**
 * Exclui TODOS os votos do Firestore e reseta o cooldown local.
 * Ação irreversível — use só no painel admin.
 * @returns {Promise<void>}
 */
export async function clearAllVotes() {
  const snap = await getDocs(collection(db, VOTES_COL))
  await Promise.all(snap.docs.map(d => deleteDoc(doc(db, VOTES_COL, d.id))))
  localStorage.removeItem(LAST_VOTE_KEY)
}

/**
 * Gera CSV do log completo para download.
 * @param {string[]} participantNames
 * @returns {Promise<string>}
 */
export async function generateCSV(participantNames) {
  const votes = await getAllVotes()
  if (votes.length === 0) return ''

  const header = ['id', 'votante', 'horario', ...participantNames].join(',')
  const rows = votes.map(v => {
    const cols = [
      v.id,
      `"${v.voterName.replace(/"/g, '""')}"`,
      v.timestamp,
      ...participantNames.map(n => v.votes[n] || ''),
    ]
    return cols.join(',')
  })
  return [header, ...rows].join('\n')
}
