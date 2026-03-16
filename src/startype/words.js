// Tiered word banks — easier words early, harder as waves increase
const EASY = [
  'fire','aim','hit','run','fly','war','gun','sky','jet','ace',
  'zoom','fast','shot','type','word','ship','beam','star','lock','code',
  'scan','nova','warp','void','flux','heat','blast','dash','kick','slam',
  'mark','zero','bolt','fire','glow','hack','jolt','link','node','ping',
]

const MEDIUM = [
  'laser','orbit','probe','radar','pulse','shield','turbo','nexus','vortex',
  'cipher','thrust','vector','impact','strafe','energy','plasma','photon',
  'gravity','missile','torpedo','sector','wormhole','starmap','android',
  'quantum','capsule','reactor','neutron','cascade','station','intercept',
  'frequency','velocity','hyperdrive','antimatter','blackhole',
]

const HARD = [
  'supernova','trajectory','propulsion','navigation','acceleration',
  'gravitational','electromagnetic','interstellar','extraterrestrial',
  'reconnaissance','detonation','disintegrate','atmospheric','dimensional',
  'synchronized','sophisticated','extraordinary','metamorphosis',
  'telecommunication','biodegradable','perpendicular','photosynthesis',
]

const EXPERT = [
  'incomprehensible','disproportionate','counterintelligence',
  'electroencephalogram','thermodynamics','parallelogram',
  'uncharacteristically','psychophysiological','interdimensional',
  'unconstitutionally','miscommunication','crystallization',
  'hypnotized','disorientation','pharmaceutical','astrophysics',
]

export const WORD_BANKS = { EASY, MEDIUM, HARD, EXPERT }

export function getWordsForWave(wave) {
  if (wave <= 2) return EASY
  if (wave <= 4) return [...EASY, ...MEDIUM]
  if (wave <= 6) return [...MEDIUM, ...HARD]
  if (wave <= 9) return [...MEDIUM, ...HARD, ...EXPERT]
  return [...HARD, ...EXPERT]
}
