const nodemailer = require("nodemailer");
const smtpTransport = require("nodemailer-smtp-transport");

const fromAddress = "info1@spadurban.co.za";
const emailPassword = "Sp@durban!";

function createTransporter(user, pass) {
    return nodemailer.createTransport(
        smtpTransport({
            host: "smtp.office365.com",
            port: 587,
            secure: false,
            pool: true,
            auth: {
                user,
                pass,
            },
            tls: { ciphers: "SSLv3" },
        })
    );
}

exports.sendTestEmail = async (req, res) => {
    const { mailOptions } = req.body;

    const transporter = createTransporter(fromAddress, emailPassword);

    try {
        const info = await transporter.sendMail(mailOptions);
        return res.status(200).json({ message: "Email sent successfully", info });
    } catch (error) {
        console.error("Email sending failed:", error);
        return res.status(500).json({ error: "Failed to send email", details: error });
    }
};
