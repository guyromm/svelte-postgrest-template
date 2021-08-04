-- Name: users; Type: TABLE; Schema: basic_auth; Owner: -
--

CREATE TABLE basic_auth.users (
    email text NOT NULL,
    pass text,
    role name NOT NULL,
    validated timestamp with time zone,
    validation_info jsonb,
    pass_reset_info jsonb,
    ts timestamp with time zone DEFAULT now(),
    approved timestamp with time zone,
    CONSTRAINT users_email_check CHECK ((email ~* '^.+@.+\..+$'::text)),
    CONSTRAINT users_pass_check CHECK ((length(pass) < 512)),
    CONSTRAINT users_role_check CHECK ((length((role)::text) < 512))
);


--
