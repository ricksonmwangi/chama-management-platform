require("dotenv").config();

const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const rateLimit = require("express-rate-limit");

require("./config/db"); // establishes the pool + fails fast if DB is unreachable

const authRoutes = require("./routes/auth");
const memberRoutes = require("./routes/members");
const contributionRoutes = require("./routes/contributions");
const loanRoutes = require("./routes/loans");
const repaymentRoutes = require("./routes/repayments");
const dashboardRoutes = require("./routes/dashboard");
const meetingRoutes = require("./routes/meetings");
const auditRoutes = require("./routes/audit");
const mpesaRoutes = require("./routes/mpesa");
const settingsRoutes = require("./routes/settings");

const app = express();

app.use(helmet());

const corsOptions = process.env.CLIENT_URL
    ? { origin: process.env.CLIENT_URL }
    : {};
app.use(cors(corsOptions));

app.use(express.json());

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 300,
    standardHeaders: true,
    legacyHeaders: false
});
app.use(limiter);

app.get("/", (req, res) => {
    res.json({ message: "Genje Group API is running." });
});

app.use("/auth", authRoutes);
app.use("/members", memberRoutes);
app.use("/contributions", contributionRoutes);
app.use("/loans", loanRoutes);
app.use("/repayments", repaymentRoutes);
app.use("/dashboard", dashboardRoutes);
app.use("/meetings", meetingRoutes);
app.use("/audit", auditRoutes);
app.use("/mpesa", mpesaRoutes);
app.use("/settings", settingsRoutes);

// Central error handler (for errors passed via next(err))
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: "Internal server error." });
});

// 404 fallback
app.use((req, res) => {
    res.status(404).json({ message: "Route not found." });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || "development"}`);
    console.log(`M-Pesa environment: ${process.env.MPESA_ENV === "production" ? "production" : "sandbox"}`);
    console.log(`M-Pesa callback URL configured as: ${process.env.MPESA_CALLBACK_URL || "(not set!)"}`);
});
