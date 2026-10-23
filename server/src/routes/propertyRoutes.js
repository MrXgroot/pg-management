import { Router } from "express";
import { v4 as uuidv4 } from "uuid";
import * as propertyRepo from "../core/repos/propertyRepo.js";
import * as occupancyQueries from "../core/queries/occupancyQueries.js";
import * as manageStructureWorkflow from "../core/workflows/manageStructureWorkflow.js";
export const propertyRouter = Router();

// Property endpoints
propertyRouter.get("/properties", async (req, res, next) => {
  try {
    const properties = await propertyRepo.getAll();
    return res.status(200).json({ data: properties });
  } catch (err) {
    return next(err);
  }
});

propertyRouter.post("/properties", async (req, res, next) => {
  try {
    const { name, address } = req.body;
    const newProperty = await propertyRepo.insert({
      id: uuidv4(),
      name,
      address,
    });
    return res.status(201).json({ data: newProperty });
  } catch (err) {
    return next(err);
  }
});

propertyRouter.patch("/properties/:id", async (req, res, next) => {
  try {
    const { name, address } = req.body;

    const existingProperty = await propertyRepo.findById(req.params.id);
    if (!existingProperty) {
      const error = new Error(`Property with id ${req.params.id} not found.`);
      error.code = "PROPERTY_NOT_FOUND";
      return next(error);
    }

    const updatedProperty = await propertyRepo.update(req.params.id, {
      name,
      address,
    });

    return res.status(200).json({ data: updatedProperty });
  } catch (err) {
    return next(err);
  }
});

propertyRouter.get("/properties/:id/occupancy", async (req, res, next) => {
  try {
    const tree = await occupancyQueries.getPropertyOccupancyTree(
      req.params.id,
      req.query.date,
    );
    if (!tree) {
      const notFoundError = new Error(
        `Property with id ${req.params.id} not found.`,
      );
      notFoundError.code = "PROPERTY_NOT_FOUND";
      return next(notFoundError);
    }
    return res.status(200).json({ data: tree });
  } catch (err) {
    return next(err);
  }
});

// Floor endpoints
propertyRouter.post("/floors", async (req, res, next) => {
  try {
    const floor = await manageStructureWorkflow.addFloor(req.body);
    return res.status(201).json({ data: floor });
  } catch (err) {
    return next(err);
  }
});

propertyRouter.delete("/floors/:id", async (req, res, next) => {
  try {
    await manageStructureWorkflow.deleteFloor(req.params.id);
    return res.status(200).json({ data: { success: true } });
  } catch (err) {
    return next(err);
  }
});

// Room endpoints
propertyRouter.post("/rooms", async (req, res, next) => {
  try {
    const room = await manageStructureWorkflow.addRoom(req.body);
    return res.status(201).json({ data: room });
  } catch (err) {
    return next(err);
  }
});

propertyRouter.delete("/rooms/:id", async (req, res, next) => {
  try {
    await manageStructureWorkflow.deleteRoom(req.params.id);
    return res.status(200).json({ data: { success: true } });
  } catch (err) {
    return next(err);
  }
});

// Bed endpoints
propertyRouter.post("/beds", async (req, res, next) => {
  try {
    const bed = await manageStructureWorkflow.addBed(req.body);
    return res.status(201).json({ data: bed });
  } catch (err) {
    return next(err);
  }
});

propertyRouter.patch("/beds/:id/toggle-active", async (req, res, next) => {
  try {
    const bed = await manageStructureWorkflow.toggleBedActive(
      req.params.id,
      req.body.isActive,
    );
    if (!bed) {
      const notFoundError = new Error(
        `Bed with id ${req.params.id} not found.`,
      );
      notFoundError.code = "BED_NOT_FOUND";
      return next(notFoundError);
    }
    return res.status(200).json({ data: bed });
  } catch (err) {
    return next(err);
  }
});

propertyRouter.delete("/beds/:id", async (req, res, next) => {
  try {
    await manageStructureWorkflow.deleteBed(req.params.id);
    return res.status(200).json({ data: { success: true } });
  } catch (err) {
    return next(err);
  }
});
