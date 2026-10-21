import { getDatabase } from "../../../../server/db/connection.js";

export function getTenantLedger(tenantId, db = getDatabase()) {
  const tenant = db
    .prepare(
      `
    SELECT id, name, phone, status, joining_date, checkout_date
    FROM tenants
    WHERE id = ?
  `,
    )
    .get(tenantId);

  if (!tenant) {
    return null;
  }

  const obligations = db
    .prepare(
      `
    SELECT 
      o.id,
      o.period_start,
      o.period_end_exclusive,
      o.due_date,
      o.amount_paise,
      o.created_at,
      COALESCE(SUM(pa.amount_paise), 0) AS allocated_paise
    FROM obligations o
    LEFT JOIN payment_allocations pa ON pa.obligation_id = o.id
    WHERE o.tenant_id = ?
    GROUP BY o.id
    ORDER BY o.period_start ASC, o.due_date ASC
  `,
    )
    .all(tenantId);

  const payments = db
    .prepare(
      `
    SELECT 
      p.id,
      p.amount_paise,
      p.paid_on,
      p.payment_method,
      p.reference_note,
      p.created_at,
      COALESCE(SUM(pa.amount_paise), 0) AS total_allocated_paise
    FROM payments p
    LEFT JOIN payment_allocations pa ON pa.payment_id = p.id
    WHERE p.tenant_id = ?
    GROUP BY p.id
    ORDER BY p.paid_on ASC, p.created_at ASC
  `,
    )
    .all(tenantId);

  const paymentAllocations = db
    .prepare(
      `
    SELECT 
      pa.id,
      pa.payment_id,
      pa.obligation_id,
      pa.amount_paise,
      pa.created_at,
      p.paid_on,
      o.period_start,
      o.period_end_exclusive
    FROM payment_allocations pa
    JOIN payments p ON p.id = pa.payment_id
    JOIN obligations o ON o.id = pa.obligation_id
    WHERE p.tenant_id = ?
    ORDER BY pa.created_at ASC
  `,
    )
    .all(tenantId);

  const deposits = db
    .prepare(
      `
    SELECT 
      d.id,
      d.amount_paise,
      d.received_on,
      d.status,
      d.created_at,
      s.id AS settlement_id,
      s.deductions_total_paise,
      s.refund_paise,
      s.remaining_liability_paise,
      s.settled_at
    FROM deposits d
    LEFT JOIN deposit_settlements s ON s.deposit_id = d.id
    WHERE d.tenant_id = ?
    ORDER BY d.received_on ASC
  `,
    )
    .all(tenantId);

  const deductions = db
    .prepare(
      `
    SELECT 
      dd.id,
      dd.settlement_id,
      dd.amount_paise,
      dd.reason
    FROM deposit_deductions dd
    JOIN deposit_settlements ds ON ds.id = dd.settlement_id
    WHERE ds.tenant_id = ?
  `,
    )
    .all(tenantId);

  const assignments = db
    .prepare(
      `
    SELECT 
      a.id,
      a.start_date,
      a.end_date_exclusive,
      b.bed_label,
      r.room_number,
      f.name AS floor_name
    FROM assignments a
    JOIN beds b ON b.id = a.bed_id
    JOIN rooms r ON r.id = b.room_id
    JOIN floors f ON f.id = r.floor_id
    WHERE a.tenant_id = ?
    ORDER BY a.start_date ASC
  `,
    )
    .all(tenantId);

  const timeline = [];

  for (const o of obligations) {
    timeline.push({
      type: "OBLIGATION",
      id: o.id,
      date: o.period_start,
      createdAt: o.created_at,
      amountPaise: o.amount_paise,
      details: {
        dueDate: o.due_date,
        periodStart: o.period_start,
        periodEndExclusive: o.period_end_exclusive,
        allocatedPaise: Number(o.allocated_paise),
        remainingPaise: o.amount_paise - Number(o.allocated_paise),
      },
    });
  }

  for (const p of payments) {
    const unallocated = p.amount_paise - Number(p.total_allocated_paise);
    timeline.push({
      type: "PAYMENT",
      id: p.id,
      date: p.paid_on,
      createdAt: p.created_at,
      amountPaise: p.amount_paise,
      details: {
        paymentMethod: p.payment_method,
        referenceNote: p.reference_note,
        allocatedPaise: Number(p.total_allocated_paise),
        advanceRolloverPaise: unallocated,
      },
    });
  }

  for (const d of deposits) {
    timeline.push({
      type: "DEPOSIT_RECEIVED",
      id: d.id,
      date: d.received_on,
      createdAt: d.created_at,
      amountPaise: d.amount_paise,
      details: {
        status: d.status,
      },
    });

    if (d.settlement_id) {
      const settlementDeductions = deductions
        .filter((dd) => dd.settlement_id === d.settlement_id)
        .map((dd) => ({ amountPaise: dd.amount_paise, reason: dd.reason }));

      timeline.push({
        type: "DEPOSIT_SETTLEMENT",
        id: d.settlement_id,
        date: d.settled_at.slice(0, 10),
        createdAt: d.settled_at,
        amountPaise: d.amount_paise,
        details: {
          deductionsTotalPaise: d.deductions_total_paise,
          refundPaise: d.refund_paise,
          remainingLiabilityPaise: d.remaining_liability_paise,
          deductions: settlementDeductions,
        },
      });
    }
  }

  for (const a of assignments) {
    timeline.push({
      type: "ASSIGNMENT",
      id: a.id,
      date: a.start_date,
      createdAt: a.start_date,
      amountPaise: 0,
      details: {
        startDate: a.start_date,
        endDateExclusive: a.end_date_exclusive,
        location: `${a.floor_name} - ${a.room_number} - Bed ${a.bed_label}`,
      },
    });
  }

  timeline.sort((a, b) => {
    if (a.date !== b.date) {
      return a.date.localeCompare(b.date);
    }
    return (a.createdAt || "").localeCompare(b.createdAt || "");
  });

  const totalObligations = obligations.reduce(
    (acc, o) => acc + o.amount_paise,
    0,
  );
  const totalAllocated = obligations.reduce(
    (acc, o) => acc + Number(o.allocated_paise),
    0,
  );
  const totalPaid = payments.reduce((acc, p) => acc + p.amount_paise, 0);

  return {
    tenant: {
      id: tenant.id,
      name: tenant.name,
      phone: tenant.phone,
      status: tenant.status,
      joiningDate: tenant.joining_date,
      checkoutDate: tenant.checkout_date,
    },
    summary: {
      totalObligationsPaise: totalObligations,
      totalPaymentsPaise: totalPaid,
      totalOutstandingPaise: totalObligations - totalAllocated,
      advanceCreditPaise: totalPaid - totalAllocated,
    },
    allocations: paymentAllocations.map((pa) => ({
      id: pa.id,
      paymentId: pa.payment_id,
      obligationId: pa.obligation_id,
      amountPaise: pa.amount_paise,
      paidOn: pa.paid_on,
      periodStart: pa.period_start,
      periodEndExclusive: pa.period_end_exclusive,
    })),
    timeline,
  };
}
