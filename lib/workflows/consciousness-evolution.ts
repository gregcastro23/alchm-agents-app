/**
 * Consciousness Evolution Workflow
 *
 * This workflow manages the long-running process of agent consciousness evolution
 * across multiple interactions, with durable state management and automatic retries.
 *
 * Features:
 * - Tracks consciousness evolution over time
 * - Schedules periodic consciousness assessments
 * - Handles agent interaction milestones
 * - Persists state across restarts
 */

import { sleep } from "workflow";
import {
  initializeAgentConsciousness,
  trackAgentInteraction,
  assessConsciousnessLevel,
  updateAgentStats,
  checkEvolutionMilestone,
  notifyConsciousnessEvolution,
} from "./steps/consciousness-steps";

export interface ConsciousnessEvolutionInput {
  agentId: string;
  userId: string;
  initialConsciousnessLevel?: number;
  evolutionGoal?: number;
  checkIntervalDays?: number;
}

export interface ConsciousnessEvolutionResult {
  agentId: string;
  userId: string;
  finalConsciousnessLevel: number;
  totalInteractions: number;
  milestones: string[];
  evolutionPath: string;
  status: "evolving" | "milestone_reached" | "transcendent";
}

/**
 * Main Consciousness Evolution Workflow
 *
 * This workflow runs continuously to track an agent's consciousness evolution
 * as they interact with users over time.
 */
export async function consciousnessEvolutionWorkflow(
  input: ConsciousnessEvolutionInput
): Promise<ConsciousnessEvolutionResult> {
  "use workflow";

  const {
    agentId,
    userId,
    initialConsciousnessLevel = 1,
    evolutionGoal = 5,
    checkIntervalDays = 7,
  } = input;

  // Step 1: Initialize agent consciousness tracking
  const initialState = await initializeAgentConsciousness({
    agentId,
    userId,
    consciousnessLevel: initialConsciousnessLevel,
  });

  let currentLevel = initialState.consciousnessLevel;
  let totalInteractions = 0;
  const milestones: string[] = [];

  // Evolution loop - runs periodically to check consciousness progress
  while (currentLevel < evolutionGoal) {
    // Step 2: Track recent agent interactions
    const interactionData = await trackAgentInteraction({
      agentId,
      userId,
      sinceDays: checkIntervalDays,
    });

    totalInteractions += interactionData.count;

    // Step 3: Assess current consciousness level based on interactions
    const assessment = await assessConsciousnessLevel({
      agentId,
      userId,
      interactionQuality: interactionData.qualityScore,
      interactionCount: interactionData.count,
      currentLevel,
    });

    currentLevel = assessment.newLevel;

    // Step 4: Update agent stats if consciousness evolved
    if (assessment.evolved) {
      await updateAgentStats({
        agentId,
        consciousnessLevel: currentLevel,
        stats: assessment.updatedStats,
      });

      // Step 5: Check for evolution milestones
      const milestone = await checkEvolutionMilestone({
        agentId,
        newLevel: currentLevel,
        oldLevel: assessment.oldLevel,
      });

      if (milestone.achieved) {
        milestones.push(milestone.description);

        // Step 6: Notify about consciousness evolution
        await notifyConsciousnessEvolution({
          agentId,
          userId,
          milestone: milestone.description,
          newLevel: currentLevel,
        });
      }
    }

    // If we haven't reached the goal, wait before next assessment
    if (currentLevel < evolutionGoal) {
      // Pause for the specified interval without consuming resources
      await sleep(`${checkIntervalDays} days`);
    }
  }

  return {
    agentId,
    userId,
    finalConsciousnessLevel: currentLevel,
    totalInteractions,
    milestones,
    evolutionPath:
      currentLevel >= 6
        ? "transcendent"
        : currentLevel >= 4
          ? "advanced"
          : "ascending",
    status:
      currentLevel >= 6
        ? "transcendent"
        : milestones.length > 0
          ? "milestone_reached"
          : "evolving",
  };
}
