import PlanetaryAgentChat from "@/components/planetary-agent-chat"

export default function PlanetaryAgentsPage() {
  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold text-center mb-8">Planetary Wisdom Agents</h1>
      <p className="text-center mb-8 max-w-2xl mx-auto">
        Consult with astrological agents representing each planet in their specific dignity. Select a planet, sign, and
        degree to receive wisdom tailored to that celestial configuration.
      </p>

      <PlanetaryAgentChat />
    </div>
  )
}
