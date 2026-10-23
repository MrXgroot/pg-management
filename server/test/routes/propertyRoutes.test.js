import { describe, expect, it, vi } from "vitest";

const propertyRepo = vi.hoisted(() => ({
  findById: vi.fn(),
  update: vi.fn(),
}));

vi.mock("../../src/core/repos/propertyRepo.js", () => propertyRepo);

import { propertyRouter } from "../../src/routes/propertyRoutes.js";
import { errorHandler } from "../../src/middleware/errorHandler.js";

function responseRecorder() {
  return {
    statusCode: 200,
    body: undefined,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(body) {
      this.body = body;
      return this;
    },
  };
}

async function invokePropertyUpdate(id, body) {
  const route = propertyRouter.stack.find(
    (layer) => layer.route?.path === "/properties/:id" && layer.route.methods.patch,
  );
  const handler = route.route.stack[0].handle;
  const req = { params: { id }, body };
  const res = responseRecorder();
  let routeError;

  await handler(req, res, (error) => {
    routeError = error;
  });

  if (routeError) errorHandler(routeError, req, res, () => {});
  return res;
}

describe("property update API", () => {
  it("returns the updated property in the standard data envelope", async () => {
    propertyRepo.findById.mockResolvedValue({ id: "property-1" });
    propertyRepo.update.mockResolvedValue({
      id: "property-1",
      name: "Updated PG",
      address: "12 Main Road",
    });

    const response = await invokePropertyUpdate("property-1", {
      name: "Updated PG",
      address: "12 Main Road",
    });

    expect(response.statusCode).toBe(200);
    expect(response.body).toEqual({
      data: { id: "property-1", name: "Updated PG", address: "12 Main Road" },
    });
    expect(propertyRepo.update).toHaveBeenCalledWith("property-1", {
      name: "Updated PG",
      address: "12 Main Road",
    });
  });

  it("returns PROPERTY_NOT_FOUND when the property does not exist", async () => {
    propertyRepo.update.mockClear();
    propertyRepo.findById.mockResolvedValue(null);

    const response = await invokePropertyUpdate("missing-property", {
      name: "Updated PG",
      address: "12 Main Road",
    });

    expect(response.statusCode).toBe(404);
    expect(response.body).toMatchObject({
      error: { code: "PROPERTY_NOT_FOUND" },
    });
    expect(propertyRepo.update).not.toHaveBeenCalled();
  });
});
