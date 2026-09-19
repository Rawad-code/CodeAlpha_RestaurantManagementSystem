const express = require("express");
const Reservation = require("../models/Reservation");
const Table = require("../models/Table");
const { authenticate, requireStaff } = require("../middleware/auth");

const router = express.Router();

router.post("/", authenticate, async (req, res, next) => {
  try {
    const { tableId, date, guests } = req.body;

    if (!tableId || !date || !guests) {
      return res.status(400).json({
        message: "tableId, date and guests are required"
      });
    }

    const reservationDate = new Date(date);

    if (Number.isNaN(reservationDate.getTime()) || reservationDate <= new Date()) {
      return res.status(400).json({
        message: "Reservation date must be a valid future date"
      });
    }

    const table = await Table.findById(tableId);

    if (!table) {
      return res.status(404).json({ message: "Table not found" });
    }

    if (guests > table.seats) {
      return res.status(400).json({
        message: `Table only supports ${table.seats} guests`
      });
    }

    const windowEnd = new Date(reservationDate.getTime() + 2 * 60 * 60 * 1000);

    const conflicting = await Reservation.findOne({
      table: table._id,
      status: "confirmed",
      date: { $gte: new Date(reservationDate.getTime() - 2 * 60 * 60 * 1000), $lt: windowEnd }
    });

    if (conflicting) {
      return res.status(409).json({
        message: "Table is not available for the requested time"
      });
    }

    const reservation = await Reservation.create({
      customer: req.user._id,
      table: table._id,
      date: reservationDate,
      guests
    });

    table.status = "reserved";
    await table.save();

    const populated = await reservation.populate([
      { path: "customer", select: "name email" },
      { path: "table", select: "tableNumber seats status" }
    ]);

    res.status(201).json({
      message: "Table reserved successfully",
      reservation: populated
    });
  } catch (error) {
    next(error);
  }
});

router.get("/my", authenticate, async (req, res, next) => {
  try {
    const reservations = await Reservation.find({
      customer: req.user._id
    })
      .populate("table")
      .sort({ date: 1 });

    res.json(reservations);
  } catch (error) {
    next(error);
  }
});

router.get("/", authenticate, requireStaff, async (req, res, next) => {
  try {
    const reservations = await Reservation.find()
      .populate("customer", "name email")
      .populate("table")
      .sort({ date: 1 });

    res.json(reservations);
  } catch (error) {
    next(error);
  }
});

router.delete("/:id", authenticate, async (req, res, next) => {
  try {
    const reservation = await Reservation.findOne({
      _id: req.params.id,
      customer: req.user._id
    });

    if (!reservation) {
      return res.status(404).json({ message: "Reservation not found" });
    }

    reservation.status = "cancelled";
    await reservation.save();

    await Table.findByIdAndUpdate(reservation.table, {
      status: "available"
    });

    res.json({ message: "Reservation cancelled successfully" });
  } catch (error) {
    next(error);
  }
});

module.exports = router;