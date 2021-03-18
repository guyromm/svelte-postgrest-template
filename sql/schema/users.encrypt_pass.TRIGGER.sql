-- Name: users encrypt_pass; Type: TRIGGER; Schema: basic_auth; Owner: -
--

CREATE TRIGGER encrypt_pass BEFORE INSERT OR UPDATE ON basic_auth.users FOR EACH ROW EXECUTE FUNCTION basic_auth.encrypt_pass();


--
