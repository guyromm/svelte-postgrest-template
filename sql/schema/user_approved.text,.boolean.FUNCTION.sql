-- Name: user_approved(text, boolean); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.user_approved(_email text, is_approved boolean) RETURNS public.users
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
    IF current_setting('request.jwt.claims', true)::json->>'role' != 'admin' THEN
        RAISE insufficient_privilege;
    END IF;

    UPDATE basic_auth.users SET approved=CASE WHEN is_approved IS TRUE THEN NOW() END
        WHERE email=_email
              AND ((is_approved IS TRUE AND approved IS NULL)
                   OR (is_approved IS FALSE AND approved IS NOT NULL));

    IF NOT FOUND THEN
        RAISE EXCEPTION 'user not changed';
    END IF;

    RETURN (SELECT u FROM public.users u WHERE u.email = _email);
END;
$$;


--
