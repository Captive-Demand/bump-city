
-- Profiles table (auto-created on signup)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  role TEXT DEFAULT 'planner',
  city TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email));
  RETURN NEW;
END;
$$;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Events table
CREATE TABLE public.events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  event_type TEXT NOT NULL DEFAULT 'shower',
  honoree_name TEXT,
  due_date DATE,
  event_date DATE,
  city TEXT,
  theme TEXT,
  gift_policy TEXT DEFAULT 'bring-gift',
  clear_wrapping BOOLEAN DEFAULT false,
  gift_note TEXT,
  surprise_mode BOOLEAN DEFAULT false,
  registry_name TEXT,
  registry_private BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can CRUD own events" ON public.events FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Registry items
CREATE TABLE public.registry_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'Essentials',
  price NUMERIC(10,2) DEFAULT 0,
  emoji TEXT DEFAULT '🎁',
  claimed BOOLEAN DEFAULT false,
  claimed_by TEXT,
  source TEXT DEFAULT 'manual',
  external_url TEXT,
  image_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.registry_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own registry items" ON public.registry_items FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Guests
CREATE TABLE public.guests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  status TEXT DEFAULT 'pending',
  plus_one BOOLEAN DEFAULT false,
  dietary_notes TEXT,
  sms_opt_in BOOLEAN DEFAULT false,
  invite_sent BOOLEAN DEFAULT false,
  invite_sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.guests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own guests" ON public.guests FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Predictions
CREATE TABLE public.predictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE NOT NULL,
  guest_name TEXT NOT NULL,
  predicted_date DATE,
  predicted_gender TEXT,
  predicted_name TEXT,
  predicted_weight TEXT,
  is_winner BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.predictions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can insert predictions" ON public.predictions FOR INSERT WITH CHECK (true);
CREATE POLICY "Event owners can view predictions" ON public.predictions FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.events WHERE events.id = predictions.event_id AND events.user_id = auth.uid())
);

-- Activity log
CREATE TABLE public.activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL,
  text TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.activity_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own activity" ON public.activity_log FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Gifts received (gift tracker)
CREATE TABLE public.gifts_received (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  donor_name TEXT NOT NULL,
  item_description TEXT NOT NULL,
  thank_you_sent BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.gifts_received ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own gifts" ON public.gifts_received FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Planning tasks
CREATE TABLE public.planning_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  assignee TEXT,
  due_date DATE,
  completed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.planning_tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own tasks" ON public.planning_tasks FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Vendors
CREATE TABLE public.vendors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT,
  city TEXT DEFAULT 'Nashville',
  phone TEXT,
  website TEXT,
  image_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.vendors ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view vendors" ON public.vendors FOR SELECT USING (true);

-- Community events
CREATE TABLE public.community_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  event_date TIMESTAMPTZ,
  location TEXT,
  city TEXT DEFAULT 'Nashville',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.community_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view community events" ON public.community_events FOR SELECT USING (true);
