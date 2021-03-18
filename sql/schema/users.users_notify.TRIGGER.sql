-- Name: users users_notify; Type: TRIGGER; Schema: basic_auth; Owner: -
--

CREATE TRIGGER users_notify AFTER INSERT OR UPDATE ON basic_auth.users FOR EACH ROW EXECUTE FUNCTION public.users_notify_trigger();


--
