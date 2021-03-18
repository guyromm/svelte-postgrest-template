-- Name: users; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.users AS
SELECT
    NULL::text AS email,
    NULL::name AS role,
    NULL::timestamp with time zone AS validated,
    NULL::jsonb AS pass_reset_info,
    NULL::jsonb AS validation_info,
    NULL::json AS source_data,
    NULL::json AS output_cfg,
    NULL::json AS jobs,
    NULL::json AS shared_source_data,
    NULL::json AS shared_output_cfg,
    NULL::json AS shared_jobs;


--
