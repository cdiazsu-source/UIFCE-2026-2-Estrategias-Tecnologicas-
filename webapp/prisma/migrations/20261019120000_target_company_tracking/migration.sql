-- Empresas de interés: sector, logo y etiquetas para filtrarlas; y en cada contacto, su tipo
-- (reclutador, gerente, recursos humanos u otro) y el avance del contacto. Además carga las 19
-- empresas de la lista del equipo (10 de mayores ingresos y 9 de mayor crecimiento; Tiendas Ara
-- está en ambas). Es idempotente: si una empresa ya existe por nombre, solo completa lo que le falte.
ALTER TABLE "TargetCompany"
  ADD COLUMN "sector" TEXT,
  ADD COLUMN "logoUrl" TEXT,
  ADD COLUMN "tags" TEXT[] DEFAULT ARRAY[]::TEXT[];

ALTER TABLE "CompanyLead"
  ADD COLUMN "kind" TEXT NOT NULL DEFAULT 'OTRO',
  ADD COLUMN "status" TEXT NOT NULL DEFAULT 'POR_CONTACTAR';

-- Los contactos que ya existen se clasifican según su cargo escrito a mano.
UPDATE "CompanyLead"
   SET "kind" = CASE
         WHEN "role" ILIKE '%reclut%' OR "role" ILIKE '%talent%' OR "role" ILIKE '%selecci%' THEN 'RECLUTADOR'
         WHEN "role" ILIKE '%recursos humanos%' OR "role" ILIKE '%gesti_n humana%' OR "role" ILIKE '%talento humano%' OR "role" ILIKE '%rrhh%' THEN 'RECURSOS_HUMANOS'
         WHEN "role" ILIKE '%gerente%' OR "role" ILIKE '%director%' OR "role" ILIKE '%ejecutiv%' OR "role" ILIKE '%vicepresidente%' OR "role" ILIKE '%ceo%' THEN 'GERENTE'
         ELSE 'OTRO'
       END;

INSERT INTO "TargetCompany" ("id", "name", "notes", "order", "sector", "logoUrl", "tags", "updatedAt") VALUES
  (gen_random_uuid()::text, 'Ecopetrol', 'Puesto 1 por ingresos operacionales: $100,6 billones COP.', 1, 'Hidrocarburos y Energía', 'ecopetrol.png', ARRAY['Mayores ingresos']::TEXT[], now()),
  (gen_random_uuid()::text, 'Terpel', 'Puesto 2 por ingresos operacionales: $26,3 billones COP.', 2, 'Distribución de combustibles', 'terpel.png', ARRAY['Mayores ingresos']::TEXT[], now()),
  (gen_random_uuid()::text, 'Reficar', 'Refinería de Cartagena. Puesto 3 por ingresos operacionales: $22,4 billones COP.', 3, 'Refinación e Industria', 'reficar.png', ARRAY['Mayores ingresos']::TEXT[], now()),
  (gen_random_uuid()::text, 'Tiendas D1', 'Koba Colombia. Puesto 4 por ingresos operacionales: $21,6 billones COP.', 4, 'Comercio minorista / Hard discount', 'tiendas-d1.png', ARRAY['Mayores ingresos']::TEXT[], now()),
  (gen_random_uuid()::text, 'EPM', 'Empresas Públicas de Medellín. Puesto 5 por ingresos operacionales: $20,2 billones COP.', 5, 'Servicios públicos y Energía', 'epm.png', ARRAY['Mayores ingresos']::TEXT[], now()),
  (gen_random_uuid()::text, 'Almacenes Éxito', 'Puesto 6 por ingresos operacionales: $16,9 billones COP.', 6, 'Comercio minorista / Grandes superficies', 'exito.png', ARRAY['Mayores ingresos']::TEXT[], now()),
  (gen_random_uuid()::text, 'Tiendas Ara', 'Jerónimo Martins. Puesto 7 por ingresos operacionales: $16,3 billones COP. También destaca por su crecimiento interanual sostenido, abriendo cientos de puntos de venta por año.', 7, 'Comercio minorista / Descuento', 'tiendas-ara.png', ARRAY['Mayores ingresos', 'Mayor crecimiento']::TEXT[], now()),
  (gen_random_uuid()::text, 'Claro Colombia', 'Comunicación Celular. Puesto 8 por ingresos operacionales: $16,3 billones COP.', 8, 'Telecomunicaciones', 'claro.png', ARRAY['Mayores ingresos']::TEXT[], now()),
  (gen_random_uuid()::text, 'Avianca', 'Puesto 9 por ingresos operacionales: $15,1 billones COP.', 9, 'Transporte aéreo', 'avianca.png', ARRAY['Mayores ingresos']::TEXT[], now()),
  (gen_random_uuid()::text, 'Enel Colombia', 'Puesto 10 por ingresos operacionales: $14,8 billones COP.', 10, 'Energía eléctrica y Servicios', 'enel.png', ARRAY['Mayores ingresos']::TEXT[], now()),
  (gen_random_uuid()::text, 'Bold', 'Plataforma fintech de pagos y datáfonos con una de las tasas de crecimiento en usuarios e ingresos más altas en el segmento MIPYME.', 11, 'Fintech (pagos y datáfonos)', 'bold.png', ARRAY['Mayor crecimiento']::TEXT[], now()),
  (gen_random_uuid()::text, 'Nu Colombia', 'Neobanco con un rápido ritmo de captación de clientes y emisión de tarjetas en el sector financiero colombiano.', 12, 'Neobanco / Sector financiero', 'nu.png', ARRAY['Mayor crecimiento']::TEXT[], now()),
  (gen_random_uuid()::text, 'Addi', 'Soluciones de pago y crédito Buy Now, Pay Later con expansión vertiginosa en el e-commerce y el comercio físico.', 13, 'Fintech (compra ahora, paga después)', 'addi.png', ARRAY['Mayor crecimiento']::TEXT[], now()),
  (gen_random_uuid()::text, 'Dollarcity', 'Cadena de descuento con uno de los mayores ritmos de apertura de tiendas y crecimiento constante en facturación.', 14, 'Comercio minorista / Descuento', 'dollarcity.png', ARRAY['Mayor crecimiento']::TEXT[], now()),
  (gen_random_uuid()::text, 'Habi', 'Proptech que se consolidó entre los negocios de tecnología con mayor valorización y volumen transaccional en la región.', 15, 'Proptech (compraventa digital de vivienda)', 'habi.png', ARRAY['Mayor crecimiento']::TEXT[], now()),
  (gen_random_uuid()::text, 'Rappi', 'Altos ritmos de crecimiento en volumen operado y diversificación de negocio.', 16, 'Plataforma de entregas y servicios financieros', 'rappi.png', ARRAY['Mayor crecimiento']::TEXT[], now()),
  (gen_random_uuid()::text, 'Tecnoglass', 'Incremento récord en ventas internacionales e ingresos consolidados.', 17, 'Manufactura (vidrio arquitectónico)', 'tecnoglass.png', ARRAY['Mayor crecimiento']::TEXT[], now()),
  (gen_random_uuid()::text, 'Siigo', 'Crecimiento orgánico e inorgánico acelerado en América Latina.', 18, 'Software administrativo y contable en la nube', 'siigo.png', ARRAY['Mayor crecimiento']::TEXT[], now()),
  (gen_random_uuid()::text, 'Bia Energy', 'Ha escalado rápidamente en el mercado corporativo e industrial.', 19, 'Comercializadora digital de energía', 'bia.png', ARRAY['Mayor crecimiento']::TEXT[], now())
ON CONFLICT ("name") DO UPDATE SET
  "sector"  = COALESCE("TargetCompany"."sector", EXCLUDED."sector"),
  "logoUrl" = COALESCE("TargetCompany"."logoUrl", EXCLUDED."logoUrl"),
  "notes"   = COALESCE("TargetCompany"."notes", EXCLUDED."notes"),
  "tags"    = CASE WHEN cardinality(COALESCE("TargetCompany"."tags", ARRAY[]::TEXT[])) = 0 THEN EXCLUDED."tags" ELSE "TargetCompany"."tags" END;
