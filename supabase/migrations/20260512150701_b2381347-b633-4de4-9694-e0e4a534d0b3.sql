
-- Allow university admins to view & update finance admin profiles in their university
CREATE POLICY "uni admin read uni profiles"
ON public.users_profile FOR SELECT TO authenticated
USING (
  has_role(auth.uid(), 'university_admin'::app_role)
  AND university_id = current_user_university()
);

CREATE POLICY "uni admin update uni profiles"
ON public.users_profile FOR UPDATE TO authenticated
USING (
  has_role(auth.uid(), 'university_admin'::app_role)
  AND university_id = current_user_university()
)
WITH CHECK (
  has_role(auth.uid(), 'university_admin'::app_role)
  AND university_id = current_user_university()
);

-- Allow university admins to manage finance_admin role assignments for users in their university
CREATE POLICY "uni admin read finance roles"
ON public.user_roles FOR SELECT TO authenticated
USING (
  has_role(auth.uid(), 'university_admin'::app_role)
  AND role = 'finance_admin'::app_role
  AND user_id IN (
    SELECT user_id FROM public.users_profile WHERE university_id = current_user_university()
  )
);

CREATE POLICY "uni admin insert finance roles"
ON public.user_roles FOR INSERT TO authenticated
WITH CHECK (
  has_role(auth.uid(), 'university_admin'::app_role)
  AND role = 'finance_admin'::app_role
  AND user_id IN (
    SELECT user_id FROM public.users_profile WHERE university_id = current_user_university()
  )
);

CREATE POLICY "uni admin delete finance roles"
ON public.user_roles FOR DELETE TO authenticated
USING (
  has_role(auth.uid(), 'university_admin'::app_role)
  AND role = 'finance_admin'::app_role
  AND user_id IN (
    SELECT user_id FROM public.users_profile WHERE university_id = current_user_university()
  )
);
