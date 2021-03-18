-- Name: validate(character varying); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.validate(email character varying) RETURNS void
    LANGUAGE sql SECURITY DEFINER
    AS $$
update basic_auth.users set validated=now() where validated is null and email=validate.email;
select pg_notify('validated',(json_build_object('email',validate.email))::text);
$$;


--
