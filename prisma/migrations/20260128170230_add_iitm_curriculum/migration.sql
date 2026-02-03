-- CreateTable
CREATE TABLE "iitm_curriculum_sections" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "order" INTEGER NOT NULL,
    "icon" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "iitm_curriculum_sections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "iitm_course_categories" (
    "id" TEXT NOT NULL,
    "sectionId" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "order" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "iitm_course_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "iitm_courses" (
    "id" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "youtubePlaylistId" TEXT NOT NULL,
    "thumbnail" TEXT,
    "lessonsCount" INTEGER NOT NULL DEFAULT 0,
    "duration" INTEGER,
    "order" INTEGER NOT NULL,
    "level" TEXT,
    "credits" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "iitm_courses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "iitm_user_progress" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "videosWatched" INTEGER NOT NULL DEFAULT 0,
    "totalVideos" INTEGER NOT NULL DEFAULT 0,
    "completionRate" INTEGER NOT NULL DEFAULT 0,
    "lastWatchedAt" TIMESTAMP(3),
    "isStarted" BOOLEAN NOT NULL DEFAULT false,
    "isCompleted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "iitm_user_progress_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "iitm_curriculum_sections_slug_key" ON "iitm_curriculum_sections"("slug");

-- CreateIndex
CREATE INDEX "iitm_course_categories_sectionId_idx" ON "iitm_course_categories"("sectionId");

-- CreateIndex
CREATE UNIQUE INDEX "iitm_course_categories_sectionId_slug_key" ON "iitm_course_categories"("sectionId", "slug");

-- CreateIndex
CREATE UNIQUE INDEX "iitm_courses_slug_key" ON "iitm_courses"("slug");

-- CreateIndex
CREATE INDEX "iitm_courses_categoryId_idx" ON "iitm_courses"("categoryId");

-- CreateIndex
CREATE INDEX "iitm_user_progress_userId_idx" ON "iitm_user_progress"("userId");

-- CreateIndex
CREATE INDEX "iitm_user_progress_courseId_idx" ON "iitm_user_progress"("courseId");

-- CreateIndex
CREATE UNIQUE INDEX "iitm_user_progress_userId_courseId_key" ON "iitm_user_progress"("userId", "courseId");

-- AddForeignKey
ALTER TABLE "iitm_course_categories" ADD CONSTRAINT "iitm_course_categories_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "iitm_curriculum_sections"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "iitm_courses" ADD CONSTRAINT "iitm_courses_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "iitm_course_categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "iitm_user_progress" ADD CONSTRAINT "iitm_user_progress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "iitm_user_progress" ADD CONSTRAINT "iitm_user_progress_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "iitm_courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
