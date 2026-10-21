import { Router } from "express";
import { collectPaymentWorkflow } from "../core/workflows/collectPaymentWorkflow.js";
import { settleDepositWorkflow } from "../core/workflows/settleDepositWorkflow.js";
import * as ledgerQueries from "../core/queries/ledgerQueries.js";
import * as financialQueries from "../core/queries/financialQueries.js";

export const paymentRouter = Router();
paymentRouter.post("/tenants/:id/collect-payment", async (req, res, next) => {
  try {
    const result = await collectPaymentWorkflow({
      tenantId: req.params.id,
      ...req.body,
    });
    return res.status(200).json({ data: result });
  } catch (err) {
    return next(err);
  }
});

// Settle deposit endpoints: tenant-scoped alias and direct deposit route
paymentRouter.post("/tenants/:id/settle-deposit", async (req, res, next) => {
  try {
    const depositId = req.body.depositId || req.params.id;
    const result = await settleDepositWorkflow({
      depositId,
      deductions: req.body.deductions,
    });
    return res.status(200).json({ data: result });
  } catch (err) {
    return next(err);
  }
});

paymentRouter.post("/deposits/:id/settle", async (req, res, next) => {
  try {
    const result = await settleDepositWorkflow({
      depositId: req.params.id,
      deductions: req.body.deductions,
    });
    return res.status(200).json({ data: result });
  } catch (err) {
    return next(err);
  }
});

paymentRouter.get("/tenants/:id/ledger", async (req, res, next) => {
  try {
    const ledger = await ledgerQueries.getTenantLedger(req.params.id);
    if (!ledger) {
      const notFoundError = new Error(
        `Tenant with id ${req.params.id} not found.`,
      );
      notFoundError.code = "TENANT_NOT_FOUND";
      return next(notFoundError);
    }
    return res.status(200).json({ data: ledger });
  } catch (err) {
    return next(err);
  }
});

paymentRouter.get("/financials/summary", async (req, res, next) => {
  try {
    const summary = await financialQueries.getFinancialSummary(
      req.query.propertyId,
      req.query.date,
    );
    return res.status(200).json({ data: summary });
  } catch (err) {
    return next(err);
  }
});
