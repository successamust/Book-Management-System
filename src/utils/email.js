import nodemailer from 'nodemailer';

const sendEmail = async (options) => {
  // 1) Create transporter (Gmail example)
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USERNAME,
      pass: process.env.EMAIL_PASSWORD
    }
  });

  // 2) Email options
  const mailOptions = {
    from: 'BookMgr <noreply@bookmgr.com>',
    to: options.email,
    subject: options.subject,
    text: options.message
  };

  // 3) Send email
  await transporter.sendMail(mailOptions);
};

export default sendEmail;