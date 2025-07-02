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

