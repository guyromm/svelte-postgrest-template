create or replace function validate_token(token varchar) returns public.jwt_token as $$
declare
u basic_auth.users;
rttok public.jwt_token;
begin
select * from basic_auth.users where validation_info->>'token'=validate_token.token and validation_info->>'email_sent'='true' and validated is null into u;
raise notice 'got user %',u.email;
if u.email is not null then
   update basic_auth.users set validated=now() where email=u.email;   
   select sign(
      row_to_json(r), current_setting('app.jwt_secret')
    ) as token
    from (
      select
	concat(role,(CASE WHEN validated is null THEN '_unvalidated' ELSE '' END)) as role,      
        email,
        validated,
        extract(epoch from now())::integer + 60*60 as exp
	from basic_auth.users
	where email=u.email
    ) r into rttok;
    raise notice 'signed rttok with %',rttok;
   end if;
   return rttok;
end;
$$ language plpgsql security definer;
grant all on function validate_token to anon;
