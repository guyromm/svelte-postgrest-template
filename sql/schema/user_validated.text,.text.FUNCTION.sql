-- Name: user_validated(text, text); Type: FUNCTION; Schema: basic_auth; Owner: -
--

CREATE FUNCTION basic_auth.user_validated(email text, pass text) RETURNS timestamp with time zone
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


--
