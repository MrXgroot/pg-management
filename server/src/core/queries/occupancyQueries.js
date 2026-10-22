import { getDatabase } from "../../../../server/db/connection.js";

function getMonthDetails(dateStr) {
  const [yearStr, monthStr] = dateStr.split("-");
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10); // 1 - 12

  const firstDay = `${yearStr}-${String(month).padStart(2, "0")}-01`;
  const lastDayNum = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const lastDay = `${yearStr}-${String(month).padStart(2, "0")}-${String(lastDayNum).padStart(2, "0")}`;

  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];
  const label = `${monthNames[month - 1]} ${year}`;

  return { label, startDate: firstDay, endDate: lastDay };
}

export function getPropertyOccupancyTree(
  propertyId,
  dateStr,
  db = getDatabase(),
) {
  const targetDate = dateStr || new Date().toISOString().slice(0, 10);
  const billingCycle = getMonthDetails(targetDate);

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

  // 1. Property-wide financial rollup for the active cycle / outstanding obligations
  const propertyFinancials = db
    .prepare(
      `
    SELECT 
      COALESCE(SUM(o.amount_paise), 0) AS total_obligations_paise,
      COALESCE(SUM(pa.allocated_paise), 0) AS total_collected_paise,
      COALESCE(SUM(o.amount_paise - COALESCE(pa.allocated_paise, 0)), 0) AS total_pending_paise,
      COALESCE(SUM(
        CASE 
          WHEN o.due_date < ? 
          THEN (o.amount_paise - COALESCE(pa.allocated_paise, 0))
          ELSE 0 
        END
      ), 0) AS total_overdue_paise
    FROM obligations o
    JOIN tenants t ON t.id = o.tenant_id
    LEFT JOIN (
      SELECT obligation_id, SUM(amount_paise) AS allocated_paise
      FROM payment_allocations
      GROUP BY obligation_id
    ) pa ON pa.obligation_id = o.id
    WHERE t.property_id = ?
      AND (
        (o.period_start >= ? AND o.period_start <= ?)
        OR (o.period_end_exclusive >= ? AND o.period_end_exclusive <= ?)
        OR (o.amount_paise - COALESCE(pa.allocated_paise, 0)) > 0
      )
  `,
    )
    .get(
      targetDate,
      propertyId,
      billingCycle.startDate,
      billingCycle.endDate,
      billingCycle.startDate,
      billingCycle.endDate,
    );

  // 2. Query structural occupancy tree (floors -> rooms -> beds -> active assignment & debts)
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
      a.start_date AS tenant_joining_date,
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

  // 3. Aggregate totals and build tree hierarchy
  let totalBeds = 0;
  let activeBeds = 0;
  let deactivatedBeds = 0;
  let occupiedBeds = 0;
  let vacantBeds = 0;
  const uniqueMembers = new Set();
  const unpaidMembers = new Set();

  const floorMap = new Map();

  for (const row of rows) {
    if (!row.floor_id) continue;

    if (!floorMap.has(row.floor_id)) {
      floorMap.set(row.floor_id, {
        id: row.floor_id,
        number: row.floor_display_order,
        name: row.floor_name,
        displayOrder: row.floor_display_order,
        totalBeds: 0,
        activeBeds: 0,
        occupiedBeds: 0,
        vacantBeds: 0,
        rooms: new Map(),
      });
    }

    const floor = floorMap.get(row.floor_id);
    if (!row.room_id) continue;

    if (!floor.rooms.has(row.room_id)) {
      floor.rooms.set(row.room_id, {
        id: row.room_id,
        roomNumber: row.room_number,
        sharingType: 0,
        totalBeds: 0,
        occupiedBeds: 0,
        vacantBeds: 0,
        roomPendingPaise: 0,
        beds: [],
      });
    }

    const room = floor.rooms.get(row.room_id);
    if (!row.bed_id) continue;

    totalBeds += 1;
    floor.totalBeds += 1;
    room.totalBeds += 1;

    const isActive = Boolean(row.bed_is_active);

    if (isActive) {
      activeBeds += 1;
      floor.activeBeds += 1;
    } else {
      deactivatedBeds += 1;
    }

    let bedStatus = "VACANT";
    let tenantInfo = null;
    let paymentStatus = "EMPTY";

    if (!isActive) {
      paymentStatus = "DISABLED";
    } else if (row.assignment_id && row.tenant_id) {
      bedStatus = "OCCUPIED";
      occupiedBeds += 1;
      floor.occupiedBeds += 1;
      room.occupiedBeds += 1;

      uniqueMembers.add(row.tenant_id);

      const outstanding = Number(row.total_outstanding_paise);
      const overdue = Number(row.overdue_paise);

      if (outstanding > 0) {
        paymentStatus = "UNPAID";
        unpaidMembers.add(row.tenant_id);
        room.roomPendingPaise += outstanding;
      } else {
        paymentStatus = "PAID";
      }

      tenantInfo = {
        id: row.tenant_id,
        name: row.tenant_name,
        phone: row.tenant_phone,
        joiningDate: row.tenant_joining_date,
        totalOutstandingPaise: outstanding,
        overduePaise: overdue,
        nextDueDate: row.next_due_date || null,
      };
    } else {
      vacantBeds += 1;
      floor.vacantBeds += 1;
      room.vacantBeds += 1;
      paymentStatus = "EMPTY";
    }

    room.beds.push({
      id: row.bed_id,
      code: `Bed ${row.bed_label}`,
      bedLabel: row.bed_label,
      isActive,
      status: bedStatus,
      paymentStatus,
      tenant: tenantInfo,
    });
  }

  // 4. Transform Map trees into structured array output
  const floors = Array.from(floorMap.values()).map((floor) => {
    const rooms = Array.from(floor.rooms.values()).map((room) => ({
      ...room,
      sharingType: room.totalBeds,
    }));

    return {
      ...floor,
      rooms,
    };
  });

  const occupancyRate =
    activeBeds > 0 ? Math.round((occupiedBeds / activeBeds) * 100) : 0;

  return {
    propertyId: property.id,
    propertyName: property.name,
    billingCycle,
    summary: {
      totalBeds,
      activeBeds,
      deactivatedBeds,
      occupiedBeds,
      vacantBeds,
      occupancyRate,
      totalMembers: uniqueMembers.size,
      unpaidMembersCount: unpaidMembers.size,
      financials: {
        totalObligationsPaise: Number(
          propertyFinancials?.total_obligations_paise || 0,
        ),
        totalCollectedPaise: Number(
          propertyFinancials?.total_collected_paise || 0,
        ),
        totalPendingPaise: Number(propertyFinancials?.total_pending_paise || 0),
        totalOverduePaise: Number(propertyFinancials?.total_overdue_paise || 0),
      },
    },
    floors,
  };
}
