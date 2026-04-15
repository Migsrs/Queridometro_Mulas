import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { getCooldownStatus, formatRemaining } from '../utils/storage'

function useCountdown() {
  const [status, setStatus] = useState(() => getCooldownStatus())

  useEffect(() => {
    if (status.canVote) return
    const id = setInterval(() => {
      const next = getCooldownStatus()
      setStatus(next)
      if (next.canVote) clearInterval(id)
    }, 1000)
    return () => clearInterval(id)
  }, [status.canVote])

  return status
}

export default function Home() {
  const [name, setName] = useState('')
  const navigate = useNavigate()
  const { canVote, remainingMs } = useCountdown()

  function handleVote(e) {
    e.preventDefault()
    const trimmed = name.trim()
    if (!trimmed || !canVote) return
    navigate('/votar', { state: { voterName: trimmed } })
  }

  return (
    <div className="page">
      <header className="header">
        <div className="logo-title">Queridômetro</div>
        <div className="logo-sub">Big Brother Brasil 26</div>
        <div className="logo-bar" />
      </header>

      <div className="card home-box">
        {!canVote ? (
          /* ── Cooldown ativo ───────────────────────────────────────── */
          <>
            <div className="notice notice-warn" style={{ marginBottom: '1.2rem' }}>
              <div style={{ fontSize: '2rem', marginBottom: '0.4rem' }}>⏳</div>
              <strong>Você já votou recentemente.</strong>
              <br />
              <small>Você poderá votar novamente em:</small>
              <div
                style={{
                  fontFamily: 'var(--font-head)',
                  fontSize: '2rem',
                  letterSpacing: '4px',
                  margin: '0.4rem 0 0.2rem',
                  color: 'var(--gold)',
                }}
              >
                {formatRemaining(remainingMs)}
              </div>
              <small style={{ color: 'var(--muted)' }}>hh:mm:ss</small>
            </div>
            <div className="home-actions">
              <Link to="/resultados">
                <button className="btn btn-gold" style={{ width: '100%' }}>
                  📊 Ver Resultados
                </button>
              </Link>
            </div>
          </>
        ) : (
          /* ── Pode votar ───────────────────────────────────────────── */
          <>
            <h2>Quem é você na casa?</h2>
            <form onSubmit={handleVote}>
              <input
                className="input"
                type="text"
                placeholder="Digite seu nome..."
                value={name}
                onChange={e => setName(e.target.value)}
                maxLength={60}
                autoFocus
              />
              <span className="badge badge-anon" style={{ display: 'block', marginBottom: '1rem' }}>
                🔒 Seu nome ficará somente no registro do administrador
              </span>
              <div className="home-actions">
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={!name.trim()}
                >
                  ❤️ Votar Agora
                </button>
                <Link to="/resultados">
                  <button type="button" className="btn btn-ghost" style={{ width: '100%' }}>
                    📊 Ver Resultados
                  </button>
                </Link>
              </div>
            </form>
          </>
        )}

        <div className="home-links">
          <Link to="/admin">Painel Admin</Link>
        </div>
      </div>
    </div>
  )
}
