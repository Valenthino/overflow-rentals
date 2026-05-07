-- Revoke EXECUTE on SECURITY DEFINER trigger functions from public roles
-- These should only be invoked by triggers, never directly via REST API

revoke execute on function public.handle_new_user() from anon, authenticated, public;
revoke execute on function public.handle_updated_at() from anon, authenticated, public;
