import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

// Helper to extract playlist ID from YouTube URL
function extractPlaylistId(url: string): string {
    const match = url.match(/[?&]list=([^&]+)/);
    return match ? match[1] : '';
}

// Helper to extract lesson count from string like "77 lessons"
function extractLessonCount(lessonsStr: string): number {
    const match = lessonsStr.match(/(\d+)/);
    return match ? parseInt(match[1], 10) : 0;
}

// Helper to generate slug from title
function generateSlug(title: string): string {
    return title
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim();
}

// Type definition for course data from JSON
interface CourseData {
    title: string;
    lessons: string;
    url: string;
    thumbnail: string | null;
}

/**
 * 🎓 OFFICIAL IITM BS CURRICULUM STRUCTURE
 * Source: IIT Madras BS (Data Science & Applications) Official Documentation
 * 
 * This mapping follows the EXACT official structure with course codes and credits.
 */

// Course title to official code mapping
const officialCourseCodes: Record<string, { code: string; credits: number; isProject?: boolean }> = {
    // Foundation Level (8 courses, 32 credits)
    'Mathematics for Data Science I': { code: 'BSMA1001', credits: 4 },
    'Statistics for Data Science I': { code: 'BSMA1002', credits: 4 },
    'Computational Thinking': { code: 'BSCS1001', credits: 4 },
    'English 1 (Basic English)': { code: 'BSHS1001', credits: 4 }, // English I
    'Mathematics for Data Science II': { code: 'BSMA1003', credits: 4 },
    'Statistics for Data Science - II': { code: 'BSMA1004', credits: 4 }, // Stats II
    'Programming in Python': { code: 'BSCS1002', credits: 4 },
    'English II': { code: 'BSHS1002', credits: 4 },

    // Diploma - Programming (6 courses + 2 projects, 27 credits)
    'Database Management Systems': { code: 'BSCS2001', credits: 4 },
    'Programming, Data Structures and Algorithms using Python': { code: 'BSCS2002', credits: 4 }, // PDSA
    'Programming, Data Structures and Algorithms using Python_Prof. Madhavan Mukund': { code: 'BSCS2002', credits: 4 }, // Full JSON title
    'Modern Application Development - I': { code: 'BSCS2003', credits: 4 },
    'MAD I Project': { code: 'BSCS2003P', credits: 2, isProject: true },
    'Programming Concepts using Java': { code: 'BSCS2005', credits: 4 },
    'Modern Application Development II': { code: 'BSCS2006', credits: 4 },
    'MAD II Project': { code: 'BSCS2006P', credits: 2, isProject: true },
    'System Commands': { code: 'BSSE2001', credits: 3 },

    // Diploma - Data Science (6 courses + 2 projects + options, 27 credits)
    'Machine Learning Foundations': { code: 'BSCS2004', credits: 4 },
    'Business Data Management': { code: 'BSMS2001', credits: 4 },
    'Machine Learning Techniques ( Prof. Arunkumar )': { code: 'BSCS2007', credits: 4 },
    'Machine Learning Practice Course': { code: 'BSCS2008', credits: 4 },
    'ML Practice Project': { code: 'BSCS2008P', credits: 2, isProject: true },
    'Tools in Data Science': { code: 'BSSE2002', credits: 3 },
    // Options (choose ONE)
    'Business Analytics': { code: 'BSMS2002', credits: 4 },
    'BDM Project': { code: 'BSMS2001P', credits: 2, isProject: true },
    'Introduction to Deep Learning and Generative AI': { code: 'BSDA2001', credits: 4 }, // Diploma GenAI
    'DL & GenAI Project': { code: 'BSDA2001P', credits: 2, isProject: true },

    // BSc Degree - Core (4 courses, 16 credits)
    'Software Engineering': { code: 'BSCS3001', credits: 4 },
    'Software Testing': { code: 'BSCS3002', credits: 4 },
    'AI: Search Methods for Problem Solving': { code: 'BSCS3003', credits: 4 },
    'Deep Learning': { code: 'BSCS3004', credits: 4 }, // BSc Deep Learning (different from Diploma GenAI)
    // 'Deep Learning': { code: 'BSCS3004', credits: 4 }, // Duplicate - handled above

    // BSc Degree - Mandatory
    'Strategies for Professional Growth (SPG) - IIT Madras B.S. Degree': { code: 'BSGN3001', credits: 4 },

    // BSc Degree - Electives (various)
    'Algorithmic Thinking in Bioinformatics': { code: 'BSCS3xxx', credits: 4 }, // Code TBD
    'Big Data and Biological Networks': { code: 'BSCS3xxx', credits: 4 },
    'Data Visualization Design': { code: 'BSCS3xxx', credits: 4 },
    'Design Thinking for Data-Driven App Development': { code: 'BSCS3xxx', credits: 4 },
    'Industry 4.0': { code: 'BSCS3xxx', credits: 4 },
    'Market Research': { code: 'BSMS3xxx', credits: 4 },
    'Introduction to big data': { code: 'BSCS3xxx', credits: 4 },
    'Statistical Computing_Prof. Dootika': { code: 'BSMA3xxx', credits: 4 },
    'Linear Statistical Models': { code: 'BSMA3xxx', credits: 4 },
    'Mathematical Thinking - Prof. Viswanath & Prof. Amritanshu Prasad': { code: 'BSMA3xxx', credits: 4 },
    'Corporate Finance Sep 2024': { code: 'BSMS3xxx', credits: 4 }, // Financial courses
    'Managerial Economics Jan 2024': { code: 'BSMS3xxx', credits: 4 },
    'Financial Forensics': { code: 'BSMS3xxx', credits: 4 },
    'Game Theory and Strategy': { code: 'BSMS3xxx', credits: 4 },

    // BS Degree - Advanced Courses
    'Introduction to large language models': { code: 'BSCS4xxx', credits: 4 },
    'Mathematical Foundations of Generative AI': { code: 'BSCS4xxx', credits: 4 },
    'Machine Learning Operations (MLOps) - Rangarajan Vasudevan': { code: 'BSCS4xxx', credits: 4 },
    'Deep Learning Practice | Prof. Mitesh | Umesh | Kaushik | 2024 Sept': { code: 'BSCS4xxx', credits: 4 },
    'Introduction to Natural Language Processing (i-NLP)': { code: 'BSCS4xxx', credits: 4 },
    'Deep Learning for Computer Vision - Prof. Vineeth': { code: 'BSCS4xxx', credits: 4 },
    'Speech Technology_Prof. Umesh': { code: 'BSCS4xxx', credits: 4 },
    'Special topics in ML (Reinforcement Learning)': { code: 'BSCS4xxx', credits: 4 },
    'Operating Systems - Prof. Chester': { code: 'BSCS4xxx', credits: 4 },
    'Advanced Algorithms_Prof. Neeldhara': { code: 'BSCS4xxx', credits: 4 },

    // BS Degree - Labs
    'Data Science and AI Lab': { code: 'BSDA4001', credits: 4 },
    'App Dev Lab': { code: 'BSCS4010', credits: 4 },
};

// Official course categorization following IITM structure
const courseMappings = {
    // 1️⃣ Foundation Level (8 courses, 32 credits)
    foundation_core: [
        'Mathematics for Data Science I',
        'Statistics for Data Science I',
        'Computational Thinking',
        'English 1 (Basic English)',
        'Mathematics for Data Science II',
        'Statistics for Data Science - II',
        'Programming in Python',
        'English II',
    ],

    // 2️⃣ Diploma Level - Programming (6 courses + 2 projects, 27 credits)
    diploma_programming: [
        'Database Management Systems',
        'Programming, Data Structures and Algorithms using Python_Prof. Madhavan Mukund', // Full JSON title
        'Modern Application Development - I',
        // 'MAD I Project', // May not exist in JSON
        'Programming Concepts using Java',
        'Modern Application Development II',
        // 'MAD II Project', // May not exist in JSON
        'System Commands',
    ],

    // 2️⃣ Diploma Level - Data Science (6 mandatory + options)
    diploma_datascience: [
        'Machine Learning Foundations',
        'Business Data Management',
        'Machine Learning Techniques ( Prof. Arunkumar )',
        'Machine Learning Practice Course',
        // 'ML Practice Project', // May not exist in JSON
        'Tools in Data Science',
    ],

    // Diploma Data Science - Option 1: Business Analytics
    diploma_ds_option1: [
        'Business Analytics',
        // 'BDM Project', // May not exist in JSON
    ],

    // Diploma Data Science - Option 2: Deep Learning & GenAI
    diploma_ds_option2: [
        'Introduction to Deep Learning and Generative AI', // BSDA2001 (Diploma level)
        // 'DL & GenAI Project', // May not exist in JSON
    ],

    // 3️⃣ BSc Degree - Core (4 courses)
    bsc_core: [
        'Software Engineering',
        'Software Testing',
        'AI: Search Methods for Problem Solving',
        'Deep Learning', // BSCS3004 (BSc level, different from Diploma GenAI)
    ],

    // 3️⃣ BSc Degree - Mandatory
    bsc_mandatory: [
        'Strategies for Professional Growth (SPG) - IIT Madras B.S. Degree',
    ],

    // 3️⃣ BSc Degree - Electives
    bsc_electives: [
        'Algorithmic Thinking in Bioinformatics',
        'Big Data and Biological Networks',
        'Data Visualization Design',
        'Design Thinking for Data-Driven App Development',
        'Industry 4.0',
        'Market Research',
        'Introduction to big data',
        'Statistical Computing_Prof. Dootika',
        'Linear Statistical Models',
        'Mathematical Thinking - Prof. Viswanath & Prof. Amritanshu Prasad',
        'Corporate Finance Sep 2024',
        'Managerial Economics Jan 2024',
        'Financial Forensics',
        'Game Theory and Strategy',
        'Privacy and Security in Online Social Media',
    ],

    // 4️⃣ BS Degree - Advanced Courses
    bs_advanced: [
        'Introduction to large language models',
        'Mathematical Foundations of Generative AI',
        'Machine Learning Operations (MLOps) - Rangarajan Vasudevan',
        'Deep Learning Practice | Prof. Mitesh | Umesh | Kaushik | 2024 Sept',
        'Introduction to Natural Language Processing (i-NLP)',
        'Deep Learning for Computer Vision - Prof. Vineeth',
        'Speech Technology_Prof. Umesh',
        'Special topics in ML (Reinforcement Learning)',
        'Operating Systems - Prof. Chester',
        'Advanced Algorithms_Prof. Neeldhara',
    ],

    // 4️⃣ BS Degree - Labs
    bs_labs: [
        'Data Science and AI Lab',
        // 'App Dev Lab', // May not exist in JSON
    ],

    // Qualifiers
    qualifier: [
        'Maths 1 Qualifier',
        'Statistics I Diploma Qualifier',
        'CT Qualifier',
        'Python for Diploma Qualifier',
        'English 1 Qualifier',
    ],

    // Supplementary
    supplementary: [
        'Machine Learning Practice Course Week 1 & 2',
        'Deep Learning Workshop',
    ],
};

async function main() {
    console.log('🎓 Starting IITM BS Curriculum Seeding (OFFICIAL STRUCTURE)...\n');

    // Read JSON file
    const jsonPath = path.join(process.cwd(), 'iitm_bs_courses.json');
    const coursesData: CourseData[] = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));

    console.log(`📚 Loaded ${coursesData.length} courses from JSON\n`);

    // Create a map for quick lookup
    const coursesMap = new Map<string, CourseData>(
        coursesData.map((course) => [course.title, course])
    );

    // Define curriculum structure following OFFICIAL IITM BS structure
    const sections = [
        {
            slug: 'foundation',
            title: '1️⃣ Foundation Level',
            description: 'Mandatory foundation courses (8 courses, 32 credits) - Entry via Qualifier Process',
            order: 1,
            icon: 'BookOpen',
            categories: [
                {
                    slug: 'core',
                    title: 'Foundation Courses',
                    description: 'All 8 required foundation courses',
                    order: 1,
                    courseList: courseMappings.foundation_core,
                },
            ],
        },
        {
            slug: 'diploma',
            title: '2️⃣ Diploma Level',
            description: 'Programming and Data Science diplomas (54 credits total)',
            order: 2,
            icon: 'Award',
            categories: [
                {
                    slug: 'programming',
                    title: '🧑‍💻 Diploma in Programming',
                    description: '6 courses + 2 projects (27 credits)',
                    order: 1,
                    courseList: courseMappings.diploma_programming,
                },
                {
                    slug: 'datascience-core',
                    title: '📊 Diploma in Data Science - Core',
                    description: '6 mandatory courses + 1 project (21 credits)',
                    order: 2,
                    courseList: courseMappings.diploma_datascience,
                },
                {
                    slug: 'datascience-option1',
                    title: '📊 DS Option 1: Business Analytics',
                    description: 'Choose this OR Option 2 (6 credits)',
                    order: 3,
                    courseList: courseMappings.diploma_ds_option1,
                },
                {
                    slug: 'datascience-option2',
                    title: '📊 DS Option 2: Deep Learning & GenAI',
                    description: 'Choose this OR Option 1 (6 credits)',
                    order: 4,
                    courseList: courseMappings.diploma_ds_option2,
                },
            ],
        },
        {
            slug: 'bsc',
            title: '3️⃣ BSc Degree Level',
            description: 'Bachelor of Science degree (28 credits)',
            order: 3,
            icon: 'GraduationCap',
            categories: [
                {
                    slug: 'core',
                    title: 'Core Courses (Mandatory)',
                    description: 'All 4 required: SE, Testing, AI Search, Deep Learning',
                    order: 1,
                    courseList: courseMappings.bsc_core,
                },
                {
                    slug: 'mandatory',
                    title: 'Mandatory Course',
                    description: 'Strategies for Professional Growth',
                    order: 2,
                    courseList: courseMappings.bsc_mandatory,
                },
                {
                    slug: 'electives',
                    title: 'Electives',
                    description: 'Choose as required to complete credits',
                    order: 3,
                    courseList: courseMappings.bsc_electives,
                },
            ],
        },
        {
            slug: 'bs',
            title: '4️⃣ BS Degree Level (Honours)',
            description: 'Bachelor of Science Honours (28 credits)',
            order: 4,
            icon: 'Trophy',
            categories: [
                {
                    slug: 'advanced',
                    title: 'Advanced / Elective Courses',
                    description: 'LLMs, GenAI, MLOps, DL Practice, NLP, RL, OS, Algorithms, etc.',
                    order: 1,
                    courseList: courseMappings.bs_advanced,
                },
                {
                    slug: 'labs',
                    title: 'Labs',
                    description: 'Practical laboratory courses',
                    order: 2,
                    courseList: courseMappings.bs_labs,
                },
            ],
        },
        {
            slug: 'qualifier',
            title: '🔑 Qualifier & Bridge',
            description: 'Entry requirement and qualifier courses',
            order: 5,
            icon: 'CheckCircle',
            categories: [
                {
                    slug: 'qualifiers',
                    title: 'Qualifier Courses',
                    description: 'Prerequisite qualifier exams for Foundation entry',
                    order: 1,
                    courseList: courseMappings.qualifier,
                },
            ],
        },
        {
            slug: 'supplementary',
            title: '📚 Supplementary Resources',
            description: 'Workshops, special topics, and additional resources',
            order: 6,
            icon: 'Library',
            categories: [
                {
                    slug: 'workshops',
                    title: 'Workshops & Special Topics',
                    description: 'Additional learning resources and workshops',
                    order: 1,
                    courseList: courseMappings.supplementary,
                },
            ],
        },
        {
            slug: 'pg-diploma',
            title: '5️⃣ PG Diploma Level (AI & ML)',
            description: '🚀 Coming Soon - 20 credits | Requires CGPA ≥ 8.0 from BS Degree',
            order: 7,
            icon: 'Star',
            categories: [
                {
                    slug: 'coming-soon',
                    title: '🔜 Coming Soon',
                    description: 'PG Diploma courses will be available here. Can progress to MTech (AI & ML).',
                    order: 1,
                    courseList: [], // Empty for now
                },
            ],
        },
        {
            slug: 'mtech',
            title: '6️⃣ MTech (AI & ML)',
            description: '🚀 Coming Soon - Available after PG Diploma completion',
            order: 8,
            icon: 'Crown',
            categories: [
                {
                    slug: 'coming-soon',
                    title: '🔜 Coming Soon',
                    description: 'MTech courses will be available here. Pathway from PG Diploma.',
                    order: 1,
                    courseList: [], // Empty for now
                },
            ],
        },
    ];

    // Seed the database
    let totalCoursesAdded = 0;
    let missingCourses: string[] = [];

    for (const sectionData of sections) {
        console.log(`📘 Creating section: ${sectionData.title}`);

        const section = await prisma.iITMCurriculumSection.create({
            data: {
                slug: sectionData.slug,
                title: sectionData.title,
                description: sectionData.description,
                order: sectionData.order,
                icon: sectionData.icon,
            },
        });

        for (const categoryData of sectionData.categories) {
            console.log(`  📂 Creating category: ${categoryData.title}`);

            const category = await prisma.iITMCourseCategory.create({
                data: {
                    sectionId: section.id,
                    slug: categoryData.slug,
                    title: categoryData.title,
                    description: categoryData.description,
                    order: categoryData.order,
                },
            });

            // Add courses to this category
            let courseOrder = 1;
            for (const courseTitle of categoryData.courseList) {
                const courseData = coursesMap.get(courseTitle);

                if (!courseData) {
                    console.warn(`    ⚠️  Course not found in JSON: ${courseTitle}`);
                    missingCourses.push(courseTitle);
                    continue;
                }

                const playlistId = extractPlaylistId(courseData.url);
                const lessonsCount = extractLessonCount(courseData.lessons);
                const slug = generateSlug(courseData.title);

                // Get official course code and credits
                const officialData = officialCourseCodes[courseTitle] || { code: null, credits: null, isProject: false };

                await prisma.iITMCourse.create({
                    data: {
                        categoryId: category.id,
                        slug,
                        title: courseData.title,
                        courseCode: officialData.code,
                        youtubePlaylistId: playlistId,
                        thumbnail: courseData.thumbnail,
                        lessonsCount,
                        credits: officialData.credits,
                        isProject: officialData.isProject || false,
                        order: courseOrder++,
                    },
                });

                totalCoursesAdded++;
                const codeInfo = officialData.code ? `[${officialData.code}]` : '[No Code]';
                const creditInfo = officialData.credits ? `${officialData.credits} cr` : '';
                const projectInfo = officialData.isProject ? '📝 PROJECT' : '';
                console.log(`    ✅ Added: ${courseData.title} ${codeInfo} ${creditInfo} ${projectInfo} (${lessonsCount} lessons)`);
            }
        }

        console.log('');
    }

    console.log(`\n🎉 Seeding complete!`);
    console.log(`📊 Summary:`);
    console.log(`   - Sections: ${sections.length}`);
    console.log(`   - Categories: ${sections.reduce((acc, s) => acc + s.categories.length, 0)}`);
    console.log(`   - Courses Added: ${totalCoursesAdded}`);

    if (missingCourses.length > 0) {
        console.log(`\n⚠️  Missing Courses (${missingCourses.length}):`);
        missingCourses.forEach(course => console.log(`   - ${course}`));
        console.log(`\n💡 These courses need to be added to iitm_bs_courses.json or the JSON file needs to be updated with matching titles.`);
    }
}

main()
    .catch((e) => {
        console.error('❌ Error seeding database:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
