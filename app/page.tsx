import Image from "next/image"
import Link from "next/link"
import ElementalChart from "@/components/elemental-chart"

export default function HomePage() {
  return (
    <div className="container py-12 px-4 mx-auto">
      <section className="flex flex-col items-center text-center mb-16">
        <h1 className="text-4xl font-bold tracking-tight mb-6">
          Alchm Kitchen - Astrological Agents
        </h1>
        <p className="text-xl max-w-3xl mb-8">
          Explore the wisdom of the cosmos through our advanced astrological agents powered by AI
        </p>
        <div className="flex flex-wrap justify-center gap-4">
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
        </div>
      </section>

      <section className="grid md:grid-cols-4 gap-8 mb-16">
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
          <h2 className="text-xl font-semibold mb-3">Today's Chart</h2>
          <p className="mb-4">View the current planetary positions and explore their elemental influences.</p>
          <Link href="/chart-of-the-moment" className="text-blue-600 dark:text-blue-400 font-medium">
            View now →
          </Link>
        </div>
        <div className="border p-6 rounded-lg">
          <h2 className="text-xl font-semibold mb-3">Elemental Analysis</h2>
          <p className="mb-4">Discover your elemental profile based on the powerful Alchm alchemical system.</p>
          <Link href="/elemental-chart" className="text-blue-600 dark:text-blue-400 font-medium">
            Analyze →
          </Link>
        </div>
      </section>
      
      <section className="mb-16">
        <h2 className="text-2xl font-bold text-center mb-8">Alchemical Elements</h2>
        <p className="text-center max-w-3xl mx-auto mb-8">
          Discover the unique elemental profile of the current moment based on planetary positions using our advanced alchemical system.
          Each element contributes its own unique qualities to the cosmic signature of now.
        </p>
        <ElementalChart />
      </section>
    </div>
  )
} 