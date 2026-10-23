-- Proyectos por sección de «Reunión coordinación» y plantillas enlazadas a un proyecto.
CREATE TABLE "CoordinationSection" (
    "section" TEXT NOT NULL,

    CONSTRAINT "CoordinationSection_pkey" PRIMARY KEY ("section")
);

CREATE TABLE "CoordinationItem" (
    "id" TEXT NOT NULL,
    "section" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CoordinationItem_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "CoordinationItem_section_projectId_key" ON "CoordinationItem"("section", "projectId");
CREATE INDEX "CoordinationItem_projectId_idx" ON "CoordinationItem"("projectId");
ALTER TABLE "CoordinationItem" ADD CONSTRAINT "CoordinationItem_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "ProjectTemplateLink" (
    "projectId" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "ProjectTemplateLink_pkey" PRIMARY KEY ("projectId", "templateId")
);

CREATE INDEX "ProjectTemplateLink_templateId_idx" ON "ProjectTemplateLink"("templateId");
ALTER TABLE "ProjectTemplateLink" ADD CONSTRAINT "ProjectTemplateLink_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ProjectTemplateLink" ADD CONSTRAINT "ProjectTemplateLink_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "Template"("id") ON DELETE CASCADE ON UPDATE CASCADE;
