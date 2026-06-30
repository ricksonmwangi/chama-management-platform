const express = require("express");
const cors = require("cors");

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

app.use(cors());
app.use(express.json());


app.get("/", (req, res) => {
    res.send("Chama API Running");
});

app.use("/members", memberRoutes);
app.use("/auth", authRoutes);
app.use("/contributions",
    contributionRoutes
);
app.use("/loans", loanRoutes); 
app.use(
    "/repayments",
    repaymentRoutes
);  
app.use(
    "/dashboard",
    dashboardRoutes
);
app.use(
    "/meetings",
    meetingRoutes
);
app.use(
    "/audit",
    auditRoutes
);
app.use(
    "/mpesa",
    mpesaRoutes
);

app.use((req, res) => {
    res.status(404).json({
        message: "Route not found"
    });
});

app.listen(process.env.PORT, () => {
    console.log(`Server running on port ${process.env.PORT}`);
});