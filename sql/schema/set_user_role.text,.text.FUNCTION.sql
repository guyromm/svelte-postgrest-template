-- Name: set_user_role(text, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.set_user_role(_email text, role text) RETURNS public.users
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
    IF current_setting('request.jwt.claims', true)::json->>'role' != 'admin' THEN
        RAISE insufficient_privilege;
    END IF;

    IF set_user_role.role NOT IN ('client', 'admin') THEN
        RAISE NOTICE 'incorrect value of param role';
    END IF;

    UPDATE basic_auth.users SET role=set_user_role.role WHERE email = _email;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'user not changed';
    END IF;

    RETURN (SELECT u FROM public.users u WHERE u.email = _email);
END ;
$$;


--
