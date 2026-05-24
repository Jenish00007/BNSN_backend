const axios = require('axios');

const BREVO_EMAIL_URL = 'https://api.brevo.com/v3/smtp/email';

const sendEmail = async (to, subject, html) => {
  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) {
    throw new Error('BREVO_API_KEY is not set in environment variables');
  }

  const response = await axios.post(
    BREVO_EMAIL_URL,
    {
      sender: {
        name: process.env.BREVO_EMAIL_SENDER_NAME || '7ARK',
        email: process.env.FROM_MAIL_ID
      },
      to: [{ email: to }],
      subject,
      htmlContent: html
    },
    {
      headers: {
        'api-key': apiKey,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    }
  );

  console.log('Email sent via Brevo:', response.data.messageId);
  return response.data;
};

module.exports = sendEmail;
