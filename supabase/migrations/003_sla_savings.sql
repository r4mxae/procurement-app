-- Procurement Dashboard — SLA & savings model.
--
-- Adds:
--   * sla_type / sla_days on tasks and tenders. The form lets the user
--     pick an instrument (RFQ / VO / RFI / RFP / custom) and a working-
--     days count; the existing `deadline` column is still populated
--     (computed at save time = createdAt + sla_days advanced over the
--     user's work week) so all existing display/sort code continues to
--     work without changes.
--   * first_offer / final_offer numeric on tenders, used to compute
--     two derived savings figures: (first_offer - final_offer) and
--     (budgeted_amount - final_offer). Budgeted amount continues to
--     live in the existing `value` column — semantically renamed in
--     the UI only.
--   * sla_presets (jsonb) and work_week (int[]) on user_settings so
--     each user can tune the four default SLAs and define a non-Mon–Fri
--     work week (default: 1=Mon..5=Fri ISO weekday numbers).

set search_path = public;

-- ─── Tasks: SLA fields ──────────────────────────────────────────
alter table tasks
  add column if not exists sla_type text,
  add column if not exists sla_days int;

-- ─── Tenders: SLA + savings model ──────────────────────────────
alter table tenders
  add column if not exists sla_type    text,
  add column if not exists sla_days    int,
  add column if not exists first_offer numeric,
  add column if not exists final_offer numeric;

-- ─── User settings: SLA presets + work week ────────────────────
alter table user_settings
  add column if not exists sla_presets jsonb
    not null default '{"rfq":18,"vo":20,"rfi":25,"rfp":85}'::jsonb,
  add column if not exists work_week int[]
    not null default '{1,2,3,4,5}'::int[];
