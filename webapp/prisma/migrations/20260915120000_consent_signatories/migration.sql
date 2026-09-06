-- CreateTable: estado de firma del consentimiento de uso de imagen para el micrositio
CREATE TABLE "ConsentSignatory" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "signed" BOOLEAN NOT NULL DEFAULT false,
    "signedAt" TIMESTAMP(3),
    "driveAccess" BOOLEAN NOT NULL DEFAULT false,
    "driveAccessAt" TIMESTAMP(3),
    "driveFolderUrl" TEXT,
    "userId" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ConsentSignatory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ConsentSignatory_userId_idx" ON "ConsentSignatory"("userId");

-- AddForeignKey
ALTER TABLE "ConsentSignatory" ADD CONSTRAINT "ConsentSignatory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
