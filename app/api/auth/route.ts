import { NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import { prisma } from '@/lib/db'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'secret'

export async function POST(request: Request) {
  const body = await request.json()
  const { action, email, password, name, birthData } = body

  if (action === 'register') {
    const hashedPassword = await bcrypt.hash(password, 12)
    const user = await prisma.users.create({
      data: { id: randomUUID(), email, name, passwordHash: hashedPassword },
    })

    await prisma.user_profiles.create({
      data: {
        id: randomUUID(),
        userId: user.id,
        birthDate: birthData ? new Date(birthData) : new Date(),
        birthLocation: { name: 'Unknown', latitude: 0, longitude: 0 },
        natalChart: birthData ?? {},
        monicaConstant: 0,
        dominantElement: 'Fire',
        updatedAt: new Date(),
      },
    })

    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' })
    return NextResponse.json({ success: true, user, token })
  }

  if (action === 'login') {
    const user = await prisma.users.findUnique({ where: { email } })
    if (!user?.passwordHash || !(await bcrypt.compare(password, user.passwordHash))) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    }

    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' })
    return NextResponse.json({ success: true, user, token })
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
}
