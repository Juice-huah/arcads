// ─── src/hamsterball/gameData.js ─────────────────────────────────────────────

export const BALL_RADIUS   = 0.72;
export const GRAVITY       = -0.013;       // 🟢 Floatier jump!
export const JUMP_VEL      = 0.36;         // 🟢 Higher jump!
export const BASE_SPEED    = 0.10;         // 🟢 Faster rolling to clear gaps easily
export const SLOW_MO_SPEED = 0.012;        
export const LANE_W        = 3.2;          
export const TRACK_W       = LANE_W * 3;   
export const LANE_TARGETS  = [-LANE_W, 0, LANE_W]; // 🟢 Exported for seeds/pads
export const CAM_DIST      = 8.5;          // 🟢 Better camera angle
export const CAM_UP        = 3.8;          
export const CAM_FOV       = 65;           

export const SKIN_STREAKS = [0, 5, 10, 15, 20, 30];

export const STREAK_BOOSTS = [
  { streak:3,  type:"speed",  label:"SPEED SURGE",  emoji:"⚡", color:"#f97316", dur:4 },
  { streak:6,  type:"shield", label:"WORD SHIELD",  emoji:"🛡️", color:"#4ade80", dur:7 },
  { streak:10, type:"double", label:"DOUBLE SCORE", emoji:"✨", color:"#c084fc", dur:8 },
  { streak:15, type:"boost",  label:"MEGA BLAST",   emoji:"🔥", color:"#ef4444", dur:5 },
];

export const WORD_CATEGORIES = {
  all:     { label:"All Words",  emoji:"📖" },
  animals: { label:"Animals",    emoji:"🦁" },
  nature:  { label:"Nature",     emoji:"🌿" },
  objects: { label:"Objects",    emoji:"🪝" },
  actions: { label:"Actions",    emoji:"🏃" },
  places:  { label:"Places",     emoji:"🗺️"  },
};

export const CATEGORIZED_WORDS = {
  animals: [
    "ant","ape","bee","bird","boar","bull","cat","clam","crab","crow","deer","dog","dove",
    "duck","eagle","elk","fish","fox","frog","goat","hawk","hen","horse","hound","jay",
    "lamb","lark","lion","lynx","mare","mink","mole","moose","moth","mouse","mule","orca",
    "otter","owl","pig","pony","ram","rat","raven","seal","shark","sheep","slug","snail",
    "snake","stag","swan","toad","wasp","weasel","wolf","wren","yak","zebra",
  ],
  nature: [
    "ash","bark","bay","bloom","brook","cave","clay","cliff","cloud","coast","coral",
    "crest","creek","dawn","dew","dune","dust","earth","ember","fern","flame","flood",
    "foam","fog","frost","gale","glow","grove","gulf","haze","hill","ice","ivy","jungle",
    "lake","lava","leaf","lily","marsh","meadow","mist","moon","moss","mud","nest","oak",
    "ocean","petal","pine","pond","rain","reef","ridge","river","rock","root","sand",
    "seed","sky","snow","soil","star","stone","storm","stream","sun","tide","trail",
    "tree","vale","vapor","vine","wave","wind",
  ],
  objects: [
    "axe","ball","band","barn","barrel","basket","bell","blade","board","bolt","book",
    "boot","bow","box","bridge","brush","cage","candle","cape","cart","chain","chest",
    "clock","coat","coin","crown","cup","dart","desk","dome","door","drum","flag",
    "flask","fork","gate","gear","glove","hammer","harp","helm","hook","horn","jar",
    "key","lamp","lance","lens","lock","map","mask","net","oar","orb","pen","pipe",
    "plate","pot","rake","ring","rope","sail","shield","ship","sign","slab","staff",
    "sword","tile","torch","tower","tube","vase","wall","wand","wheel",
  ],
  actions: [
    "aim","bite","blow","bounce","brew","burn","carry","catch","chase","climb","copy",
    "dash","dig","dive","drag","draw","drift","drop","earn","fall","feed","find","flee",
    "flex","float","fold","freeze","give","glow","grab","grip","grow","guide","hang",
    "heal","help","hide","hold","hunt","jump","kick","land","leap","lift","load","look",
    "march","melt","move","open","pace","pull","push","raise","reach","rise","roll",
    "roar","rush","sail","scan","shift","sing","skip","slide","snap","soar","spin",
    "stand","swim","throw","twist","walk","wave","wrap",
  ],
  places: [
    "alley","arch","arena","attic","barn","bay","cabin","cafe","camp","canyon","cave",
    "city","cove","creek","den","desert","dome","farm","field","fjord","fort","garden",
    "gate","glen","gorge","grove","gulf","hall","harbor","hill","home","house","hut",
    "isle","jungle","keep","lab","lake","land","lane","ledge","library","marsh",
    "meadow","mine","park","path","peak","pier","plain","pond","reef","ridge","river",
    "road","school","shore","slope","spire","stable","store","street","swamp","temple",
    "town","trail","tunnel","vale","valley","village","wall","well","wood","yard",
  ],
};

const _allSet = new Set([
  ...CATEGORIZED_WORDS.animals, ...CATEGORIZED_WORDS.nature, ...CATEGORIZED_WORDS.objects,
  ...CATEGORIZED_WORDS.actions, ...CATEGORIZED_WORDS.places,
  "ace","acid","age","air","ale","alive","alone","angel","ankle","arc","art","awe",
  "able","acorn","add","ache","atom","algae","base","bath","bead","beam","bean",
  "beat","bend","best","bike","bill","bind","body","bond","bone","blue","bold","brave",
  "calm","cane","card","care","cast","cell","chat","chip","coal","cool","cope","cord",
  "corn","crop","cube","cute","cycle","data","date","dear","deck","dial","dice","diet",
  "dome","drug","dusk","elf","era","evil","emit","epic","even","exam","exit",
  "face","fact","fade","fail","fame","fast","fawn","fear","fell","felt","file",
  "fill","fine","firm","fist","flat","flaw","flea","flip","fond","font","food",
  "form","fork","free","fuel","full","fund","fury","gain",
  "game","gaze","gill","glad","goal","good","gore","grim","grit","gull","hack",
  "hail","half","halt","hand","hard","harm","head","heap","heat","heel","held","herd",
  "here","high","hike","hole","home","hood","host","howl","hulk","hymn",
  "ink","iron","idea","iris","itch","icon","inch","jest","join","jolt","joy",
  "just","jewel","jazz","jelly","keen","kind","king","kiss","know","lack","land",
  "lane","lash","last","lawn","lead","lean","left","lend","lime","line","list",
  "live","lore","loss","love","luck","lung","lurk","lush",
  "mad","main","make","mane","mast","mate","math","meal","mean","meat","meet",
  "memo","mesh","mild","mile","mill","mind","mine","moan","mock","mode","much",
  "myth","nail","navy","near","need","next","node","norm","note",
  "neck","neon","nerd","nick","null","numb","oath","odd","old","ooze","onyx",
  "pace","pack","page","pain","pale","palm","park","part","past","pawn","peck",
  "pelt","perk","pest","pick","pike","pill","pink","plea","poll","pool","poor",
  "pose","post","pour","prey","prop","pull","pump","push","plume","prime","prowl",
  "race","rack","raft","rage","ramp","rank","rant","rate","read","real","reap",
  "reed","reel","rely","rent","rest","rift","riot","ripe","robe","roam","roll",
  "roof","ruin","rule","rush","rust","sack","safe","sail","same","sane","save",
  "seam","seep","self","shed","shop","shot","sick","sift","sill","site","skin",
  "skip","slap","slim","slip","snap","sneak","soak","soap","soft","sole","song",
  "sore","sort","sour","span","spit","spot","stem","step","stew","suit","swap",
  "sweet","swift","tab","tape","task","teal","tend","tent","test","thin","tick",
  "till","tilt","tire","toll","tone","tool","torn","toss","tray","trek","trim",
  "trip","tune","tusk","type","unit","urge","user","undo","vale","veil","vent",
  "vest","void","vow","vein","valor","vast","vice","ward","warp","weed","well",
  "wing","wail","wait","walk","wall","wane","weak","wear","weld","wide","wild",
  "will","wilt","wink","wipe","wish","wood","wool","word","worm","yarn","yard",
  "yell","yore","year","yoga","zap","zeal","zero","zone","zoom","zest","zing",
]);
export const ALL_WORDS = [..._allSet].sort();

export const WORD_INDEX = {};
for (const w of ALL_WORDS) {
  const k = w[0]; if (!WORD_INDEX[k]) WORD_INDEX[k] = []; WORD_INDEX[k].push(w);
}

export const WORLDS = [
  { id:1, name:"Meadow Run",     emoji:"🌿", color:"#4ade80", altColor:"#22d3ee",
    sky:0x87ceeb, tile:0x5cb85c, tileDark:0x3a7d3a, fog:0xd0f0c0, fogDensity:0.007,
    desc:"Sunny meadow — gentle hills, wide paths!",
    amb:0xffeedd, sun:0xffeedd, gateCount:4, speed:1.0,
    groundColor:0x4a9140, treeTrunk:0x5c3a1e },
  { id:2, name:"Coastal Breeze", emoji:"🏖️", color:"#38bdf8", altColor:"#7dd3fc",
    sky:0x60a5fa, tile:0xd4a96a, tileDark:0xb8864a, fog:0xbae6fd, fogDensity:0.006,
    desc:"Sandy shores, ocean breezes!",
    amb:0xeef8ff, sun:0xfff4cc, gateCount:4, speed:1.05,
    groundColor:0xd2b48c, treeTrunk:0x6b4423 },
  { id:3, name:"Autumn Forest",  emoji:"🍂", color:"#f59e0b", altColor:"#fb923c",
    sky:0xe27340, tile:0x92400e, tileDark:0x6b2a08, fog:0xfde68a, fogDensity:0.009,
    desc:"Fallen leaves, crisp forest paths!",
    amb:0x553311, sun:0xffaa44, gateCount:5, speed:1.1,
    groundColor:0x7a3b10, treeTrunk:0x4a2b0a },
  { id:4, name:"Snow Peak",      emoji:"❄️", color:"#e2e8f0", altColor:"#bae6fd",
    sky:0x8db7cc, tile:0xdde8f0, tileDark:0xaac5d5, fog:0xd8ecf8, fogDensity:0.008,
    desc:"Crystal mountain paths, icy charm!",
    amb:0xddeeff, sun:0xffffff, gateCount:5, speed:1.15,
    groundColor:0xd0e8f0, treeTrunk:0x6688aa },
  { id:5, name:"Night Sky",      emoji:"🌌", color:"#c084fc", altColor:"#f0abfc",
    sky:0x020308, tile:0x2e1065, tileDark:0x1a0840, fog:0x1a0840, fogDensity:0.011,
    desc:"Roll under the stars — cosmic vibes!",
    amb:0x110022, sun:0xaa44ff, gateCount:6, speed:1.2,
    groundColor:0x1a0840, treeTrunk:0x3d1d7a },
];

export const SKINS = [
  { id:0, name:"Cheddar",  streakUnlock:0,  body:0xd4844a, belly:0xfde8c8, ear:0xd4844a, ballTint:0xffffff, desc:"Classic golden hamster" },
  { id:1, name:"Snowball", streakUnlock:5,  body:0xf0f0f0, belly:0xffffff, ear:0xffcccc, ballTint:0xddeeff, desc:"Pure white & fluffy" },
  { id:2, name:"Midnight", streakUnlock:10, body:0x2d3a6b, belly:0x4a5a9a, ear:0x3d4e80, ballTint:0x8888ff, desc:"Dark & mysterious" },
  { id:3, name:"Goldie",   streakUnlock:15, body:0xd97706, belly:0xfef3c7, ear:0xd97706, ballTint:0xffe066, desc:"Shimmering gold" },
  { id:4, name:"Galaxy",   streakUnlock:20, body:0x7c3aed, belly:0xa78bfa, ear:0x8b5cf6, ballTint:0xcc88ff, desc:"Cosmic purple" },
  { id:5, name:"Coral",    streakUnlock:30, body:0xf43f5e, belly:0xfda4af, ear:0xf43f5e, ballTint:0xff99aa, desc:"Blazing coral — elite!" },
];

export const KEYFRAMES = `
  @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&family=Fredoka+One&family=Exo+2:wght@400;600;700;800;900&display=swap');

  @keyframes hFloat     { 0%,100%{transform:translateY(0)}  50%{transform:translateY(-12px)} }
  @keyframes hPulse     { 0%,100%{opacity:.7}               50%{opacity:1} }
  @keyframes hSlideUp   { from{opacity:0;transform:translateY(24px)} to{opacity:1;transform:translateY(0)} }
  @keyframes hBounce    { 0%,100%{transform:translateX(-50%) scale(1)} 50%{transform:translateX(-50%) scale(1.07)} }
  @keyframes hShake     { 0%,100%{transform:translateX(-50%)} 20%{transform:translateX(calc(-50% - 6px))} 40%{transform:translateX(calc(-50% + 6px))} 60%{transform:translateX(calc(-50% - 4px))} 80%{transform:translateX(calc(-50% + 4px))} }
  @keyframes hCountdown { 0%{opacity:0;transform:scale(2.2)} 30%{opacity:1;transform:scale(1.05)} 100%{opacity:1;transform:scale(1)} }
  @keyframes hGlow      { 0%,100%{box-shadow:0 0 8px currentColor} 50%{box-shadow:0 0 22px currentColor,0 0 40px currentColor} }
  @keyframes hCorrect   { 0%{transform:translateX(-50%) scale(1)} 30%{transform:translateX(-50%) scale(1.06)} 70%{transform:translateX(-50%) scale(.98)} 100%{transform:translateX(-50%) scale(1)} }
  @keyframes hPop       { 0%{opacity:1;transform:translateY(0) scale(1)} 100%{opacity:0;transform:translateY(-68px) scale(.85)} }
  @keyframes hRingEntry { from{opacity:0;transform:translateX(-50%) scale(.7) translateY(20px)} to{opacity:1;transform:translateX(-50%) scale(1) translateY(0)} }
`;

let _audioCtx = null;
export function getAudioCtx() {
  if (!_audioCtx) try { _audioCtx = new (window.AudioContext||window.webkitAudioContext)(); } catch {}
  return _audioCtx;
}

export function playSound(type) {
  try {
    const ctx = getAudioCtx(); if (!ctx) return;
    const osc = ctx.createOscillator(), gain = ctx.createGain();
    osc.connect(gain); gain.connect(ctx.destination);
    const map = {
      correct:     [[392,523,659,784],     0.38,"sine",    0.30],
      wrong:       [[300,240,180],         0.28,"sawtooth",0.25],
      jump:        [[380,560],             0.14,"sine",    0.16],
      switch:      [[480,580],             0.08,"sine",    0.10],
      checkpoint:  [[440,554,660,880],     0.48,"sine",    0.28],
      gate_open:   [[392,494,587,740],     0.44,"sine",    0.28],
      ring_enter:  [[660,780,880],         0.32,"sine",    0.28],
      ring_exit:   [[880,660],             0.22,"sine",    0.18],
      win:         [[523,659,784,1047],    0.75,"sine",    0.36],
      streak:      [[523,659,784,1047,1318],0.58,"sine",   0.38],
      skin_unlock: [[660,880,1100,1320],   0.68,"sine",    0.42],
      coin:        [[987,1318],            0.15,"sine",    0.15], // 🟢 NEW SEED SOUND
    };
    const [freqs, dur, wave, vol] = map[type] || [[440],0.2,"sine",0.2];
    gain.gain.setValueAtTime(vol, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
    osc.type = wave;
    osc.frequency.setValueAtTime(freqs[0], ctx.currentTime);
    freqs.forEach((f,i) => { if(i>0) osc.frequency.setValueAtTime(f, ctx.currentTime + (dur/freqs.length)*i); });
    osc.start(ctx.currentTime); osc.stop(ctx.currentTime + dur);
  } catch {}
}

export function validateChainWord(typed, lastWord, usedSet, teacherCfg={}) {
  const w = typed.trim().toLowerCase();
  const { minLength=2, customWords=[], category="all", wordList=null } = teacherCfg;
  if (w.length < 1)           return { ok:false, reason:"Select an option!" };
  if (w.length < minLength)   return { ok:false, reason:`Min ${minLength} letters!` };
  if (usedSet.has(w))         return { ok:false, reason:"Already used!" };
  
  if (lastWord) {
    const target = lastWord.slice(-1).toLowerCase();
    if (w[0] !== target) return { ok:false, reason:`Must start with "${target.toUpperCase()}"` };
  }
  return { ok:true };
}

export function generateMultipleChoice(targetLetter, usedSet, teacherCfg={}) {
    const { category="all", customWords=[], wordList=null } = teacherCfg;
    const effectiveList = wordList || (
      customWords.length > 0 ? customWords :
      category !== "all" && CATEGORIZED_WORDS[category] ? CATEGORIZED_WORDS[category] :
      ALL_WORDS
    );
  
    const tl = targetLetter.toLowerCase();
  
    // 1. Find Correct Word
    const correctCandidates = effectiveList.filter(w => w[0] === tl && !usedSet.has(w));
    let correctWord = "word"; // emergency fallback
    if (correctCandidates.length > 0) {
        correctWord = correctCandidates[Math.floor(Math.random() * correctCandidates.length)];
    } else {
        const allUnused = effectiveList.filter(w => !usedSet.has(w));
        if (allUnused.length > 0) correctWord = allUnused[Math.floor(Math.random() * allUnused.length)];
    }
  
    // 2. Find 3 Wrong Words (that don't start with the target letter)
    const incorrectCandidates = effectiveList.filter(w => w[0] !== tl && w !== correctWord);
    const incorrectWords = [];
    const shuffledIncorrect = incorrectCandidates.sort(() => 0.5 - Math.random());
    for(let i = 0; i < 3 && i < shuffledIncorrect.length; i++){
      incorrectWords.push(shuffledIncorrect[i]);
    }
  
    // 3. Combine and Shuffle
    const options = [correctWord, ...incorrectWords].sort(() => 0.5 - Math.random());
  
    return { options, correct: correctWord };
}

export function getTargetLetter(lastWord) {
  if (!lastWord) return null;
  return lastWord.slice(-1).toUpperCase();
}