-- Métricas rápidas de LinkedIn (calcadas de la tarjeta "Supervisa el
-- rendimiento" de la app): impresiones, visualizaciones de perfil y
-- apariciones en búsquedas. `followers` ya existía.
ALTER TABLE "LinkedInSnapshot" ADD COLUMN "impressions" INTEGER;
ALTER TABLE "LinkedInSnapshot" ADD COLUMN "profileViews" INTEGER;
ALTER TABLE "LinkedInSnapshot" ADD COLUMN "searchAppearances" INTEGER;
