// lib/prisma.js
import { PrismaClient } from '@prisma/client'


let prisma

if (process.env.NODE_ENV === 'production') {
  prisma = new PrismaClient({
    log: ['error'], // Ne logger que les erreurs en production
  })
} else {
  if (!global.__prisma) {
    global.__prisma = new PrismaClient({
      log: ['query', 'info', 'warn', 'error'], 
    })
  }
  prisma = global.__prisma
}

process.on('beforeExit', async () => {
  await prisma.$disconnect()
})

process.on('SIGINT', async () => {
  await prisma.$disconnect()
  process.exit(0)
})

process.on('SIGTERM', async () => {
  await prisma.$disconnect()
  process.exit(0)
})

export { prisma }
export default prisma