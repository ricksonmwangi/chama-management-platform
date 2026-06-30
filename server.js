const express = require("express");
const cors = require("cors");
const helmet = require("helmet");

require("dotenv").config();
require("./config/db");

const memberRoutes = require("./routes/members");
const authRoutes = require("./routes/auth");
const contributionRoutes = require("./routes/contributions");
const loanRoutes = require("./routes/loans");
const repaymentRoutes = require("./routes/repayments");
const dashboardRoutes = require("./routes/dashboard");
const meetingRoutes = require("./routes/meetings");
const auditRoutes = require("./routes/audit");
const mpesaRoutes = require("./routes/mpesa");

const app = express();

/*
|--------------------------------------------------------------------------
| Security Middleware
|--------------------------------------------------------------------------
*/

app.use(helmet());

const corsOptions = process.env.CLIENT_URL
    ? { origin: process.env.CLIENT_URL }
    : {};

app.use(cors(corsOptions));

app.use(express.json());

/*
|--------------------------------------------------------------------------
| Home Route
|--------------------------------------------------------------------------
*/

app.get("/", (req, res) => {
    res.send("Chama API Running");
});

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
*/

app.use("/auth", authRoutes);
app.use("/members", memberRoutes);
app.use("/contributions", contributionRoutes);
app.use("/loans", loanRoutes);
app.use("/repayments", repaymentRoutes);
app.use("/dashboard", dashboardRoutes);
app.use("/meetings", meetingRoutes);
app.use("/audit", auditRoutes);
app.use("/mpesa", mpesaRoutes);

/*
|--------------------------------------------------------------------------
| Error Handler
|--------------------------------------------------------------------------
*/

app.use((err, req, res, next) => {
    console.error(err);

    res.status(err.status || 500).json({
        message: err.message || "Internal Server Error"
    });
});

/*
|--------------------------------------------------------------------------
| 404 Handler
|--------------------------------------------------------------------------
*/

app.use((req, res) => {
    res.status(404).json({
        message: "Route not found"
    });
});

/*
|--------------------------------------------------------------------------
| Start Server
|--------------------------------------------------------------------------
*/

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});