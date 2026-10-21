// server/src/core/repos/tenantRepo.js
import { getDatabase } from "../../../db/connection.js";

function mapTenant(row) {
  if (!row) return null;
  return {
    id: row.id,
    propertyId: row.property_id,
    name: row.name,
    phone: row.phone,
    status: row.status,
    joiningDate: row.joining_date,
    checkoutDate: row.checkout_date,
    createdAt: row.created_at,
  };
}

export function findById(id, db = getDatabase()) {
  const row = db.prepare("SELECT * FROM tenants WHERE id = ?").get(id);
  return mapTenant(row);
}

export function findDirectory(
  { propertyId, status, search },
  db = getDatabase(),
) {
  const conditions = ["property_id = ?"];
  const params = [propertyId];

  if (status) {
    conditions.push("status = ?");
    params.push(status);
  }

  if (search && search.trim().length > 0) {
    conditions.push("(name LIKE ? OR phone LIKE ?)");
    const term = `%${search.trim()}%`;
    params.push(term, term);
  }

  const query = `SELECT * FROM tenants WHERE ${conditions.join(" AND ")} ORDER BY created_at DESC`;
  const rows = db.prepare(query).all(...params);
  return rows.map(mapTenant);
}

export function insert(tenant, db = getDatabase()) {
  db.prepare(
    `
    INSERT INTO tenants (id, property_id, name, phone, status, joining_date, checkout_date)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `,
  ).run(
    tenant.id,
    tenant.propertyId,
    tenant.name,
    tenant.phone,
    tenant.status || "ACTIVE",
    tenant.joiningDate,
    tenant.checkoutDate || null,
  );
  return findById(tenant.id, db);
}

export function updateContactDetails(id, changes, db = getDatabase()) {
  const fields = [];
  const params = [];

  if (changes.name !== undefined) {
    fields.push("name = ?");
    params.push(changes.name);
  }
  if (changes.phone !== undefined) {
    fields.push("phone = ?");
    params.push(changes.phone);
  }

  if (fields.length === 0) return findById(id, db);

  params.push(id);
  db.prepare(`UPDATE tenants SET ${fields.join(", ")} WHERE id = ?`).run(
    ...params,
  );
  return findById(id, db);
}

export function updateStatus(id, { status, checkoutDate }, db = getDatabase()) {
  db.prepare(
    `
    UPDATE tenants
    SET status = ?, checkout_date = ?
    WHERE id = ?
  `,
  ).run(status, checkoutDate || null, id);
  return findById(id, db);
}
