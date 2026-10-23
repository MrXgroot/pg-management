CREATE TABLE IF NOT EXISTS properties (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP)
);

CREATE TABLE IF NOT EXISTS floors (
  id TEXT PRIMARY KEY,
  property_id TEXT NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  display_order INTEGER NOT NULL,
  name TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS rooms (
  id TEXT PRIMARY KEY,
  floor_id TEXT NOT NULL REFERENCES floors(id) ON DELETE CASCADE,
  room_number TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS beds (
  id TEXT PRIMARY KEY,
  room_id TEXT NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  bed_label TEXT NOT NULL,
  is_active INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0, 1))
);

CREATE TABLE IF NOT EXISTS tenants (
  id TEXT PRIMARY KEY,
  property_id TEXT NOT NULL REFERENCES properties(id) ON DELETE RESTRICT,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('ACTIVE', 'CHECKED_OUT')),
  joining_date TEXT NOT NULL,
  checkout_date TEXT,
  created_at TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP)
);

CREATE TABLE IF NOT EXISTS assignments (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
  bed_id TEXT NOT NULL REFERENCES beds(id) ON DELETE RESTRICT,
  start_date TEXT NOT NULL,
  end_date_exclusive TEXT
);

CREATE TRIGGER IF NOT EXISTS assignments_integrity_before_insert
BEFORE INSERT ON assignments
FOR EACH ROW
BEGIN
  SELECT CASE
    WHEN NEW.end_date_exclusive IS NOT NULL
      AND NEW.start_date >= NEW.end_date_exclusive
    THEN RAISE(ABORT, 'ASSIGNMENT_INTERVAL_INVALID')
  END;

  SELECT CASE
    WHEN EXISTS (
      SELECT 1 FROM assignments existing
      WHERE existing.bed_id = NEW.bed_id
        AND (existing.end_date_exclusive IS NULL OR NEW.start_date < existing.end_date_exclusive)
        AND (NEW.end_date_exclusive IS NULL OR existing.start_date < NEW.end_date_exclusive)
    )
    THEN RAISE(ABORT, 'ASSIGNMENT_BED_OVERLAP')
  END;

  SELECT CASE
    WHEN EXISTS (
      SELECT 1 FROM assignments existing
      WHERE existing.tenant_id = NEW.tenant_id
        AND (existing.end_date_exclusive IS NULL OR NEW.start_date < existing.end_date_exclusive)
        AND (NEW.end_date_exclusive IS NULL OR existing.start_date < NEW.end_date_exclusive)
    )
    THEN RAISE(ABORT, 'ASSIGNMENT_TENANT_OVERLAP')
  END;
END;

CREATE TRIGGER IF NOT EXISTS assignments_integrity_before_update
BEFORE UPDATE OF tenant_id, bed_id, start_date, end_date_exclusive ON assignments
FOR EACH ROW
BEGIN
  SELECT CASE
    WHEN NEW.end_date_exclusive IS NOT NULL
      AND NEW.start_date >= NEW.end_date_exclusive
    THEN RAISE(ABORT, 'ASSIGNMENT_INTERVAL_INVALID')
  END;

  SELECT CASE
    WHEN EXISTS (
      SELECT 1 FROM assignments existing
      WHERE existing.id <> OLD.id
        AND existing.bed_id = NEW.bed_id
        AND (existing.end_date_exclusive IS NULL OR NEW.start_date < existing.end_date_exclusive)
        AND (NEW.end_date_exclusive IS NULL OR existing.start_date < NEW.end_date_exclusive)
    )
    THEN RAISE(ABORT, 'ASSIGNMENT_BED_OVERLAP')
  END;

  SELECT CASE
    WHEN EXISTS (
      SELECT 1 FROM assignments existing
      WHERE existing.id <> OLD.id
        AND existing.tenant_id = NEW.tenant_id
        AND (existing.end_date_exclusive IS NULL OR NEW.start_date < existing.end_date_exclusive)
        AND (NEW.end_date_exclusive IS NULL OR existing.start_date < NEW.end_date_exclusive)
    )
    THEN RAISE(ABORT, 'ASSIGNMENT_TENANT_OVERLAP')
  END;
END;

CREATE TABLE IF NOT EXISTS rental_terms (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
  rent_paise INTEGER NOT NULL CHECK (rent_paise > 0),
  effective_from TEXT NOT NULL,
  effective_to_exclusive TEXT
);

CREATE TABLE IF NOT EXISTS obligations (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
  period_start TEXT NOT NULL,
  period_end_exclusive TEXT NOT NULL,
  due_date TEXT NOT NULL,
  amount_paise INTEGER NOT NULL CHECK (amount_paise > 0),
  rental_term_id TEXT REFERENCES rental_terms(id) ON DELETE SET NULL,
  created_at TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP),
  UNIQUE (tenant_id, period_start, period_end_exclusive),
  CHECK (period_start < period_end_exclusive)
);

CREATE TABLE IF NOT EXISTS payments (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
  amount_paise INTEGER NOT NULL CHECK (amount_paise > 0),
  paid_on TEXT NOT NULL,
  payment_method TEXT NOT NULL CHECK (payment_method IN ('UPI', 'CASH', 'BANK_TRANSFER', 'OTHER')),
  reference_note TEXT,
  idempotency_key TEXT UNIQUE,
  created_at TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP)
);

CREATE TABLE IF NOT EXISTS payment_allocations (
  id TEXT PRIMARY KEY,
  payment_id TEXT NOT NULL REFERENCES payments(id) ON DELETE RESTRICT,
  obligation_id TEXT NOT NULL REFERENCES obligations(id) ON DELETE RESTRICT,
  amount_paise INTEGER NOT NULL CHECK (amount_paise > 0),
  created_at TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP)
);

CREATE TABLE IF NOT EXISTS deposits (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
  amount_paise INTEGER NOT NULL CHECK (amount_paise > 0),
  received_on TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('HELD', 'SETTLED')),
  created_at TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP)
);

CREATE TABLE IF NOT EXISTS deposit_settlements (
  id TEXT PRIMARY KEY,
  deposit_id TEXT NOT NULL UNIQUE REFERENCES deposits(id) ON DELETE RESTRICT,
  tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
  deductions_total_paise INTEGER NOT NULL DEFAULT 0 CHECK (deductions_total_paise >= 0),
  refund_paise INTEGER NOT NULL DEFAULT 0 CHECK (refund_paise >= 0),
  remaining_liability_paise INTEGER NOT NULL DEFAULT 0 CHECK (remaining_liability_paise >= 0),
  settled_at TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP)
);

CREATE TABLE IF NOT EXISTS deposit_deductions (
  id TEXT PRIMARY KEY,
  settlement_id TEXT NOT NULL REFERENCES deposit_settlements(id) ON DELETE RESTRICT,
  amount_paise INTEGER NOT NULL CHECK (amount_paise > 0),
  reason TEXT NOT NULL CHECK (length(trim(reason)) > 0)
);

CREATE INDEX IF NOT EXISTS idx_assignments_bed_dates
  ON assignments(bed_id, start_date, end_date_exclusive);
CREATE INDEX IF NOT EXISTS idx_assignments_tenant_dates
  ON assignments(tenant_id, start_date, end_date_exclusive);
CREATE INDEX IF NOT EXISTS idx_obligations_tenant_period
  ON obligations(tenant_id, period_start, due_date);
CREATE INDEX IF NOT EXISTS idx_allocations_obligation
  ON payment_allocations(obligation_id);
CREATE INDEX IF NOT EXISTS idx_allocations_payment
  ON payment_allocations(payment_id);
CREATE INDEX IF NOT EXISTS idx_payments_tenant_date
  ON payments(tenant_id, paid_on);
CREATE INDEX IF NOT EXISTS idx_tenants_property_status
  ON tenants(property_id, status);
