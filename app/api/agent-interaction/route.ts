import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: Request) {
  const { userId, agentId, interactionData } = await request.json();

  // Use backend API call instead of direct import
  const planetary = { status: 'placeholder' }; // TODO: Call backend API
  const powerGained = 1; // TODO: Implement calculation via backend API
  
  await prisma.consciousnessInteraction.create({
    data: {
      userId,
      agentId,
      interactionData: JSON.stringify(interactionData),
      planetaryInfluences: JSON.stringify(planetary),
      powerGained
    }
  });
  
  return NextResponse.json({ success: true });
}
