import { useState } from 'react'
import Game from './Game.jsx'
import './index.css'

export default function App() {
  const [screen, setScreen] = useState('title') // title | game | gameover
  const [finalStats, setFinalStats] = useState(null)

  const handleGameOver = (stats) => {
    setFinalStats(stats)
    setScreen('gameover')
  }

  return (
    <div className="app-root">
      {screen === 'title' && <TitleScreen onStart={() => setScreen('game')} />}
      {screen === 'game' && <Game onGameOver={handleGameOver} />}
      {screen === 'gameover' && (
        <GameOverScreen
          stats={finalStats}
          onRestart={() => setScreen('game')}
          onMenu={() => setScreen('title')}
        />
      )}
    </div>
  )
}

function TitleScreen({ onStart }) {
  return (
    <div className="title-screen">
      <StarField count={120} />
      <div className="title-content">
        <div className="title-badge">GALACTIC TYPING COMBAT</div>
        <h1 className="title-logo">
          <span className="logo-star">★</span>
          STAR<span className="logo-type">TYPE</span>
          <span className="logo-star">★</span>
        </h1>
        <p className="title-tagline">Your keyboard is your weapon. Type to survive.</p>

        <div className="title-instructions">
          <div className="inst-row"><kbd>TYPE</kbd> the word on each enemy ship to destroy it</div>
          <div className="inst-row"><kbd>SPEED</kbd> increases as your score climbs</div>
          <div className="inst-row"><kbd>3 LIVES</kbd> — don't let enemies reach the bottom</div>
        </div>

        <button className="btn-launch" onClick={onStart}>
          <span className="btn-launch-inner">LAUNCH MISSION</span>
        </button>
      </div>
    </div>
  )
}

function GameOverScreen({ stats, onRestart, onMenu }) {
  const grade = getGrade(stats?.score || 0, stats?.accuracy || 0)
  return (
    <div className="gameover-screen">
      <StarField count={80} />
      <div className="gameover-content">
        <div className="go-alert">⚠ MISSION FAILED ⚠</div>
        <h2 className="go-title">SHIP DESTROYED</h2>

        <div className="go-grade" style={{ color: grade.color }}>
          <span className="go-grade-letter">{grade.letter}</span>
          <span className="go-grade-label">{grade.label}</span>
        </div>

        <div className="go-stats">
          <StatRow icon="🎯" label="Final Score" value={stats?.score ?? 0} />
          <StatRow icon="💥" label="Words Destroyed" value={stats?.destroyed ?? 0} />
          <StatRow icon="📊" label="Accuracy" value={`${stats?.accuracy ?? 0}%`} />
          <StatRow icon="⚡" label="Best WPM" value={stats?.bestWpm ?? 0} />
          <StatRow icon="🌊" label="Max Wave" value={stats?.wave ?? 1} />
        </div>

        <div className="go-actions">
          <button className="btn-launch" onClick={onRestart}>
            <span className="btn-launch-inner">↺ RETRY MISSION</span>
          </button>
          <button className="btn-secondary" onClick={onMenu}>MAIN MENU</button>
        </div>
      </div>
    </div>
  )
}

function StatRow({ icon, label, value }) {
  return (
    <div className="stat-row">
      <span className="stat-icon">{icon}</span>
      <span className="stat-label">{label}</span>
      <span className="stat-value">{value}</span>
    </div>
  )
}

function getGrade(score, accuracy) {
  if (score >= 50 && accuracy >= 90) return { letter: 'S', label: 'LEGENDARY', color: '#ffd700' }
  if (score >= 30 && accuracy >= 80) return { letter: 'A', label: 'ELITE PILOT', color: '#00f5ff' }
  if (score >= 20 && accuracy >= 70) return { letter: 'B', label: 'SKILLED', color: '#7c3aed' }
  if (score >= 10) return { letter: 'C', label: 'AVERAGE', color: '#22c55e' }
  return { letter: 'D', label: 'ROOKIE', color: '#f97316' }
}

export function StarField({ count = 100 }) {
  const stars = Array.from({ length: count }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: Math.random() * 2.5 + 0.5,
    dur: Math.random() * 4 + 2,
    delay: Math.random() * 4,
    drift: (Math.random() - 0.5) * 0.04,
  }))
  return (
    <div className="starfield" aria-hidden="true">
      {stars.map(s => (
        <div
          key={s.id}
          className="star"
          style={{
            left: `${s.x}%`,
            top: `${s.y}%`,
            width: s.size,
            height: s.size,
            animationDuration: `${s.dur}s`,
            animationDelay: `${s.delay}s`,
          }}
        />
      ))}
    </div>
  )
}
