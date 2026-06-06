-- Lock down the public.rls_auto_enable() helper.
--
-- It exists only to auto-enable Row-Level Security on newly created tables in
-- the `public` schema, invoked by a DDL event trigger. It must never be
-- callable directly over the REST API (/rest/v1/rpc/rls_auto_enable), so we
-- revoke EXECUTE from the API roles — mirroring 002 for the other SECURITY
-- DEFINER functions. Event-trigger invocation is unaffected by this revoke.
--
-- Guarded so the migration is safe to run on a database where the function has
-- not been created.
do $$
begin
  if exists (
    select 1
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname = 'rls_auto_enable'
  ) then
    revoke execute on function public.rls_auto_enable() from anon, authenticated, public;
  end if;
end;
$$;
