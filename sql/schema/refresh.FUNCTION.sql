-- Name: refresh(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.refresh() RETURNS public.jwt_token
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
declare
    result public.jwt_token;
begin
 if current_setting('request.jwt.claims', true)::json->>'email' is null then
      raise invalid_password using message = 'not currently logged in!';
      end if;

 select sign(
      row_to_json(r), current_setting('app.jwt_secret')
    ) as token
    from (
      select
    concat(role,(CASE WHEN validated is null OR approved is NULL THEN '_unvalidated' ELSE '' END)) as role,
        email,
        validated,
        approved,
        extract(epoch from now())::integer + 60*60 as exp
    from basic_auth.users
    where email=current_setting('request.jwt.claims', true)::json->>'email'
    ) r
    into result;
    return result;
end;
$$;


--
