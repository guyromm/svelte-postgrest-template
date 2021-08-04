-- Name: register(text, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.register(em text, ps text) RETURNS public.jwt_token
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
    mode_invite_only_enabled bool = (
        SELECT COALESCE((SELECT value::bool
                         FROM public.settings
                         WHERE key = 'mode_invite_only'), FALSE));
BEGIN
    INSERT INTO basic_auth.users (email, pass, role, validated, approved)
    VALUES (em,
            ps,
            'client',
            NULL,
            CASE mode_invite_only_enabled WHEN FALSE THEN NOW() END);
    RETURN login(em, ps);
END;
$$;


--
