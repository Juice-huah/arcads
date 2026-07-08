// src/pages/GameLibrary.jsx
import React from 'react';

const GAMES_DATA = [
  { id: 'maze', title: 'Knowledge Maze', img: '/assets/MazeSS.png', color: '#4ade80', desc: 'Navigate through a twisting labyrinth by answering questions correctly to unlock doors and escape before time runs out!' },
  { id: 'adventure', title: 'Adventure Battle', img: '/assets/AdventureBattleSS.png', color: '#f6ad55', desc: 'Choose your hero and battle monsters in turn-based combat. Your knowledge is your weapon!' },
  { id: 'wordquest', title: 'Word Quest', img: '/assets/WordQuestSS.png', color: '#ce93d8', desc: 'A classic Snakes & Ladders style board game. Roll the dice and answer questions to climb to victory.' },
  { id: 'forest', title: 'Enchanted Forest', img: '/assets/EnchantedForestSS.png', color: '#4dff91', desc: 'Explore a mysterious map, unscramble hidden vocabulary words, and defeat regional bosses to clear the forest.' },
  { id: 'whack', title: 'Cyber Whack', img: '/assets/WhackAMoleSS.png', color: '#ff4757', desc: 'A fast-paced Whack-A-Mole reflex game! Hit the normal targets for combos, avoid the bombs, and answer pop-up quizzes!' },
  { id: 'tower', title: 'Tower Defense', img: '/assets/TowerDefenseSS.png', color: '#ffd700', desc: 'Match incoming enemy prompts with the correct answers from your tower to blast them away before they breach your castle.' },
  { id: 'hamster', title: 'HamsterBall', img: '/assets/HamsterballSS.png', color: '#ff007f', desc: 'Roll through a 3D obstacle course, jump over gaps, collect coins, and answer word-chain questions to reach the finish line!' },
  { id: 'startype', title: 'StarType', img: '/assets/StarTypeSS.png', color: '#00f5ff', desc: 'Galactic typing combat. Type the words attached to incoming enemy ships to lock on and fire your lasers to survive the waves!' }
];

export default function GameLibrary() {
  return (
    <main className="homepage-container">
      
      <section className="hero" style={{ minHeight: 'auto', padding: '60px 20px', flexDirection: 'column' }}>
        <h1 className="hero-logo" style={{ fontSize: 'clamp(2.5rem, 5vw, 4rem)', marginBottom: '10px' }}>
          GAME LIBRARY
        </h1>
        <p className="tagline">EXPLORE OUR ACTIVITIES</p>
        <p style={{ maxWidth: '700px', margin: '20px auto 0 auto', fontSize: '1.2rem', lineHeight: '1.7', color: 'inherit' }}>
          Teachers can create custom rooms using these templates, and students can play them to learn and compete!
        </p>
      </section>

      <section className="info-grid" style={{ 
          marginTop: '0', 
          paddingTop: '20px', 
          paddingBottom: '80px', 
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', 
          gap: '40px', 
          alignItems: 'stretch',
          maxWidth: '1300px', 
          margin: '0 auto'
      }}>
        {GAMES_DATA.map((game) => (
          <div key={game.id} style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              textAlign: 'center', 
              padding: '35px',
              background: 'rgba(0, 0, 0, 0.25)', 
              border: `3px solid ${game.color}`,
              borderRadius: '16px', 
              boxShadow: `0 0 20px ${game.color}40`, 
              transition: 'transform 0.3s ease, box-shadow 0.3s ease'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = 'translateY(-5px)';
              e.currentTarget.style.boxShadow = `0 5px 25px ${game.color}50`;
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = `0 0 20px ${game.color}40`;
            }}
          >
            
            <div style={{ 
                width: '100%', 

                height: '240px', 
                marginBottom: '25px', 
                borderRadius: '12px',
                border: `3px solid ${game.color}A0`,
                overflow: 'hidden', 
                backgroundColor: '#000',
                flexShrink: 0,
                boxShadow: `0 4px 10px rgba(0, 0, 0, 0.5)`
            }}>
                <img 
                    src={game.img} 
                    alt={`${game.title} gameplay preview`} 
                    style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover', 
                        objectPosition: 'center',
                        transition: 'transform 0.4s ease', 
                    }}
                    onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.08)'} 
                    onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
                />
            </div>
            
            <h3 style={{ 
                marginBottom: '18px', 
                textTransform: 'uppercase', 
                color: game.color, 
                fontFamily: "'Press Start 2P', cursive", 
                fontSize: '1rem', 
                lineHeight: '1.6',
                fontWeight: 'bold',
                letterSpacing: '1px'
            }}>
                {game.title}
            </h3>
            
            <p style={{ 
                margin: 0, 
                color: '#ddd', 
                fontSize: '1rem',
                lineHeight: '1.7',
                fontWeight: '500'
            }}>
                {game.desc}
            </p>
          </div>
        ))}
      </section>

    </main>
  );
}