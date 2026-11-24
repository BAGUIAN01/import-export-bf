-- Recherche générale : tolérance aux fautes de frappe (« Ouedrago », « Sawadgo »)
-- avec la similarité de trigrammes. Facultatif : si l'extension n'est pas
-- disponible, la migration passe et la recherche fonctionne sans.
DO $$
BEGIN
  CREATE EXTENSION IF NOT EXISTS pg_trgm;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'pg_trgm indisponible : recherche sans tolérance aux fautes';
END
$$;
