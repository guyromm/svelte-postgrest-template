-- Name: role(character varying, character varying); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.role(email character varying, newrole character varying) RETURNS void
    LANGUAGE sql SECURITY DEFINER
    AS $$
update basic_auth.users set role=newrole where email=role.email and email<>current_setting('request.jwt.claim.email'::text, true) and role<>newrole;
$$;


--
