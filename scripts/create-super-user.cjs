/* eslint-disable no-console */
const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

function parseArgs() {
  const args = process.argv.slice(2)
  const out = {}
  for (const a of args) {
    const m = a.match(/^--([^=]+)=(.*)$/)
    if (m) out[m[1]] = m[2]
  }
  return out
}

async function main() {
  const { email, password, role = 'CHAIRMAN', owner } = parseArgs()
  if (!email || !password) {
    console.error('Usage: node scripts/create-super-user.cjs --email=<email> --password=<password> [--role=CHAIRMAN|ADMINISTRATOR|...] [--owner=true|false]')
    process.exit(1)
  }

  const isOwner = owner === 'true' || owner === undefined && role === 'CHAIRMAN'
  
  const prisma = new PrismaClient()
  try {
    const hash = await bcrypt.hash(password, 10)
    const user = await prisma.user.upsert({
      where: { email },
      update: { password: hash, role, isActive: true, isOwner },
      create: { email, password: hash, role, isActive: true, isOwner }
    })
    console.log('User ready:', { id: user.id, email: user.email, role: user.role, isOwner: user.isOwner })
  } finally {
    await prisma.$disconnect()
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
