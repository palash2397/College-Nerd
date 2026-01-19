import express from "express";
import morgan from "morgan";
import cors from "cors";
import "dotenv/config.js";

import { connectDB } from "./DB/config.js";

import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 4001;

connectDB();

import { stripeWebhookHandle } from "./controllers/payment/payment.controller.js";
app.use(
  "/api/v1/payment/webhook",
  express.raw({ type: "application/json" }),
  stripeWebhookHandle,
);

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));
app.use(morgan("dev"));
app.use(
  cors({
    origin: "*",
    credentials: true,
  }),
);
app.use("/api/v1", express.static("public"));

import rootRouter from "./routes/root.routes.js";
app.use("/api/v1", rootRouter);

// Routes
app.get("/api", (req, res) => {
  res.send("Welcome to College Nerd");
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
