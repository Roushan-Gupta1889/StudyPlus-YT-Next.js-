/*
  Warnings:

  - A unique constraint covering the columns `[userId,videoId]` on the table `watch_history` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "watch_history" ALTER COLUMN "watchedAt" DROP DEFAULT;

-- CreateIndex
CREATE UNIQUE INDEX "watch_history_userId_videoId_key" ON "watch_history"("userId", "videoId");
