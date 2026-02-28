// ─── UTILITY ────────────────────────────────────────────────────────────────
export const checkWord     = (input, answer) => input.trim().toUpperCase() === answer.toUpperCase()
export const partialReveal = (answer) =>
  answer.slice(0, Math.ceil(answer.length / 2)) +
  '·'.repeat(answer.length - Math.ceil(answer.length / 2))

// ─── DIFFICULTY CONFIG ───────────────────────────────────────────────────────
export const DIFFICULTY = {
  easy:   { label: 'Easy',   hintAfter: 1, partialAfter: 3, timeLimit: null,  streakBonus: 10 },
  normal: { label: 'Normal', hintAfter: 2, partialAfter: 5, timeLimit: null,  streakBonus: 20 },
  hard:   { label: 'Hard',   hintAfter: 3, partialAfter: 7, timeLimit: 30,    streakBonus: 35 },
  timed:  { label: 'Timed',  hintAfter: 2, partialAfter: 5, timeLimit: 20,    streakBonus: 50 },
}

// ─── TREASURE CHEST REWARDS ──────────────────────────────────────────────────
export const CHEST_REWARDS = {
  hint:        { label: '+1 Hint Charge',      icon: '💡', type: 'hint',     value: 1 },
  heart:       { label: '+1 Heart',            icon: '❤️',  type: 'heart',    value: 1 },
  reveal:      { label: 'Reveal First Letter', icon: '🔮', type: 'reveal',   value: 1 },
  score_boost: { label: '+50 Bonus Score',     icon: '⭐', type: 'score',    value: 50 },
  skip:        { label: 'Skip One Word',       icon: '⚡', type: 'skip',     value: 1 },
  streak_save: { label: 'Streak Shield',       icon: '🛡️', type: 'streak_save', value: 1 },
  secret_lore: { label: 'Secret Lore Unlocked',icon: '📜', type: 'lore',     value: 1 },
}

// ─── HIDDEN LOCATIONS ────────────────────────────────────────────────────────
// Discovered by: exploring the map, dialogue choices, streaks
export const HIDDEN_LOCATIONS = [
  {
    id: 'h0',
    name: 'The Mossy Hollow',
    subtitle: 'A secret nook beneath the roots',
    unlockCondition: { type: 'streak', value: 3, atLocation: 0 },
    unlockHint: 'Answer 3 in a row at Forest Entrance',
    mapPos: { cx: 95, cy: 440 },
    accent: '#66ff88', glow: 'rgba(102,255,136,0.5)',
    bg: 'radial-gradient(ellipse at 50% 40%, #1a3a1a 0%, #0a1a0a 100%)',
    treeClr: '#061006',
    description: "A hidden hollow where the Groundskeeper stashes forgotten treasures.",
    npc: { name: 'Root-Warden', title: 'Keeper of Old Secrets', clr: '#66cc77' },
    chests: [
      { id: 'mh_c1', rarity: 'common',    reward: 'hint',        unlocked: false, pos: { x: 30, y: 55 } },
      { id: 'mh_c2', rarity: 'rare',      reward: 'heart',       unlocked: false, pos: { x: 65, y: 60 } },
    ],
    lore: "Long before travellers walked these paths, the Groundskeeper buried first-words here — the very first terms ever spoken in the forest.",
    words: [
      { answer: 'ROOTS',   scrambled: 'SORTUO', hint: 'The underground part of a tree that anchors it and absorbs water.', difficulty: 'easy' },
      { answer: 'NOOK',    scrambled: 'KOON',   hint: 'A small, sheltered corner or recess — a cozy hidden spot.', difficulty: 'easy' },
    ],
    success: ["The hollow rings with a soft bell-tone! You found an ancient resonance!", "The moss glows briefly. Old magic, released at last!", "Yes! Root-Warden feels the old words returning!"],
    fail:    ["Hm. Not quite. The hollow stays quiet.", "Try once more. The roots rustle with patience.", "Almost! The hollow wants to glow for you."],
    intro: ["...You found me! Nobody ever finds this hollow!", "I'm Root-Warden. I guard words the Groundskeeper forgot to carry.", "Two old words rest here. Unscramble them — they've been waiting ages for someone like you."],
  },
  {
    id: 'h1',
    name: 'Starfall Glade',
    subtitle: 'Where light fell from the sky',
    unlockCondition: { type: 'dialogue_choice', atLocation: 1, choiceKey: 'starpath' },
    unlockHint: 'Choose the celestial path in Sylph\'s dialogue',
    mapPos: { cx: 235, cy: 310 },
    accent: '#fffacd', glow: 'rgba(255,250,180,0.55)',
    bg: 'radial-gradient(ellipse at 50% 30%, #1a1840 0%, #0a0820 100%)',
    treeClr: '#04030f',
    description: "A meteor crater turned into a magical glade where starlight lingers permanently.",
    npc: { name: 'Luminos', title: 'Fragment of Fallen Light', clr: '#e8e8a0' },
    chests: [
      { id: 'sg_c1', rarity: 'legendary', reward: 'reveal',   unlocked: false, pos: { x: 50, y: 50 } },
      { id: 'sg_c2', rarity: 'common',    reward: 'score_boost', unlocked: false, pos: { x: 75, y: 62 } },
    ],
    lore: "Three stars fell here during the original curse. Their light is trapped — but your words might set them free.",
    words: [
      { answer: 'CELESTIAL', scrambled: 'SLAITCELE', hint: 'Of or relating to the sky, stars, and heavens.', difficulty: 'normal' },
      { answer: 'RADIANCE',  scrambled: 'IACERANDR', hint: 'Light or heat radiating from a source; warm brightness.', difficulty: 'normal' },
    ],
    success: ["The glade blazes brilliant white! A star remembers itself!", "Luminos trembles with joy — that word was written in starfire!", "The crater hums. You have released something eternal."],
    fail:    ["The starlight dims slightly. Try again.", "The glade waits in patience. Stars are eternal.", "Not yet. Look at the tiles more carefully — the answer shines."],
    intro: ["Oh! A visitor! The glade has been lonely since the stars fell.", "I am Luminos — a shard of starlight that couldn't return home.", "The words that called me down are scrambled. Unscramble them... and perhaps I can finally rise again."],
  },
  {
    id: 'h2',
    name: 'The Drowned Archive',
    subtitle: 'Books that breathe underwater',
    unlockCondition: { type: 'chest', value: 3 }, // unlock after opening 3 chests total
    unlockHint: 'Open 3 treasure chests across the forest',
    mapPos: { cx: 395, cy: 510 },
    accent: '#40e0d0', glow: 'rgba(64,224,208,0.5)',
    bg: 'radial-gradient(ellipse at 50% 60%, #082030 0%, #030d18 100%)',
    treeClr: '#020a10',
    description: "A submerged library where waterlogged books still hold literary wisdom.",
    npc: { name: 'Archivist', title: 'Keeper of Drowned Texts', clr: '#60c8b8' },
    chests: [
      { id: 'da_c1', rarity: 'rare',   reward: 'skip',        unlocked: false, pos: { x: 25, y: 65 } },
      { id: 'da_c2', rarity: 'common', reward: 'hint',        unlocked: false, pos: { x: 70, y: 58 } },
      { id: 'da_c3', rarity: 'rare',   reward: 'secret_lore', unlocked: false, pos: { x: 50, y: 70 } },
    ],
    lore: "The Ferryman's library — sunk when the curse struck the river. Every book holds a literary term.",
    words: [
      { answer: 'METAPHOR',  scrambled: 'RAEHPOTM', hint: 'A figure of speech comparing two unlike things without using "like" or "as".', difficulty: 'normal' },
      { answer: 'NARRATIVE', scrambled: 'IVTARENRA', hint: 'A spoken or written account of connected events — a story.', difficulty: 'hard' },
      { answer: 'ALLEGORY',  scrambled: 'EYLGORLA', hint: 'A story with a hidden symbolic meaning beneath the surface plot.', difficulty: 'hard' },
    ],
    success: ["A page dries itself! The archive exhales a grateful bubble!", "The word floats up through the water in golden light.", "Archivist stamps the page with a ghostly seal of approval!"],
    fail:    ["The ink bleeds a little more. Try again.", "These drowned words are stubborn. Focus.", "Close! The page almost turned. One more try."],
    intro: ["*glub glub* Welcome, word-seeker, to the Drowned Archive.", "I am the Archivist. My texts are waterlogged, but the words within are eternal.", "These are literary terms — the very language of storytelling. Restore them."],
  },
  {
    id: 'h3',
    name: 'The Ember Vault',
    subtitle: 'Where the explorer\'s greatest finds are kept',
    unlockCondition: { type: 'complete', atLocation: 3 }, // complete Forgotten Camp
    unlockHint: 'Complete the Forgotten Camp area',
    mapPos: { cx: 610, cy: 275 },
    accent: '#ffc080', glow: 'rgba(255,192,128,0.5)',
    bg: 'radial-gradient(ellipse at 50% 40%, #3a1500 0%, #1a0800 100%)',
    treeClr: '#0d0400',
    description: "The explorer Ember's secret vault — accessible only after her memories are restored.",
    npc: { name: 'Ember\'s Echo', title: 'Memory Made Manifest', clr: '#d4a080' },
    chests: [
      { id: 'ev_c1', rarity: 'legendary', reward: 'streak_save', unlocked: false, pos: { x: 40, y: 55 } },
      { id: 'ev_c2', rarity: 'legendary', reward: 'heart',       unlocked: false, pos: { x: 60, y: 55 } },
    ],
    lore: "Ember hid her rarest discoveries here. Only someone who helped restore her memories could ever find the entrance.",
    words: [
      { answer: 'TENACITY',   scrambled: 'YATICENT', hint: 'The quality of being determined and persistent despite difficulty.', difficulty: 'hard' },
      { answer: 'RESILIENCE', scrambled: 'RESNELICI', hint: 'The capacity to recover quickly from difficulties; toughness.', difficulty: 'hard' },
    ],
    success: ["Ember's echo shines with proud light! That word was her motto!", "The vault walls warm with amber glow — a perfect answer!", "She always said resilience was her favorite word. You proved worthy of it."],
    fail:    ["Ember's echo flickers sadly. Try again.", "She spent years learning these words. Take your time.", "Almost! The vault wants to open for you."],
    intro: ["You found it. The vault responded to your kindness in the Camp.", "I am what Ember left behind — her memories, her joy, her purpose.", "Two of her greatest words remain scrambled here. Can you restore what she treasured most?"],
  },
  {
    id: 'h4',
    name: 'The Void Threshold',
    subtitle: 'Where the Unraveler\'s power bleeds through',
    unlockCondition: { type: 'streak', value: 5 }, // 5 streak anywhere
    unlockHint: 'Achieve a combo streak of 5 correct answers in a row',
    mapPos: { cx: 760, cy: 260 },
    accent: '#dd88ff', glow: 'rgba(200,100,255,0.6)',
    bg: 'radial-gradient(ellipse at 50% 40%, #1a0030 0%, #08001a 100%)',
    treeClr: '#04000d',
    description: "A crack in reality near the Ancient Tree. Only the keenest minds find it.",
    npc: { name: 'Echo Fragment', title: 'Shard of the Unraveler\'s Past', clr: '#aa66dd' },
    chests: [
      { id: 'vt_c1', rarity: 'legendary', reward: 'reveal', unlocked: false, pos: { x: 35, y: 58 } },
      { id: 'vt_c2', rarity: 'legendary', reward: 'heart',  unlocked: false, pos: { x: 65, y: 58 } },
    ],
    lore: "Before becoming the Unraveler, it was a Scholar — the greatest linguist who ever lived. These words are from its last lecture.",
    words: [
      { answer: 'OMNISCIENT',  scrambled: 'TOICENSIMN', hint: 'Knowing everything; having complete or unlimited knowledge.', difficulty: 'hard' },
      { answer: 'PARADOX',     scrambled: 'DOAXPRA',    hint: 'A statement that seems contradictory but may reveal a truth.', difficulty: 'hard' },
      { answer: 'CATACLYSM',   scrambled: 'CSLYMTACA',  hint: 'A large-scale and violent disaster or upheaval.', difficulty: 'hard' },
    ],
    success: ["The void cracks further — but with LIGHT, not darkness!", "Echo Fragment weeps starlight. That word was the Scholar's last hope.", "The threshold pulses with ancient power. You are extraordinary."],
    fail:    ["The void swallows the attempt. Harder than it looks.", "Even the Scholar struggled with these. Breathe and try again.", "Close — the word shimmers at the edge of the void. Reach for it."],
    intro: ["...You found me. I was not certain any mortal could.", "I am what the Unraveler was before the hatred took hold — a pure echo of its scholarly self.", "Three words remain from its final lesson. Restore them... and perhaps it was not all wasted."],
  },
]

// ─── TREASURE CHESTS (per location) ─────────────────────────────────────────
export const LOCATION_CHESTS = {
  0: [ // Forest Entrance
    { id: 'fe_c1', rarity: 'common', reward: 'hint',  unlocked: false, pos: { x: 72, y: 60 }, triggerCondition: null },
    { id: 'fe_c2', rarity: 'rare',   reward: 'heart', unlocked: false, pos: { x: 18, y: 65 }, triggerCondition: { type: 'solve', count: 2 } },
  ],
  1: [
    { id: 'wp_c1', rarity: 'common',  reward: 'hint',        unlocked: false, pos: { x: 68, y: 62 }, triggerCondition: null },
    { id: 'wp_c2', rarity: 'rare',    reward: 'score_boost', unlocked: false, pos: { x: 20, y: 60 }, triggerCondition: { type: 'streak', count: 2 } },
  ],
  2: [
    { id: 'rc_c1', rarity: 'common',  reward: 'hint',   unlocked: false, pos: { x: 70, y: 58 }, triggerCondition: null },
    { id: 'rc_c2', rarity: 'rare',    reward: 'reveal', unlocked: false, pos: { x: 15, y: 62 }, triggerCondition: { type: 'solve', count: 2 } },
  ],
  3: [
    { id: 'fc_c1', rarity: 'common',    reward: 'hint',     unlocked: false, pos: { x: 71, y: 59 }, triggerCondition: null },
    { id: 'fc_c2', rarity: 'rare',      reward: 'skip',     unlocked: false, pos: { x: 16, y: 63 }, triggerCondition: { type: 'streak', count: 2 } },
    { id: 'fc_c3', rarity: 'legendary', reward: 'heart',    unlocked: false, pos: { x: 45, y: 75 }, triggerCondition: { type: 'solve', count: 3 } },
  ],
  4: [
    { id: 'sg_c1', rarity: 'common',    reward: 'hint',        unlocked: false, pos: { x: 73, y: 60 }, triggerCondition: null },
    { id: 'sg_c2', rarity: 'rare',      reward: 'streak_save', unlocked: false, pos: { x: 18, y: 64 }, triggerCondition: { type: 'streak', count: 3 } },
  ],
  5: [
    { id: 'at_c1', rarity: 'legendary', reward: 'heart',       unlocked: false, pos: { x: 42, y: 72 }, triggerCondition: null },
    { id: 'at_c2', rarity: 'legendary', reward: 'reveal',      unlocked: false, pos: { x: 60, y: 68 }, triggerCondition: { type: 'solve', count: 2 } },
  ],
}

// ─── DIALOGUE CHOICE NODES ────────────────────────────────────────────────────
// These unlock hidden areas or provide bonus items based on player choice
export const DIALOGUE_CHOICES = {
  1: { // Whispering Path — Sylph
    afterLine: 2, // show choice after intro line index 2
    prompt: "How do you wish to walk this path?",
    options: [
      { key: 'starpath',  label: '✨ Follow the starlight', outcome: 'unlock_hidden', hiddenId: 'h1', bonus: null },
      { key: 'mistwalk',  label: '🌫️ Drift with the mist',  outcome: 'bonus_hint', hiddenId: null, bonus: { type: 'hint', value: 1 } },
    ],
  },
  3: { // Forgotten Camp — Ember
    afterLine: 2,
    prompt: "What will you say to comfort Ember?",
    options: [
      { key: 'encourage', label: '🌟 "Your words live on in this forest."', outcome: 'bonus_score', hiddenId: null, bonus: { type: 'score', value: 30 } },
      { key: 'listen',    label: '🤍 "Tell me about your favorite discovery."', outcome: 'bonus_lore',  hiddenId: null, bonus: { type: 'lore',  value: 'ember_memory' } },
    ],
  },
}

// ─── LOCATIONS ──────────────────────────────────────────────────────────────
export const LOCATIONS = [
  {
    id: 0,
    name: 'Forest Entrance',
    subtitle: 'Where all journeys begin',
    mapPos: { cx: 130, cy: 500 },
    mapIcon: 'entrance',
    bg: 'radial-gradient(ellipse at 50% 25%, #1e4a24 0%, #0e2d14 45%, #080f0a 100%)',
    accent: '#4dff91', glow: 'rgba(77,255,145,0.45)', treeClr: '#071a0b',
    ptcType: 'leaves', ptcClr: '#4dff91',
    npc: { name: 'Bramble', title: 'the Old Groundskeeper', clr: '#7abf7a' },
    words: [
      { answer: 'CAT',  scrambled: 'TCA',  hint: 'A small furry creature that purrs and says meow.',         difficulty: 'easy' },
      { answer: 'TREE', scrambled: 'RETE', hint: 'It has roots, a trunk, branches, and leaves.',             difficulty: 'easy' },
      { answer: 'BIRD', scrambled: 'BRID', hint: 'A feathered creature with wings that can sing and fly.',   difficulty: 'easy' },
    ],
    intro: [
      "Well, bless my bark! A real live traveler at the Forest Entrance!",
      "Name's Bramble. I've kept this gateway longer than the moss on those old stones.",
      "Something dreadful has happened, dear. The forest's words — all scrambled like a broken nest!",
      "Without proper words, the magic fades. Creatures forget their very names.",
      "Help old Bramble unscramble these words, and you'll take your first step toward healing this forest!",
    ],
    success: [
      "Ha-HA! Sharp as a holly leaf, you are! The forest remembers that word now!",
      "Splendid! See how the leaves shimmer? That's the magic returning — because of YOU!",
      "Right you are! The entrance sings with gratitude! You have the gift, young one!",
    ],
    fail: [
      "Oops-a-daisy! Not quite right. Bramble's patient as a great oak — try again, dear.",
      "Hmm, that's not it. Take a breath. Read the letters nice and slow.",
      "Nearly, nearly! You're closer than you think. The word wants to be found!",
    ],
    outro: "You've done it! The Forest Entrance glows again! But wait — the Thornhog stirs in the thicket...",
    boss: {
      name: 'Thornhog', title: 'Guardian of the Threshold',
      type: 'thornhog', clr: '#7abf5a', glowClr: 'rgba(100,200,80,0.6)', hp: 2,
      introLines: [
        "GROOAARGH! Who dares trespass into MY forest?!",
        "I am Thornhog — woven from root and thorn since the First Planting.",
        "You think a few little words makes you worthy? Prove it... against ME.",
      ],
      attackLines: [
        "HA! Your words are weak! The thorns advance!",
        "WRONG! Feel the bark close in around you!",
        "Incorrect! My roots drink your confusion!",
      ],
      defeatLines: [
        "...Impossible. A human who actually knows these words?",
        "The thorns... they soften. The roots... release.",
        "You are worthy of this forest. Pass... brave wanderer.",
      ],
      words: [
        { answer: 'FERN',  scrambled: 'NREF',  hint: 'A leafy, feathery plant that grows on shaded forest floors.', difficulty: 'easy' },
        { answer: 'GROVE', scrambled: 'VREOG', hint: 'A small group of trees growing close together.',              difficulty: 'easy' },
      ],
    },
    postBoss: "The Thornhog dissolves into bark and soil. The path to the Whispering Path is open. Sylph waits in the mist ahead.",
  },
  {
    id: 1,
    name: 'Whispering Path',
    subtitle: 'Where the forest leans in and listens',
    mapPos: { cx: 268, cy: 378 },
    mapIcon: 'mist',
    bg: 'radial-gradient(ellipse at 50% 25%, #0f3040 0%, #081828 45%, #040d14 100%)',
    accent: '#7ad4ff', glow: 'rgba(122,212,255,0.45)', treeClr: '#060f1a',
    ptcType: 'wisps', ptcClr: '#7ad4ff',
    npc: { name: 'Sylph', title: 'the Mist Wanderer', clr: '#a0d4e8' },
    words: [
      { answer: 'LIGHT', scrambled: 'TILGH',  hint: 'It banishes darkness. The sun gives it. Candles flicker with it.', difficulty: 'easy' },
      { answer: 'CLOUD', scrambled: 'DOLUC',  hint: 'White or grey shapes that drift slowly across the sky.',           difficulty: 'easy' },
      { answer: 'SOUND', scrambled: 'NODSU',  hint: 'What your ears perceive — music, voices, the wind.',              difficulty: 'easy' },
    ],
    intro: [
      "...You came. I heard your heartbeat long before your footsteps.",
      "I am Sylph. I drift between the dewdrops and the silence of this path.",
      "These ways were once full of whispered words — every leaf carried a syllable.",
      "Now the words are scrambled... broken like morning mist in a sudden gale.",
      "Speak the lost words back into being. Gently. The path... is listening.",
    ],
    success: [
      "...Yes. Do you feel that? The mist settles where truth is spoken. Beautiful.",
      "The path remembers. That word is restored. You carry rare conviction.",
      "Breathe it in. The forest exhales with you. Well answered, wanderer.",
    ],
    fail: [
      "...No. But the word hasn't gone far at all.",
      "Listen. The path whispers the answer if you become still enough to hear it.",
      "Nearly... Try once more. The mist always parts for the persistent.",
    ],
    outro: "The path breathes freely once more. But the Mistveil spirit stirs — something ancient wakes in the fog...",
    boss: {
      name: 'Mistveil', title: 'Spirit of the Forgotten Whisper',
      type: 'mistveil', clr: '#a0d4e8', glowClr: 'rgba(122,212,255,0.75)', hp: 2,
      introLines: [
        "Ssshhh... do you hear it? That silence... is me.",
        "I am Mistveil. I swallowed the words of this path when the curse fell.",
        "They live inside me — tangled, unspoken. Come take them back... if you dare.",
      ],
      attackLines: [
        "The mist thickens! Your words dissolve into the fog!",
        "Incorrect... I draw the whispers tighter around you...",
        "Wrong. The silence grows heavier. Focus, wanderer...",
      ],
      defeatLines: [
        "The words... escape me at last... I feel lighter...",
        "Perhaps... this silence was not peace. Perhaps it was a prison.",
        "Go on. Carry what I release. The path truly belongs to you now.",
      ],
      words: [
        { answer: 'BREEZE', scrambled: 'ZREEBE', hint: 'A gentle, pleasant wind. It rustles leaves and cools warm skin.',        difficulty: 'normal' },
        { answer: 'HOLLOW', scrambled: 'LLOHOW', hint: 'An empty space inside something — like the inside of a tree trunk.',   difficulty: 'normal' },
      ],
    },
    postBoss: "Mistveil dissolves into silver that settles on every leaf. The Whispering Path sings. Find Finn at the Old River Crossing.",
  },
  {
    id: 2,
    name: 'Old River Crossing',
    subtitle: 'Where the current carries ancient memories',
    mapPos: { cx: 430, cy: 455 },
    mapIcon: 'river',
    bg: 'radial-gradient(ellipse at 50% 35%, #103545 0%, #081828 45%, #050e18 100%)',
    accent: '#4fc3f7', glow: 'rgba(79,195,247,0.45)', treeClr: '#050d18',
    ptcType: 'drops', ptcClr: '#4fc3f7',
    npc: { name: 'Finn', title: 'the River Ferryman', clr: '#78a8c0' },
    words: [
      { answer: 'BRIDGE', scrambled: 'BRDIGE', hint: 'A structure connecting two sides — often built over water.', difficulty: 'normal' },
      { answer: 'STREAM', scrambled: 'ESMRAT', hint: 'A small, flowing body of water moving over rocks and stones.', difficulty: 'normal' },
      { answer: 'VOYAGE', scrambled: 'GYOVAE', hint: 'A long journey, often by water. An adventure with a clear destination.', difficulty: 'normal' },
    ],
    intro: [
      "Ho there! Watch your step — the planks get slippery this time of year!",
      "Name's Finn. Ferried folk across this river for forty-odd years. Never lost a passenger.",
      "River used to sing, y'know. Day and night, a cheerful tune. Now it's quiet as stone.",
      "Something scrambled up the words it knew. River forgot what it was even for.",
      "Impress me with your wits, and I'll give you safe passage! That's the deal.",
    ],
    success: [
      "HA! A proper brain on you! D'you hear that? The river's humming again!",
      "Well I'll be! Spot on! Come on — you've earned your crossing!",
      "Sharp as a fishhook! Word restored — the river remembers itself at last!",
    ],
    fail: [
      "Hmm. Not quite. I've seen the current fool wiser folk. Give it another go.",
      "Wrong, but you haven't quit — that counts for something. Think it through.",
      "Not yet, friend. The answer's floating right there on the surface.",
    ],
    outro: "Safe crossing! But the river churns — the Rivertide Serpent rises from the deep...",
    boss: {
      name: 'Rivertide Serpent', title: 'Ancient Warden of the Deep Current',
      type: 'serpent', clr: '#4fc3f7', glowClr: 'rgba(79,195,247,0.75)', hp: 3,
      introLines: [
        "SSSSS... the crossing belongs to ME, land-walker.",
        "I am the Rivertide Serpent. I've coiled beneath this bridge since before your kind had language.",
        "The curse gave me new power — your words are mine now. Unscramble them... if the cold doesn't freeze your mind.",
      ],
      attackLines: [
        "The current sweeps your answer away! TRY AGAIN!",
        "WRONG! The river rises! The words stay MINE!",
        "Incorrect! I coil tighter! Think harder, land-walker!",
      ],
      defeatLines: [
        "Nngh... you unravel my coils with every word...",
        "The river speaks your name... I bow to you, word-keeper.",
        "The crossing is yours. The current sings again because of you.",
      ],
      words: [
        { answer: 'TORRENT', scrambled: 'RTONRET', hint: 'A fast, violent flow of water — a rushing, unstoppable current.', difficulty: 'normal' },
        { answer: 'SURFACE', scrambled: 'FCAREUS', hint: 'The outermost layer of something — the very top of the water.',  difficulty: 'normal' },
        { answer: 'CURRENT', scrambled: 'NRTRUCE', hint: 'The steady movement of water in one direction through a river.',  difficulty: 'normal' },
      ],
    },
    postBoss: "The Serpent descends into the deep, singing a word-song as it goes. Head to the eastern ridge — Ember needs you at the Forgotten Camp.",
  },
  {
    id: 3,
    name: 'Forgotten Camp',
    subtitle: 'Where embers of memory refuse to die',
    mapPos: { cx: 560, cy: 330 },
    mapIcon: 'fire',
    bg: 'radial-gradient(ellipse at 50% 40%, #301808 0%, #1a0f05 45%, #0d0703 100%)',
    accent: '#ff9a3c', glow: 'rgba(255,154,60,0.45)', treeClr: '#120a02',
    ptcType: 'embers', ptcClr: '#ff7020',
    npc: { name: 'Ember', title: 'Ghost of the Lost Explorer', clr: '#d4a070' },
    words: [
      { answer: 'SHELTER', scrambled: 'ERLSETH', hint: 'A place of safety and protection from rain, wind, or danger.', difficulty: 'normal' },
      { answer: 'ANCIENT', scrambled: 'TICNAEN', hint: 'Very, very old. Something from a time long, long past.',        difficulty: 'normal' },
      { answer: 'WHISPER', scrambled: 'WREIPHS', hint: 'To speak so quietly that you can barely be heard at all.',      difficulty: 'normal' },
    ],
    intro: [
      "Oh... a visitor. I wasn't sure anyone would ever find their way here.",
      "I'm Ember. I was an explorer once. Catalogued every word of this forest.",
      "The curse struck while I was sleeping. Pulled the words right out of the air.",
      "I've been here ever since... tethered by the weight of everything lost.",
      "If you restore the words I cherished most... perhaps I can finally find peace.",
    ],
    success: [
      "Oh! That word! Written in copper ink on page fifty-seven... I feel it returning!",
      "Yes... YES. The camp feels warmer. You're giving me back to myself. Thank you.",
      "Bless you. I'd almost forgotten what joy felt like. That word is real again.",
    ],
    fail: [
      "That's alright. I waited years. A moment more won't hurt.",
      "Don't despair. These words hid even from me, and I had a full dictionary.",
      "You're close — I feel the word trembling, wanting to break free. One more try.",
    ],
    outro: "The camp glows warmly now. But from the shadows... the Ashwraith wakes...",
    boss: {
      name: 'Ashwraith', title: 'Specter of the Burned Archive',
      type: 'ashwraith', clr: '#ff9a3c', glowClr: 'rgba(255,100,30,0.75)', hp: 3,
      introLines: [
        "Hhhhheh... you dare disturb my ashes, flesh-walker?",
        "I am the Ashwraith. I consumed the explorer's journals. Her words fuel my fire.",
        "Every word you restore weakens me. So I will make them IMPOSSIBLE to solve.",
      ],
      attackLines: [
        "BURN! The letters scatter in the heat! Try again!",
        "Wrong! The ash smothers your answer!",
        "Incorrect! My flames grow hotter with your failure!",
      ],
      defeatLines: [
        "No... the fire cools... the words leave me...",
        "The explorer's words were never mine to keep. I see that now.",
        "Take them. Take them all. The ash... is at peace.",
      ],
      words: [
        { answer: 'FLICKER', scrambled: 'KLICREF', hint: 'To shine unsteadily — burning and dimming in turns, like a candle in wind.', difficulty: 'hard' },
        { answer: 'ANGUISH', scrambled: 'SHUGANI', hint: 'Severe emotional pain or distress. The deepest kind of sorrow.',              difficulty: 'hard' },
        { answer: 'REMNANT', scrambled: 'TNRANME', hint: 'A small remaining part of something that once existed in full.',               difficulty: 'hard' },
      ],
    },
    postBoss: "The Ashwraith crumbles to harmless ash that drifts upward like freed fireflies. Ember finally smiles. Shadow Grove lies through the dark trees.",
  },
  {
    id: 4,
    name: 'Shadow Grove',
    subtitle: 'Where darkness tests the truly worthy',
    mapPos: { cx: 700, cy: 415 },
    mapIcon: 'shadow',
    bg: 'radial-gradient(ellipse at 50% 25%, #1a0835 0%, #080418 45%, #030210 100%)',
    accent: '#c084fc', glow: 'rgba(192,132,252,0.45)', treeClr: '#04021a',
    ptcType: 'shadows', ptcClr: '#8040d0',
    npc: { name: 'Shade', title: 'Warden of the Deep Grove', clr: '#9060c0' },
    words: [
      { answer: 'PHANTOM',   scrambled: 'MHOANTP',   hint: 'A ghost or apparition. Something seen but not entirely real.',              difficulty: 'hard' },
      { answer: 'ETHEREAL',  scrambled: 'LEHAEERT',  hint: "Extremely delicate and otherworldly. Like a spirit's touch.",               difficulty: 'hard' },
      { answer: 'LABYRINTH', scrambled: 'BNHRIYTLA', hint: 'A complex, confusing network of passages. An intricate maze.',              difficulty: 'hard' },
    ],
    intro: [
      "You enter my Grove. Bold. Or perhaps foolish. I have not yet decided which.",
      "I am Shade. Sentinel over the deepest words since before the First Frost.",
      "Do not mistake darkness for emptiness, wanderer. Shadow holds more than light ever could.",
      "These words I guard have weight. They are not given freely.",
      "Prove you are worthy. Unscramble them... if you truly can.",
    ],
    success: [
      "...Correct. You see through shadow. That word belongs to the light once more.",
      "Hmph. You have surprised me. That does not happen often.",
      "Worthy. That is all I will say. But coming from me — it means everything.",
    ],
    fail: [
      "No. Shadows do not yield to guesses. Focus. Think with precision.",
      "Wrong. But you have not fled. That earns you one more chance.",
      "Still not there. But the darkness around you thins. I see your resolve growing.",
    ],
    outro: "You have my respect. But even I fear what stirs deeper in these trees... the Nightshade Predator has caught your scent.",
    boss: {
      name: 'Nightshade Predator', title: 'Apex Hunter of the Shadow Grove',
      type: 'nightshade', clr: '#c084fc', glowClr: 'rgba(192,132,252,0.8)', hp: 3,
      introLines: [
        "*low, rumbling growl* ...I have been watching you from the very beginning.",
        "I am the Nightshade Predator. I hunt what others fear to name.",
        "Your journey ends HERE. In MY darkness. Unless your words are stronger than my claws...",
      ],
      attackLines: [
        "SLASH! Your answer is torn to ribbons! Try again!",
        "Wrong! I lunge from the shadows! FOCUS!",
        "Incorrect... the darkness closes in... what is the word?!",
      ],
      defeatLines: [
        "...The words illuminate me. I can see myself clearly for the first time.",
        "I am not a monster. I was a guardian, made dark by the curse.",
        "Go on, word-bearer. You carry a light no shadow can extinguish.",
      ],
      words: [
        { answer: 'SINISTER',  scrambled: 'TNIRESIS',  hint: 'Suggesting evil or danger. Something that feels threatening and deeply wrong.', difficulty: 'hard' },
        { answer: 'PREDATOR',  scrambled: 'DAPRORET',  hint: 'A hunter that kills other animals for food. A ruthless, relentless pursuer.',   difficulty: 'hard' },
        { answer: 'OBSCURITY', scrambled: 'YCRISUBOT', hint: 'The state of being unknown or unclear — hidden away from sight in the dark.',   difficulty: 'hard' },
      ],
    },
    postBoss: "The Nightshade Predator transforms into a beam of light that shoots toward the Ancient Tree. The final path opens before you.",
  },
  {
    id: 5,
    name: 'Ancient Tree Sanctuary',
    subtitle: 'Where the first words were spoken and legends sealed',
    mapPos: { cx: 762, cy: 185 },
    mapIcon: 'tree',
    bg: 'radial-gradient(ellipse at 50% 35%, #2e1a00 0%, #120800 45%, #080400 100%)',
    accent: '#ffd700', glow: 'rgba(255,215,0,0.55)', treeClr: '#0a0500',
    ptcType: 'golden', ptcClr: '#ffd700',
    npc: { name: 'The Ancient Tree', title: 'Guardian of All Words', clr: '#c8a040' },
    words: [
      { answer: 'ENCHANTMENT',  scrambled: 'TNEHCNAMENT',  hint: 'The magical state of being utterly spellbound and captivated.',       difficulty: 'hard' },
      { answer: 'EQUILIBRIUM',  scrambled: 'LIIURBQUMEI',  hint: 'A state of perfect balance and stability between opposing forces.',   difficulty: 'hard' },
      { answer: 'CONSCIOUSNESS', scrambled: 'SNOUSSNECICOS', hint: 'The state of being aware and awake — the very experience of existence.', difficulty: 'hard' },
    ],
    intro: [
      "...",
      "Child.",
      "You have walked... very, very far.",
      "I am the Ancient Tree. I was here before this forest had a name.",
      "The words within me are the oldest. The ones that gave this place its very soul.",
      "The curse struck deepest here. Three words remain imprisoned within my roots.",
      "You have proven yourself at every crossing. Every path. Every shadow.",
      "Now... set them free.",
    ],
    success: [
      "YESSS... Feel the earth tremble? A piece of me awakens once more.",
      "That word has not been spoken in a hundred years. You have returned it to the world.",
      "The roots sing. They carry your name to every corner of this forest.",
    ],
    fail: [
      "Do not be discouraged. Even I struggled to hold these words. They are ancient things.",
      "Not yet. But your whole journey proves you worthy beyond any doubt.",
      "The word reaches for you. Reach back. Try again.",
    ],
    outro: "The greatest words return... but the Unraveler — source of the original curse — now stands before you...",
    boss: {
      name: 'The Unraveler', title: 'Origin of the Eternal Curse',
      type: 'unraveler', clr: '#ffd700', glowClr: 'rgba(255,215,0,0.9)', hp: 3,
      introLines: [
        "So. You've come this far. I am... impressed. And furious.",
        "I AM THE UNRAVELER. I scattered these words across the forest a century ago. FOR A REASON.",
        "Language gives mortals too much power. Words build worlds. Words topple them.",
        "I will scramble you into NOTHING if you cannot name what I have become.",
      ],
      attackLines: [
        "THE WORDS FRACTURE! YOUR MIND FRACTURES WITH THEM!",
        "WRONG! Feel the language leave you! What are you without words?!",
        "Incorrect! The curse TIGHTENS! THINK! THINK!",
      ],
      defeatLines: [
        "No... NO... impossible... I have guarded these for a CENTURY...",
        "The words... they leave me... I feel myself unraveling... fittingly...",
        "You have done what I believed no mortal could do.",
        "The forest is free. And so... am I.",
      ],
      words: [
        { answer: 'PHENOMENON',  scrambled: 'NEOPNHOMNE',  hint: 'A remarkable or extraordinary occurrence that inspires awe and wonder in all who witness it.',  difficulty: 'hard' },
        { answer: 'TRANSCEND',   scrambled: 'DCENNASTR',   hint: 'To go beyond the limits of ordinary experience — to rise above all boundaries and surpass.',     difficulty: 'hard' },
        { answer: 'SOVEREIGNTY', scrambled: 'YTVNIRGOSE',  hint: 'Supreme power and authority — the absolute right to govern oneself completely.',                  difficulty: 'hard' },
      ],
    },
    postBoss: 'VICTORY',
  },
]

export const TOTAL_WORDS    = LOCATIONS.reduce((s, l) => s + l.words.length + l.boss.words.length, 0)
export const LOCATION_COUNT = LOCATIONS.length

// ─── PARTIAL REVEAL (alias for backward compat) ──────────────────────────────
export const partial = partialReveal