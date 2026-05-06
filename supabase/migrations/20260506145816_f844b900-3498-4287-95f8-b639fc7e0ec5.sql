
-- ENUMS
CREATE TYPE public.app_role AS ENUM ('super_admin','university_admin','employer','finance_admin','public_verifier');
CREATE TYPE public.entity_status AS ENUM ('active','pending','suspended','inactive');
CREATE TYPE public.cert_status AS ENUM ('valid','revoked','suspended','pending');
CREATE TYPE public.verif_status AS ENUM ('pending','completed','failed','cancelled');
CREATE TYPE public.pay_status AS ENUM ('unpaid','paid','refunded','failed');
CREATE TYPE public.settle_status AS ENUM ('pending','processing','paid');

-- UNIVERSITIES
CREATE TABLE public.universities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  registration_no text,
  logo_url text,
  address text,
  contact_person text,
  contact_email text,
  api_key text UNIQUE,
  api_secret text,
  commission_rate numeric NOT NULL DEFAULT 40,
  status entity_status NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- COMPANIES
CREATE TABLE public.companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name text NOT NULL,
  registration_no text,
  address text,
  contact_person text,
  contact_email text,
  status entity_status NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- USERS PROFILE (no role here)
CREATE TABLE public.users_profile (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid UNIQUE NOT NULL,
  full_name text NOT NULL,
  email text NOT NULL,
  university_id uuid REFERENCES public.universities(id) ON DELETE SET NULL,
  company_id uuid REFERENCES public.companies(id) ON DELETE SET NULL,
  status entity_status NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- USER ROLES (separate)
CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  role app_role NOT NULL,
  UNIQUE(user_id, role)
);

-- has_role function
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS(SELECT 1 FROM public.user_roles WHERE user_id=_user_id AND role=_role);
$$;

-- helpers: current user's company / university
CREATE OR REPLACE FUNCTION public.current_user_company()
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
  SELECT company_id FROM public.users_profile WHERE user_id=auth.uid() LIMIT 1;
$$;
CREATE OR REPLACE FUNCTION public.current_user_university()
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
  SELECT university_id FROM public.users_profile WHERE user_id=auth.uid() LIMIT 1;
$$;

-- CERTIFICATES
CREATE TABLE public.certificates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  university_id uuid NOT NULL REFERENCES public.universities(id) ON DELETE CASCADE,
  certificate_number text UNIQUE NOT NULL,
  student_name text NOT NULL,
  ic_passport text,
  matric_number text,
  faculty text,
  programme_name text,
  award_type text,
  graduation_date date,
  convocation_date date,
  certificate_status cert_status NOT NULL DEFAULT 'valid',
  certificate_file_url text,
  qr_code_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- VERIFICATION REQUESTS
CREATE TABLE public.verification_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  certificate_id uuid NOT NULL REFERENCES public.certificates(id) ON DELETE CASCADE,
  company_id uuid REFERENCES public.companies(id) ON DELETE SET NULL,
  requested_by uuid,
  status verif_status NOT NULL DEFAULT 'pending',
  payment_status pay_status NOT NULL DEFAULT 'unpaid',
  report_reference_no text UNIQUE,
  report_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- TRANSACTIONS
CREATE TABLE public.transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  verification_request_id uuid REFERENCES public.verification_requests(id) ON DELETE CASCADE,
  amount numeric NOT NULL,
  university_share numeric NOT NULL,
  platform_share numeric NOT NULL,
  gateway_fee numeric NOT NULL DEFAULT 1,
  payment_gateway text DEFAULT 'MockPay',
  payment_reference text,
  payment_status pay_status NOT NULL DEFAULT 'paid',
  paid_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- API LOGS
CREATE TABLE public.api_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  university_id uuid REFERENCES public.universities(id) ON DELETE CASCADE,
  endpoint text,
  method text,
  request_payload jsonb,
  response_status int,
  ip_address text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- AUDIT LOGS
CREATE TABLE public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  action text,
  module text,
  description text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- SETTLEMENTS
CREATE TABLE public.settlements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  university_id uuid NOT NULL REFERENCES public.universities(id) ON DELETE CASCADE,
  total_amount numeric NOT NULL DEFAULT 0,
  total_transactions int NOT NULL DEFAULT 0,
  settlement_status settle_status NOT NULL DEFAULT 'pending',
  settlement_month text,
  paid_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- PAYMENT SETTINGS
CREATE TABLE public.payment_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  verification_fee numeric NOT NULL DEFAULT 20,
  platform_commission_rate numeric NOT NULL DEFAULT 40,
  payment_gateway_name text NOT NULL DEFAULT 'MockPay',
  status entity_status NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO public.payment_settings (verification_fee, platform_commission_rate, payment_gateway_name) VALUES (20, 40, 'MockPay');

-- ENABLE RLS
ALTER TABLE public.universities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users_profile ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.verification_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settlements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_settings ENABLE ROW LEVEL SECURITY;

-- POLICIES
-- universities: public can read active universities (for dropdowns / public verify)
CREATE POLICY "anyone read universities" ON public.universities FOR SELECT USING (true);
CREATE POLICY "super admin manage universities" ON public.universities FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'super_admin')) WITH CHECK (public.has_role(auth.uid(),'super_admin'));

-- companies
CREATE POLICY "auth read companies" ON public.companies FOR SELECT TO authenticated USING (
  public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'finance_admin') OR id = public.current_user_company()
);
CREATE POLICY "anyone insert company on register" ON public.companies FOR INSERT WITH CHECK (true);
CREATE POLICY "super admin update companies" ON public.companies FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(),'super_admin'));

-- users_profile
CREATE POLICY "user read own or admin" ON public.users_profile FOR SELECT TO authenticated USING (
  user_id = auth.uid() OR public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'finance_admin')
);
CREATE POLICY "self insert profile" ON public.users_profile FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "self update profile" ON public.users_profile FOR UPDATE TO authenticated USING (user_id = auth.uid());

-- user_roles
CREATE POLICY "read own roles" ON public.user_roles FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.has_role(auth.uid(),'super_admin'));
CREATE POLICY "self insert employer role" ON public.user_roles FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() AND role = 'employer');
CREATE POLICY "super admin manage roles" ON public.user_roles FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'super_admin')) WITH CHECK (public.has_role(auth.uid(),'super_admin'));

-- certificates: public can read minimal info (for /verify); university admin manages own
CREATE POLICY "public read certificates" ON public.certificates FOR SELECT USING (true);
CREATE POLICY "uni admin manage certificates" ON public.certificates FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'super_admin') OR (public.has_role(auth.uid(),'university_admin') AND university_id = public.current_user_university()))
  WITH CHECK (public.has_role(auth.uid(),'super_admin') OR (public.has_role(auth.uid(),'university_admin') AND university_id = public.current_user_university()));

-- verification_requests
CREATE POLICY "read verification requests" ON public.verification_requests FOR SELECT TO authenticated USING (
  public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'finance_admin')
  OR company_id = public.current_user_company()
  OR (public.has_role(auth.uid(),'university_admin') AND certificate_id IN (SELECT id FROM public.certificates WHERE university_id = public.current_user_university()))
);
CREATE POLICY "employer create verification" ON public.verification_requests FOR INSERT TO authenticated
  WITH CHECK (company_id = public.current_user_company());
CREATE POLICY "employer update own verification" ON public.verification_requests FOR UPDATE TO authenticated
  USING (company_id = public.current_user_company() OR public.has_role(auth.uid(),'super_admin'));

-- transactions
CREATE POLICY "read transactions" ON public.transactions FOR SELECT TO authenticated USING (
  public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'finance_admin')
  OR verification_request_id IN (SELECT id FROM public.verification_requests WHERE company_id = public.current_user_company())
  OR (public.has_role(auth.uid(),'university_admin') AND verification_request_id IN (
    SELECT vr.id FROM public.verification_requests vr JOIN public.certificates c ON c.id=vr.certificate_id WHERE c.university_id = public.current_user_university()
  ))
);
CREATE POLICY "auth insert transactions" ON public.transactions FOR INSERT TO authenticated WITH CHECK (true);

-- api_logs
CREATE POLICY "read api logs" ON public.api_logs FOR SELECT TO authenticated USING (
  public.has_role(auth.uid(),'super_admin') OR university_id = public.current_user_university()
);
CREATE POLICY "insert api logs" ON public.api_logs FOR INSERT TO authenticated WITH CHECK (true);

-- audit logs
CREATE POLICY "super admin read audit" ON public.audit_logs FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'super_admin'));
CREATE POLICY "auth insert audit" ON public.audit_logs FOR INSERT TO authenticated WITH CHECK (true);

-- settlements
CREATE POLICY "read settlements" ON public.settlements FOR SELECT TO authenticated USING (
  public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'finance_admin') OR university_id = public.current_user_university()
);
CREATE POLICY "finance manage settlements" ON public.settlements FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'finance_admin'))
  WITH CHECK (public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'finance_admin'));

-- payment settings
CREATE POLICY "anyone read payment settings" ON public.payment_settings FOR SELECT USING (true);
CREATE POLICY "super admin manage payment settings" ON public.payment_settings FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'super_admin')) WITH CHECK (public.has_role(auth.uid(),'super_admin'));
