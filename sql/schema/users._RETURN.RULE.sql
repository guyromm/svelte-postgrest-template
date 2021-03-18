-- Name: users _RETURN; Type: RULE; Schema: public; Owner: -
--

CREATE OR REPLACE VIEW public.users AS
 SELECT u.email,
    u.role,
    u.validated,
    u.pass_reset_info,
    u.validation_info,
    json_agg(sd.*) AS source_data,
    json_agg(oc.*) AS output_cfg,
    json_agg(jo.*) AS jobs,
    json_agg(sdpo.*) AS shared_source_data,
    json_agg(ocpo.*) AS shared_output_cfg,
    json_agg(jopo.*) AS shared_jobs
   FROM (((((((((basic_auth.users u
     LEFT JOIN public.source_data sd ON (((sd.owner_id)::text = u.email)))
     LEFT JOIN public.output_cfg oc ON (((oc.owner_id)::text = u.email)))
     LEFT JOIN public.jobs jo ON (((jo.owner_id)::text = u.email)))
     LEFT JOIN public.source_data_perms sdp ON ((u.email = (sdp.user_id)::text)))
     LEFT JOIN public.source_data sdpo ON ((sdp.data_id = sdpo.id)))
     LEFT JOIN public.output_cfg_perms ocp ON ((u.email = (sdp.user_id)::text)))
     LEFT JOIN public.output_cfg ocpo ON ((ocp.cfg_id = ocpo.id)))
     LEFT JOIN public.jobs_perms jop ON ((u.email = (sdp.user_id)::text)))
     LEFT JOIN public.jobs jopo ON ((jop.job_id = jopo.id)))
  GROUP BY u.email;


--
