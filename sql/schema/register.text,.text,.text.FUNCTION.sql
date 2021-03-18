-- Name: register(text, text, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.register(em text, ps text, vinfo text) RETURNS public.jwt_token
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
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
$$;


--
