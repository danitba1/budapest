-- Run via Neon SQL Editor or: npm run migrate
--
-- If DATABASE_URL uses a different role than the one that ran this script, grant access (replace my_app_user
-- with the exact username from your connection string — not CURRENT_USER, which is only the SQL Editor role):
--   GRANT USAGE ON SCHEMA public TO my_app_user;
--   GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.packing_categories, public.packing_items, public.trip_day_meals, public.trip_tasks_state TO my_app_user;

CREATE TABLE IF NOT EXISTS public.packing_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.packing_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID NOT NULL REFERENCES public.packing_categories (id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  packed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS packing_items_category_id_idx ON public.packing_items (category_id);

-- ארוחות ליום (שתי ארוחות ליום) — עמודי הטיול לפי יום
CREATE TABLE IF NOT EXISTS public.trip_day_meals (
  day_number INT PRIMARY KEY CHECK (day_number >= 1 AND day_number <= 10),
  meal_1 TEXT NOT NULL DEFAULT '',
  meal_2 TEXT NOT NULL DEFAULT '',
  general_notes TEXT NOT NULL DEFAULT '',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.trip_day_meals ADD COLUMN IF NOT EXISTS general_notes TEXT NOT NULL DEFAULT '';

-- מצב רשימת משימות (סימון בוצע, הסרות, משימות מותאמות אישית) — שורה יחידה
CREATE TABLE IF NOT EXISTS public.trip_tasks_state (
  id SMALLINT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  payload JSONB NOT NULL DEFAULT '{"done": {}, "hidden": [], "custom": []}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- If you use a dedicated app role, grant (replace my_app_user):
--   GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.packing_categories, public.packing_items, public.trip_day_meals, public.trip_tasks_state TO my_app_user;
