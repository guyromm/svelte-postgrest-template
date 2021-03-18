-- Name: user_insert(character varying); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.user_insert(email character varying) RETURNS void
    LANGUAGE sql SECURITY DEFINER
    AS $$
insert into basic_auth.users (email,pass,role) values(user_insert.email,md5(random()::text),'client');
$$;


--
