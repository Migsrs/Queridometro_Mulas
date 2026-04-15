/**
 * Camada de persistência via localStorage.
 *
 * Chaves usadas:
 *  - "qm_votes"        → array completo de votos (com nome do eleitor — só admin lê)
 *  - "qm_last_vote_ts" → timestamp (ms) do último voto — controla o cooldown de 1h
 */

const VOTES_KEY      = 'qm_votes'
const LAST_VOTE_KEY  = 'qm_last_vote_ts'
const COOLDOWN_MS    = 60 * 60 * 1000   // 1 hora em milissegundos

// ─── Cooldown ────────────────────────────────────────────────────────────────

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

// ─── Leitura ─────────────────────────────────────────────────────────────────

export function getAllVotes() {
  try {
    return JSON.parse(localStorage.getItem(VOTES_KEY) || '[]')
  } catch {
    return []
  }
}

// ─── Escrita ──────────────────────────────────────────────────────────────────

/**
 * Salva um voto completo e registra o timestamp para o cooldown.
 * @param {string} voterName   - Nome de quem votou (só visível ao admin)
 * @param {Object} votes       - { [participantName]: sentimentKey }
 * @returns {string}           - ID gerado para o voto
 */
export function saveVote(voterName, votes) {
  const all = getAllVotes()
  const id  = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
  all.push({
    id,
    voterName: voterName.trim(),
    timestamp: new Date().toISOString(),
    votes,
  })
  localStorage.setItem(VOTES_KEY, JSON.stringify(all))
  localStorage.setItem(LAST_VOTE_KEY, String(Date.now()))
  return id
}

// ─── Agregação (pública — sem nomes) ─────────────────────────────────────────

/**
 * Retorna contagens por participante e sentimento.
 * { [participantName]: { [sentimentKey]: count } }
 */
export function getAggregateResults() {
  const results = {}
  for (const vote of getAllVotes()) {
    for (const [participant, sentiment] of Object.entries(vote.votes)) {
      if (!results[participant]) results[participant] = {}
      results[participant][sentiment] = (results[participant][sentiment] || 0) + 1
    }
  }
  return results
}

/** Total de votos registrados. */
export function getTotalVotes() {
  return getAllVotes().length
}

// ─── Admin ────────────────────────────────────────────────────────────────────

/** Exclui TODOS os votos e reseta o cooldown. Ação irreversível — use só no painel admin. */
export function clearAllVotes() {
  localStorage.removeItem(VOTES_KEY)
  localStorage.removeItem(LAST_VOTE_KEY)
}

/**
 * Gera CSV do log completo para download.
 * Colunas: id, voterName, timestamp, [um participante por coluna]
 */
export function generateCSV(participantNames) {
  const votes = getAllVotes()
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
