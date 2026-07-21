const nodemailer = require('nodemailer');

let testAccount = null;
let transporter = null;

async function initMailer() {
  if (transporter) return; // already initialized
  
  if (process.env.SMTP_HOST) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT || 587,
      secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  } else {
    // Fallback to Ethereal Email for testing if no SMTP config is provided
    try {
      testAccount = await nodemailer.createTestAccount();
      transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false, // true for 465, false for other ports
        auth: {
          user: testAccount.user, // generated ethereal user
          pass: testAccount.pass, // generated ethereal password
        },
      });
      console.log('No SMTP config found. Falling back to Ethereal Email for testing.');
    } catch (err) {
      console.error('Failed to create Ethereal Email account:', err);
    }
  }
}

async function sendMail(options) {
  await initMailer();
  if (!transporter) {
    console.error('Mailer is not initialized. Falling back to console log for email:', options);
    return;
  }
  
  try {
    const info = await transporter.sendMail({
      from: '"SecureExam AI" <noreply@secureexam.ai>',
      ...options,
    });
    
    // If using Ethereal, log the preview URL
    let previewUrl = null;
    if (testAccount) {
      previewUrl = nodemailer.getTestMessageUrl(info);
      console.log('Preview URL: %s', previewUrl);
    }
    return { info, previewUrl };
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
}

module.exports = {
  sendMail
};
