ALTER TABLE public.events ADD COLUMN IF NOT EXISTS gift_preferences JSONB DEFAULT '{}'::jsonb;
ALTER TABLE public.vendors ADD COLUMN IF NOT EXISTS referral_code TEXT;
ALTER TABLE public.vendors ADD COLUMN IF NOT EXISTS discount_code TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS sms_opt_in BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email_notifications BOOLEAN NOT NULL DEFAULT true;