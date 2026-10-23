-- Post-it virtual del máster para los monitores Junior (una sola nota vigente).
CREATE TABLE "StickyNote" (
    "id" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "color" TEXT NOT NULL DEFAULT 'AMARILLO',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "author" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StickyNote_pkey" PRIMARY KEY ("id")
);
