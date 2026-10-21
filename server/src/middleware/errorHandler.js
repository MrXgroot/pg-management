const STATUS_CODE_MAP = {
  // 400 Bad Request
  INVALID_RENT_AMOUNT: 400,
  INVALID_DEPOSIT_AMOUNT: 400,
  INVALID_PAYMENT_AMOUNT: 400,
  CANNOT_SHIFT_TO_SAME_BED: 400,
  SHIFT_DATE_BEFORE_START_DATE: 400,
  CHECKOUT_DATE_BEFORE_START_DATE: 400,
  INVALID_DATE_FORMAT: 400,

  // 404 Not Found
  PROPERTY_NOT_FOUND: 404,
  BED_NOT_FOUND: 404,
  TARGET_BED_NOT_FOUND: 404,
  TENANT_NOT_FOUND: 404,
  DEPOSIT_NOT_FOUND: 404,

  // 409 Conflict
  BED_INACTIVE: 409,
  BED_ALREADY_OCCUPIED: 409,
  TARGET_BED_INACTIVE: 409,
  TARGET_BED_OCCUPIED: 409,
  TENANT_NOT_ACTIVE: 409,
  TENANT_ALREADY_CHECKED_OUT: 409,
  NO_ACTIVE_ASSIGNMENT: 409,
  DEPOSIT_ALREADY_SETTLED: 409,
  FLOOR_HAS_ROOMS: 409,
  ROOM_HAS_BEDS: 409,
  BED_HAS_HISTORICAL_ASSIGNMENTS: 409,
};

export const errorHandler = (err, req, res, next) => {
  const code = err.code || "INTERNAL_SERVER_ERROR";
  const status = err.status || STATUS_CODE_MAP[code] || 500;

  if (status >= 500) {
    console.error("[Internal Error]:", err);
    return res.status(500).json({
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "An unexpected internal error occurred.",
        details: null,
      },
    });
  }

  return res.status(status).json({
    error: {
      code,
      message: err.message || "A business validation error occurred.",
      details: err.details ?? null,
    },
  });
};
