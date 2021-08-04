-- Name: login(text, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.login(em text, ps text) RETURNS public.jwt_token
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
declare
  _role name;
  _validated timestamptz;
  _approved timestamptz;
  result public.jwt_token;
begin
  select basic_auth.user_role(em, ps) into _role;
  if _role is null then
    raise notice 'could not find user with email % pass %',em,ps;
    raise invalid_password using message = 'invalid user or password';
  end if;
  select basic_auth.user_validated(em,ps) into _validated;
  select approved INTO _approved from basic_auth.users u
  where u.email = em
     and u.pass = crypt(ps, u.pass);

  select sign(
      row_to_json(r), current_setting('app.jwt_secret')
    ) as token
    from (
      select
    concat(_role,(CASE WHEN _validated is null OR _approved IS NULL THEN '_unvalidated' ELSE '' END)) as role,
        login.em as email,
        _validated as validated,
        _approved as approved,
        extract(epoch from now())::integer + 60*60 as exp
    ) r
    into result;
  return result;
end;
$$;


--
