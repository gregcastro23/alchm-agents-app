/**
 * Verify database tables exist and are accessible
 *
 * This script checks:
 * 1. Database connection
 * 2. RAG tables exist (RAGQuery, RAGSource, RAGFeedback)
 * 3. Write operations work
 * 4. Read operations work
 */

import { PrismaClient } from '@prisma/client'

async function verifyDatabase() {
  const prisma = new PrismaClient()

  console.log('🔍 Verifying Database Connection...\n')

  try {
    // 1. Check connection
    console.log('1. Testing database connection...')
    await prisma.$connect()
    console.log('   ✅ Database connected successfully\n')

    // 2. Check RAG tables exist and count records
    console.log('2. Checking RAG tables...')

    try {
      const queryCount = await prisma.rAGQueryLog.count()
      console.log(`   ✅ RAGQueryLog table: ${queryCount} record(s)`)
    } catch (error) {
      console.log('   ❌ RAGQueryLog table not found or inaccessible')
      throw error
    }

    try {
      const feedbackCount = await prisma.rAGFeedback.count()
      console.log(`   ✅ RAGFeedback table: ${feedbackCount} record(s)`)
    } catch (error) {
      console.log('   ❌ RAGFeedback table not found or inaccessible')
      throw error
    }

    try {
      const analyticsCount = await prisma.rAGAnalytics.count()
      console.log(`   ✅ RAGAnalytics table: ${analyticsCount} record(s)\n`)
    } catch (error) {
      console.log('   ❌ RAGAnalytics table not found or inaccessible')
      throw error
    }

    // 3. Test write operation
    console.log('3. Testing write operations...')
    const testQueryLog = await prisma.rAGQueryLog.create({
      data: {
        sessionId: 'test-session-' + Date.now(),
        agentId: 'test-agent',
        agentName: 'Test Agent',
        query: 'Test query for database verification',
        queryLength: 39,
        ragUsed: true,
        sourcesRetrieved: 0,
        retrievalTime: 0,
        totalTime: 0,
        success: true,
        relevanceScores: [],
        avgRelevance: 0,
      },
    })
    console.log(`   ✅ Write successful (ID: ${testQueryLog.id})`)

    // 4. Test read operation
    console.log('4. Testing read operations...')
    const readBack = await prisma.rAGQueryLog.findUnique({
      where: { id: testQueryLog.id },
    })
    if (readBack && readBack.id === testQueryLog.id) {
      console.log(`   ✅ Read successful (verified ID: ${readBack.id})`)
    } else {
      throw new Error('Read verification failed')
    }

    // 5. Test delete operation (cleanup)
    console.log('5. Testing delete operations...')
    await prisma.rAGQueryLog.delete({ where: { id: testQueryLog.id } })
    console.log(`   ✅ Delete successful\n`)

    console.log('=' .repeat(60))
    console.log('✅ Database Verification Complete!\n')
    console.log('All RAG tables are operational:')
    console.log('  - RAGQueryLog: Stores query metadata')
    console.log('  - RAGFeedback: Stores user feedback')
    console.log('  - RAGAnalytics: Stores analytics events')
    console.log('\nNext steps:')
    console.log('  - Start dev server: npm run dev')
    console.log('  - Test end-to-end: npm run test-rag')
    console.log('  - View data: npx prisma studio')

  } catch (error) {
    console.error('\n❌ Database Verification Failed\n')
    console.error('Error:', error)
    console.log('\nTroubleshooting:')
    console.log('  1. Check DATABASE_URL in .env.local:')
    console.log('     DATABASE_URL=postgresql://user:pass@host:5432/db')
    console.log('')
    console.log('  2. Run database migrations:')
    console.log('     npx prisma migrate deploy')
    console.log('')
    console.log('  3. Generate Prisma client:')
    console.log('     npx prisma generate')
    console.log('')
    console.log('  4. Verify database is running:')
    console.log('     pg_isready -h localhost -p 5432')
    console.log('')
    console.log('  5. Check table schema:')
    console.log('     npx prisma db pull')
    console.log('     npx prisma studio')

    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

// Run verification
verifyDatabase().catch(console.error)
