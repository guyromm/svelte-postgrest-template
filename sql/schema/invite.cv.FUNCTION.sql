-- Name: invite(character varying); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.invite(email character varying) RETURNS text
    LANGUAGE sql SECURITY DEFINER
    AS $$
    -- jsonb_set(jsonb_set(coalesce(validation_info,'{}'::jsonb),'{token}'::text[],concat('"',md5(random()::text),'"')::jsonb),'{email_sent}','true'::jsonb)
insert into basic_auth.users (email,role,validation_info) values(invite.email,'client',json_build_object('no_email',true,'token',md5(random()::text))) on conflict (email) do nothing returning email;
$$;


--
