import { getDatabase } from "../../../../server/db/connection.js";

export function getPropertyOccupancyTree(
  propertyId,
  dateStr,
  db = getDatabase(),
) {
  const targetDate = dateStr || new Date().toISOString().slice(0, 10);

  const property = db
    .prepare(
      `
    SELECT id, name, address
    FROM properties
    WHERE id = ?
  `,
    )
    .get(propertyId);

  if (!property) {
    return null;
  }

  const rows = db
    .prepare(
      `
    SELECT 
      f.id AS floor_id,
      f.name AS floor_name,
      f.display_order AS floor_display_order,
      r.id AS room_id,
      r.room_number,
      b.id AS bed_id,
      b.bed_label,
      b.is_active AS bed_is_active,
      a.id AS assignment_id,
      t.id AS tenant_id,
      t.name AS tenant_name,
      t.phone AS tenant_phone,
      COALESCE(debt.total_outstanding_paise, 0) AS total_outstanding_paise,
      COALESCE(debt.overdue_paise, 0) AS overdue_paise,
      debt.next_due_date
    FROM floors f
    LEFT JOIN rooms r ON r.floor_id = f.id
    LEFT JOIN beds b ON b.room_id = r.id
    LEFT JOIN assignments a ON a.bed_id = b.id
      AND a.start_date <= ?
      AND (a.end_date_exclusive IS NULL OR a.end_date_exclusive > ?)
    LEFT JOIN tenants t ON t.id = a.tenant_id
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
        ) AS overdue_paise,
        MIN(o.due_date) AS next_due_date
      FROM obligations o
      LEFT JOIN (
        SELECT obligation_id, SUM(amount_paise) AS allocated_paise
        FROM payment_allocations
        GROUP BY obligation_id
      ) pa ON pa.obligation_id = o.id
      WHERE (o.amount_paise - COALESCE(pa.allocated_paise, 0)) > 0
      GROUP BY o.tenant_id
    ) debt ON debt.tenant_id = t.id
    WHERE f.property_id = ?
    ORDER BY f.display_order ASC, r.room_number ASC, b.bed_label ASC
  `,
    )
    .all(targetDate, targetDate, targetDate, propertyId);

  const floorMap = new Map();

  for (const row of rows) {
    if (!row.floor_id) continue;

    if (!floorMap.has(row.floor_id)) {
      floorMap.set(row.floor_id, {
        id: row.floor_id,
        name: row.floor_name,
        displayOrder: row.floor_display_order,
        rooms: new Map(),
      });
    }

    const floor = floorMap.get(row.floor_id);
    if (!row.room_id) continue;

    if (!floor.rooms.has(row.room_id)) {
      floor.rooms.set(row.room_id, {
        id: row.room_id,
        roomNumber: row.room_number,
        beds: [],
      });
    }

    const room = floor.rooms.get(row.room_id);
    if (!row.bed_id) continue;

    let bedStatus = "VACANT";
    let tenantInfo = null;

    if (row.bed_is_active === 0) {
      bedStatus = "INACTIVE";
    } else if (row.assignment_id && row.tenant_id) {
      bedStatus = "OCCUPIED";
      tenantInfo = {
        id: row.tenant_id,
        name: row.tenant_name,
        phone: row.tenant_phone,
        totalOutstandingPaise: Number(row.total_outstanding_paise),
        overduePaise: Number(row.overdue_paise),
        nextDueDate: row.next_due_date || null,
      };
    }

    room.beds.push({
      id: row.bed_id,
      bedLabel: row.bed_label,
      isActive: Boolean(row.bed_is_active),
      status: bedStatus,
      tenant: tenantInfo,
    });
  }

  const floors = Array.from(floorMap.values()).map((floor) => ({
    id: floor.id,
    name: floor.name,
    displayOrder: floor.displayOrder,
    rooms: Array.from(floor.rooms.values()),
  }));

  return {
    property: {
      id: property.id,
      name: property.name,
      address: property.address,
    },
    asOfDate: targetDate,
    floors,
  };
}
