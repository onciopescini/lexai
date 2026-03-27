-- ==============================================
-- FIX: Atomic increment for free_queries_used
-- ==============================================
-- Due to race conditions on the Node Server reading the `user_metadata`
-- and writing it back via `admin.updateUserById`, a user could bypass 
-- the free tier limit by firing simultaneous requests.
-- This function natively locks the row and increments atomically.

CREATE OR REPLACE FUNCTION increment_free_queries(p_user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER 
SET search_path = public
AS $$
BEGIN
  UPDATE auth.users
  SET raw_user_meta_data =
    CASE 
      WHEN raw_user_meta_data ? 'free_queries_used' THEN
        jsonb_set(
          raw_user_meta_data,
          '{free_queries_used}',
          (COALESCE((raw_user_meta_data->>'free_queries_used')::int, 0) + 1)::text::jsonb
        )
      ELSE
        jsonb_set(
          raw_user_meta_data,
          '{free_queries_used}',
          '1'::jsonb,
          true
        )
    END
  WHERE id = p_user_id;
END;
$$;
