-- Name: users_pass_reset_notify(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.users_pass_reset_notify() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    IF NEW.pass_reset_info IS NOT NULL AND OLD.pass_reset_info IS DISTINCT FROM NEW.pass_reset_info THEN
        PERFORM pg_notify('users_pass_reset', (json_build_object('email', NEW.email))::text);
    END IF;

    RETURN NEW;
END;
$$;


--
