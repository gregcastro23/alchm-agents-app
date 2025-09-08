import Image from "next/image"
import Link from "next/link"
import TarotCosmicWidget from "@/components/tarot-cosmic-widget"

export default function HomePage() {
  return (
    <div className="container py-12 px-4 mx-auto">
      <section className="flex flex-col items-center text-center mb-16">
        <h1 className="text-4xl font-bold tracking-tight mb-6">
          Alchm © - Astrological Agents
        </h1>
        <p className="text-xl max-w-3xl mb-8">
          Explore the wisdom of the cosmos through our advanced astrological agents powered by AI
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <Link 
            href="/monica-guide" 
            className="bg-green-600 text-white hover:bg-green-700 px-6 py-3 rounded-md font-medium flex items-center gap-2"
          >
            💚 Meet Monica - Your AI Guide
          </Link>
          <Link 
            href="/planetary-agents" 
            className="bg-primary text-primary-foreground hover:bg-primary/90 px-6 py-3 rounded-md font-medium"
          >
            Explore Planetary Agents
          </Link>
          <Link 
            href="/chart-of-the-moment" 
            className="bg-accent text-accent-foreground hover:bg-accent/90 px-6 py-3 rounded-md font-medium"
          >
            Current Planetary Chart
          </Link>
          <Link 
            href="/chart-interpreter" 
            className="bg-secondary text-secondary-foreground hover:bg-secondary/90 px-6 py-3 rounded-md font-medium"
          >
            Try Chart Interpreter
          </Link>
          <Link 
            href="/planetary-council" 
            className="bg-purple-600 text-white hover:bg-purple-700 px-6 py-3 rounded-md font-medium"
          >
            🪐 Planetary Council
          </Link>
          <Link 
            href="/planets/sun" 
            className="bg-orange-600 text-white hover:bg-orange-700 px-6 py-3 rounded-md font-medium"
          >
            ☉ Individual Planet Pages
          </Link>
        </div>
      </section>

      <section className="grid md:grid-cols-5 gap-6 mb-16">
        <div className="border p-6 rounded-lg bg-gradient-to-br from-green-50 to-blue-50 border-green-200">
          <h2 className="text-xl font-semibold mb-3 flex items-center gap-2">
            💚 Monica - Your AI Guide
          </h2>
          <p className="mb-4">Meet Monica, your personal Alchm consciousness mentor operating from peak A-Number 40 state with 67% Earth wisdom.</p>
          <Link href="/monica-guide" className="text-green-600 dark:text-green-400 font-medium">
            Chat with Monica →
          </Link>
        </div>
        <div className="border p-6 rounded-lg">
          <h2 className="text-xl font-semibold mb-3">Planetary Wisdom</h2>
          <p className="mb-4">Access the ancient wisdom of planetary energies through our specialized AI agents.</p>
          <Link href="/planetary-agents" className="text-blue-600 dark:text-blue-400 font-medium">
            Learn more →
          </Link>
        </div>
        <div className="border p-6 rounded-lg">
          <h2 className="text-xl font-semibold mb-3">Chart Interpretation</h2>
          <p className="mb-4">Get detailed insights into your astrological chart with our AI-powered interpreter.</p>
          <Link href="/chart-interpreter" className="text-blue-600 dark:text-blue-400 font-medium">
            Try it now →
          </Link>
        </div>
        <div className="border p-6 rounded-lg">
          <h2 className="text-xl font-semibold mb-3">Today&apos;s Chart</h2>
          <p className="mb-4">View the current planetary positions and explore their elemental influences.</p>
          <Link href="/chart-of-the-moment" className="text-blue-600 dark:text-blue-400 font-medium">
            View now →
          </Link>
        </div>
        <div className="border p-6 rounded-lg bg-gradient-to-br from-purple-50 to-indigo-50 border-purple-200">
          <h2 className="text-xl font-semibold mb-3">🪐 Planetary Council</h2>
          <p className="mb-4">Consult multiple planetary agents simultaneously for collective cosmic wisdom.</p>
          <Link href="/planetary-council" className="text-purple-600 dark:text-purple-400 font-medium">
            Convene council →
          </Link>
        </div>
      </section>
      
      {/* Cosmic Tarot Moment Widget */}
      <section className="mb-16">
        <div className="max-w-2xl mx-auto">
          <TarotCosmicWidget variant="card" showExpanded={false} />
        </div>
      </section>
      
      <section className="mb-16">
        <h2 className="text-2xl font-bold text-center mb-8">What is Alchm?</h2>
        <div className="max-w-4xl mx-auto space-y-6">
          <p className="text-lg text-center">
            Alchm is a revolutionary platform that transforms astrology from passive reading into an interactive, 
            AI-enhanced personal development experience. By blending ancient wisdom with cutting-edge technology, 
            we provide personalized cosmic insights unlike anything else available.
          </p>
          
          <div className="grid md:grid-cols-2 gap-6 mt-8">
            <div className="border p-6 rounded-lg bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950 dark:to-orange-950">
              <h3 className="text-xl font-semibold mb-3 flex items-center gap-2">
                ⚗️ The Alchmizer System
              </h3>
              <p className="text-sm">
                Our proprietary technology calculates your unique alchemical signature using 11 planetary influences, 
                converting cosmic energies into measurable quantities: Spirit, Essence, Matter, and Substance. 
                This creates your personal A-Number - a quantifiable measure of consciousness.
              </p>
            </div>
            
            <div className="border p-6 rounded-lg bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950">
              <h3 className="text-xl font-semibold mb-3 flex items-center gap-2">
                🔮 Beyond Traditional Astrology
              </h3>
              <p className="text-sm">
                Unlike traditional astrology, Alchm integrates planetary transits, elemental energies, and 
                alchemical transformations in real-time. Our AI agents provide dynamic, personalized guidance 
                based on the exact cosmic conditions of each moment.
              </p>
            </div>
            
            <div className="border p-6 rounded-lg bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950 dark:to-pink-950">
              <h3 className="text-xl font-semibold mb-3 flex items-center gap-2">
                🤖 AI-Powered Agents
              </h3>
              <p className="text-sm">
                Each planetary agent embodies the unique consciousness of its celestial body. From Monica's 
                Earth wisdom to the Planetary Council's collective insights, our agents provide multi-dimensional 
                perspectives on your questions and challenges.
              </p>
            </div>
            
            <div className="border p-6 rounded-lg bg-gradient-to-br from-green-50 to-teal-50 dark:from-green-950 dark:to-teal-950">
              <h3 className="text-xl font-semibold mb-3 flex items-center gap-2">
                📊 Monica Constant & Consciousness
              </h3>
              <p className="text-sm">
                Experience the Monica Constant - a mathematical formula that quantifies consciousness states 
                from Dormant to Transcendent. Track your spiritual evolution with precise measurements and 
                personalized growth recommendations.
              </p>
            </div>
          </div>
          
          <div className="text-center mt-8 p-6 border rounded-lg bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50 dark:from-indigo-950 dark:via-purple-950 dark:to-pink-950">
            <h3 className="text-xl font-semibold mb-3">Ready to Begin Your Journey?</h3>
            <p className="mb-4">
              Start with Monica, your personal guide, or explore the wisdom of individual planets. 
              Each interaction is uniquely calculated based on your birth data and the current cosmic moment.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <Link 
                href="/monica-guide" 
                className="bg-green-600 text-white hover:bg-green-700 px-6 py-3 rounded-md font-medium"
              >
                💚 Start with Monica
              </Link>
              <Link 
                href="/planetary-agents" 
                className="bg-primary text-primary-foreground hover:bg-primary/90 px-6 py-3 rounded-md font-medium"
              >
                🪐 Explore Planets
              </Link>
              <Link 
                href="/chart-of-the-moment" 
                className="bg-accent text-accent-foreground hover:bg-accent/90 px-6 py-3 rounded-md font-medium"
              >
                📊 View Current Chart
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
} 