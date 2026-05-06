
-- Storage bucket for university logos
INSERT INTO storage.buckets (id, name, public) VALUES ('university-logos','university-logos', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "public read uni logos" ON storage.objects FOR SELECT USING (bucket_id='university-logos');
CREATE POLICY "auth upload uni logos" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id='university-logos');
CREATE POLICY "auth update uni logos" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id='university-logos');
CREATE POLICY "auth delete uni logos" ON storage.objects FOR DELETE TO authenticated USING (bucket_id='university-logos');

-- Billplz sandbox config on payment_settings
ALTER TABLE public.payment_settings
  ADD COLUMN IF NOT EXISTS billplz_sandbox boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS billplz_api_key text DEFAULT '',
  ADD COLUMN IF NOT EXISTS billplz_collection_id text DEFAULT '',
  ADD COLUMN IF NOT EXISTS billplz_x_signature text DEFAULT '';
