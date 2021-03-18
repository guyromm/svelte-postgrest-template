-- Name: pass_reset_new(text, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.pass_reset_new(token text, pass text) RETURNS json
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
    UPDATE basic_auth.users u
    SET pass            = pass_reset_new.pass,
        pass_reset_info = NULL
    WHERE u.pass_reset_info IS NOT NULL
      AND u.pass_reset_info ->> 'token' = pass_reset_new.token
      AND NOW() - (u.pass_reset_info ->> 'ts')::timestamptz < '1 HOUR'::interval;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'token is not valid';
    END IF;

    RETURN json_build_object('status', 'ok');
END;
$$;


--
