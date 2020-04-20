CREATE or replace FUNCTION
users_notify_trigger()
RETURNS trigger
language plpgsql
AS $trigger$
begin
     perform pg_notify('users_insert', (jsonb_build_object('email',NEW.email))::text);
     return null;
     end;
$trigger$;

CREATE TRIGGER users_notify
AFTER INSERT or UPDATE ON basic_auth.users
FOR EACH ROW EXECUTE PROCEDURE users_notify_trigger();
