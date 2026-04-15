import { useState, useEffect } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { participants, sentiments, getInitials, getAvatarColor } from '../data/participants'
import { saveVote, getCooldownStatus } from '../utils/storage'

function Avatar({ participant }) {
  if (participant.photo) {
    return (
      <div className="p-avatar">
        <img src={participant.photo} alt={participant.name} />
      </div>
    )
  }
  return (
    <div
      className="p-avatar"
      style={{ borderColor: getAvatarColor(participant.name) }}
    >
      <span
        className="p-avatar-initials"
        style={{ color: getAvatarColor(participant.name) }}
      >
        {getInitials(participant.name)}
      </span>
    </div>
  )
}

export default function Voting() {
  const navigate = useNavigate()
  const location = useLocation()
  const voterName = location.state?.voterName

  // Redireciona se acessar sem nome ou ainda estiver no cooldown
  useEffect(() => {
    if (!voterName || !getCooldownStatus().canVote) {
      navigate('/', { replace: true })
    }
  }, [voterName, navigate])

  // { participantName: sentimentKey }
  const [votes, setVotes] = useState({})
  const [submitted, setSubmitted] = useState(false)

  const votedCount  = Object.keys(votes).length
  const totalCount  = participants.length
  const allVoted    = votedCount === totalCount
  const progressPct = Math.round((votedCount / totalCount) * 100)

  function selectSentiment(participantName, sentimentKey) {
    setVotes(prev => ({ ...prev, [participantName]: sentimentKey }))
  }

  function handleSubmit() {
    if (!allVoted) return
    saveVote(voterName, votes)
    setSubmitted(true)
  }

  if (submitted) {
    return (
      <div className="page">
        <header className="header">
          <div className="logo-title">Queridômetro</div>
          <div className="logo-sub">Big Brother Brasil 26</div>
          <div className="logo-bar" />
        </header>
        <div className="card home-box" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>🎉</div>
          <h2 style={{ color: '#4caf50', fontFamily: 'var(--font-head)', fontSize: '1.4rem' }}>
            Voto registrado!
          </h2>
          <p style={{ color: 'var(--muted)', marginTop: '0.5rem', marginBottom: '1.5rem' }}>
            Obrigado, <strong style={{ color: 'var(--white)' }}>{voterName.split(' ')[0]}</strong>!
            Seu voto foi salvo de forma anônima.
          </p>
          <div className="home-actions">
            <Link to="/resultados">
              <button className="btn btn-gold" style={{ width: '100%' }}>
                📊 Ver Resultados
              </button>
            </Link>
            <Link to="/">
              <button className="btn btn-ghost" style={{ width: '100%' }}>
                Voltar ao Início
              </button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="page">
      <header className="header">
        <div className="logo-title">Queridômetro</div>
        <div className="logo-sub">Big Brother Brasil 26</div>
        <div className="logo-bar" />
      </header>

      <div className="voting-header">
        <p className="voting-info">
          Avalie cada participante &nbsp;·&nbsp;{' '}
          <strong>{votedCount}/{totalCount}</strong> avaliados
        </p>
        <div className="progress-bar-wrap">
          <div
            className="progress-bar-fill"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      <div className="participants-grid">
        {participants.map(p => {
          const selected = votes[p.name]
          return (
            <div
              key={p.id}
              className={`card p-card ${selected ? 'voted' : ''}`}
            >
              <Avatar participant={p} />
              <div className="p-info">
                <div className="p-name">
                  {p.name}
                  {selected && (
                    <span
                      className="voted-checkmark"
                      title="Avaliado"
                      style={{ marginLeft: '0.4rem' }}
                    >
                      ✓
                    </span>
                  )}
                </div>
                <div className="p-sentiments">
                  {sentiments.map(s => (
                    <button
                      key={s.key}
                      className={`sentiment-btn ${selected === s.key ? 'selected' : ''}`}
                      style={
                        selected === s.key
                          ? { borderColor: s.color, boxShadow: `0 0 8px ${s.color}60` }
                          : {}
                      }
                      title={s.label}
                      onClick={() => selectSentiment(p.name, s.key)}
                    >
                      <span className="s-emoji">{s.emoji}</span>
                      <span className="s-label">{s.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <div className="voting-actions">
        <button
          className="btn btn-primary"
          onClick={handleSubmit}
          disabled={!allVoted}
          title={!allVoted ? `Avalie mais ${totalCount - votedCount} participante(s)` : ''}
        >
          {allVoted
            ? '✅ Enviar Meu Voto'
            : `Avalie todos (${votedCount}/${totalCount})`}
        </button>
        <Link to="/">
          <button className="btn btn-ghost">Cancelar</button>
        </Link>
      </div>
    </div>
  )
}
