const express = require("express");
const Table = require("../models/Table");
const Reservation = require("../models/Reservation");
const { authenticate, requireStaff } = require("../middleware/auth");

const router = express.Router();

router.get("/", async (req, res, next) => {
  try {
    const tables = await Table.find().sort({ tableNumber: 1 });
    res.json(tables);
  } catch (error) {
    next(error);
  }
});

router.get("/availability", async (req, res, next) => {
  try {
    const { date } = req.query;

    if (!date) {
      return res.status(400).json({ message: "date is required" });
    }

    const start = new Date(date);

    if (Number.isNaN(start.getTime())) {
      return res.status(400).json({ message: "Invalid date" });
    }

    const end = new Date(start.getTime() + 2 * 60 * 60 * 1000);

    const reservations = await Reservation.find({
      date: { $gte: start, $lt: end },
      status: "confirmed"
    }).select("table");

    const reservedIds = reservations.map((r) => r.table.toString());

    const tables = await Table.find({
      _id: { $nin: reservedIds },
      status: { $ne: "occupied" }
    }).sort({ tableNumber: 1 });

    res.json(tables);
  } catch (error) {
    next(error);
  }
});

router.post("/", authenticate, requireStaff, async (req, res, next) => {
  try {
    const { tableNumber, seats } = req.body;

    if (!tableNumber || !seats) {
      return res.status(400).json({
        message: "tableNumber and seats are required"
      });
    }

    const table = await Table.create({ tableNumber, seats });
    res.status(201).json(table);
  } catch (error) {
    next(error);
  }
});

router.patch("/:id/status", authenticate, requireStaff, async (req, res, next) => {
  try {
    const { status } = req.body;

    if (!["available", "reserved", "occupied"].includes(status)) {
      return res.status(400).json({ message: "Invalid table status" });
    }

    const table = await Table.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true }
    );

    if (!table) {
      return res.status(404).json({ message: "Table not found" });
    }

    res.json(table);
  } catch (error) {
    next(error);
  }
});

module.exports = router;