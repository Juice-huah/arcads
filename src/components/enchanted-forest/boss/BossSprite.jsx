// ─── Individual boss SVG sprites ─────────────────────────────────────────────

function Thornhog({ isAttacking, isDefeated, clr }) {
  return (
    <svg viewBox="0 0 200 220" width="200" height="220">
      {/* Body */}
      <ellipse cx="100" cy="145" rx="68" ry="55" fill="#4a3018"/>
      <ellipse cx="100" cy="140" rx="60" ry="48" fill="#5a3e20"/>
      {/* Thorns on back */}
      {[45,60,80,100,120,140,155].map((x,i) => (
        <polygon key={i} points={`${x},${115+i%2*8} ${x-8},${85+i%2*10} ${x+8},${85+i%2*10}`}
          fill={i%2===0?"#2a6a18":"#3a8a22"} />
      ))}
      {/* Head */}
      <ellipse cx="100" cy="100" rx="48" ry="42" fill="#5a3e20"/>
      <ellipse cx="100" cy="110" rx="40" ry="32" fill="#6a4e28"/>
      {/* Snout */}
      <ellipse cx="100" cy="122" rx="22" ry="14" fill="#8a5e35"/>
      <circle cx="92"  cy="120" r="5" fill="#3a1a05"/>
      <circle cx="108" cy="120" r="5" fill="#3a1a05"/>
      {/* Eyes */}
      <circle cx="80"  cy="96" r="8" fill="#ff4400"/>
      <circle cx="120" cy="96" r="8" fill="#ff4400"/>
      <circle cx="82"  cy="96" r="4" fill="#1a0800"/>
      <circle cx="122" cy="96" r="4" fill="#1a0800"/>
      <circle cx="83"  cy="95" r="1.5" fill="white"/>
      <circle cx="123" cy="95" r="1.5" fill="white"/>
      {/* Tusks */}
      <path d="M88,130 L78,148 L84,148 Z" fill="#d4b87a"/>
      <path d="M112,130 L122,148 L116,148 Z" fill="#d4b87a"/>
      {/* Legs */}
      <rect x="62" y="175" width="22" height="32" rx="8" fill="#4a3018"/>
      <rect x="88" y="178" width="22" height="30" rx="8" fill="#4a3018"/>
      <rect x="116" y="175" width="22" height="32" rx="8" fill="#4a3018"/>
      {/* Root/vine detail */}
      <path d="M32,160 Q50,140 42,120 Q34,100 50,90" stroke="#2a5a18" strokeWidth="4" fill="none"/>
      <path d="M168,160 Q150,140 158,120 Q166,100 150,90" stroke="#2a5a18" strokeWidth="4" fill="none"/>
      {/* Thorn spikes along sides */}
      {[90,100,110,120,130].map((y,i) => (
        <g key={i}>
          <polygon points={`38,${y} 20,${y-8} 22,${y+4}`} fill="#3a8a22"/>
          <polygon points={`162,${y} 180,${y-8} 178,${y+4}`} fill="#3a8a22"/>
        </g>
      ))}
    </svg>
  )
}

function Mistveil({ isAttacking, isDefeated, clr }) {
  return (
    <svg viewBox="0 0 200 260" width="200" height="260">
      {/* Mist trails */}
      <ellipse cx="100" cy="230" rx="80" ry="20" fill="#4a9ab8" opacity=".15"/>
      <path d="M40,220 Q100,200 160,220 Q140,240 100,245 Q60,240 40,220Z" fill="#5ab0cc" opacity=".12"/>
      {/* Body — translucent spirit */}
      <ellipse cx="100" cy="150" rx="50" ry="75" fill="#a0d4e8" opacity=".35"/>
      <ellipse cx="100" cy="150" rx="38" ry="60" fill="#c8eeff" opacity=".45"/>
      {/* Flowing robes bottom */}
      <path d="M50,180 Q60,220 80,240 Q100,248 120,240 Q140,220 150,180 Q130,195 100,200 Q70,195 50,180Z"
        fill="#b0dcf0" opacity=".5"/>
      {/* Head */}
      <circle cx="100" cy="85" r="40" fill="#daeef8" opacity=".7"/>
      <circle cx="100" cy="82" r="32" fill="#eef8ff" opacity=".8"/>
      {/* Eyes — glowing orbs */}
      <circle cx="85"  cy="80" r="10" fill="#4a9ab8" opacity=".9"/>
      <circle cx="115" cy="80" r="10" fill="#4a9ab8" opacity=".9"/>
      <circle cx="85"  cy="80" r="6"  fill="#7ad4ff"/>
      <circle cx="115" cy="80" r="6"  fill="#7ad4ff"/>
      <circle cx="87"  cy="78" r="2.5" fill="white"/>
      <circle cx="117" cy="78" r="2.5" fill="white"/>
      {/* Thin smile */}
      <path d="M88,96 Q100,104 112,96" stroke="#5ab0cc" strokeWidth="2.5" fill="none" opacity=".7"/>
      {/* Arms — wispy */}
      <path d="M55,130 Q30,120 20,105 Q15,95 25,90 Q35,88 40,100" stroke="#b0dcf0" strokeWidth="6" fill="none" opacity=".6" strokeLinecap="round"/>
      <path d="M145,130 Q170,120 180,105 Q185,95 175,90 Q165,88 160,100" stroke="#b0dcf0" strokeWidth="6" fill="none" opacity=".6" strokeLinecap="round"/>
      {/* Mist wisps */}
      {[0,1,2,3].map(i => (
        <ellipse key={i} cx={70+i*20} cy={195+i%2*10} rx="12" ry="5" fill="#7ad4ff" opacity=".25"
          style={{ animation: `mistDrift ${3+i}s ease-in-out infinite alternate` }}/>
      ))}
      {/* Crown of light */}
      {[-30,-15,0,15,30].map((a, i) => (
        <line key={i}
          x1={100 + Math.sin((a)*Math.PI/180)*35}
          y1={85  - Math.cos((a)*Math.PI/180)*35}
          x2={100 + Math.sin((a)*Math.PI/180)*50}
          y2={85  - Math.cos((a)*Math.PI/180)*50}
          stroke="#7ad4ff" strokeWidth="2.5" opacity=".6"/>
      ))}
    </svg>
  )
}

function Serpent({ isAttacking, isDefeated, clr }) {
  return (
    <svg viewBox="0 0 200 280" width="200" height="280">
      {/* Water splash base */}
      <ellipse cx="100" cy="265" rx="70" ry="12" fill="#4fc3f7" opacity=".3"/>
      {[70,90,110,130].map((x,i) => (
        <path key={i} d={`M${x},255 Q${x+5},${240-i*5} ${x+3},${225-i*8}`}
          stroke="#4fc3f7" strokeWidth="3" fill="none" opacity=".4"/>
      ))}
      {/* Body coil */}
      <path d="M60,260 Q20,230 30,190 Q40,150 80,160 Q120,170 130,130 Q140,90 110,70 Q80,50 90,30"
        stroke="#1e7090" strokeWidth="38" fill="none" strokeLinecap="round"/>
      <path d="M60,260 Q20,230 30,190 Q40,150 80,160 Q120,170 130,130 Q140,90 110,70 Q80,50 90,30"
        stroke="#3a98b8" strokeWidth="28" fill="none" strokeLinecap="round"/>
      <path d="M60,260 Q20,230 30,190 Q40,150 80,160 Q120,170 130,130 Q140,90 110,70 Q80,50 90,30"
        stroke="#5abcd8" strokeWidth="16" fill="none" strokeLinecap="round"/>
      {/* Scale highlights */}
      {[[80,160],[100,140],[120,120],[110,95],[95,70]].map(([x,y],i) => (
        <ellipse key={i} cx={x} cy={y} rx="14" ry="6" fill="#7ad4ff" opacity=".3" transform={`rotate(${-30+i*15} ${x} ${y})`}/>
      ))}
      {/* Head */}
      <ellipse cx="90" cy="28" rx="38" ry="28" fill="#2a8aaa" transform="rotate(-15 90 28)"/>
      <ellipse cx="90" cy="28" rx="30" ry="22" fill="#3aaac8" transform="rotate(-15 90 28)"/>
      {/* Eyes */}
      <circle cx="76"  cy="18" r="9" fill="#ffee00" opacity=".9"/>
      <circle cx="104" cy="18" r="9" fill="#ffee00" opacity=".9"/>
      <ellipse cx="76"  cy="18" rx="4" ry="7" fill="#1a0a00"/>
      <ellipse cx="104" cy="18" rx="4" ry="7" fill="#1a0a00"/>
      <circle cx="77"  cy="16" r="2" fill="white"/>
      <circle cx="105" cy="16" r="2" fill="white"/>
      {/* Fangs */}
      <polygon points="82,38 78,52 86,52" fill="white" opacity=".9"/>
      <polygon points="98,38 94,52 102,52" fill="white" opacity=".9"/>
      {/* Forked tongue */}
      <path d="M90,48 L90,60 L85,68 M90,60 L95,68" stroke="#ff4040" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
      {/* Fins */}
      <path d="M112,20 Q130,8 138,18 Q132,28 118,30Z" fill="#2a8aaa" opacity=".8"/>
    </svg>
  )
}

function Ashwraith({ isAttacking, isDefeated, clr }) {
  return (
    <svg viewBox="0 0 200 280" width="200" height="280">
      {/* Ash base */}
      <ellipse cx="100" cy="270" rx="65" ry="12" fill="#ff7020" opacity=".2"/>
      {/* Tattered cloak / smoke bottom */}
      <path d="M40,220 Q50,255 60,270 Q80,265 100,270 Q120,265 140,270 Q150,255 160,220 Q140,240 100,245 Q60,240 40,220Z"
        fill="#3a2a18" opacity=".8"/>
      {/* Body — burning ghost */}
      <ellipse cx="100" cy="155" rx="55" ry="80" fill="#2a1808" opacity=".9"/>
      <ellipse cx="100" cy="145" rx="45" ry="68" fill="#3a2010" opacity=".85"/>
      {/* Fire detail on body */}
      {[0,1,2,3,4].map(i => (
        <path key={i}
          d={`M${65+i*18},165 Q${68+i*18},${140+i%2*15} ${70+i*18},${115+i%2*10} Q${72+i*18},${135+i%2*12} ${74+i*18},165Z`}
          fill="#ff7020" opacity=".5"/>
      ))}
      {/* Inner fire glow */}
      <ellipse cx="100" cy="145" rx="30" ry="45" fill="#ff4a00" opacity=".15"/>
      {/* Arms — skeletal with flame */}
      <path d="M48,140 Q30,120 18,108 Q12,100 18,92 Q26,86 34,96 Q40,106 48,118"
        stroke="#3a2010" strokeWidth="14" fill="none" strokeLinecap="round"/>
      <path d="M48,140 Q30,120 18,108 Q12,100 18,92 Q26,86 34,96 Q40,106 48,118"
        stroke="#ff7020" strokeWidth="5" fill="none" strokeLinecap="round" opacity=".7"/>
      <path d="M152,140 Q170,120 182,108 Q188,100 182,92 Q174,86 166,96 Q160,106 152,118"
        stroke="#3a2010" strokeWidth="14" fill="none" strokeLinecap="round"/>
      <path d="M152,140 Q170,120 182,108 Q188,100 182,92 Q174,86 166,96 Q160,106 152,118"
        stroke="#ff7020" strokeWidth="5" fill="none" strokeLinecap="round" opacity=".7"/>
      {/* Claw fingers */}
      {[14,22,30,38].map((x,i) => (
        <path key={i} d={`M${x},92 L${x-4+i},76`} stroke="#ff7020" strokeWidth="2.5" strokeLinecap="round"/>
      ))}
      {[162,170,178,186].map((x,i) => (
        <path key={i} d={`M${x},92 L${x+i-4},76`} stroke="#ff7020" strokeWidth="2.5" strokeLinecap="round"/>
      ))}
      {/* Head — skull-like */}
      <circle cx="100" cy="78" r="42" fill="#2a1808"/>
      <circle cx="100" cy="75" r="36" fill="#4a2a14"/>
      {/* Eye sockets */}
      <ellipse cx="82"  cy="70" rx="14" ry="16" fill="#1a0808"/>
      <ellipse cx="118" cy="70" rx="14" ry="16" fill="#1a0808"/>
      {/* Burning eyes */}
      <ellipse cx="82"  cy="70" rx="9" ry="10" fill="#ff6600"/>
      <ellipse cx="118" cy="70" rx="9" ry="10" fill="#ff6600"/>
      <ellipse cx="82"  cy="70" rx="5" ry="6"  fill="#ffcc00"/>
      <ellipse cx="118" cy="70" rx="5" ry="6"  fill="#ffcc00"/>
      <circle cx="82"  cy="68" r="2" fill="white" opacity=".8"/>
      <circle cx="118" cy="68" r="2" fill="white" opacity=".8"/>
      {/* Nose cavity */}
      <ellipse cx="100" cy="85" rx="6" ry="8" fill="#1a0808"/>
      {/* Mouth — jagged teeth */}
      <path d="M78,100 L82,92 L88,100 L94,92 L100,100 L106,92 L112,100 L118,92 L122,100"
        stroke="#ff7020" strokeWidth="2" fill="none" opacity=".8"/>
      {/* Flame crown */}
      {[-25,-12,0,12,25].map((a, i) => (
        <path key={i}
          d={`M${100+a},40 Q${103+a},${22+i%2*8} ${100+a},${8+i%2*6} Q${97+a},${22+i%2*8} ${100+a},40Z`}
          fill={i%2===0?"#ff7020":"#ffcc00"} opacity=".7"/>
      ))}
    </svg>
  )
}

function Nightshade({ isAttacking, isDefeated, clr }) {
  return (
    <svg viewBox="0 0 220 200" width="220" height="200">
      {/* Shadow pool */}
      <ellipse cx="110" cy="188" rx="85" ry="12" fill="#4a0080" opacity=".4"/>
      {/* Tail */}
      <path d="M30,160 Q0,180 10,200 Q20,200 28,185 Q36,170 55,160"
        stroke="#2a0850" strokeWidth="18" fill="none" strokeLinecap="round"/>
      <path d="M30,160 Q0,180 10,200 Q20,200 28,185 Q36,170 55,160"
        stroke="#5a2080" strokeWidth="8" fill="none" strokeLinecap="round"/>
      {/* Body */}
      <ellipse cx="110" cy="130" rx="80" ry="55" fill="#1a0430"/>
      <ellipse cx="110" cy="122" rx="68" ry="46" fill="#2a0845"/>
      {/* Fur/shadow texture stripes */}
      {[75,90,110,130,145].map((x,i) => (
        <path key={i} d={`M${x},100 Q${x+5},120 ${x+2},140`} stroke="#3a1060" strokeWidth="3" fill="none" opacity=".5"/>
      ))}
      {/* Front legs */}
      <path d="M68,155 L58,185 Q54,192 62,194 Q68,192 70,185 L74,160Z" fill="#2a0845"/>
      <path d="M152,155 L162,185 Q166,192 158,194 Q152,192 150,185 L146,160Z" fill="#2a0845"/>
      {/* Claws */}
      {[55,61,67].map((x,i) => <path key={i} d={`M${x},194 L${x-3},205`} stroke="#c084fc" strokeWidth="2.5" strokeLinecap="round"/>)}
      {[155,161,167].map((x,i) => <path key={i} d={`M${x},194 L${x+3},205`} stroke="#c084fc" strokeWidth="2.5" strokeLinecap="round"/>)}
      {/* Neck */}
      <path d="M80,90 Q95,60 130,60 Q145,60 155,80 L145,95 Q130,75 110,78 Q90,82 85,100Z" fill="#2a0845"/>
      {/* Head */}
      <ellipse cx="140" cy="72" rx="45" ry="38" fill="#1a0430"/>
      <ellipse cx="140" cy="70" rx="38" ry="32" fill="#2a0845"/>
      {/* Ears */}
      <polygon points="110,45 100,18 125,38" fill="#1a0430"/>
      <polygon points="113,43 106,25 122,38" fill="#5a2080"/>
      <polygon points="165,42 176,15 155,36" fill="#1a0430"/>
      <polygon points="163,42 171,22 158,36" fill="#5a2080"/>
      {/* Eyes */}
      <circle cx="124" cy="68" r="12" fill="#6020a0"/>
      <circle cx="155" cy="68" r="12" fill="#6020a0"/>
      <circle cx="124" cy="68" r="8"  fill="#c084fc"/>
      <circle cx="155" cy="68" r="8"  fill="#c084fc"/>
      <ellipse cx="124" cy="68" rx="4" ry="6" fill="#0a0010"/>
      <ellipse cx="155" cy="68" rx="4" ry="6" fill="#0a0010"/>
      <circle cx="125" cy="66" r="2" fill="white" opacity=".8"/>
      <circle cx="156" cy="66" r="2" fill="white" opacity=".8"/>
      {/* Snout */}
      <ellipse cx="140" cy="88" rx="18" ry="12" fill="#2a0845"/>
      <ellipse cx="140" cy="90" rx="10" ry="6"  fill="#1a0430"/>
      {/* Nose */}
      <ellipse cx="140" cy="88" rx="6" ry="4" fill="#5a2080"/>
      {/* Fangs */}
      <polygon points="128,94 125,106 131,106" fill="white" opacity=".85"/>
      <polygon points="152,94 149,106 155,106" fill="white" opacity=".85"/>
      {/* Shadow wisps */}
      {[0,1,2].map(i => (
        <path key={i}
          d={`M${90+i*25},165 Q${85+i*25},${145+i*5} ${88+i*25},125`}
          stroke="#7030c0" strokeWidth="3" fill="none" opacity=".35" strokeLinecap="round"/>
      ))}
    </svg>
  )
}

function Unraveler({ isAttacking, isDefeated, clr }) {
  return (
    <svg viewBox="0 0 220 280" width="220" height="280">
      {/* Ground energy */}
      <ellipse cx="110" cy="270" rx="80" ry="12" fill="#ffd700" opacity=".25"/>
      {/* Unraveling script/text around body */}
      {['W','O','R','D','S','?','!','X'].map((ch,i) => {
        const a = (i/8)*Math.PI*2
        const r = 100
        return (
          <text key={i}
            x={110 + Math.cos(a)*r} y={140 + Math.sin(a)*r}
            textAnchor="middle" dominantBaseline="middle"
            fontSize="16" fontFamily="Cinzel, serif"
            fill="#ffd700" opacity=".4"
            style={{ animation: `spinSlow ${8+i}s linear infinite`, transformOrigin: '110px 140px' }}>
            {ch}
          </text>
        )
      })}
      {/* Outer swirling energy rings */}
      <circle cx="110" cy="135" r="90" fill="none" stroke="#ffd700" strokeWidth="1.5" opacity=".15"
        style={{ animation: 'spinSlow 12s linear infinite', transformOrigin: '110px 135px' }}/>
      <circle cx="110" cy="135" r="75" fill="none" stroke="#ffaa00" strokeWidth="1" opacity=".2"
        style={{ animation: 'spinSlow 8s linear reverse infinite', transformOrigin: '110px 135px' }}/>
      {/* Body — abstract geometric form */}
      <path d="M110,50 L165,95 L148,160 L72,160 L55,95 Z" fill="#1a1000"/>
      <path d="M110,58 L157,98 L143,153 L77,153 L63,98 Z" fill="#2a2000"/>
      {/* Inner light */}
      <ellipse cx="110" cy="110" rx="35" ry="40" fill="#ffd700" opacity=".08"/>
      <ellipse cx="110" cy="110" rx="22" ry="28" fill="#ffd700" opacity=".15"/>
      {/* Arms made of unraveling scripts */}
      <path d="M60,100 Q35,88 18,95 Q8,105 15,118 Q24,128 38,120 Q52,112 62,118"
        stroke="#2a2000" strokeWidth="16" fill="none" strokeLinecap="round"/>
      <path d="M60,100 Q35,88 18,95 Q8,105 15,118 Q24,128 38,120 Q52,112 62,118"
        stroke="#ffd700" strokeWidth="4" fill="none" strokeLinecap="round" opacity=".6"
        strokeDasharray="6 4"/>
      <path d="M160,100 Q185,88 202,95 Q212,105 205,118 Q196,128 182,120 Q168,112 158,118"
        stroke="#2a2000" strokeWidth="16" fill="none" strokeLinecap="round"/>
      <path d="M160,100 Q185,88 202,95 Q212,105 205,118 Q196,128 182,120 Q168,112 158,118"
        stroke="#ffd700" strokeWidth="4" fill="none" strokeLinecap="round" opacity=".6"
        strokeDasharray="6 4"/>
      {/* Floating script particles */}
      {['∑','∂','Ω','∞','∆','Φ','Ψ','Λ'].map((s, i) => (
        <text key={i}
          x={55+i*15} y={75+((i%3)*20)}
          fontSize="10" fill="#ffd700" opacity={0.2+i*0.06}
          fontFamily="serif"
          style={{
            animation: `npcFloat ${2+i*0.4}s ease-in-out infinite`,
            animationDelay: `${i*0.25}s`,
          }}>
          {s}
        </text>
      ))}
      {/* Head — masked entity */}
      <circle cx="110" cy="75" r="44" fill="#1a1000"/>
      <circle cx="110" cy="73" r="36" fill="#2a2000"/>
      {/* Mask cracks with golden light */}
      <path d="M95,58 L100,90" stroke="#ffd700" strokeWidth="2" opacity=".5"/>
      <path d="M115,55 L118,88" stroke="#ffd700" strokeWidth="1.5" opacity=".4"/>
      <path d="M88,72 L130,74" stroke="#ffd700" strokeWidth="1" opacity=".3"/>
      {/* Eyes — two golden voids */}
      <ellipse cx="95"  cy="70" rx="13" ry="15" fill="#0a0800"/>
      <ellipse cx="125" cy="70" rx="13" ry="15" fill="#0a0800"/>
      <ellipse cx="95"  cy="70" rx="9"  ry="11" fill="#ffd700" opacity=".9"/>
      <ellipse cx="125" cy="70" rx="9"  ry="11" fill="#ffd700" opacity=".9"/>
      <ellipse cx="95"  cy="70" rx="5"  ry="7"  fill="#fff8c0"/>
      <ellipse cx="125" cy="70" rx="5"  ry="7"  fill="#fff8c0"/>
      <ellipse cx="95"  cy="70" rx="2"  ry="4"  fill="#1a1000"/>
      <ellipse cx="125" cy="70" rx="2"  ry="4"  fill="#1a1000"/>
      {/* Crown of splintered text */}
      {[-35,-20,-5,10,25,40].map((a,i) => {
        const rad = (a - 90) * Math.PI / 180
        return (
          <line key={i}
            x1={110 + Math.cos(rad)*36} y1={73 + Math.sin(rad)*36}
            x2={110 + Math.cos(rad)*56} y2={73 + Math.sin(rad)*56}
            stroke="#ffd700" strokeWidth={2.5-i*0.2} opacity={0.6+i*0.05}
            style={{ animation: `pathGlow ${2+i*0.3}s ease-in-out infinite`, animationDelay:`${i*0.1}s` }}/>
        )
      })}
      {/* Robes / lower body */}
      <path d="M68,155 Q65,200 70,245 Q90,260 110,265 Q130,260 150,245 Q155,200 152,155 Q130,170 110,175 Q90,170 68,155Z"
        fill="#1a1000" opacity=".95"/>
      <path d="M78,155 Q76,195 80,235 Q95,248 110,252 Q125,248 140,235 Q144,195 142,155 Q128,166 110,170 Q92,166 78,155Z"
        fill="#2a2000" opacity=".8"/>
      {/* Unraveling hem detail */}
      {[75,90,110,130,145].map((x,i) => (
        <path key={i} d={`M${x},240 Q${x+5},255 ${x+3},265`}
          stroke="#ffd700" strokeWidth="1.5" fill="none" opacity=".35" strokeLinecap="round"/>
      ))}
    </svg>
  )
}

// ─── Main BossSprite export ───────────────────────────────────────────────────
export default function BossSprite({ type, isAttacking, isDefeated, clr, glowClr }) {
  const components = { thornhog: Thornhog, mistveil: Mistveil, serpent: Serpent, ashwraith: Ashwraith, nightshade: Nightshade, unraveler: Unraveler }
  const Sprite = components[type] || Thornhog

  return (
    <div style={{
      animation: isDefeated
        ? 'bossDefeat 1.2s ease forwards'
        : isAttacking
        ? 'bossAttack 0.55s ease'
        : `bossFloat 3.5s ease-in-out infinite, bossIdleGlow 3s ease-in-out infinite`,
      '--boss-clr': glowClr || clr,
      transformOrigin: 'center bottom',
      filter: isDefeated ? undefined : `drop-shadow(0 0 12px ${glowClr || clr})`,
    }}>
      <Sprite isAttacking={isAttacking} isDefeated={isDefeated} clr={clr} />
    </div>
  )
}
