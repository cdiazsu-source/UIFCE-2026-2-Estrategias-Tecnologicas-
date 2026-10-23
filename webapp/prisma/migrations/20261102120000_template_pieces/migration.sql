-- Piezas de una plantilla: imagen pequeña + enlace (Canva, Drive…), varias por plantilla.
CREATE TABLE "TemplatePiece" (
    "id" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "image" TEXT NOT NULL,
    "label" TEXT NOT NULL DEFAULT '',
    "url" TEXT NOT NULL DEFAULT '',
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TemplatePiece_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "TemplatePiece_templateId_idx" ON "TemplatePiece"("templateId");

ALTER TABLE "TemplatePiece" ADD CONSTRAINT "TemplatePiece_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "Template"("id") ON DELETE CASCADE ON UPDATE CASCADE;
