// Load environment variables from .env file
require( 'dotenv' ).config();

const express = require( 'express' );
const nodemailer = require( 'nodemailer' );
const cors = require( 'cors' );

const app = express();
const port = process.env.PORT || 3001;

// === MIDDLEWARE ===
// Enable CORS (Cross-Origin Resource Sharing)
// This allows your static site (on a different domain) to talk to this API
app.use( cors() );
// Parse JSON request bodies
app.use( express.json() );
app.use( express.urlencoded( { extended: true } ) );

// === EMAIL CONFIGURATION ===
// Get email credentials from Environment Variables
const EMAIL_USER = process.env.EMAIL_USER;
const EMAIL_PASS = process.env.EMAIL_PASS;
const DESTINATION_EMAIL = process.env.DESTINATION_EMAIL;

// Check if critical environment variables are set
if ( !EMAIL_USER || !EMAIL_PASS || !DESTINATION_EMAIL ) {
  console.error( 'FATAL ERROR: Email environment variables are not set.' );
  console.error( 'Please set EMAIL_USER, EMAIL_PASS, and DESTINATION_EMAIL.' );
  // Don't start the server if config is missing
  // process.exit(1); 
  // Note: Render might restart this. Logging is key.
}

// Create a reusable transporter object using Nodemailer
// This example uses Gmail. You MUST use an "App Password" for this.
// See: https://support.google.com/accounts/answer/185833
const transporter = nodemailer.createTransport( {
  service: 'gmail', // Or your email provider (e.g., 'hotmail', 'yahoo')
  auth: {
    user: EMAIL_USER, // Your full email address
    pass: EMAIL_PASS, // Your "App Password"
  },
} );

// === API ENDPOINT ===
// This is the endpoint your HTML form will send data to
app.post( '/send-ppr-form', ( req, res ) => {
  console.log( 'Received PPR form submission' );

  // Check for missing config on-request
  if ( !EMAIL_USER || !EMAIL_PASS || !DESTINATION_EMAIL ) {
    console.error( 'Email configuration is missing.' );
    return res.status( 500 ).json( { message: 'Server configuration error.' } );
  }

  const data = req.body;

  // Create a simple HTML body for the email
  let htmlBody = '<h1>New PPR Form Submission</h1>';
  htmlBody += '<table border="1" cellpadding="5" cellspacing="0">';
  for ( const key in data ) {
    htmlBody += `<tr><td><strong>${ key }</strong></td><td>${ Array.isArray( data[ key ] ) ? data[ key ].join( ', ' ) : data[ key ] }</td></tr>`;
  }
  htmlBody += '</table>';

  // Email options
  const mailOptions = {
    from: `"DPA Website Form" <${ EMAIL_USER }>`, // Sender address
    to: DESTINATION_EMAIL, // List of receivers
    subject: `New PPR Submission: ${ data[ 'Pilot First Name' ] } ${ data[ 'Pilot Last Name' ] }`, // Subject line
    html: htmlBody, // HTML body
  };

  // Send the email
  transporter.sendMail( mailOptions, ( error, info ) => {
    if ( error ) {
      console.error( 'Error sending email:', error );
      return res.status( 500 ).json( { message: 'Error sending email.' } );
    }
    console.log( 'Email sent:', info.response );
    res.status( 200 ).json( { message: 'Email sent successfully.' } );
  } );
} );

// Health check endpoint (optional, but good for Render)
app.get( '/health', ( req, res ) => {
  res.status( 200 ).send( 'OK' );
} );

// Start the server
app.listen( port, () => {
  console.log( `Backend server listening on port ${ port }` );
} );
