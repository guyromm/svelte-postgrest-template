-- Name: user_role(text, text); Type: FUNCTION; Schema: basic_auth; Owner: -
--

CREATE FUNCTION basic_auth.user_role(email text, pass text) RETURNS name
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


--
