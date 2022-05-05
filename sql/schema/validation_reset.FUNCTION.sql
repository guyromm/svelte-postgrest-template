-- Name: validation_reset(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.validation_reset() RETURNS json
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
    cur_email text = current_setting('request.jwt.claims', true)::json->>'email';
BEGIN
    IF cur_email IS NULL THEN
        RAISE invalid_password USING MESSAGE = 'not currently logged in!';
    END IF;

    UPDATE basic_auth.users u
    SET validation_info=NULL
    WHERE u.email = cur_email
      AND u.validated IS NULL;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'email not found or already validated';
    END IF;

    PERFORM pg_notify('users_insert', (jsonb_build_object('email', cur_email))::text);

    RETURN json_build_object('status', 'ok');
END;
$$;


--
