const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  const iitmtest = await prisma.user.findUnique({ where: { email: "iitmtest@iitm.ac.in" } });
  
  const strandedVids = await prisma.video.findMany({
    where: { userId: iitmtest.id, playlistVideos: { none: {} } }
  });
  
  console.log(`Stranded videos: ${strandedVids.length}`);
  console.log(strandedVids.slice(0, 5).map(v => v.title));
}

main().catch(console.error).finally(() => prisma.$disconnect());
