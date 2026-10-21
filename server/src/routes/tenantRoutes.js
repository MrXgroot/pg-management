import { Router } from "express";
import * as tenantQueries from "../core/queries/tenantQueries.js";
import { moveInWorkflow } from "../core/workflows/moveInWorkflow.js";
import { shiftBedWorkflow } from "../core/workflows/shiftBedWorkflow.js";
import { moveOutWorkflow } from "../core/workflows/moveOutWorkflow.js";

export const tenantRouter = Router();
tenantRouter.get("/tenants", async (req, res, next) => {
  try {
    const directory = await tenantQueries.getTenantDirectory(req.query);
    return res.status(200).json({ data: directory });
  } catch (err) {
    return next(err);
  }
});

tenantRouter.post("/tenants/move-in", async (req, res, next) => {
  try {
    const result = await moveInWorkflow(req.body);
    return res.status(201).json({ data: result });
  } catch (err) {
    return next(err);
  }
});

tenantRouter.post("/tenants/:id/shift-bed", async (req, res, next) => {
  try {
    const result = await shiftBedWorkflow({
      tenantId: req.params.id,
      targetBedId: req.body.targetBedId,
      shiftDate: req.body.shiftDate,
    });
    return res.status(200).json({ data: result });
  } catch (err) {
    return next(err);
  }
});

tenantRouter.post("/tenants/:id/checkout", async (req, res, next) => {
  try {
    const result = await moveOutWorkflow({
      tenantId: req.params.id,
      checkoutDate: req.body.checkoutDate,
    });
    return res.status(200).json({ data: result });
  } catch (err) {
    return next(err);
  }
});
