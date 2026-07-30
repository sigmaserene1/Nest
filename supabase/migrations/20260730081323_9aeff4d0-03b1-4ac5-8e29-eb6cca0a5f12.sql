-- A claimed name is permanent: no renames, no wallet reassignment
CREATE OR REPLACE FUNCTION public.profiles_block_rename()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.wallet IS DISTINCT FROM OLD.wallet OR lower(trim(NEW.name)) IS DISTINCT FROM lower(trim(OLD.name)) THEN
    RAISE EXCEPTION 'Nest names are permanent and cannot be changed';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_block_rename_trg ON public.profiles;
CREATE TRIGGER profiles_block_rename_trg
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.profiles_block_rename();