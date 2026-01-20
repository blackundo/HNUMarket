CREATE OR REPLACE FUNCTION public.check_max_attributes()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  IF (SELECT COUNT(*) FROM product_attributes WHERE product_id = NEW.product_id) >= 3 THEN
    RAISE EXCEPTION 'Product cannot have more than 3 attributes';
  END IF;
  RETURN NEW;
END;
$function$;


CREATE OR REPLACE FUNCTION public.check_max_variants()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  IF (SELECT COUNT(*) FROM product_variants_new WHERE product_id = NEW.product_id) >= 100 THEN
    RAISE EXCEPTION 'Product cannot have more than 100 variants';
  END IF;
  RETURN NEW;
END;
$function$;


