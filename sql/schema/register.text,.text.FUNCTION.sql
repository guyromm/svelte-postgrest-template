-- Name: register(text, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.register(em text, ps text) RETURNS public.jwt_token
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
declare
  result public.jwt_token;
begin
  insert into basic_auth.users (email,pass,role,validated) values(em,ps,'client',null);
  return login(em,ps);
end;
$$;


--
