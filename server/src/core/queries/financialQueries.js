import { getDatabase } from "../../../db/connection.js";

export function getFinancialSummary(propertyId, dateStr, db = getDatabase()) {
  const targetDate = dateStr || new Date().toISOString().slice(0, 10);

  const bedStats = db
    .prepare(
      `
    SELECT 
      COUNT(b.id) AS total_beds,
      SUM(CASE WHEN b.is_active = 1 THEN 1 ELSE 0 END) AS active_beds,
      SUM(CASE WHEN b.is_active = 0 THEN 1 ELSE 0 END) AS inactive_beds,
      SUM(
        CASE 
          WHEN b.is_active = 1 AND a.id IS NOT NULL THEN 1 
          ELSE 0 
        END
      ) AS occupied_beds,
      SUM(
        CASE 
          WHEN b.is_active = 1 AND a.id IS NULL THEN 1 
          ELSE 0 
        END
      ) AS vacant_beds
    FROM beds b
    JOIN rooms r ON r.id = b.room_id
    JOIN floors f ON f.id = r.floor_id
    LEFT JOIN assignments a ON a.bed_id = b.id 
      AND a.start_date <= ? 
      AND (a.end_date_exclusive IS NULL OR a.end_date_exclusive > ?)
    WHERE f.property_id = ?
  `,
    )
    .get(targetDate, targetDate, propertyId);

  const tenantStats = db
    .prepare(
      `
    SELECT 
      COUNT(id) AS active_tenants
    FROM tenants
    WHERE property_id = ? AND status = 'ACTIVE'
  `,
    )
    .get(propertyId);

  const obligationsStats = db
    .prepare(
      `
    SELECT 
      COALESCE(SUM(o.amount_paise), 0) AS total_billed_paise,
      COALESCE(SUM(pa.allocated_paise), 0) AS total_allocated_paise,
      COALESCE(SUM(o.amount_paise - COALESCE(pa.allocated_paise, 0)), 0) AS total_outstanding_paise,
      COALESCE(SUM(
        CASE 
          WHEN o.due_date < ? 
          THEN (o.amount_paise - COALESCE(pa.allocated_paise, 0))
          ELSE 0 
        END
      ), 0) AS overdue_paise
    FROM obligations o
    JOIN tenants t ON t.id = o.tenant_id
    LEFT JOIN (
      SELECT obligation_id, SUM(amount_paise) AS allocated_paise
      FROM payment_allocations
      GROUP BY obligation_id
    ) pa ON pa.obligation_id = o.id
    WHERE t.property_id = ?
  `,
    )
    .get(targetDate, propertyId);

  const paymentStats = db
    .prepare(
      `
    SELECT 
      COALESCE(SUM(p.amount_paise), 0) AS total_collected_paise,
      COALESCE(SUM(p.amount_paise - COALESCE(pa.allocated_paise, 0)), 0) AS advance_credit_paise
    FROM payments p
    JOIN tenants t ON t.id = p.tenant_id
    LEFT JOIN (
      SELECT payment_id, SUM(amount_paise) AS allocated_paise
      FROM payment_allocations
      GROUP BY payment_id
    ) pa ON pa.payment_id = p.id
    WHERE t.property_id = ?
  `,
    )
    .get(propertyId);

  const depositStats = db
    .prepare(
      `
    SELECT 
      COALESCE(SUM(CASE WHEN d.status = 'HELD' THEN d.amount_paise ELSE 0 END), 0) AS held_deposit_paise,
      COALESCE(SUM(CASE WHEN d.status = 'SETTLED' THEN d.amount_paise ELSE 0 END), 0) AS settled_deposit_paise
    FROM deposits d
    JOIN tenants t ON t.id = d.tenant_id
    WHERE t.property_id = ?
  `,
    )
    .get(propertyId);

  return {
    propertyId,
    asOfDate: targetDate,
    beds: {
      total: Number(bedStats.total_beds || 0),
      active: Number(bedStats.active_beds || 0),
      inactive: Number(bedStats.inactive_beds || 0),
      occupied: Number(bedStats.occupied_beds || 0),
      vacant: Number(bedStats.vacant_beds || 0),
    },
    tenants: {
      activeCount: Number(tenantStats.active_tenants || 0),
    },
    financials: {
      totalBilledPaise: Number(obligationsStats.total_billed_paise),
      totalCollectedPaise: Number(paymentStats.total_collected_paise),
      totalOutstandingPaise: Number(obligationsStats.total_outstanding_paise),
      overduePaise: Number(obligationsStats.overdue_paise),
      advanceCreditPaise: Number(paymentStats.advance_credit_paise),
      heldDepositPaise: Number(depositStats.held_deposit_paise),
      settledDepositPaise: Number(depositStats.settled_deposit_paise),
    },
  };
}
