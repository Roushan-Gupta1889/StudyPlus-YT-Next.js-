const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  const history = await prisma.watchHistory.findMany({
    include: {
      video: {
        include: {
          playlistVideos: {
            select: { playlistId: true },
            take: 1,
          },
        },
      },
    },
    orderBy: { watchedAt: "desc" },
    take: 5,
  });

  console.log(JSON.stringify(history, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
