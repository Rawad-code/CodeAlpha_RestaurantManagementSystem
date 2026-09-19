const express = require("express");
const Order = require("../models/Order");
const MenuItem = require("../models/MenuItem");
const { authenticate, requireStaff } = require("../middleware/auth");

const router = express.Router();

router.post("/", authenticate, async (req, res, next) => {
  try {
    const { items, table } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: "At least one order item is required" });
    }

    const itemIds = items.map((item) => item.menuItem);
    const menuItems = await MenuItem.find({
      _id: { $in: itemIds },
      available: true
    });

    if (menuItems.length !== itemIds.length) {
      return res.status(400).json({
        message: "One or more menu items are unavailable or invalid"
      });
    }

    const itemMap = new Map(
      menuItems.map((item) => [item._id.toString(), item])
    );

    let total = 0;

    const orderItems = items.map((item) => {
      const menuItem = itemMap.get(item.menuItem.toString());
      const quantity = Number(item.quantity);

      if (!Number.isInteger(quantity) || quantity < 1) {
        throw new Error("Each quantity must be a positive integer");
      }

      total += menuItem.price * quantity;

      return {
        menuItem: menuItem._id,
        quantity,
        price: menuItem.price
      };
    });

    const order = await Order.create({
      customer: req.user._id,
      table,
      items: orderItems,
      total: Number(total.toFixed(2))
    });

    const populated = await order.populate([
      { path: "customer", select: "name email" },
      { path: "table", select: "tableNumber" },
      { path: "items.menuItem", select: "name category" }
    ]);

    res.status(201).json({
      message: "Order placed successfully",
      order: populated
    });
  } catch (error) {
    next(error);
  }
});

router.get("/my", authenticate, async (req, res, next) => {
  try {
    const orders = await Order.find({ customer: req.user._id })
      .populate("table", "tableNumber")
      .populate("items.menuItem", "name category")
      .sort({ createdAt: -1 });

    res.json(orders);
  } catch (error) {
    next(error);
  }
});

router.get("/", authenticate, requireStaff, async (req, res, next) => {
  try {
    const orders = await Order.find()
      .populate("customer", "name email")
      .populate("table", "tableNumber")
      .populate("items.menuItem", "name category")
      .sort({ createdAt: -1 });

    res.json(orders);
  } catch (error) {
    next(error);
  }
});

router.patch("/:id/status", authenticate, requireStaff, async (req, res, next) => {
  try {
    const allowed = ["pending", "preparing", "ready", "served", "cancelled"];
    const { status } = req.body;

    if (!allowed.includes(status)) {
      return res.status(400).json({ message: "Invalid order status" });
    }

    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true }
    );

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    res.json(order);
  } catch (error) {
    next(error);
  }
});

module.exports = router;