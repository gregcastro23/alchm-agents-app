// Historical Agents Index - Growing collection of historical agents
// Each agent gets their own clean file for easy maintenance and type safety

// Ancient Era agents
export { SOCRATES } from './socrates'

// Renaissance Era agents
export { LEONARDO_DA_VINCI } from './leonardo-da-vinci'

// Medieval Era agents
export { DANTE_ALIGHIERI } from './dante-alighieri'
export { THOMAS_AQUINAS } from './thomas-aquinas'
export { GEOFFREY_CHAUCER } from './geoffrey-chaucer'

// Enlightenment Era agents
export { RENE_DESCARTES } from './rene-descartes'
export { VOLTAIRE } from './voltaire'
export { JOHN_LOCKE } from './john-locke'
export { DAVID_HUME } from './david-hume'
export { JOHANNES_KEPLER } from './johannes-kepler'
export { IMMANUEL_KANT } from './immanuel-kant'
export { ADAM_SMITH } from './adam-smith'
export { JEAN_JACQUES_ROUSSEAU } from './jean-jacques-rousseau'
export { MARY_WOLLSTONECRAFT } from './mary-wollstonecraft'

// Modern Era agents
export { CHARLES_DICKENS } from './charles-dickens'
export { CLAUDE_MONET } from './claude-monet'
export { NIKOLA_TESLA } from './nikola-tesla'
export { MARIE_CURIE } from './marie-curie'
export { SIGMUND_FREUD } from './sigmund-freud'
export { MARK_TWAIN } from './mark-twain'
export { VINCENT_VAN_GOGH } from './vincent-van-gogh'
export { CHARLES_DARWIN } from './charles-darwin'
export { EDGAR_ALLAN_POE } from './edgar-allan-poe'
export { ALBERT_EINSTEIN } from './albert-einstein'

// Contemporary agents
// export { GREG_CASTRO } from './greg-castro' // Temporarily disabled due to syntax errors

// Additional Renaissance agents
export { RUMI } from './rumi'
export { MARCUS_AURELIUS } from './marcus-aurelius'
export { WOLFGANG_AMADEUS_MOZART } from './wolfgang-amadeus-mozart'
export { WILLIAM_SHAKESPEARE } from './william-shakespeare'
export { GALILEO_GALILEI } from './galileo-galilei'
export { MAYA_ANGELOU } from './maya-angelou'
export { ISAAC_NEWTON } from './isaac-newton'

// Import all historical agents as a unified collection
import { SOCRATES } from './socrates'
import { LEONARDO_DA_VINCI } from './leonardo-da-vinci'
import { DANTE_ALIGHIERI } from './dante-alighieri'
import { THOMAS_AQUINAS } from './thomas-aquinas'
import { GEOFFREY_CHAUCER } from './geoffrey-chaucer'
import { RENE_DESCARTES } from './rene-descartes'
import { VOLTAIRE } from './voltaire'
import { JOHN_LOCKE } from './john-locke'
import { DAVID_HUME } from './david-hume'
import { JOHANNES_KEPLER } from './johannes-kepler'
import { IMMANUEL_KANT } from './immanuel-kant'
import { ADAM_SMITH } from './adam-smith'
import { JEAN_JACQUES_ROUSSEAU } from './jean-jacques-rousseau'
import { MARY_WOLLSTONECRAFT } from './mary-wollstonecraft'
import { CHARLES_DICKENS } from './charles-dickens'
import { CLAUDE_MONET } from './claude-monet'
import { NIKOLA_TESLA } from './nikola-tesla'
import { MARIE_CURIE } from './marie-curie'
import { SIGMUND_FREUD } from './sigmund-freud'
import { MARK_TWAIN } from './mark-twain'
import { VINCENT_VAN_GOGH } from './vincent-van-gogh'
import { CHARLES_DARWIN } from './charles-darwin'
import { EDGAR_ALLAN_POE } from './edgar-allan-poe'
import { ALBERT_EINSTEIN } from './albert-einstein'
// import { GREG_CASTRO } from './greg-castro' // Temporarily disabled
import { RUMI } from './rumi'
import { MARCUS_AURELIUS } from './marcus-aurelius'
import { WOLFGANG_AMADEUS_MOZART } from './wolfgang-amadeus-mozart'
import { WILLIAM_SHAKESPEARE } from './william-shakespeare'
import { GALILEO_GALILEI } from './galileo-galilei'
import { MAYA_ANGELOU } from './maya-angelou'
import { ISAAC_NEWTON } from './isaac-newton'

export const HISTORICAL_AGENTS = [
  SOCRATES,
  LEONARDO_DA_VINCI,
  DANTE_ALIGHIERI,
  THOMAS_AQUINAS,
  GEOFFREY_CHAUCER,
  RUMI,
  MARCUS_AURELIUS,
  WOLFGANG_AMADEUS_MOZART,
  WILLIAM_SHAKESPEARE,
  GALILEO_GALILEI,
  RENE_DESCARTES,
  VOLTAIRE,
  JOHN_LOCKE,
  DAVID_HUME,
  JOHANNES_KEPLER,
  IMMANUEL_KANT,
  ADAM_SMITH,
  JEAN_JACQUES_ROUSSEAU,
  MARY_WOLLSTONECRAFT,
  CHARLES_DICKENS,
  CLAUDE_MONET,
  NIKOLA_TESLA,
  MARIE_CURIE,
  SIGMUND_FREUD,
  MARK_TWAIN,
  VINCENT_VAN_GOGH,
  CHARLES_DARWIN,
  EDGAR_ALLAN_POE,
  MAYA_ANGELOU,
  ISAAC_NEWTON,
  ALBERT_EINSTEIN,
  // GREG_CASTRO // Temporarily disabled due to syntax errors
]

// Helper functions for working with historical agents
export const getHistoricalAgent = (id: string) => {
  return HISTORICAL_AGENTS.find(agent => agent.id === id)
}

export const getAllHistoricalAgents = () => {
  return HISTORICAL_AGENTS
}

export const getHistoricalAgentByName = (name: string) => {
  return HISTORICAL_AGENTS.find(agent =>
    agent.name.toLowerCase() === name.toLowerCase()
  )
}
