import nodemailer from "nodemailer";

// Create reusable transporter
const createTransporter = () => {
  // For development, you can use Gmail or other SMTP services
  // For production, use proper SMTP configuration
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: parseInt(process.env.SMTP_PORT || "587"),
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER || process.env.EMAIL_USER,
      pass: process.env.SMTP_PASS || process.env.EMAIL_PASSWORD,
    },
  });
};

export async function sendOTPEmail(
  email: string,
  otp: string,
  type: "admin" | "user" = "user"
): Promise<boolean> {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: process.env.EMAIL_FROM || process.env.SMTP_USER || "noreply@reclaimadmin.com",
      to: email,
      subject: "Password Reset OTP - ReclaimAdmin",
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Password Reset OTP</title>
          </head>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
              <h1 style="color: white; margin: 0;">Password Reset Request</h1>
            </div>
            <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
              <p style="font-size: 16px; margin-bottom: 20px;">Hello,</p>
              <p style="font-size: 16px; margin-bottom: 20px;">
                You have requested to reset your password for your ${type === "admin" ? "admin" : "user"} account.
              </p>
              <p style="font-size: 16px; margin-bottom: 30px;">
                Please use the following OTP (One-Time Password) to verify your identity:
              </p>
              <div style="background: white; border: 2px dashed #667eea; border-radius: 8px; padding: 20px; text-align: center; margin: 30px 0;">
                <h2 style="color: #667eea; font-size: 32px; letter-spacing: 8px; margin: 0; font-weight: bold;">${otp}</h2>
              </div>
              <p style="font-size: 14px; color: #666; margin-bottom: 10px;">
                <strong>This OTP will expire in 10 minutes.</strong>
              </p>
              <p style="font-size: 14px; color: #666; margin-bottom: 20px;">
                If you did not request this password reset, please ignore this email.
              </p>
              <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
              <p style="font-size: 12px; color: #999; text-align: center; margin: 0;">
                This is an automated email. Please do not reply to this message.
              </p>
            </div>
          </body>
        </html>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("OTP Email sent:", info.messageId);
    return true;
  } catch (error) {
    console.error("Error sending OTP email:", error);
    return false;
  }
}

