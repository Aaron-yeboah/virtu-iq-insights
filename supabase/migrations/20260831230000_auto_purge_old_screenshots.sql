-- Automated screenshot purging after 7 days to optimize storage & scalability while retaining full prediction history
CREATE OR REPLACE FUNCTION public.purge_old_screenshots(_days_old integer DEFAULT 7)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, storage
AS $$
DECLARE
  _purged_count integer := 0;
  _rec RECORD;
BEGIN
  -- Safety check: minimum 1 day threshold
  IF _days_old < 1 THEN
    _days_old := 7;
  END IF;

  -- Iterate through analyses created older than specified days with an active image_path
  FOR _rec IN
    SELECT id, image_path
      FROM public.analyses
     WHERE created_at < (now() - (_days_old || ' days')::interval)
       AND image_path IS NOT NULL
  LOOP
    -- 1. Remove file object from storage.objects
    DELETE FROM storage.objects
     WHERE bucket_id = 'screenshots'
       AND name = _rec.image_path;

    -- 2. Nullify image_path on the analysis record (keeps verdict history intact)
    UPDATE public.analyses
       SET image_path = NULL
     WHERE id = _rec.id;

    _purged_count := _purged_count + 1;
  END LOOP;

  RETURN _purged_count;
END;
$$;

REVOKE ALL ON FUNCTION public.purge_old_screenshots(integer) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.purge_old_screenshots(integer) TO authenticated, service_role;

-- Safely attempt to schedule daily cleanup at 3:00 AM via pg_cron if enabled
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    PERFORM cron.schedule(
      'purge-screenshots-daily',
      '0 3 * * *',
      'SELECT public.purge_old_screenshots(7);'
    );
  END IF;
EXCEPTION WHEN OTHERS THEN
  -- pg_cron extension not installed or restricted, function remains available via RPC
  NULL;
END;
$$;
