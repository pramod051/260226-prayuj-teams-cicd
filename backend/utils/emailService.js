const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Verify SMTP on startup
transporter.verify((error, success) => {
  if (error) {
    console.error('❌ Email service error:', error);
  } else {
    console.log('✅ Email service ready');
  }
});

const sendVerificationOTP = async (email, otp) => {
  try {
    console.log(`📧 Attempting to send OTP to: ${email}`);

    const mailOptions = {
      from: `"Prayuj Teams" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Verify Your Email - Prayuj Teams',
      html: `
        <h2>Welcome to Prayuj Teams!</h2>
        <p>Your verification code is:</p>
        <div style="background-color:#f5f5f5;padding:20px;text-align:center;margin:20px 0">
          <h1 style="color:#4CAF50;font-size:36px;letter-spacing:5px;margin:0">${otp}</h1>
        </div>
        <p>This code will expire in 10 minutes.</p>
        <p>If you didn't request this code, please ignore this email.</p>
      `
    };

    const result = await transporter.sendMail(mailOptions);
    console.log('✅ OTP sent successfully:', result.messageId);
    return result;
  } catch (error) {
    console.error('❌ OTP sending failed:', error);
    throw error;
  }
};

module.exports = { sendVerificationOTP };
