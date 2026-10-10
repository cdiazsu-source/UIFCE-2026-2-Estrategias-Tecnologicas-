-- Consentimientos de imagen: marca por persona de que su foto tipo carné (JPG,
-- máx. 5 MB) ya está lista en su carpeta de Drive.
ALTER TABLE "ConsentSignatory" ADD COLUMN "photoReady" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "ConsentSignatory" ADD COLUMN "photoReadyAt" TIMESTAMP(3);
