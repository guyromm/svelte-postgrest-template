-- Name: validate_token(character varying); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.validate_token(token character varying) RETURNS json
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
declare
u basic_auth.users;
rttok public.jwt_token;
status varchar;
begin
   select into u * from basic_auth.users where validation_info->>'token'=validate_token.token and (validation_info->>'email_sent'='true' or validation_info->>'no_email'='true'); --  and validated is null into u;
   raise notice 'got unvalidated user %',u.email;
   if u.email is not null and u.validated is null then
      update basic_auth.users set validated=now(), validation_info=validation_info-'token' where email=u.email;
      select sign(
            row_to_json(r), current_setting('app.jwt_secret')
        ) as token
        from (
        select
        concat(role,(CASE WHEN validated is null OR approved IS NULL THEN '_unvalidated' ELSE '' END)) as role,
        email,
        validated,
        approved,
        extract(epoch from now())::integer + 60*60 as exp
        from basic_auth.users
        where email=u.email
        ) r into rttok;
      status:= 'signed 1 (initial) rttok with '||rttok;
   elsif u.email is not null and u.validated>=(now()-interval '1 hour') then
    -- let's respect a validation token for up to an hour after validation
        select sign(
              row_to_json(r), current_setting('app.jwt_secret')
          ) as token
          from (
          select
          concat(role,(CASE WHEN validated is null OR approved IS NULL THEN '_unvalidated' ELSE '' END)) as role,
          email,
          validated,
          approved,
          extract(epoch from now())::integer + 60*60 as exp
          from basic_auth.users
          where email=u.email
          ) r into rttok;
       status:= 'signed 2 (hour-window) rttok with '||rttok;
   elsif u.email is null then
    status:='no matching user';
   else
    status:='validated too long ago. token no longer valid';
       end if;
   return json_build_object('token',rttok,'validated',u.validated,'email',u.email,'status',status);
end;
$$;


--
