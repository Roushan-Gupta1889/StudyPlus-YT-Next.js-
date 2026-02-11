import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    console.log('Start seeding contributors...')

    // Clear existing contributors to avoid duplicates if run multiple times
    await prisma.contributor.deleteMany()

    // Top Contributors
    const topContributors = [
        { name: "Aarav Patel", amount: 5000, isAnonymous: false, message: "Love the focus mode!", createdAt: new Date('2023-12-01') },
        { name: "Vihaan Sharma", amount: 2500, isAnonymous: false, message: "Keep up the good work.", createdAt: new Date('2024-01-15') },
        { name: "Aditi Rao", amount: 1500, isAnonymous: false, message: "Helped me ace my exams.", createdAt: new Date('2024-02-10') },
        { name: "Rohan Gupta", amount: 1000, isAnonymous: false, message: "Great for deep work.", createdAt: new Date('2024-03-05') },
        { name: "Sanya Malhotra", amount: 500, isAnonymous: false, message: "Student friendly pricing (free!)", createdAt: new Date('2024-03-20') },
    ]

    // Recent Contributors
    const recentContributors = [
        { name: "Anonymous", amount: 500, isAnonymous: true, message: "", createdAt: new Date(Date.now() - 1000 * 60 * 60 * 1) }, // 1 hour ago
        { name: "Ishaan K.", amount: 200, isAnonymous: false, message: "Chai on me!", createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2) }, // 2 hours ago
        { name: "Rahul V.", amount: 100, isAnonymous: false, message: "", createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5) }, // 5 hours ago
        { name: "Anonymous", amount: 2000, isAnonymous: true, message: "Super generous.", createdAt: new Date(Date.now() - 1000 * 60 * 60 * 8) }, // 8 hours ago
        { name: "Ananya S.", amount: 150, isAnonymous: false, message: "", createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24) }, // 1 day ago
    ]

    const allContributors = [...topContributors, ...recentContributors]

    for (const contributor of allContributors) {
        await prisma.contributor.create({
            data: contributor,
        })
    }

    console.log(`Seeded ${allContributors.length} contributors.`)
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
