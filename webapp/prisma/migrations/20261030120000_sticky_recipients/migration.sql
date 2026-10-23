-- Destinatarios del post-it del máster (sin filas = todos los Junior).
CREATE TABLE "StickyRecipient" (
    "profileKey" TEXT NOT NULL,

    CONSTRAINT "StickyRecipient_pkey" PRIMARY KEY ("profileKey")
);
