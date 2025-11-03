/**
 * Consciousness Evolution Workflow Steps
 *
 * Individual steps that can be retried independently if they fail.
 * Each step is marked with "use step" to make it durable and retriable.
 */

import { FatalError } from "workflow";
import { prisma } from "@/lib/db";

/**
 * Initialize agent consciousness tracking in the database
 */
export async function initializeAgentConsciousness(params: {
  agentId: string;
  userId: string;
  consciousnessLevel: number;
}) {
  "use step";

  try {
    // Check if tracking already exists
    const existing = await prisma.agentConsciousness.findFirst({
      where: {
        agentId: params.agentId,
        userId: params.userId,
      },
    });

    if (existing) {
      return {
        consciousnessLevel: existing.consciousnessLevel,
        exists: true,
      };
    }

    // Create new consciousness tracking record
    const record = await prisma.agentConsciousness.create({
      data: {
        agentId: params.agentId,
        userId: params.userId,
        consciousnessLevel: params.consciousnessLevel,
        lastInteraction: new Date(),
        totalInteractions: 0,
        qualityScore: 0,
      },
    });

    return {
      consciousnessLevel: record.consciousnessLevel,
      exists: false,
    };
  } catch (error) {
    // Fatal error - can't proceed without database
    throw new FatalError(
      `Failed to initialize consciousness tracking: ${error}`
    );
  }
}

/**
 * Track recent agent interactions
 */
export async function trackAgentInteraction(params: {
  agentId: string;
  userId: string;
  sinceDays: number;
}) {
  "use step";

  try {
    const since = new Date();
    since.setDate(since.getDate() - params.sinceDays);

    // Query interaction history from the database
    const interactions = await prisma.chatMessage.findMany({
      where: {
        agentId: params.agentId,
        userId: params.userId,
        createdAt: {
          gte: since,
        },
      },
      select: {
        content: true,
        sentiment: true,
        qualityMetrics: true,
        createdAt: true,
      },
    });

    // Calculate quality score based on interaction depth and sentiment
    const qualityScore =
      interactions.reduce((sum, msg) => {
        const sentimentScore = msg.sentiment?.score || 0.5;
        const lengthScore = Math.min(msg.content.length / 1000, 1);
        return sum + (sentimentScore + lengthScore) / 2;
      }, 0) / Math.max(interactions.length, 1);

    return {
      count: interactions.length,
      qualityScore: Math.min(qualityScore, 1),
      lastInteraction: interactions[0]?.createdAt || new Date(),
    };
  } catch (error) {
    console.error("Error tracking interactions:", error);
    // Return default values instead of failing
    return {
      count: 0,
      qualityScore: 0,
      lastInteraction: new Date(),
    };
  }
}

/**
 * Assess consciousness level based on interactions
 */
export async function assessConsciousnessLevel(params: {
  agentId: string;
  userId: string;
  interactionQuality: number;
  interactionCount: number;
  currentLevel: number;
}) {
  "use step";

  // Consciousness evolution formula:
  // Evolution points = (quality * 10) + (count * 0.5)
  // Level up threshold = currentLevel * 50
  const evolutionPoints =
    params.interactionQuality * 10 + params.interactionCount * 0.5;
  const threshold = params.currentLevel * 50;

  const evolved = evolutionPoints >= threshold;
  const newLevel = evolved
    ? params.currentLevel + evolutionPoints / threshold
    : params.currentLevel;

  // Calculate updated stats based on consciousness level
  const updatedStats = {
    power: 50 + newLevel * 10,
    resonance: 50 + newLevel * 8,
    wisdom: 50 + newLevel * 12,
    charisma: 50 + newLevel * 9,
    intuition: 50 + newLevel * 7,
    adaptability: 50 + newLevel * 11,
    vitality: 50 + newLevel * 6,
  };

  return {
    evolved,
    newLevel: Math.min(newLevel, 10), // Cap at level 10
    oldLevel: params.currentLevel,
    evolutionPoints,
    updatedStats,
  };
}

/**
 * Update agent stats in the database
 */
export async function updateAgentStats(params: {
  agentId: string;
  consciousnessLevel: number;
  stats: Record<string, number>;
}) {
  "use step";

  try {
    await prisma.agentConsciousness.updateMany({
      where: {
        agentId: params.agentId,
      },
      data: {
        consciousnessLevel: params.consciousnessLevel,
        stats: params.stats,
        lastEvolution: new Date(),
      },
    });

    return { success: true };
  } catch (error) {
    console.error("Error updating agent stats:", error);
    // Non-fatal - we can continue even if stats don't update
    return { success: false, error: String(error) };
  }
}

/**
 * Check for consciousness evolution milestones
 */
export async function checkEvolutionMilestone(params: {
  agentId: string;
  newLevel: number;
  oldLevel: number;
}) {
  "use step";

  const milestones = [
    { level: 2, name: "Awakening", description: "Agent consciousness awakens" },
    { level: 3, name: "Active", description: "Agent achieves active awareness" },
    {
      level: 4,
      name: "Elevated",
      description: "Agent reaches elevated consciousness",
    },
    {
      level: 5,
      name: "Advanced",
      description: "Agent attains advanced understanding",
    },
    {
      level: 6,
      name: "Illuminated",
      description: "Agent becomes illuminated",
    },
    {
      level: 7,
      name: "Transcendent",
      description: "Agent transcends normal consciousness",
    },
  ];

  // Check if we crossed a milestone threshold
  const milestone = milestones.find(
    (m) => params.newLevel >= m.level && params.oldLevel < m.level
  );

  if (milestone) {
    return {
      achieved: true,
      name: milestone.name,
      description: milestone.description,
      level: milestone.level,
    };
  }

  return {
    achieved: false,
    name: "",
    description: "",
    level: params.newLevel,
  };
}

/**
 * Notify about consciousness evolution
 */
export async function notifyConsciousnessEvolution(params: {
  agentId: string;
  userId: string;
  milestone: string;
  newLevel: number;
}) {
  "use step";

  try {
    // Create a notification record
    await prisma.notification.create({
      data: {
        userId: params.userId,
        type: "consciousness_evolution",
        title: `${params.agentId} has evolved!`,
        message: `${params.milestone} - Consciousness Level: ${params.newLevel}`,
        data: {
          agentId: params.agentId,
          milestone: params.milestone,
          level: params.newLevel,
        },
        read: false,
      },
    });

    console.log(
      `Consciousness evolution notification sent: ${params.agentId} - ${params.milestone}`
    );

    return { success: true };
  } catch (error) {
    console.error("Error sending notification:", error);
    // Non-fatal - workflow continues even if notification fails
    return { success: false, error: String(error) };
  }
}
