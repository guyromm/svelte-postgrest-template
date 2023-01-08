-- Name: users; Type: VIEW; Schema: public; Owner: -
--

CREATE OR REPLACE VIEW public.users AS
 SELECT u.ts,
    u.email,
    u.role,
    u.validated,
    u.pass_reset_info,
    u.validation_info,
    u.approved
   FROM basic_auth.users u;


--
