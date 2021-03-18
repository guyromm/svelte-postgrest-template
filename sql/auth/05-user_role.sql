CREATE or replace FUNCTION basic_auth.user_role(email text, pass text) RETURNS name
    LANGUAGE plpgsql
    AS $$
begin
  return (
  select role from basic_auth.users
   where users.email = user_role.email
     and users.pass = crypt(user_role.pass, users.pass)
  );
end;
$$;

CREATE or replace FUNCTION basic_auth.user_validated(email text, pass text)
RETURNS timestamptz
    LANGUAGE plpgsql
    AS $$
begin
  return (
  select validated from basic_auth.users
   where users.email = user_validated.email
     and users.pass = crypt(user_validated.pass, users.pass)
  );
end;
$$;

