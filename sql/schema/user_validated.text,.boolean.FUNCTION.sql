-- Name: user_validated(text, boolean); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.user_validated(_email text, is_valid boolean) RETURNS public.users
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
    IF current_setting('request.jwt.claims', true)::json->>'role' != 'admin' THEN
        RAISE insufficient_privilege;
    END IF;

    UPDATE basic_auth.users SET validated=CASE WHEN is_valid IS TRUE THEN NOW() END
        WHERE email=_email
              AND ((is_valid IS TRUE AND validated IS NULL)
                   OR (is_valid IS FALSE AND validated IS NOT NULL));

    IF NOT FOUND THEN
        RAISE EXCEPTION 'user not changed';
    END IF;

    RETURN (SELECT u FROM public.users u WHERE u.email = _email);
END;
$$;


--
