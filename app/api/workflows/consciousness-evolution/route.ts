/**
 * Consciousness Evolution Workflow API Endpoint
 *
 * Triggers and manages consciousness evolution workflows for agents.
 *
 * POST /api/workflows/consciousness-evolution - Start a new workflow
 * GET /api/workflows/consciousness-evolution?workflowId=xxx - Get workflow status
 */

import { NextRequest, NextResponse } from "next/server";
import {
  consciousnessEvolutionWorkflow,
  type ConsciousnessEvolutionInput,
} from "@/lib/workflows/consciousness-evolution";

/**
 * POST - Start a new consciousness evolution workflow
 */
export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as ConsciousnessEvolutionInput;

    // Validate required fields
    if (!body.agentId || !body.userId) {
      return NextResponse.json(
        { error: "Missing required fields: agentId and userId" },
        { status: 400 }
      );
    }

    // Start the workflow (runs in the background)
    const workflowPromise = consciousnessEvolutionWorkflow(body);

    // In a production app, you'd want to:
    // 1. Store the workflow ID in a database
    // 2. Return the workflow ID to the client
    // 3. Provide endpoints to check workflow status
    //
    // For now, we'll run it and return the workflow info
    const workflowId = `consciousness-${body.agentId}-${body.userId}-${Date.now()}`;

    // Don't await - let it run in the background
    workflowPromise
      .then((result) => {
        console.log("Workflow completed:", workflowId, result);
      })
      .catch((error) => {
        console.error("Workflow failed:", workflowId, error);
      });

    return NextResponse.json(
      {
        success: true,
        workflowId,
        message: "Consciousness evolution workflow started",
        input: body,
      },
      { status: 202 } // 202 Accepted - processing in background
    );
  } catch (error) {
    console.error("Error starting workflow:", error);
    return NextResponse.json(
      {
        error: "Failed to start consciousness evolution workflow",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

/**
 * GET - Check workflow status
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const workflowId = searchParams.get("workflowId");

    if (!workflowId) {
      return NextResponse.json(
        { error: "Missing workflowId parameter" },
        { status: 400 }
      );
    }

    // In a production app, you'd query the workflow status from the database
    // For now, return a placeholder response
    return NextResponse.json({
      workflowId,
      status: "running",
      message:
        "Workflow status tracking will be available in the next iteration",
    });
  } catch (error) {
    console.error("Error fetching workflow status:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch workflow status",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
