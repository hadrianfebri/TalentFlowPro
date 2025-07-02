--
-- PostgreSQL database dump
--

-- Dumped from database version 16.9
-- Dumped by pg_dump version 16.5

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

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: ai_insights; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.ai_insights (
    id integer NOT NULL,
    company_id character varying NOT NULL,
    type character varying NOT NULL,
    title character varying NOT NULL,
    description text,
    severity character varying DEFAULT 'medium'::character varying,
    data jsonb,
    action_taken boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT now(),
    expires_at timestamp without time zone
);


ALTER TABLE public.ai_insights OWNER TO neondb_owner;

--
-- Name: ai_insights_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.ai_insights_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.ai_insights_id_seq OWNER TO neondb_owner;

--
-- Name: ai_insights_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.ai_insights_id_seq OWNED BY public.ai_insights.id;


--
-- Name: attendance; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.attendance (
    id integer NOT NULL,
    employee_id integer NOT NULL,
    date date NOT NULL,
    check_in timestamp without time zone,
    check_out timestamp without time zone,
    check_in_location jsonb,
    check_out_location jsonb,
    check_in_photo character varying,
    check_out_photo character varying,
    working_hours numeric(4,2),
    overtime_hours numeric(4,2),
    status character varying DEFAULT 'present'::character varying,
    notes text,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.attendance OWNER TO neondb_owner;

--
-- Name: attendance_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.attendance_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.attendance_id_seq OWNER TO neondb_owner;

--
-- Name: attendance_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.attendance_id_seq OWNED BY public.attendance.id;


--
-- Name: companies; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.companies (
    id character varying NOT NULL,
    name character varying NOT NULL,
    address text,
    phone character varying,
    email character varying,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.companies OWNER TO neondb_owner;

--
-- Name: departments; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.departments (
    id integer NOT NULL,
    name character varying NOT NULL,
    company_id character varying NOT NULL,
    manager_id character varying,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.departments OWNER TO neondb_owner;

--
-- Name: departments_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.departments_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.departments_id_seq OWNER TO neondb_owner;

--
-- Name: departments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.departments_id_seq OWNED BY public.departments.id;


--
-- Name: documents; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.documents (
    id integer NOT NULL,
    employee_id integer,
    company_id character varying NOT NULL,
    type character varying NOT NULL,
    name character varying NOT NULL,
    description text,
    file_path character varying NOT NULL,
    file_size integer,
    mime_type character varying,
    is_template boolean DEFAULT false,
    template_variables jsonb,
    signed_by jsonb,
    signed_at timestamp without time zone,
    created_by character varying NOT NULL,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.documents OWNER TO neondb_owner;

--
-- Name: documents_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.documents_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.documents_id_seq OWNER TO neondb_owner;

--
-- Name: documents_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.documents_id_seq OWNED BY public.documents.id;


--
-- Name: employee_salary_components; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.employee_salary_components (
    id integer NOT NULL,
    employee_id integer NOT NULL,
    component_id integer NOT NULL,
    amount character varying NOT NULL,
    effective_date date NOT NULL,
    end_date date,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    notes text
);


ALTER TABLE public.employee_salary_components OWNER TO neondb_owner;

--
-- Name: employee_salary_components_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.employee_salary_components_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.employee_salary_components_id_seq OWNER TO neondb_owner;

--
-- Name: employee_salary_components_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.employee_salary_components_id_seq OWNED BY public.employee_salary_components.id;


--
-- Name: employees; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.employees (
    id integer NOT NULL,
    employee_id character varying NOT NULL,
    user_id character varying,
    company_id character varying NOT NULL,
    first_name character varying NOT NULL,
    last_name character varying NOT NULL,
    birth_place character varying,
    birth_date date,
    gender character varying,
    marital_status character varying,
    nationality character varying DEFAULT 'Indonesia'::character varying,
    religion character varying,
    home_address text,
    phone character varying,
    personal_email character varying,
    work_email character varying NOT NULL,
    emergency_contact jsonb,
    nik character varying,
    npwp character varying,
    bpjs_health_number character varying,
    bpjs_employment_number character varying,
    education jsonb,
    "position" character varying NOT NULL,
    department_id integer,
    hire_date date NOT NULL,
    employment_status character varying DEFAULT 'permanent'::character varying,
    work_location character varying,
    basic_salary numeric(15,2),
    bank_account character varying,
    bank_name character varying,
    status character varying DEFAULT 'active'::character varying,
    termination_date date,
    termination_reason text,
    notes text,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.employees OWNER TO neondb_owner;

--
-- Name: employees_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.employees_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.employees_id_seq OWNER TO neondb_owner;

--
-- Name: employees_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.employees_id_seq OWNED BY public.employees.id;


--
-- Name: job_applications; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.job_applications (
    id integer NOT NULL,
    job_id integer NOT NULL,
    applicant_name character varying NOT NULL,
    applicant_email character varying NOT NULL,
    applicant_phone character varying,
    resume_path character varying,
    cover_letter text,
    parsed_resume jsonb,
    keyword_score numeric(5,2),
    stage character varying DEFAULT 'applied'::character varying,
    notes text,
    interview_date timestamp without time zone,
    offer_amount numeric(15,2),
    hired_date date,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    applicant_address text,
    date_of_birth date,
    gender character varying,
    education jsonb,
    experience jsonb,
    skills jsonb,
    certifications jsonb,
    portfolio_path text,
    status character varying DEFAULT 'pending'::character varying,
    expected_salary bigint,
    available_start_date date,
    ai_match_score numeric,
    ai_analysis jsonb,
    interview_notes text,
    source character varying,
    rejection_reason text,
    referral_source character varying,
    referred_by character varying,
    created_by character varying
);


ALTER TABLE public.job_applications OWNER TO neondb_owner;

--
-- Name: job_applications_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.job_applications_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.job_applications_id_seq OWNER TO neondb_owner;

--
-- Name: job_applications_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.job_applications_id_seq OWNED BY public.job_applications.id;


--
-- Name: jobs; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.jobs (
    id integer NOT NULL,
    company_id character varying NOT NULL,
    title character varying NOT NULL,
    department_id integer,
    description text,
    requirements text,
    location character varying,
    salary_range character varying,
    type character varying DEFAULT 'full-time'::character varying,
    status character varying DEFAULT 'active'::character varying,
    openings integer DEFAULT 1,
    created_by character varying NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.jobs OWNER TO neondb_owner;

--
-- Name: jobs_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.jobs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.jobs_id_seq OWNER TO neondb_owner;

--
-- Name: jobs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.jobs_id_seq OWNED BY public.jobs.id;


--
-- Name: leave_requests; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.leave_requests (
    id integer NOT NULL,
    employee_id integer NOT NULL,
    leave_type_id integer NOT NULL,
    start_date date NOT NULL,
    end_date date NOT NULL,
    total_days integer NOT NULL,
    reason text,
    status character varying DEFAULT 'pending'::character varying,
    approved_by character varying,
    approved_at timestamp without time zone,
    rejection_reason text,
    documents jsonb,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.leave_requests OWNER TO neondb_owner;

--
-- Name: leave_requests_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.leave_requests_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.leave_requests_id_seq OWNER TO neondb_owner;

--
-- Name: leave_requests_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.leave_requests_id_seq OWNED BY public.leave_requests.id;


--
-- Name: leave_types; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.leave_types (
    id integer NOT NULL,
    name character varying NOT NULL,
    company_id character varying NOT NULL,
    max_days integer,
    description text,
    is_active boolean DEFAULT true
);


ALTER TABLE public.leave_types OWNER TO neondb_owner;

--
-- Name: leave_types_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.leave_types_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.leave_types_id_seq OWNER TO neondb_owner;

--
-- Name: leave_types_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.leave_types_id_seq OWNED BY public.leave_types.id;


--
-- Name: local_auth; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.local_auth (
    id integer NOT NULL,
    email character varying,
    employee_id character varying,
    password character varying NOT NULL,
    role character varying NOT NULL,
    company_id character varying NOT NULL,
    is_active boolean DEFAULT true,
    last_login timestamp without time zone,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    CONSTRAINT local_auth_role_check CHECK (((role)::text = ANY ((ARRAY['admin'::character varying, 'hr'::character varying, 'employee'::character varying])::text[])))
);


ALTER TABLE public.local_auth OWNER TO neondb_owner;

--
-- Name: local_auth_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.local_auth_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.local_auth_id_seq OWNER TO neondb_owner;

--
-- Name: local_auth_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.local_auth_id_seq OWNED BY public.local_auth.id;


--
-- Name: payroll; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.payroll (
    id integer NOT NULL,
    employee_id integer NOT NULL,
    period character varying NOT NULL,
    basic_salary numeric(15,2) NOT NULL,
    overtime_pay numeric(15,2) DEFAULT '0'::numeric,
    allowances jsonb,
    deductions jsonb,
    gross_salary numeric(15,2) NOT NULL,
    net_salary numeric(15,2) NOT NULL,
    bpjs_health numeric(15,2) DEFAULT '0'::numeric,
    bpjs_employment numeric(15,2) DEFAULT '0'::numeric,
    pph21 numeric(15,2) DEFAULT '0'::numeric,
    status character varying DEFAULT 'draft'::character varying,
    processed_at timestamp without time zone,
    paid_at timestamp without time zone,
    slip_generated boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT now(),
    adjustments jsonb DEFAULT '{}'::jsonb,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.payroll OWNER TO neondb_owner;

--
-- Name: payroll_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.payroll_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.payroll_id_seq OWNER TO neondb_owner;

--
-- Name: payroll_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.payroll_id_seq OWNED BY public.payroll.id;


--
-- Name: performance_reviews; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.performance_reviews (
    id integer NOT NULL,
    employee_id integer NOT NULL,
    period character varying NOT NULL,
    targets jsonb,
    achievements jsonb,
    rating integer,
    feedback text,
    reviewed_by integer,
    status character varying DEFAULT 'draft'::character varying,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.performance_reviews OWNER TO neondb_owner;

--
-- Name: performance_reviews_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.performance_reviews_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.performance_reviews_id_seq OWNER TO neondb_owner;

--
-- Name: performance_reviews_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.performance_reviews_id_seq OWNED BY public.performance_reviews.id;


--
-- Name: reimbursements; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.reimbursements (
    id integer NOT NULL,
    employee_id integer NOT NULL,
    category character varying NOT NULL,
    amount numeric(15,2) NOT NULL,
    description text NOT NULL,
    receipt_photo character varying,
    ocr_data jsonb,
    date date NOT NULL,
    status character varying DEFAULT 'pending'::character varying,
    approved_by character varying(255),
    approved_at timestamp without time zone,
    rejection_reason text,
    paid_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.reimbursements OWNER TO neondb_owner;

--
-- Name: reimbursements_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.reimbursements_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.reimbursements_id_seq OWNER TO neondb_owner;

--
-- Name: reimbursements_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.reimbursements_id_seq OWNED BY public.reimbursements.id;


--
-- Name: reward_wallet; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.reward_wallet (
    id integer NOT NULL,
    employee_id integer NOT NULL,
    company_id character varying NOT NULL,
    total_points integer DEFAULT 0,
    monthly_points integer DEFAULT 0,
    last_activity timestamp without time zone,
    achievements jsonb,
    streaks jsonb,
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.reward_wallet OWNER TO neondb_owner;

--
-- Name: reward_wallet_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.reward_wallet_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.reward_wallet_id_seq OWNER TO neondb_owner;

--
-- Name: reward_wallet_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.reward_wallet_id_seq OWNED BY public.reward_wallet.id;


--
-- Name: salary_components; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.salary_components (
    id integer NOT NULL,
    company_id character varying NOT NULL,
    name character varying NOT NULL,
    code character varying NOT NULL,
    type character varying DEFAULT 'allowance'::character varying NOT NULL,
    category character varying DEFAULT 'fixed'::character varying NOT NULL,
    description text,
    default_amount character varying DEFAULT '0'::character varying NOT NULL,
    is_taxable boolean DEFAULT true NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.salary_components OWNER TO neondb_owner;

--
-- Name: salary_components_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.salary_components_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.salary_components_id_seq OWNER TO neondb_owner;

--
-- Name: salary_components_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.salary_components_id_seq OWNED BY public.salary_components.id;


--
-- Name: sessions; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.sessions (
    sid character varying NOT NULL,
    sess jsonb NOT NULL,
    expire timestamp without time zone NOT NULL
);


ALTER TABLE public.sessions OWNER TO neondb_owner;

--
-- Name: users; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.users (
    id character varying NOT NULL,
    email character varying,
    first_name character varying,
    last_name character varying,
    profile_image_url character varying,
    role character varying DEFAULT 'employee'::character varying,
    company_id character varying,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    employee_id integer
);


ALTER TABLE public.users OWNER TO neondb_owner;

--
-- Name: ai_insights id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.ai_insights ALTER COLUMN id SET DEFAULT nextval('public.ai_insights_id_seq'::regclass);


--
-- Name: attendance id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.attendance ALTER COLUMN id SET DEFAULT nextval('public.attendance_id_seq'::regclass);


--
-- Name: departments id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.departments ALTER COLUMN id SET DEFAULT nextval('public.departments_id_seq'::regclass);


--
-- Name: documents id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.documents ALTER COLUMN id SET DEFAULT nextval('public.documents_id_seq'::regclass);


--
-- Name: employee_salary_components id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.employee_salary_components ALTER COLUMN id SET DEFAULT nextval('public.employee_salary_components_id_seq'::regclass);


--
-- Name: employees id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.employees ALTER COLUMN id SET DEFAULT nextval('public.employees_id_seq'::regclass);


--
-- Name: job_applications id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.job_applications ALTER COLUMN id SET DEFAULT nextval('public.job_applications_id_seq'::regclass);


--
-- Name: jobs id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.jobs ALTER COLUMN id SET DEFAULT nextval('public.jobs_id_seq'::regclass);


--
-- Name: leave_requests id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.leave_requests ALTER COLUMN id SET DEFAULT nextval('public.leave_requests_id_seq'::regclass);


--
-- Name: leave_types id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.leave_types ALTER COLUMN id SET DEFAULT nextval('public.leave_types_id_seq'::regclass);


--
-- Name: local_auth id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.local_auth ALTER COLUMN id SET DEFAULT nextval('public.local_auth_id_seq'::regclass);


--
-- Name: payroll id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.payroll ALTER COLUMN id SET DEFAULT nextval('public.payroll_id_seq'::regclass);


--
-- Name: performance_reviews id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.performance_reviews ALTER COLUMN id SET DEFAULT nextval('public.performance_reviews_id_seq'::regclass);


--
-- Name: reimbursements id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.reimbursements ALTER COLUMN id SET DEFAULT nextval('public.reimbursements_id_seq'::regclass);


--
-- Name: reward_wallet id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.reward_wallet ALTER COLUMN id SET DEFAULT nextval('public.reward_wallet_id_seq'::regclass);


--
-- Name: salary_components id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.salary_components ALTER COLUMN id SET DEFAULT nextval('public.salary_components_id_seq'::regclass);


--
-- Data for Name: ai_insights; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.ai_insights (id, company_id, type, title, description, severity, data, action_taken, created_at, expires_at) FROM stdin;
1	company-001	attendance_pattern	Pola Absensi Terlambat	5 karyawan menunjukkan pola keterlambatan berulang dalam 2 minggu terakhir	medium	{"pattern": "late_arrival", "employees": 5}	f	2025-06-10 14:52:46.192796	2025-06-17 14:52:46.177
2	company-001	turnover_prediction	Prediksi Turnover	2 karyawan berisiko tinggi resign dalam 3 bulan ke depan	high	{"confidence": 0.85, "at_risk_employees": 2}	f	2025-06-10 14:52:46.271049	2025-07-10 14:52:46.177
3	test-company	attendance_pattern	Pola Absensi Terlambat	5 karyawan menunjukkan pola keterlambatan berulang dalam 2 minggu terakhir	medium	{"pattern": "late_arrival", "employees": 5}	f	2025-06-11 09:38:13.59721	2025-06-18 09:38:13.582
4	test-company	turnover_prediction	Prediksi Turnover	2 karyawan berisiko tinggi resign dalam 3 bulan ke depan	high	{"confidence": 0.85, "at_risk_employees": 2}	f	2025-06-11 09:38:13.5967	2025-07-11 09:38:13.582
\.


--
-- Data for Name: attendance; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.attendance (id, employee_id, date, check_in, check_out, check_in_location, check_out_location, check_in_photo, check_out_photo, working_hours, overtime_hours, status, notes, created_at) FROM stdin;
1	11	2025-06-16	2025-06-16 11:03:50.723	2025-06-16 11:04:13.045	"-6.267017865481733, 106.80360468278968"	"-6.267017865481733, 106.80360468278968"	\N	\N	\N	\N	present	\N	2025-06-16 11:03:52.872
2	11	2025-06-17	2025-06-17 08:45:21.248	2025-06-17 10:05:20.167	"-6.267020084427839, 106.80360775338477"	"-6.267036614235638, 106.8036021038583"	\N	\N	\N	\N	present	\N	2025-06-17 08:45:21.292
3	11	2025-06-18	2025-06-18 08:58:24.401	\N	"-6.2670313437960825, 106.8036009859455"	\N	\N	\N	\N	\N	present	\N	2025-06-18 08:58:24.446
4	8	2025-06-24	2025-06-24 09:06:42.517441	\N	\N	\N	\N	\N	8.00	\N	present	\N	2025-06-24 09:06:42.517441
5	9	2025-06-24	2025-06-24 09:06:42.517441	\N	\N	\N	\N	\N	7.75	\N	late	\N	2025-06-24 09:06:42.517441
6	11	2025-06-23	2025-06-24 09:06:42.517441	\N	\N	\N	\N	\N	8.00	\N	present	\N	2025-06-24 09:06:42.517441
7	13	2025-06-23	2025-06-24 09:06:42.517441	\N	\N	\N	\N	\N	7.50	\N	late	\N	2025-06-24 09:06:42.517441
8	14	2025-06-22	2025-06-24 09:06:42.517441	\N	\N	\N	\N	\N	8.00	\N	present	\N	2025-06-24 09:06:42.517441
9	11	2025-06-24	2025-06-24 09:20:15.555	2025-06-24 09:46:23.266	"-6.2669832679890645, 106.80360602759994"	"-6.266895341720234, 106.80359649010776"	\N	\N	\N	\N	present	\N	2025-06-24 09:20:15.598
\.


--
-- Data for Name: companies; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.companies (id, name, address, phone, email, created_at) FROM stdin;
company-1	PT. Contoh UMKM	Jl. Sudirman No. 123, Jakarta	+62-21-12345678	info@contohUMKM.com	2025-06-16 04:53:36.80233
\.


--
-- Data for Name: departments; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.departments (id, name, company_id, manager_id, created_at) FROM stdin;
5	Human Resources	company-1	\N	2025-06-16 04:53:36.832761
6	Engineering	company-1	\N	2025-06-16 04:53:36.832761
7	Marketing	company-1	\N	2025-06-16 04:53:36.832761
8	Finance	company-1	\N	2025-06-16 04:53:36.832761
9	IT Department	company-1	\N	2025-06-24 09:06:39.523242
10	Finance	company-1	\N	2025-06-24 09:06:39.523242
11	Operations	company-1	\N	2025-06-24 09:06:39.523242
\.


--
-- Data for Name: documents; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.documents (id, employee_id, company_id, type, name, description, file_path, file_size, mime_type, is_template, template_variables, signed_by, signed_at, created_by, created_at) FROM stdin;
2	\N	company-1	policy	Test Document	Test document for employee	/uploads/test.pdf	\N	\N	f	\N	\N	\N	test-user-123	2025-06-17 09:17:04.253602
3	11	company-1	contract	Kontrak Kerja	kontrak kerja	/documents/1750151955138_Kontrak Kerja	\N	\N	f	\N	\N	\N	test-user-123	2025-06-17 09:19:17.095848
\.


--
-- Data for Name: employee_salary_components; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.employee_salary_components (id, employee_id, component_id, amount, effective_date, end_date, is_active, created_at, updated_at, notes) FROM stdin;
\.


--
-- Data for Name: employees; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.employees (id, employee_id, user_id, company_id, first_name, last_name, birth_place, birth_date, gender, marital_status, nationality, religion, home_address, phone, personal_email, work_email, emergency_contact, nik, npwp, bpjs_health_number, bpjs_employment_number, education, "position", department_id, hire_date, employment_status, work_location, basic_salary, bank_account, bank_name, status, termination_date, termination_reason, notes, created_at, updated_at) FROM stdin;
9	EMP002	user-hr-1	company-1	HR	Manager	\N	\N	\N	\N	Indonesia	\N	\N	+62-812-3456-7891	\N	hr@contohUMKM.com	\N	\N	\N	\N	\N	\N	HR Manager	5	2024-01-15	permanent	\N	12000000.00	\N	\N	active	\N	\N	\N	2025-06-16 04:53:36.907946	2025-06-16 04:53:36.907946
8	EMP001	user-admin-1	company-1	Admin	System	\N	\N	\N	\N	Indonesia	\N	\N	+62-812-3456-7890	\N	admin@contohUMKM.com	\N	\N	\N	\N	\N	\N	System Administrator	\N	2024-01-01	permanent	\N	15000000.00	\N	\N	active	\N	\N	\N	2025-06-16 04:53:36.907946	2025-06-16 04:53:36.907946
13	EMP004	\N	company-1	alvian		\N	\N	\N	\N	Indonesia	\N	\N		\N	alvian@company.com	\N	\N	\N	\N	\N	\N	Employee	\N	2025-06-24	permanent	\N	\N	\N	\N	active	\N	\N	\N	2025-06-24 08:36:00.267873	2025-06-24 08:36:00.267873
14	EMP005	\N	company-1	andi		\N	\N	\N	\N	Indonesia	\N	\N	3232323	\N	alvian@gmail.com	\N	\N	\N	\N	\N	\N	Employee	8	2025-06-24	permanent	\N	\N	\N	\N	active	\N	\N	\N	2025-06-24 08:39:11.296115	2025-06-24 08:39:11.296115
11	EMP003	\N	company-1	Test Update	Employee	\N	\N	\N	\N	Indonesia	\N	JL Cipete Raya	0834232334	\N	employee@email.com	"083434343443"	\N	\N	\N	\N	\N	Staff	\N	2024-01-01	permanent	\N	\N	\N	\N	active	\N	\N	\N	2025-06-16 11:00:42.818105	2025-06-24 09:37:07.237
\.


--
-- Data for Name: job_applications; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.job_applications (id, job_id, applicant_name, applicant_email, applicant_phone, resume_path, cover_letter, parsed_resume, keyword_score, stage, notes, interview_date, offer_amount, hired_date, created_at, updated_at, applicant_address, date_of_birth, gender, education, experience, skills, certifications, portfolio_path, status, expected_salary, available_start_date, ai_match_score, ai_analysis, interview_notes, source, rejection_reason, referral_source, referred_by, created_by) FROM stdin;
9	7	alvian	alvian@gmail.com	3323232333434	resume_file-1750751998154-385333389.pdf	\N	\N	\N	hired	\N	2025-06-28 15:33:00	\N	2025-06-24	2025-06-24 07:59:59.504552	2025-06-24 08:35:16.543	\N	\N	\N	"[{\\"level\\":\\"sarjana\\"}]"	"[{\\"years\\":4}]"	\N	\N	\N	pending	\N	\N	81	\N	\N	manual	\N	\N	\N	user-hr-1
10	7	Panji Pratama Kurniawan	panji@email.com	34343434	resume_file-1750752912442-694756938.pdf	\N	\N	\N	hired	\N	2025-06-26 15:19:00	\N	2025-06-24	2025-06-24 08:15:13.504072	2025-06-24 08:38:30.164	\N	\N	\N	"[{\\"level\\":\\"sarjana\\"}]"	"[{\\"years\\":3}]"	\N	\N	\N	pending	\N	\N	85	\N	\N	manual	\N	\N	\N	user-hr-1
8	7	andi	alvian@gmail.com	3232323	resume_file-1750751923833-67637524.pdf	\N	\N	\N	hired	\N	2025-06-30 15:39:00	\N	2025-06-24	2025-06-24 07:58:44.38135	2025-06-24 08:39:11.236	\N	\N	\N	"[{\\"level\\":\\"sarjana\\"}]"	"[{\\"years\\":3}]"	\N	\N	\N	pending	\N	\N	57	\N	\N	manual	\N	\N	\N	user-hr-1
\.


--
-- Data for Name: jobs; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.jobs (id, company_id, title, department_id, description, requirements, location, salary_range, type, status, openings, created_by, created_at, updated_at) FROM stdin;
6	company-1	Backend Developer	6	We are looking for an experienced backend developer.	3+ years experience with Node.js and PostgreSQL	Jakarta, Indonesia	8000000-12000000	full-time	active	1	user-admin-1	2025-06-16 04:53:36.937573	2025-06-16 04:53:36.937573
7	company-1	FullStack Developer	1	Shape complete user journeys: brainstorm flows, sketch wireframes in Figma, then ship pixel-perfect components with React + Tailwind CSS.\nBuild and maintain REST / GraphQL and real-time endpoints in Golang or NestJS, exposing AI services (LLM prompts, embeddings, forecasting) to the front-end.\nOptimise performance across the stack—SSR/ISR in Next.js, connection pooling & caching in Golang/NestJS, smart prefetching, and bundle-size budgeting.\nIntegrate multi-tenant auth, rate-limiting, usage metering, and MWXT-based billing hooks so each tenant’s AI usage maps cleanly to on-chain logic.\nCollaborate with DevOps on containerised releases (Docker + Kubernetes), CI/CD (GitLab CI or GitHub Actions), IaC (Terraform), and WAF-protected zero-trust gateways.\nWrite automated tests (unit, integration, E2E) and keep living docs up to date for fellow engineers and external marketplace vendors.\nPair daily with design, product, AI, and blockchain teams to brainstorm new features, run design reviews, and iterate quickly on user feedback.	Strong production experience with React, Next.js, TypeScript, and Tailwind CSS—comfortable turning Figma concepts into responsive, accessible UIs.\nSolid backend chops in Golang or NestJS (Node + TypeScript)—able to design clean service layers, handle concurrency, and write efficient data access code.\nDeep understanding of REST, GraphQL, WebSockets, and how to secure them with OAuth 2 / OIDC, JWT, and role-based access controls.\nFamiliarity with relational (Postgres), in-memory (Redis), and NoSQL (Mongo) data stores, plus schema design, migrations, and query optimisation.\nExperience consuming or hosting AI/ML services—LLM calls, vector databases, inference endpoints—and wrapping them behind easy-to-use APIs.\nComfort with cloud-native tooling: Docker, Kubernetes, Terraform, CI/CD pipelines, and observability stacks (Prometheus, Grafana, or Datadog).\nA security mindset: understanding of OWASP Top 10, WAF concepts, secret management, and basic threat-model practices.\nStrong communication skills and a passion for collaborating in fast-moving, remote-first teams.	Jakarta	Rp 8.000.000 - Rp 10.000.000	full-time	active	1	user-hr-1	2025-06-24 06:13:19.489564	2025-06-24 06:13:19.489564
\.


--
-- Data for Name: leave_requests; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.leave_requests (id, employee_id, leave_type_id, start_date, end_date, total_days, reason, status, approved_by, approved_at, rejection_reason, documents, created_at, updated_at) FROM stdin;
12	11	1	2025-06-20	2025-06-22	3	Personal leave test	pending	\N	\N	\N	\N	2025-06-17 08:49:51.413845	2025-06-17 08:49:51.413845
13	11	1	2025-06-25	2025-06-26	2	Medical appointment	approved	test-user-123	2025-06-17 08:55:06.37	\N	\N	2025-06-17 08:54:13.741542	2025-06-17 08:55:06.37
14	11	1	2025-06-23	2025-06-26	4	acara keluarga	approved	test-user-123	2025-06-17 10:16:47.503	\N	\N	2025-06-17 09:06:51.939227	2025-06-17 10:16:47.503
15	11	1	2025-06-26	2025-06-27	2	jalan-jalan	approved	test-user-123	2025-06-24 10:01:28.023	\N	\N	2025-06-24 09:22:49.649162	2025-06-24 10:01:28.023
\.


--
-- Data for Name: leave_types; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.leave_types (id, name, company_id, max_days, description, is_active) FROM stdin;
\.


--
-- Data for Name: local_auth; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.local_auth (id, email, employee_id, password, role, company_id, is_active, last_login, created_at, updated_at) FROM stdin;
4	\N	EMP004	$2b$10$a8Gg1UNdeInK66jc12kekORqoVctnPHnjFDKThlRBXPl.UZCwZpTW	employee	company-1	t	\N	2025-06-16 06:59:10.437366	2025-06-16 06:59:10.437366
1	admin@contohUMKM.com	EMP001	$2b$10$/gM/0Lsd/ZA/1ioZE6xThOl6giT4DGXMYj9cHmt5kdFRSVKXRH.dm	admin	company-1	t	2025-06-26 06:46:14.483	2025-06-16 06:59:02.093448	2025-06-16 06:59:02.093448
3	employee@email.com	EMP003	$2b$10$a8Gg1UNdeInK66jc12kekORqoVctnPHnjFDKThlRBXPl.UZCwZpTW	employee	company-1	t	2025-06-26 07:00:47.26	2025-06-16 06:59:10.437366	2025-06-16 06:59:10.437366
2	hr@contohUMKM.com	EMP002	$2b$10$/gM/0Lsd/ZA/1ioZE6xThOl6giT4DGXMYj9cHmt5kdFRSVKXRH.dm	hr	company-1	t	2025-07-02 07:17:27.289	2025-06-16 06:59:02.093448	2025-06-16 06:59:02.093448
\.


--
-- Data for Name: payroll; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.payroll (id, employee_id, period, basic_salary, overtime_pay, allowances, deductions, gross_salary, net_salary, bpjs_health, bpjs_employment, pph21, status, processed_at, paid_at, slip_generated, created_at, adjustments, updated_at) FROM stdin;
13	11	2025-06	5000000.00	0.00	{}	{"tax": 0, "total": 300000, "bpjsHealth": 200000, "bpjsEmployment": 100000}	5000000.00	4700000.00	200000.00	100000.00	0.00	draft	2025-06-17 10:19:34.377	\N	f	2025-06-17 10:19:34.377	{}	2025-06-17 10:19:34.377
14	9	2025-06	12000000.00	0.00	{}	{"tax": 1050000, "total": 1770000, "bpjsHealth": 480000, "bpjsEmployment": 240000}	12000000.00	10230000.00	480000.00	240000.00	1050000.00	draft	2025-06-17 10:19:34.497	\N	f	2025-06-17 10:19:34.497	{}	2025-06-17 10:19:34.497
15	8	2025-06	15000000.00	0.00	{}	{"tax": 1500000, "total": 2400000, "bpjsHealth": 600000, "bpjsEmployment": 300000}	15000000.00	12600000.00	600000.00	300000.00	1500000.00	draft	2025-06-17 10:19:34.619	\N	f	2025-06-17 10:19:34.619	{}	2025-06-17 10:19:34.619
\.


--
-- Data for Name: performance_reviews; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.performance_reviews (id, employee_id, period, targets, achievements, rating, feedback, reviewed_by, status, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: reimbursements; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.reimbursements (id, employee_id, category, amount, description, receipt_photo, ocr_data, date, status, approved_by, approved_at, rejection_reason, paid_at, created_at, updated_at) FROM stdin;
7	11	meal	200000.00	makan malam	/receipts/placeholder.jpg	\N	2025-06-16	approved	test-user-123	2025-06-17 10:19:19.521	\N	\N	2025-06-17 09:27:47.412603	2025-06-17 10:19:19.521
6	11	transport	100000.00	jalan2	/receipts/placeholder.jpg	\N	2025-06-10	approved	test-user-123	2025-06-17 10:19:23.916	\N	\N	2025-06-17 09:19:53.83879	2025-06-17 10:19:23.916
\.


--
-- Data for Name: reward_wallet; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.reward_wallet (id, employee_id, company_id, total_points, monthly_points, last_activity, achievements, streaks, updated_at) FROM stdin;
\.


--
-- Data for Name: salary_components; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.salary_components (id, company_id, name, code, type, category, description, default_amount, is_taxable, is_active, created_at, updated_at) FROM stdin;
5	company-1	Gaji Pokok	BASIC	allowance	fixed	Basic salary	5000000	t	t	2025-06-16 04:53:36.85917	2025-06-16 04:53:36.85917
6	company-1	Tunjangan Transport	TRANSPORT	allowance	fixed	Transportation allowance	500000	t	t	2025-06-16 04:53:36.85917	2025-06-16 04:53:36.85917
\.


--
-- Data for Name: sessions; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.sessions (sid, sess, expire) FROM stdin;
2gey8x4_h9W525b5NKgjPUDm7IMtHsj8	{"cookie": {"path": "/", "secure": false, "expires": "2025-07-03T07:00:10.491Z", "httpOnly": true, "originalMaxAge": 604800000}, "authUser": {"id": 3, "role": "employee", "email": "employee@email.com", "companyId": "company-1", "employeeId": "EMP003"}}	2025-07-03 07:36:00
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.users (id, email, first_name, last_name, profile_image_url, role, company_id, created_at, updated_at, employee_id) FROM stdin;
user-admin-1	admin@contohUMKM.com	Admin	System	\N	employee	company-1	2025-06-16 04:53:36.882488	2025-06-16 04:53:36.882488	\N
user-hr-1	hr@contohUMKM.com	HR	Manager	\N	employee	company-1	2025-06-16 04:53:36.882488	2025-06-16 04:53:36.882488	\N
\.


--
-- Name: ai_insights_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.ai_insights_id_seq', 4, true);


--
-- Name: attendance_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.attendance_id_seq', 9, true);


--
-- Name: departments_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.departments_id_seq', 11, true);


--
-- Name: documents_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.documents_id_seq', 3, true);


--
-- Name: employee_salary_components_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.employee_salary_components_id_seq', 10, true);


--
-- Name: employees_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.employees_id_seq', 14, true);


--
-- Name: job_applications_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.job_applications_id_seq', 10, true);


--
-- Name: jobs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.jobs_id_seq', 7, true);


--
-- Name: leave_requests_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.leave_requests_id_seq', 15, true);


--
-- Name: leave_types_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.leave_types_id_seq', 1, false);


--
-- Name: local_auth_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.local_auth_id_seq', 4, true);


--
-- Name: payroll_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.payroll_id_seq', 15, true);


--
-- Name: performance_reviews_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.performance_reviews_id_seq', 5, true);


--
-- Name: reimbursements_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.reimbursements_id_seq', 7, true);


--
-- Name: reward_wallet_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.reward_wallet_id_seq', 1, false);


--
-- Name: salary_components_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.salary_components_id_seq', 6, true);


--
-- Name: ai_insights ai_insights_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.ai_insights
    ADD CONSTRAINT ai_insights_pkey PRIMARY KEY (id);


--
-- Name: attendance attendance_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.attendance
    ADD CONSTRAINT attendance_pkey PRIMARY KEY (id);


--
-- Name: companies companies_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.companies
    ADD CONSTRAINT companies_pkey PRIMARY KEY (id);


--
-- Name: departments departments_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.departments
    ADD CONSTRAINT departments_pkey PRIMARY KEY (id);


--
-- Name: documents documents_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.documents
    ADD CONSTRAINT documents_pkey PRIMARY KEY (id);


--
-- Name: employee_salary_components employee_salary_components_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.employee_salary_components
    ADD CONSTRAINT employee_salary_components_pkey PRIMARY KEY (id);


--
-- Name: employees employees_employee_id_key; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.employees
    ADD CONSTRAINT employees_employee_id_key UNIQUE (employee_id);


--
-- Name: employees employees_nik_key; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.employees
    ADD CONSTRAINT employees_nik_key UNIQUE (nik);


--
-- Name: employees employees_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.employees
    ADD CONSTRAINT employees_pkey PRIMARY KEY (id);


--
-- Name: employees employees_user_id_key; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.employees
    ADD CONSTRAINT employees_user_id_key UNIQUE (user_id);


--
-- Name: employees employees_work_email_key; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.employees
    ADD CONSTRAINT employees_work_email_key UNIQUE (work_email);


--
-- Name: job_applications job_applications_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.job_applications
    ADD CONSTRAINT job_applications_pkey PRIMARY KEY (id);


--
-- Name: jobs jobs_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.jobs
    ADD CONSTRAINT jobs_pkey PRIMARY KEY (id);


--
-- Name: leave_requests leave_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.leave_requests
    ADD CONSTRAINT leave_requests_pkey PRIMARY KEY (id);


--
-- Name: leave_types leave_types_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.leave_types
    ADD CONSTRAINT leave_types_pkey PRIMARY KEY (id);


--
-- Name: local_auth local_auth_email_key; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.local_auth
    ADD CONSTRAINT local_auth_email_key UNIQUE (email);


--
-- Name: local_auth local_auth_employee_id_key; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.local_auth
    ADD CONSTRAINT local_auth_employee_id_key UNIQUE (employee_id);


--
-- Name: local_auth local_auth_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.local_auth
    ADD CONSTRAINT local_auth_pkey PRIMARY KEY (id);


--
-- Name: payroll payroll_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.payroll
    ADD CONSTRAINT payroll_pkey PRIMARY KEY (id);


--
-- Name: performance_reviews performance_reviews_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.performance_reviews
    ADD CONSTRAINT performance_reviews_pkey PRIMARY KEY (id);


--
-- Name: reimbursements reimbursements_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.reimbursements
    ADD CONSTRAINT reimbursements_pkey PRIMARY KEY (id);


--
-- Name: reward_wallet reward_wallet_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.reward_wallet
    ADD CONSTRAINT reward_wallet_pkey PRIMARY KEY (id);


--
-- Name: salary_components salary_components_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.salary_components
    ADD CONSTRAINT salary_components_pkey PRIMARY KEY (id);


--
-- Name: sessions sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT sessions_pkey PRIMARY KEY (sid);


--
-- Name: users users_email_unique; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_unique UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: IDX_session_expire; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX "IDX_session_expire" ON public.sessions USING btree (expire);


--
-- Name: employee_salary_components employee_salary_components_component_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.employee_salary_components
    ADD CONSTRAINT employee_salary_components_component_id_fkey FOREIGN KEY (component_id) REFERENCES public.salary_components(id);


--
-- Name: employee_salary_components employee_salary_components_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.employee_salary_components
    ADD CONSTRAINT employee_salary_components_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.employees(id);


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: public; Owner: cloud_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE cloud_admin IN SCHEMA public GRANT ALL ON SEQUENCES TO neon_superuser WITH GRANT OPTION;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: public; Owner: cloud_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE cloud_admin IN SCHEMA public GRANT ALL ON TABLES TO neon_superuser WITH GRANT OPTION;


--
-- PostgreSQL database dump complete
--

