const express = require("express");
const MenuItem = require("../models/MenuItem");
const { authenticate, requireStaff } = require("../middleware/auth");

const router = express.Router();

router.get("/", async (req, res, next) => {
  try {
    const filter = req.query.category
      ? { category: req.query.category }
      : {};

    const items = await MenuItem.find(filter).sort({ category: 1, name: 1 });
    res.json(items);
  } catch (error) {
    next(error);
  }
});

router.post("/", authenticate, requireStaff, async (req, res, next) => {
  try {
    const { name, description, category, price, available } = req.body;

    if (!name || !category || price === undefined) {
      return res.status(400).json({
        message: "Name, category and price are required"
      });
    }

    const item = await MenuItem.create({
      name,
      description,
      category,
      price,
      available
    });

    res.status(201).json(item);
  } catch (error) {
    next(error);
  }
});

router.put("/:id", authenticate, requireStaff, async (req, res, next) => {
  try {
    const item = await MenuItem.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!item) {
      return res.status(404).json({ message: "Menu item not found" });
    }

    res.json(item);
  } catch (error) {
    next(error);
  }
});

router.delete("/:id", authenticate, requireStaff, async (req, res, next) => {
  try {
    const item = await MenuItem.findByIdAndDelete(req.params.id);

    if (!item) {
      return res.status(404).json({ message: "Menu item not found" });
    }

    res.json({ message: "Menu item deleted successfully" });
  } catch (error) {
    next(error);
  }
});

module.exports = router;