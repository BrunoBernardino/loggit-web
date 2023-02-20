SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


--
-- Name: loggit_user_sessions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.loggit_user_sessions (
    id uuid DEFAULT gen_random_uuid(),
    user_id uuid DEFAULT gen_random_uuid(),
    expires_at timestamp with time zone NOT NULL,
    verified BOOLEAN NOT NULL,
    last_seen_at timestamp with time zone DEFAULT now(),
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.loggit_user_sessions OWNER TO postgres;


--
-- Name: loggit_verification_codes; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.loggit_verification_codes (
    id uuid DEFAULT gen_random_uuid(),
    user_id uuid DEFAULT gen_random_uuid(),
    code character varying NOT NULL,
    verification jsonb NOT NULL,
    expires_at timestamp with time zone NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.loggit_verification_codes OWNER TO postgres;


--
-- Name: loggit_events; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.loggit_events (
    id uuid DEFAULT gen_random_uuid(),
    user_id uuid DEFAULT gen_random_uuid(),
    name text NOT NULL,
    date character varying NOT NULL,
    extra jsonb NOT NULL
);


ALTER TABLE public.loggit_events OWNER TO postgres;


--
-- Name: loggit_users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.loggit_users (
    id uuid DEFAULT gen_random_uuid(),
    email character varying NOT NULL,
    encrypted_key_pair text NOT NULL,
    subscription jsonb NOT NULL,
    status character varying NOT NULL,
    extra jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.loggit_users OWNER TO postgres;


--
-- Name: loggit_migrations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.loggit_migrations (
    id uuid DEFAULT gen_random_uuid(),
    name character varying(100) NOT NULL,
    executed_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE public.loggit_migrations OWNER TO postgres;


--
-- Name: loggit_user_sessions loggit_user_sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.loggit_user_sessions
    ADD CONSTRAINT loggit_user_sessions_pkey PRIMARY KEY (id);


--
-- Name: loggit_verification_codes loggit_verification_codes_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.loggit_verification_codes
    ADD CONSTRAINT loggit_verification_codes_pkey PRIMARY KEY (id);


--
-- Name: loggit_events loggit_events_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.loggit_events
    ADD CONSTRAINT loggit_events_pkey PRIMARY KEY (id);


--
-- Name: loggit_users loggit_users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.loggit_users
    ADD CONSTRAINT loggit_users_pkey PRIMARY KEY (id);


--
-- Name: loggit_user_sessions loggit_user_sessions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.loggit_user_sessions
    ADD CONSTRAINT loggit_user_sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.loggit_users(id);


--
-- Name: loggit_verification_codes loggit_verification_codes_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.loggit_verification_codes
    ADD CONSTRAINT loggit_verification_codes_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.loggit_users(id);


--
-- Name: loggit_events loggit_events_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.loggit_events
    ADD CONSTRAINT loggit_events_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.loggit_users(id);


--
-- Name: TABLE loggit_user_sessions; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.loggit_user_sessions TO postgres;


--
-- Name: TABLE loggit_verification_codes; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.loggit_verification_codes TO postgres;


--
-- Name: TABLE loggit_events; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.loggit_events TO postgres;


--
-- Name: TABLE loggit_users; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.loggit_users TO postgres;


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: public; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON SEQUENCES  TO postgres;


--
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: public; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON FUNCTIONS  TO postgres;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: public; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON TABLES  TO postgres;
