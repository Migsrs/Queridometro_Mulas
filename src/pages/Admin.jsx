import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { participants, sentiments } from '../data/participants'
import {
  getAllVotes,
  getTotalVotes,
  clearAllVotes,
  generateCSV,
} from '../utils/storage'

/** Senha de acesso ao painel. Altere aqui se necessário. */
const ADMIN_PASSWORD = 'bbb26@admin'

function formatDate(iso) {
  try {
    return new Date(iso).toLocaleString('pt-BR', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    })
  } catch {
    return iso
  }
}

export default function Admin() {
  const [input,   setInput]   = useState('')
  const [auth,    setAuth]    = useState(false)
  const [error,   setError]   = useState('')
  const [votes,   setVotes]   = useState([])
  const [search,  setSearch]  = useState('')
  const [loading, setLoading] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)

  async function handleLogin(e) {
    e.preventDefault()
    if (input === ADMIN_PASSWORD) {
      setLoading(true)
      const all = await getAllVotes()
      setVotes(all)
      setAuth(true)
      setLoading(false)
    } else {
      setError('Senha incorreta.')
    }
  }

  async function refresh() {
    setLoading(true)
    const all = await getAllVotes()
    setVotes(all)
    setRefreshKey(k => k + 1)
    setLoading(false)
  }

  async function handleClear() {
    if (!window.confirm('Tem certeza que deseja apagar TODOS os votos? Esta ação é irreversível.')) return
    setLoading(true)
    await clearAllVotes()
    await refresh()
  }

  async function handleExportCSV() {
    const csv = await generateCSV(participants.map(p => p.name))
    if (!csv) return alert('Nenhum voto para exportar.')
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href     = url
    a.download = `queridometro_log_${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  // ── Estatísticas ────────────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const totalVoters = votes.length
    const sentimentCounts = {}
    for (const s of sentiments) sentimentCounts[s.key] = 0
    for (const v of votes) {
      for (const sk of Object.values(v.votes)) {
        if (sk in sentimentCounts) sentimentCounts[sk]++
      }
    }
    const topSentiment = Object.entries(sentimentCounts)
      .sort((a, b) => b[1] - a[1])[0]
    return { totalVoters, sentimentCounts, topSentiment }
  }, [votes])

  // ── Filtro de busca ──────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    if (!search.trim()) return votes
    const q = search.toLowerCase()
    return votes.filter(v =>
      v.voterName.toLowerCase().includes(q) ||
      v.id.toLowerCase().includes(q),
    )
  }, [votes, search])

  // ── Sentimento emoji rápido ──────────────────────────────────────────────────
  const emojiMap = Object.fromEntries(sentiments.map(s => [s.key, s.emoji]))
  const colorMap = Object.fromEntries(sentiments.map(s => [s.key, s.color]))
  const labelMap = Object.fromEntries(sentiments.map(s => [s.key, s.label]))

  // ── Tela de login ────────────────────────────────────────────────────────────
  if (!auth) {
    return (
      <div className="page">
        <header className="header">
          <div className="logo-title">Admin</div>
          <div className="logo-sub">Painel Administrativo</div>
          <div className="logo-bar" />
        </header>

        <div className="card admin-login-box">
          <h2>🔑 Acesso Restrito</h2>
          <form onSubmit={handleLogin}>
            <input
              className="input"
              type="password"
              placeholder="Senha do administrador..."
              value={input}
              onChange={e => { setInput(e.target.value); setError('') }}
              autoFocus
            />
            {error && (
              <p style={{ color: 'var(--red)', fontSize: '0.85rem', margin: '0.5rem 0' }}>
                {error}
              </p>
            )}
            <div className="home-actions" style={{ marginTop: '1rem' }}>
              <button type="submit" className="btn btn-primary" disabled={!input}>
                Entrar
              </button>
              <Link to="/">
                <button type="button" className="btn btn-ghost" style={{ width: '100%' }}>
                  ← Voltar
                </button>
              </Link>
            </div>
          </form>
        </div>
      </div>
    )
  }

  // ── Painel admin ─────────────────────────────────────────────────────────────
  return (
    <div className="page">
      <header className="header">
        <div className="logo-title">Painel Admin</div>
        <div className="logo-sub">Queridômetro BBB 26</div>
        <div className="logo-bar" />
      </header>

      <div className="admin-panel">
        {/* Estatísticas */}
        <div className="admin-stats">
          <div className="card stat-card">
            <div className="stat-value">{stats.totalVoters}</div>
            <div className="stat-label">Votantes</div>
          </div>
          <div className="card stat-card">
            <div className="stat-value">
              {stats.totalVoters > 0
                ? (stats.totalVoters * participants.length).toLocaleString()
                : '0'}
            </div>
            <div className="stat-label">Avaliações totais</div>
          </div>
          {stats.topSentiment && stats.totalVoters > 0 && (
            <div className="card stat-card">
              <div className="stat-value" style={{ fontSize: '2rem' }}>
                {emojiMap[stats.topSentiment[0]]}
              </div>
              <div className="stat-label">Sentimento mais votado</div>
            </div>
          )}
          <div className="card stat-card">
            <div className="stat-value">{participants.length}</div>
            <div className="stat-label">Participantes</div>
          </div>
        </div>

        {/* Ações */}
        <div className="admin-actions">
          <button className="btn btn-ghost" onClick={refresh} disabled={loading}>
            {loading ? '⏳ Carregando...' : '🔄 Atualizar'}
          </button>
          <button className="btn btn-gold" onClick={handleExportCSV} disabled={votes.length === 0 || loading}>
            ⬇️ Exportar CSV
          </button>
          <button className="btn btn-danger" onClick={handleClear} disabled={votes.length === 0 || loading}>
            🗑 Limpar Todos os Votos
          </button>
          <Link to="/">
            <button className="btn btn-ghost">← Início</button>
          </Link>
        </div>

        {/* Log completo */}
        <div className="admin-section-title">
          Log de Votos ({filtered.length} de {votes.length})
        </div>

        {votes.length === 0 ? (
          <p style={{ color: 'var(--muted)', textAlign: 'center', padding: '2rem' }}>
            Nenhum voto registrado ainda.
          </p>
        ) : (
          <>
            <input
              className="input"
              type="text"
              placeholder="Buscar por nome ou ID..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ maxWidth: 340, marginBottom: '1rem' }}
            />

            <div className="log-table-wrap">
              <table className="log-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Votante</th>
                    <th>Horário</th>
                    <th>Avaliações</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((v, i) => (
                    <tr key={v.id}>
                      <td style={{ color: 'var(--gray)', fontSize: '0.75rem' }}>
                        {filtered.length - i}
                      </td>
                      <td className="voter-name-cell">{v.voterName}</td>
                      <td style={{ whiteSpace: 'nowrap' }}>{formatDate(v.timestamp)}</td>
                      <td>
                        <div className="votes-breakdown">
                          {Object.entries(v.votes).map(([pname, sk]) => (
                            <span
                              key={pname}
                              className="vote-pill"
                              style={{ borderColor: colorMap[sk] || 'var(--border)' }}
                              title={`${pname}: ${labelMap[sk] || sk}`}
                            >
                              {emojiMap[sk] || '?'} {pname}
                            </span>
                          ))}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* Resumo por sentimento */}
        {votes.length > 0 && (
          <>
            <div className="admin-section-title">Distribuição de Sentimentos</div>
            <div className="admin-stats" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))' }}>
              {sentiments.map(s => (
                <div className="card stat-card" key={s.key}>
                  <div className="stat-value" style={{ fontSize: '1.8rem', color: s.color }}>
                    {s.emoji}
                  </div>
                  <div className="stat-value" style={{ fontSize: '1.6rem', color: s.color }}>
                    {stats.sentimentCounts[s.key] || 0}
                  </div>
                  <div className="stat-label">{s.label}</div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
