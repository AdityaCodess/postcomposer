const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const sendEmailOTP = async (email, otpCode) => {
  const htmlTemplate = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
    </head>
    <body style="background-color: #0A0A0A; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 40px 20px;">
      <div style="max-width: 500px; margin: 0 auto; background-color: #111111; border: 1px solid #27272a; border-radius: 12px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.5);">
        
        <!-- Header -->
        <div style="background-color: #151515; padding: 24px; text-align: center; border-bottom: 1px solid #27272a;">
          <!-- IMPORTANT: Replace this src with your actual hosted Postifye logo URL (e.g., Imgur, Cloudinary, AWS S3) -->
          <img src="https://ik.imagekit.io/adityabhallacorp/postifye.png?updatedAt=1787593133300/150x40/151515/ffffff?text=POSTIFYE" alt="Postifye Logo" style="height: 28px; width: auto; display: block; margin: 0 auto;" />
        </div>

        <!-- Body -->
        <div style="padding: 32px 24px; text-align: center;">
          <h2 style="color: #f4f4f5; font-size: 22px; font-weight: 600; margin-top: 0; margin-bottom: 12px;">Verification Code</h2>
          <p style="color: #a1a1aa; font-size: 15px; margin-bottom: 32px; line-height: 1.6;">
            Please use the verification code below to complete your request. This code will expire in <strong>15 minutes</strong>.
          </p>
          
          <div style="background-color: #0A0A0A; border: 1px solid #27272a; border-radius: 8px; padding: 20px; margin-bottom: 32px;">
            <span style="font-family: 'Courier New', Courier, monospace; font-size: 36px; font-weight: bold; letter-spacing: 12px; color: #818cf8; margin-left: 12px;">${otpCode}</span>
          </div>
          
          <p style="color: #71717a; font-size: 13px; margin: 0;">
            If you didn't request this code, you can safely ignore this email.
          </p>
        </div>

        <!-- Footer -->
        <div style="background-color: #0A0A0A; padding: 20px; text-align: center; border-top: 1px solid #27272a;">
          <p style="color: #52525b; font-size: 12px; margin: 0;">
            &copy; ${new Date().getFullYear()} Postifye. All rights reserved.
          </p>
        </div>

      </div>
    </body>
    </html>
  `;

  const mailOptions = {

    from: '"Postifye" <' + process.env.EMAIL_USER + '>', 
    to: email,
    subject: 'Your Postifye Verification Code',
    html: htmlTemplate,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('OTP Email sent successfully to:', email);
  } catch (error) {
    console.error('Error sending OTP email:', error);
    throw new Error('Failed to send OTP email');
  }
};

module.exports = { sendEmailOTP };