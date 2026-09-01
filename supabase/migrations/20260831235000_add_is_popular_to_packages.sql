-- Add is_popular column to packages and update admin_upsert_package RPC
ALTER TABLE public.packages ADD COLUMN IF NOT EXISTS is_popular boolean NOT NULL DEFAULT false;

-- Mark plus as popular initially if exists
UPDATE public.packages SET is_popular = true WHERE slug = 'plus';

-- Drop previous function signatures to avoid overload collisions
DROP FUNCTION IF EXISTS public.admin_upsert_package(text, text, numeric, integer, jsonb, boolean, integer, uuid, integer);
DROP FUNCTION IF EXISTS public.admin_upsert_package(text, text, numeric, integer, jsonb, boolean, integer, uuid, integer, boolean);

CREATE OR REPLACE FUNCTION public.admin_upsert_package(
  _name text,
  _slug text,
  _price_ghs numeric,
  _credits integer,
  _perks jsonb DEFAULT '[]'::jsonb,
  _is_active boolean DEFAULT true,
  _sort_order integer DEFAULT 0,
  _id uuid DEFAULT NULL::uuid,
  _max_verdicts integer DEFAULT 2,
  _is_popular boolean DEFAULT false
)
RETURNS packages
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE _p public.packages;
BEGIN
  IF NOT public.has_role(auth.uid(),'admin') THEN RAISE EXCEPTION 'FORBIDDEN'; END IF;
  IF COALESCE(NULLIF(trim(_name),''), '') = '' THEN RAISE EXCEPTION 'INVALID_NAME'; END IF;
  IF _price_ghs IS NULL OR _price_ghs < 0 THEN RAISE EXCEPTION 'INVALID_PRICE'; END IF;
  IF _credits IS NULL OR _credits < 1 THEN RAISE EXCEPTION 'INVALID_CREDITS'; END IF;
  IF _max_verdicts IS NULL OR _max_verdicts < 1 THEN RAISE EXCEPTION 'INVALID_MAX_VERDICTS'; END IF;

  IF _id IS NULL THEN
    INSERT INTO public.packages (name, slug, price_ghs, credits, perks, is_active, sort_order, max_verdicts, is_popular)
    VALUES (trim(_name), lower(trim(_slug)), _price_ghs, _credits, COALESCE(_perks,'[]'::jsonb), COALESCE(_is_active,true), COALESCE(_sort_order,0), _max_verdicts, COALESCE(_is_popular, false))
    RETURNING * INTO _p;
  ELSE
    UPDATE public.packages
       SET name = trim(_name), slug = lower(trim(_slug)), price_ghs = _price_ghs, credits = _credits,
           perks = COALESCE(_perks,'[]'::jsonb), is_active = COALESCE(_is_active,true), sort_order = COALESCE(_sort_order,0),
           max_verdicts = _max_verdicts, is_popular = COALESCE(_is_popular, false)
     WHERE id = _id RETURNING * INTO _p;
    IF _p.id IS NULL THEN RAISE EXCEPTION 'NOT_FOUND'; END IF;
  END IF;

  INSERT INTO public.audit_logs (actor_id, action, entity, entity_id, meta)
  VALUES (auth.uid(), CASE WHEN _id IS NULL THEN 'package.created' ELSE 'package.updated' END, 'packages', _p.id,
          jsonb_build_object('name', _p.name, 'price_ghs', _p.price_ghs, 'credits', _p.credits, 'is_active', _p.is_active, 'max_verdicts', _p.max_verdicts, 'is_popular', _p.is_popular));

  RETURN _p;
END;
$function$;

REVOKE ALL ON FUNCTION public.admin_upsert_package(text, text, numeric, integer, jsonb, boolean, integer, uuid, integer, boolean) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.admin_upsert_package(text, text, numeric, integer, jsonb, boolean, integer, uuid, integer, boolean) TO authenticated, service_role;
