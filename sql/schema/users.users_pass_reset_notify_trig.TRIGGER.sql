-- Name: users users_pass_reset_notify_trig; Type: TRIGGER; Schema: basic_auth; Owner: -
--

CREATE TRIGGER users_pass_reset_notify_trig AFTER UPDATE ON basic_auth.users FOR EACH ROW EXECUTE FUNCTION public.users_pass_reset_notify();


--
