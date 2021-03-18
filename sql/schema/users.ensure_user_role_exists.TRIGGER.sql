-- Name: users ensure_user_role_exists; Type: TRIGGER; Schema: basic_auth; Owner: -
--

CREATE CONSTRAINT TRIGGER ensure_user_role_exists AFTER INSERT OR UPDATE ON basic_auth.users NOT DEFERRABLE INITIALLY IMMEDIATE FOR EACH ROW EXECUTE FUNCTION basic_auth.check_role_exists();


--
