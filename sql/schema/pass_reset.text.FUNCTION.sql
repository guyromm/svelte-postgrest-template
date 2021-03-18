-- Name: pass_reset(text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.pass_reset(email text) RETURNS json
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
    UPDATE basic_auth.users u
    SET pass_reset_info = json_build_object(
        'ts', NOW(),
        'token', MD5(RANDOM()::text),
        'email_sent', FALSE
    )
    WHERE u.email = pass_reset.email
      AND u.validated IS NOT NULL;


    IF NOT FOUND THEN
        RAISE EXCEPTION 'email not found';
    END IF;

    RETURN json_build_object('status', 'ok');
END;
$$;


--
