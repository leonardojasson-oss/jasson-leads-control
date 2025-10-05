-- Script de Backfill: Normalização Global de Nomes (Closers/SDRs/Arrematadores)
-- Objetivo: Padronizar todos os nomes para a grafia oficial em Title Case
-- Data: 2025-01-09

-- ============================================================================
-- ETAPA 1: Normalização Básica (trim + case)
-- ============================================================================

-- 1.1) Normalizar espaços e aplicar Title Case em 'closer'
UPDATE leads
SET closer = INITCAP(LOWER(REGEXP_REPLACE(closer, '\s+', ' ', 'g')))
WHERE closer IS NOT NULL;

-- 1.2) Normalizar espaços e aplicar Title Case em 'sdr'
UPDATE leads
SET sdr = INITCAP(LOWER(REGEXP_REPLACE(sdr, '\s+', ' ', 'g')))
WHERE sdr IS NOT NULL;

-- 1.3) Normalizar espaços e aplicar Title Case em 'arrematador'
UPDATE leads
SET arrematador = INITCAP(LOWER(REGEXP_REPLACE(arrematador, '\s+', ' ', 'g')))
WHERE arrematador IS NOT NULL;

-- ============================================================================
-- ETAPA 2: Mapeamento para Grafia Oficial
-- ============================================================================

-- Leonardo
UPDATE leads SET closer = 'Leonardo' WHERE LOWER(closer) IN ('leonardo','leonard','leonardo ');
UPDATE leads SET sdr = 'Leonardo' WHERE LOWER(sdr) IN ('leonardo','leonard','leonardo ');
UPDATE leads SET arrematador = 'Leonardo' WHERE LOWER(arrematador) IN ('leonardo','leonard','leonardo ');

-- Alan
UPDATE leads SET closer = 'Alan' WHERE LOWER(closer) IN ('alan','allan','alán','alãn');
UPDATE leads SET sdr = 'Alan' WHERE LOWER(sdr) IN ('alan','allan','alán','alãn');
UPDATE leads SET arrematador = 'Alan' WHERE LOWER(arrematador) IN ('alan','allan','alán','alãn');

-- Antonio
UPDATE leads SET closer = 'Antonio' WHERE LOWER(closer) IN ('antonio','antônio','antónio');
UPDATE leads SET sdr = 'Antonio' WHERE LOWER(sdr) IN ('antonio','antônio','antónio');
UPDATE leads SET arrematador = 'Antonio' WHERE LOWER(arrematador) IN ('antonio','antônio','antónio');

-- Marcelo
UPDATE leads SET closer = 'Marcelo' WHERE LOWER(closer) IN ('marcelo','marcello');
UPDATE leads SET sdr = 'Marcelo' WHERE LOWER(sdr) IN ('marcelo','marcello');
UPDATE leads SET arrematador = 'Marcelo' WHERE LOWER(arrematador) IN ('marcelo','marcello');

-- Gibran
UPDATE leads SET closer = 'Gibran' WHERE LOWER(closer) IN ('gibran','gíbran');
UPDATE leads SET sdr = 'Gibran' WHERE LOWER(sdr) IN ('gibran','gíbran');
UPDATE leads SET arrematador = 'Gibran' WHERE LOWER(arrematador) IN ('gibran','gíbran');

-- Giselle
UPDATE leads SET closer = 'Giselle' WHERE LOWER(closer) IN ('giselle','gisele');
UPDATE leads SET sdr = 'Giselle' WHERE LOWER(sdr) IN ('giselle','gisele');
UPDATE leads SET arrematador = 'Giselle' WHERE LOWER(arrematador) IN ('giselle','gisele');

-- Guilherme
UPDATE leads SET closer = 'Guilherme' WHERE LOWER(closer) IN ('guilherme','guilhermme');
UPDATE leads SET sdr = 'Guilherme' WHERE LOWER(sdr) IN ('guilherme','guilhermme');
UPDATE leads SET arrematador = 'Guilherme' WHERE LOWER(arrematador) IN ('guilherme','guilhermme');

-- Vinícius
UPDATE leads SET closer = 'Vinícius' WHERE LOWER(closer) IN ('vinicius','vinícios','vinícus','vinícius');
UPDATE leads SET sdr = 'Vinícius' WHERE LOWER(sdr) IN ('vinicius','vinícios','vinícus','vinícius');
UPDATE leads SET arrematador = 'Vinícius' WHERE LOWER(arrematador) IN ('vinicius','vinícios','vinícus','vinícius');

-- Francisco
UPDATE leads SET closer = 'Francisco' WHERE LOWER(closer) IN ('francisco','franscisco');
UPDATE leads SET sdr = 'Francisco' WHERE LOWER(sdr) IN ('francisco','franscisco');
UPDATE leads SET arrematador = 'Francisco' WHERE LOWER(arrematador) IN ('francisco','franscisco');

-- Matriz
UPDATE leads SET closer = 'Matriz' WHERE LOWER(closer) IN ('matriz','matrix');
UPDATE leads SET sdr = 'Matriz' WHERE LOWER(sdr) IN ('matriz','matrix');
UPDATE leads SET arrematador = 'Matriz' WHERE LOWER(arrematador) IN ('matriz','matrix');

-- ============================================================================
-- ETAPA 3: Verificação (opcional)
-- ============================================================================

-- Verificar valores distintos restantes em 'closer'
-- SELECT DISTINCT closer FROM leads WHERE closer IS NOT NULL ORDER BY closer;

-- Verificar valores distintos restantes em 'sdr'
-- SELECT DISTINCT sdr FROM leads WHERE sdr IS NOT NULL ORDER BY sdr;

-- Verificar valores distintos restantes em 'arrematador'
-- SELECT DISTINCT arrematador FROM leads WHERE arrematador IS NOT NULL ORDER BY arrematador;

-- ============================================================================
-- FIM DO SCRIPT
-- ============================================================================
