-- Name: users; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.users AS
 SELECT u.email,
    u.role,
    u.validated,
    u.pass_reset_info,
    u.validation_info
   FROM basic_auth.users u;


--
