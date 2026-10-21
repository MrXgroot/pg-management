import { getDatabase } from "../../../../server/db/connection.js";

export function getTenantDirectory(
  { propertyId, status, search, paymentStatus },
  db = getDatabase(),
) {
  const currentDate = new Date().toISOString().slice(0, 10);
  const conditions = ["t.property_id = ?"];
  const params = [propertyId];

  if (status) {
    conditions.push("t.status = ?");
    params.push(status);
  }

  if (search && search.trim().length > 0) {
    conditions.push("(t.name LIKE ? OR t.phone LIKE ?)");
    const searchTerm = `%${search.trim()}%`;
    params.push(searchTerm, searchTerm);
  }

  const whereClause = conditions.length
    ? `WHERE ${conditions.join(" AND ")}`
    : "";

  const query = `
    SELECT 
      t.id AS tenant_id,
      t.property_id,
      t.name,
      t.phone,
      t.status,
      t.joining_date,
      t.checkout_date,
      t.created_at,
      b.id AS bed_id,
      b.bed_label,
      r.id AS room_id,
      r.room_number,
      f.id AS floor_id,
      f.name AS floor_name,
      COALESCE(debt.total_outstanding_paise, 0) AS total_outstanding_paise,
      COALESCE(debt.overdue_paise, 0) AS overdue_paise,
      COALESCE(credit.advance_credit_paise, 0) AS advance_credit_paise
    FROM tenants t
    LEFT JOIN assignments a ON a.tenant_id = t.id 
      AND a.start_date <= ? 
      AND (a.end_date_exclusive IS NULL OR a.end_date_exclusive > ?)
    LEFT JOIN beds b ON b.id = a.bed_id
    LEFT JOIN rooms r ON r.id = b.room_id
    LEFT JOIN floors f ON f.id = r.floor_id
    LEFT JOIN (
      SELECT 
        o.tenant_id,
        SUM(o.amount_paise - COALESCE(pa.allocated_paise, 0)) AS total_outstanding_paise,
        SUM(
          CASE 
            WHEN o.due_date < ? 
            THEN (o.amount_paise - COALESCE(pa.allocated_paise, 0))
            ELSE 0 
          END
        ) AS overdue_paise
      FROM obligations o
      LEFT JOIN (
        SELECT obligation_id, SUM(amount_paise) AS allocated_paise
        FROM payment_allocations
        GROUP BY obligation_id
      ) pa ON pa.obligation_id = o.id
      WHERE (o.amount_paise - COALESCE(pa.allocated_paise, 0)) > 0
      GROUP BY o.tenant_id
    ) debt ON debt.tenant_id = t.id
    LEFT JOIN (
      SELECT 
        p.tenant_id,
        SUM(p.amount_paise - COALESCE(pa.allocated_paise, 0)) AS advance_credit_paise
      FROM payments p
      LEFT JOIN (
        SELECT payment_id, SUM(amount_paise) AS allocated_paise
        FROM payment_allocations
        GROUP BY payment_id
      ) pa ON pa.payment_id = p.id
      GROUP BY p.tenant_id
    ) credit ON credit.tenant_id = t.id
    ${whereClause}
    ORDER BY t.created_at DESC
  `;

  const queryParams = [currentDate, currentDate, currentDate, ...params];
  const rows = db.prepare(query).all(...queryParams);

  return rows
    .map((row) => {
      const totalOutstanding = Number(row.total_outstanding_paise);
      const overdue = Number(row.overdue_paise);
      const advanceCredit = Number(row.advance_credit_paise);

      let computedPaymentStatus = "PAID";
      if (overdue > 0) {
        computedPaymentStatus = "OVERDUE";
      } else if (totalOutstanding > 0) {
        computedPaymentStatus = "PENDING";
      } else if (advanceCredit > 0) {
        computedPaymentStatus = "CREDIT";
      }

      return {
        id: row.tenant_id,
        propertyId: row.property_id,
        name: row.name,
        phone: row.phone,
        status: row.status,
        joiningDate: row.joining_date,
        checkoutDate: row.checkout_date,
        createdAt: row.created_at,
        currentBed: row.bed_id
          ? {
              bedId: row.bed_id,
              bedLabel: row.bed_label,
              roomId: row.room_id,
              roomNumber: row.room_number,
              floorId: row.floor_id,
              floorName: row.floor_name,
            }
          : null,
        balances: {
          totalOutstandingPaise: totalOutstanding,
          overduePaise: overdue,
          advanceCreditPaise: advanceCredit,
          paymentStatus: computedPaymentStatus,
        },
      };
    })
    .filter((tenant) => {
      if (!paymentStatus) return true;
      return tenant.balances.paymentStatus === paymentStatus;
    });
}
