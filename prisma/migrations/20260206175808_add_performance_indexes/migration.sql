-- CreateIndex
CREATE INDEX "notes_userId_videoId_createdAt_idx" ON "notes"("userId", "videoId", "createdAt");

-- CreateIndex
CREATE INDEX "videos_userId_completed_idx" ON "videos"("userId", "completed");

-- CreateIndex
CREATE INDEX "videos_userId_inLibrary_idx" ON "videos"("userId", "inLibrary");

-- CreateIndex
CREATE INDEX "videos_userId_progress_idx" ON "videos"("userId", "progress");

-- CreateIndex
CREATE INDEX "watch_history_userId_watchedAt_idx" ON "watch_history"("userId", "watchedAt");
