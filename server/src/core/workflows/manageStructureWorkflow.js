import crypto from "node:crypto";
import { getDatabase } from "../../../../server/db/connection.js";
import * as floorRepo from "../repos/floorRepo.js";
import * as roomRepo from "../repos/roomRepo.js";
import * as bedRepo from "../repos/bedRepo.js";

export function addFloor(
  { propertyId, displayOrder, name },
  db = getDatabase(),
) {
  return floorRepo.insert(
    {
      id: crypto.randomUUID(),
      propertyId,
      displayOrder,
      name,
    },
    db,
  );
}

export function deleteFloor(floorId, db = getDatabase()) {
  const run = db.transaction(() => {
    const rooms = roomRepo.findByFloorId(floorId, db);
    if (rooms.length > 0) {
      throw new Error("FLOOR_HAS_ROOMS");
    }
    floorRepo.remove(floorId, db);
  });
  return run();
}

export function addRoom({ floorId, roomNumber }, db = getDatabase()) {
  return roomRepo.insert(
    {
      id: crypto.randomUUID(),
      floorId,
      roomNumber,
    },
    db,
  );
}

export function deleteRoom(roomId, db = getDatabase()) {
  const run = db.transaction(() => {
    const beds = bedRepo.findByRoomId(roomId, db);
    if (beds.length > 0) {
      throw new Error("ROOM_HAS_BEDS");
    }
    roomRepo.remove(roomId, db);
  });
  return run();
}

export function addBed(
  { roomId, bedLabel, isActive = true },
  db = getDatabase(),
) {
  return bedRepo.insert(
    {
      id: crypto.randomUUID(),
      roomId,
      bedLabel,
      isActive,
    },
    db,
  );
}

export function deleteBed(bedId, db = getDatabase()) {
  const run = db.transaction(() => {
    try {
      bedRepo.remove(bedId, db);
    } catch (err) {
      if (err.message && err.message.includes("historical assignments exist")) {
        throw new Error("BED_HAS_HISTORICAL_ASSIGNMENTS");
      }
      throw err;
    }
  });
  return run();
}

export function toggleBedActive(bedId, isActive, db = getDatabase()) {
  return bedRepo.setActive(bedId, isActive, db);
}
