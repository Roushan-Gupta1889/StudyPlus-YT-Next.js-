import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function clearIITMData() {
    console.log('🗑️  Clearing old IITM data...\n');

    try {
        // Delete in correct order (respecting foreign key constraints)
        const deletedProgress = await prisma.iITMUserProgress.deleteMany({});
        console.log(`✅ Deleted ${deletedProgress.count} user progress records`);

        const deletedCourses = await prisma.iITMCourse.deleteMany({});
        console.log(`✅ Deleted ${deletedCourses.count} courses`);

        const deletedCategories = await prisma.iITMCourseCategory.deleteMany({});
        console.log(`✅ Deleted ${deletedCategories.count} categories`);

        const deletedSections = await prisma.iITMCurriculumSection.deleteMany({});
        console.log(`✅ Deleted ${deletedSections.count} sections`);

        console.log('\n✨ All IITM data cleared successfully!');
        console.log('Now run: npm run seed:iitm\n');
    } catch (error) {
        console.error('❌ Error clearing data:', error);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

clearIITMData();
