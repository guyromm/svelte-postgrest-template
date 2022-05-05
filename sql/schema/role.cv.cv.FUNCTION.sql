-- Name: role(character varying, character varying); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.role(email character varying, newrole character varying) RETURNS void
    LANGUAGE sql SECURITY DEFINER
    AS $$
update basic_auth.users set role=newrole where email=role.email and email<>current_setting('request.jwt.claims', true)::json->>'email' and role<>newrole;
$$;


SET default_tablespace = '';

SET default_table_access_method = heap;

--
