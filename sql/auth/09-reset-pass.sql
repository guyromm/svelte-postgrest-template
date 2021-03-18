DROP FUNCTION IF EXISTS pass_reset CASCADE;
CREATE OR REPLACE FUNCTION pass_reset(email text)
    RETURNS json AS
$$
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP FUNCTION IF EXISTS pass_reset_new CASCADE;
CREATE OR REPLACE FUNCTION pass_reset_new(token text, pass text)
    RETURNS json AS
$$
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP FUNCTION IF EXISTS users_pass_reset_notify CASCADE;
CREATE OR REPLACE FUNCTION users_pass_reset_notify()
    RETURNS TRIGGER AS
$$
BEGIN
    IF NEW.pass_reset_info IS NOT NULL AND OLD.pass_reset_info IS DISTINCT FROM NEW.pass_reset_info THEN
        PERFORM pg_notify('users_pass_reset', (json_build_object('email', NEW.email))::text);
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS users_pass_reset_notify_trig ON basic_auth.users;
CREATE TRIGGER users_pass_reset_notify_trig
    AFTER UPDATE
    ON basic_auth.users
    FOR EACH ROW
EXECUTE FUNCTION users_pass_reset_notify();
