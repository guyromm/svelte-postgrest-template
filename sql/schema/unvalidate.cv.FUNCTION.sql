-- Name: unvalidate(character varying); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.unvalidate(email character varying) RETURNS void
    LANGUAGE sql SECURITY DEFINER
    AS $$
update basic_auth.users set validated=null,validation_info=null where validated is not null and email=unvalidate.email;
$$;


--
