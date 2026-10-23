-- Tipo del enlace de una plantilla (Canva, Drive, Figma…), elegido por quien la guarda.
CREATE TABLE "TemplateLinkLabel" (
    "templateId" TEXT NOT NULL,
    "label" TEXT NOT NULL,

    CONSTRAINT "TemplateLinkLabel_pkey" PRIMARY KEY ("templateId")
);

ALTER TABLE "TemplateLinkLabel" ADD CONSTRAINT "TemplateLinkLabel_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "Template"("id") ON DELETE CASCADE ON UPDATE CASCADE;
