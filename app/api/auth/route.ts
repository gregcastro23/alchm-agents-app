import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

const prisma = new PrismaClient()
const JWT_SECRET = process.env.JWT_SECRET || 'secret'

export async function POST(request: Request) {
  const body = await request.json()
  const { action, email, password, name, birthData } = body

  if (action === 'register') {
    const hashedPassword = await bcrypt.hash(password, 12)
    const user = await prisma.user.create({
      data: { email, name, passwordHash: hashedPassword },
    })

    await prisma.userProfile.create({
      data: { userId: user.id, birthDate: new Date(birthData) },
    })

    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' })
    return NextResponse.json({ success: true, user, token })
  }

  if (action === 'login') {
    const user = await prisma.user.findUnique({ where: { email } })
    if (!user || !(await bcrypt.compare(password, user.hashedPassword))) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    }

    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' })
    return NextResponse.json({ success: true, user, token })
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
}
