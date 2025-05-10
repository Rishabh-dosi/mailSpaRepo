const express = require("express");
const nodemailer = require("nodemailer");
const smtpTransport = require("nodemailer-smtp-transport");

const app = express();
const port = 4100;

app.use(express.json())

const fromAddress = "info1@spadurban.co.za";
const emailPassword = "Sp@durban!";

// Utility function to create a transporter
function createTransporter(user, pass) {
    return nodemailer.createTransport(
        smtpTransport({
            host: "smtp.office365.com",
            port: 587,
            secure: false, // TLS
            pool: true,
            auth: {
                user: user,
                pass: pass,
            },
            tls: { ciphers: "SSLv3" },
        })
    );
}
app.use("/api", function (req, res) {
    res.send("HELLO WORLD");
})
// Endpoint to test email
async function fn() {
    const transporter = createTransporter(fromAddress, emailPassword);

    const mailOptions = {
        from: fromAddress,
        to: "bluewebspark@gmail.com", // 🔁 Change to your email
        subject: "SMTP Test Email",
        html: "<h3>This is a test email sent using Office365 SMTP and Node.js</h3>",
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log("✅ Email sent:", info);
    } catch (error) {
        console.error("❌ Failed to send email:", error);
    }
};
const emailRoutes = require("./routes/mailServiceRoute");
app.use("/api/email", emailRoutes);
app.listen(port, () => {
    console.log(`🚀 Email test app listening at http://localhost:${port}`);
});
