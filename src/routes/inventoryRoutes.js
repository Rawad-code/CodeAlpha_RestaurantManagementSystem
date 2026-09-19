const express = require("express");
const Inventory = require("../models/Inventory");
const { authenticate, requireStaff } = require("../middleware/auth");

const router = express.Router();

router.get("/", async (req, res, next) => {
  try {
    const items = await Inventory.find().sort({ name: 1 });
    res.json(items);
  } catch (error) {
    next(error);
  }
});

router.get("/alerts", authenticate, requireStaff, async (req, res, next) => {
  try {
    const items = await Inventory.find({
      $expr: { $lte: ["$quantity", "$reorderLevel"] }
    }).sort({ quantity: 1 });

    res.json(items);
  } catch (error) {
    next(error);
  }
});

router.post("/", authenticate, requireStaff, async (req, res, next) => {
  try {
    const { name, unit, quantity, reorderLevel } = req.body;

    if (!name || !unit || quantity === undefined || reorderLevel === undefined) {
      return res.status(400).json({
        message: "name, unit, quantity and reorderLevel are required"
      });
    }

    const item = await Inventory.create({
      name,
      unit,
      quantity,
      reorderLevel
    });

    res.status(201).json(item);
  } catch (error) {
    next(error);
  }
});

router.patch("/:id", authenticate, requireStaff, async (req, res, next) => {
  try {
    const item = await Inventory.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!item) {
      return res.status(404).json({ message: "Inventory item not found" });
    }

    res.json(item);
  } catch (error) {
    next(error);
  }
});

router.patch("/:id/adjust", authenticate, requireStaff, async (req, res, next) => {
  try {
    const { amount } = req.body;

    if (!Number.isFinite(Number(amount))) {
      return res.status(400).json({ message: "amount must be a number" });
    }

    const item = await Inventory.findById(req.params.id);

    if (!item) {
      return res.status(404).json({ message: "Inventory item not found" });
    }

    const newQuantity = item.quantity + Number(amount);

    if (newQuantity < 0) {
      return res.status(400).json({
        message: "Inventory quantity cannot be negative"
      });
    }

    item.quantity = newQuantity;
    await item.save();

    res.json(item);
  } catch (error) {
    next(error);
  }
});

module.exports = router;