-- Name: users_notify_trigger(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.users_notify_trigger() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
begin
     perform pg_notify('users_insert', (jsonb_build_object('email',NEW.email))::text);
     return null;
     end;
$$;


--
