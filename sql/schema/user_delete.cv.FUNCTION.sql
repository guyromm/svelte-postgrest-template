-- Name: user_delete(character varying); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.user_delete(email character varying) RETURNS void
    LANGUAGE sql SECURITY DEFINER
    AS $$
delete from basic_auth.users where email=user_delete.email and role<>'admin' and validated is null and email<>current_setting('request.jwt.claims', true)::json->>'email';
$$;


--
