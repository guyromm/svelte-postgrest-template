-- login should be on your exposed schema
create or replace function
login(em text, ps text) returns public.jwt_token as $$
declare
  _role name;
  _validated timestamptz;
  result public.jwt_token;
begin
  select basic_auth.user_role(em, ps) into _role;
  if _role is null then
    raise notice 'could not find user with email % pass %',em,ps;
    raise invalid_password using message = 'invalid user or password';
  end if;
  select basic_auth.user_validated(em,ps) into _validated;
  select sign(
      row_to_json(r), current_setting('app.jwt_secret')
    ) as token
    from (
      select
	_role as role,
        login.em as email,
        _validated as validated,
        extract(epoch from now())::integer + 60*60 as exp
    ) r
    into result;
  return result;
end;
$$ language plpgsql security definer;

create or replace function
refresh() returns public.jwt_token as $$
declare
	result public.jwt_token;
begin
 if current_setting('request.jwt.claim.email'::text, true) is null then
      raise invalid_password using message = 'not currently logged in!';
      end if;
    
 select sign(
      row_to_json(r), current_setting('app.jwt_secret')
    ) as token
    from (
      select
	role,
        email,
        validated,
        extract(epoch from now())::integer + 60*60 as exp
	from basic_auth.users
	where email=current_setting('request.jwt.claim.email'::text, true)
    ) r
    into result;
    return result;
end;
$$ language plpgsql security definer;
