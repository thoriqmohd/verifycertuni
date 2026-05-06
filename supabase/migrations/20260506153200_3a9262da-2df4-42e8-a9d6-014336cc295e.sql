
CREATE OR REPLACE FUNCTION public.rollup_settlement_on_transaction()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uni uuid;
  v_month text;
BEGIN
  IF NEW.payment_status <> 'paid' THEN RETURN NEW; END IF;

  SELECT c.university_id INTO v_uni
  FROM public.verification_requests vr
  JOIN public.certificates c ON c.id = vr.certificate_id
  WHERE vr.id = NEW.verification_request_id;

  IF v_uni IS NULL THEN RETURN NEW; END IF;

  v_month := to_char(COALESCE(NEW.paid_at, now()), 'YYYY-MM');

  INSERT INTO public.settlements (university_id, settlement_month, total_amount, total_transactions, settlement_status)
  VALUES (v_uni, v_month, COALESCE(NEW.university_share,0), 1, 'pending')
  ON CONFLICT (university_id, settlement_month)
  DO UPDATE SET
    total_amount = public.settlements.total_amount + COALESCE(NEW.university_share,0),
    total_transactions = public.settlements.total_transactions + 1;

  RETURN NEW;
END;
$$;

-- Need a unique index for the ON CONFLICT
CREATE UNIQUE INDEX IF NOT EXISTS settlements_uni_month_uniq
  ON public.settlements (university_id, settlement_month);

DROP TRIGGER IF EXISTS trg_rollup_settlement ON public.transactions;
CREATE TRIGGER trg_rollup_settlement
AFTER INSERT ON public.transactions
FOR EACH ROW EXECUTE FUNCTION public.rollup_settlement_on_transaction();
