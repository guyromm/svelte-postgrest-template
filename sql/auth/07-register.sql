CREATE OR REPLACE FUNCTION public.register(em text, ps text)
 RETURNS jwt_token
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
declare
  result public.jwt_token;
begin
  insert into basic_auth.users (email,pass,role,validated) values(em,ps,'client',null);
  return login(em,ps);
end;
$function$;



CREATE OR REPLACE FUNCTION public.register(em text, ps text,vinfo text)
 RETURNS jwt_token
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
declare
  result public.jwt_token;
begin
  insert into basic_auth.users
  	 (email,pass,role,validated,validation_info)
	 values(em,ps,'client',null,vinfo)
	 on conflict (email) do
	 update set
	 	validation_info=vinfo,
		validated=null,
		pass=ps
		where users.email=em;
  return login(em,ps);
end;
$function$


