import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { participants, sentiments, getInitials, getAvatarColor } from '../data/participants'
import { getAggregateResults, getTotalVotes } from '../utils/storage'

function Avatar({ participant, size = 48 }) {
  if (participant.photo) {
    return (
      <div className="p-avatar" style={{ width: size, height: size }}>
        <img src={participant.photo} alt={participant.name} />
      </div>
    )
  }
  return (
    <div
      className="p-avatar"
      style={{
        width: size,
        height: size,
        borderColor: getAvatarColor(participant.name),
        flexShrink: 0,
      }}
    >
      <span
        className="p-avatar-initials"
        style={{ color: getAvatarColor(participant.name), fontSize: size * 0.35 }}
      >
        {getInitials(participant.name)}
      </span>
    </div>
  )
}

/** Calcula a pontuação média ponderada (quero muito bem=5 … antipatia=1). */
const SCORE_MAP = {
  quero_muito_bem: 5,
  gosto: 4,
  neutro: 3,
  nao_gosto: 2,
  antipatia: 1,
}

function calcScore(counts) {
  let total = 0; let sum = 0
  for (const [key, n] of Object.entries(counts)) {
    sum += (SCORE_MAP[key] || 0) * n
    total += n
  }
  return total === 0 ? 0 : sum / total
}

export default function Results() {
  const [aggregate, setAggregate]   = useState({})
  const [totalVotes, setTotalVotes] = useState(0)
  const [loading, setLoading]       = useState(true)

  useEffect(() => {
    async function load() {
      const [agg, total] = await Promise.all([getAggregateResults(), getTotalVotes()])
      setAggregate(agg)
      setTotalVotes(total)
      setLoading(false)
    }
    load()
  }, [])

  // Ordena por score decrescente
  const sorted = useMemo(() => {
    return [...participants].sort((a, b) => {
      const sa = calcScore(aggregate[a.name] || {})
      const sb = calcScore(aggregate[b.name] || {})
      return sb - sa
    })
  }, [aggregate])

  if (loading) {
    return (
      <div className="page">
        <header className="header">
          <div className="logo-title">Resultados</div>
          <div className="logo-sub">Big Brother Brasil 26</div>
          <div className="logo-bar" />
        </header>
        <p style={{ textAlign: 'center', color: 'var(--muted)', padding: '3rem' }}>
          Carregando resultados...
        </p>
      </div>
    )
  }

  return (
    <div className="page">
      <header className="header">
        <div className="logo-title">Resultados</div>
        <div className="logo-sub">Big Brother Brasil 26</div>
        <div className="logo-bar" />
      </header>

      <div className="results-actions">
        <Link to="/">
          <button className="btn btn-ghost">← Início</button>
        </Link>
        <button
          className="btn btn-ghost"
          onClick={() => window.location.reload()}
          title="Atualizar resultados"
        >
          🔄 Atualizar
        </button>
      </div>

      <p className="results-summary">
        {totalVotes === 0
          ? 'Nenhum voto registrado ainda.'
          : (
            <>
              <strong>{totalVotes}</strong>{' '}
              {totalVotes === 1 ? 'votante participou' : 'votantes participaram'}.
              Resultados anônimos — ordenados por popularidade.
            </>
          )}
      </p>

      <div className="results-grid">
        {sorted.map((p, index) => {
          const counts = aggregate[p.name] || {}
          const total  = Object.values(counts).reduce((a, b) => a + b, 0)
          const score  = calcScore(counts)

          return (
            <div key={p.id} className="card result-card">
              <div className="result-header">
                <div style={{ position: 'relative' }}>
                  <Avatar participant={p} size={48} />
                  <span
                    style={{
                      position: 'absolute',
                      top: -6,
                      left: -6,
                      background: index < 3 ? 'var(--gold)' : 'var(--border)',
                      color: index < 3 ? '#111' : 'var(--muted)',
                      borderRadius: '50%',
                      width: 20,
                      height: 20,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.65rem',
                      fontWeight: 700,
                      fontFamily: 'var(--font-head)',
                    }}
                  >
                    {index + 1}
                  </span>
                </div>
                <div>
                  <div className="result-name">{p.name}</div>
                  <div className="result-votes-total">
                    {total} voto{total !== 1 ? 's' : ''}
                    {total > 0 && (
                      <span style={{ marginLeft: 6, color: 'var(--gold)' }}>
                        · {score.toFixed(1)} ★
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="result-bars">
                {sentiments.map(s => {
                  const count = counts[s.key] || 0
                  const pct   = total > 0 ? Math.round((count / total) * 100) : 0
                  return (
                    <div key={s.key} className="result-bar-row">
                      <span className="result-bar-emoji">{s.emoji}</span>
                      <span className="result-bar-label">{s.label}</span>
                      <div className="result-bar-track">
                        <div
                          className="result-bar-fill"
                          style={{ width: `${pct}%`, background: s.color }}
                        />
                      </div>
                      <span className="result-bar-count">
                        {count > 0 ? count : '–'}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
