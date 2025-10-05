-- =====================================================
-- Função de normalização de nomes para PostgreSQL
-- =====================================================
-- Normaliza nomes para Title Case e aplica correções
-- específicas (ex: Vinícius com acento)
-- =====================================================

CREATE OR REPLACE FUNCTION normalize_name_pg(s text)
RETURNS text LANGUAGE plpgsql AS $$
DECLARE 
  w text; 
  out text := '';
BEGIN
  -- Retorna NULL se entrada for NULL
  IF s IS NULL THEN 
    RETURN NULL; 
  END IF;
  
  -- Remove espaços extras e converte para minúsculas
  s := regexp_replace(trim(s), '\s+', ' ', 'g');
  s := lower(s);
  
  -- Converte cada palavra para Title Case
  FOR w IN SELECT unnest(string_to_array(s, ' ')) LOOP
    out := out || initcap(w) || ' ';
  END LOOP;
  
  out := trim(out);
  
  -- Correções específicas para grafia oficial
  IF lower(out) = 'vinicius' THEN 
    out := 'Vinícius'; 
  END IF;
  
  RETURN out;
END $$;

-- =====================================================
-- Função trigger para normalização automática
-- =====================================================
-- Aplica normalização nas colunas closer, sdr e arrematador
-- antes de INSERT ou UPDATE
-- =====================================================

CREATE OR REPLACE FUNCTION leads_normalize_people_trg()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  -- Normaliza closer se não for NULL
  IF NEW.closer IS NOT NULL THEN 
    NEW.closer := normalize_name_pg(NEW.closer); 
  END IF;
  
  -- Normaliza sdr se não for NULL
  IF NEW.sdr IS NOT NULL THEN 
    NEW.sdr := normalize_name_pg(NEW.sdr); 
  END IF;
  
  -- Normaliza arrematador se não for NULL
  IF NEW.arrematador IS NOT NULL THEN 
    NEW.arrematador := normalize_name_pg(NEW.arrematador); 
  END IF;
  
  RETURN NEW;
END $$;

-- =====================================================
-- Criação do trigger
-- =====================================================
-- Remove trigger existente se houver e cria novo
-- =====================================================

DROP TRIGGER IF EXISTS trg_leads_normalize_people ON leads;

CREATE TRIGGER trg_leads_normalize_people
BEFORE INSERT OR UPDATE ON leads
FOR EACH ROW EXECUTE FUNCTION leads_normalize_people_trg();

-- =====================================================
-- Verificação
-- =====================================================
-- Teste a função de normalização
-- =====================================================

-- Exemplos de teste:
-- SELECT normalize_name_pg('LEONARDO');      -- Retorna: Leonardo
-- SELECT normalize_name_pg('  alan  ');      -- Retorna: Alan
-- SELECT normalize_name_pg('vinicius');      -- Retorna: Vinícius
-- SELECT normalize_name_pg('GISELLE  SILVA'); -- Retorna: Giselle Silva
