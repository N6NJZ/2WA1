// Load environment variables from .env file
import dotenv from 'dotenv';
import { Resend } from 'resend';
import express from 'express';
import cors from 'cors';
const app = express();
const port = process.env.PORT || 10000;

// Allow EVERYONE. If this fixes it, we know your FRONTEND_URL variable was slightly wrong (e.g. missing 'www' or 'https').
app.use(cors({
  origin: '*',
  methods: ['POST', 'GET', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));


// 3. BODY PARSER WITH ERROR HANDLING
// If the JSON is bad, this is usually where it crashes silently.
app.use(express.json({ limit: '10mb' }), (err, req, res, next) => {
  if (err) {
    console.error('[CRITICAL FAIL] JSON Parsing Error:', err.message);
    return res.status(400).send('Invalid JSON format');
  }
  next();
});

app.use(express.urlencoded({ extended: true }));

// === EMAIL CONFIGURATION ===
const EMAIL_USER = process.env.EMAIL_USER;
const EMAIL_PASS = process.env.EMAIL_PASS;
const DESTINATION_EMAIL = process.env.DESTINATION_EMAIL;
const RESEND_API_KEY = process.env.RESEND_API_KEY;

// Check if critical environment variables are set
if (!EMAIL_USER || !EMAIL_PASS || !DESTINATION_EMAIL || !RESEND_API_KEY) {
  console.error('FATAL ERROR: Email environment variables are not set.');
  console.error('Please set EMAIL_USER, EMAIL_PASS, RESEND_API_KEY, and DESTINATION_EMAIL.');
  // Don't start the server if config is missing
  // process.exit(1); 
  // Note: Render might restart this. Logging is key.
}

// Create a reusable transporter object using Nodemailer
// This example uses Gmail. You MUST use an "App Password" for this.
// See: https://support.google.com/accounts/answer/185833
console.log('creating transporter');



// === API ENDPOINT ===
// This is the endpoint your HTML form will send data to
app.post('/send-ppr-form', async (req, res) => {
  console.log('Received PPR form submission');

  const data = req.body;

  if (!data || Object.keys(data).length === 0) {
    console.error('Received empty body');
    return res.status(400).json({ message: "No data received" });
  }

  // Create a simple HTML body for the email
  let htmlBody = '<h1>New PPR Form Submission</h1>';
  htmlBody += '<table border="1" cellpadding="5" cellspacing="0">';
  for (const key in data) {
    htmlBody += `<tr><td><strong>${key}</strong></td><td>${Array.isArray(data[key]) ? data[key].join(', ') : data[key]}</td></tr>`;
  }
  htmlBody += '</table>';

  // Email options
  const mailOptions = {
    from: `"DPA Website Form" <${EMAIL_USER}>`, // Sender address
    to: DESTINATION_EMAIL, // List of receivers
    subject: `New PPR Submission: ${data['Pilot First Name']} ${data['Pilot Last Name']}`, // Subject line
    html: htmlBody, // HTML body
  };

  // Send the email
  const resend = new Resend(process.env.RESEND_API_KEY);

  const response = await resend.emails.send({
    from: process.env.EMAIL_USER || 'dave@rv-7.com',
    to: 'dave@rv-7.com',
    subject: 'Hello World',
    html: '<p>Congrats on sending your <strong>first email</strong>!</p>'
  });

  console.log('Response: ', response);
});

// Health check endpoint (optional, but good for Render)
app.get('/health', (req, res) => {
  res.status(200).send('OK');
});

app.listen(port, '0.0.0.0', () => {
  console.log(`Backend server listening on port ${port}`);
});
