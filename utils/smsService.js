const axios = require('axios');

const BREVO_API_URL = 'https://api.brevo.com/v3/transactionalSMS/sms';

/**
 * Send an SMS via Brevo Transactional SMS API.
 * @param {string} phoneNumber - Recipient number (10-digit Indian number or with country code)
 * @param {string} message - SMS content
 */
const sendSMS = async (phoneNumber, message) => {
  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) {
    throw new Error('BREVO_API_KEY is not set in environment variables');
  }

  // Ensure number is in international format (+91 for India)
  const recipient = phoneNumber.startsWith('+')
    ? phoneNumber
    : `+91${phoneNumber.replace(/^0+/, '')}`;

  const response = await axios.post(
    BREVO_API_URL,
    {
      sender: process.env.BREVO_SMS_SENDER || 'BSNS',
      recipient,
      content: message,
      type: 'transactional'
    },
    {
      headers: {
        'api-key': apiKey,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    }
  );

  return response.data;
};

module.exports = { sendSMS };
