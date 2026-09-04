-- AlterTable: credencial propia y última visita de una persona
ALTER TABLE "User" ADD COLUMN "credentialKey" TEXT;
ALTER TABLE "User" ADD COLUMN "lastSeenAt" TIMESTAMP(3);
CREATE UNIQUE INDEX "User_credentialKey_key" ON "User"("credentialKey");

-- CreateTable: comentarios al equipo (panel principal)
CREATE TABLE "TeamComment" (
    "id" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "author" TEXT NOT NULL,
    "authorRole" TEXT,
    "authorId" TEXT,
    "reviewed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TeamComment_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "TeamComment_createdAt_idx" ON "TeamComment"("createdAt");
CREATE INDEX "TeamComment_authorId_idx" ON "TeamComment"("authorId");

ALTER TABLE "TeamComment" ADD CONSTRAINT "TeamComment_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateTable: plantillas del área
CREATE TABLE "Template" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT,
    "url" TEXT,
    "format" TEXT,
    "notes" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Template_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Template_category_idx" ON "Template"("category");
