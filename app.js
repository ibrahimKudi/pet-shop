const express = require('express');
const path = require('path');
const expressLayouts = require('express-ejs-layouts');
const session = require('express-session');
const horses = require('./data/horses');
const bodyParser = require('body-parser');
const twilio = require('twilio');

const app = express();
const PORT = process.env.PORT || 2000;

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: false }));

// Set EJS as the view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Session Middleware
app.use(session({
  secret: 'your-secret-key',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false }
}));

// Twilio Setup
const accountSid = 'AC86475cad9ad17f819ab3135c9ef1b131';
const authToken = '50857304909458125314ca27014ceec6';
const client = new twilio(accountSid, authToken);
const FROM_WHATSAPP_NUMBER = 'whatsapp:+14155238886';
const TO_WHATSAPP_NUMBER = 'whatsapp:+2348073669696';

// Homepage
app.get('/', (req, res) => {
  res.render('index', { horses });
});

// All Horses Page
app.get('/horses', (req, res) => {
  res.render('horses', { horses });
});

// Horse Details Page
app.get('/horses/:id', (req, res) => {
  const horseId = parseInt(req.params.id);
  const horse = horses.find(h => h.id === horseId);

  if (!horse) {
    return res.status(404).send('Horse not found');
  }

  res.render('horse', { horse });
});

// Inquire Page
app.get('/inquire/:id', (req, res) => {
  const horseId = parseInt(req.params.id);
  const horse = horses.find(h => h.id === horseId);

  if (!horse) {
    return res.status(404).send('Horse not found');
  }

  res.render('inquire', { horse });
});

// Contact Page
app.get('/contact', (req, res) => {
  res.render('contact');  
});

app.post('/contact', (req, res) => {
  const { name, email, message } = req.body;
  const newContact = req.session.newContact || [];
  newContact.push({ name, email, message });
  req.session.newContact = newContact;
  res.redirect('/thankyou');
});

// Adoption 101 Page
app.get('/adoption101', (req, res) => {
  res.render('adoption101');
});

// Thank You Page
app.get('/thankyou', (req, res) => {
  res.render('thankyou');
});

// Adoption Submission
app.post('/thankyou', (req, res) => {
  const {
    name,
    email,
    phone,
    city,
    state,
    contact,
    payment,
    horseName,
    horseFee
  } = req.body;
12
  const messageBody = `🐎 New Adoption Request:
- Name: ${name}
- Email: ${email}
- Phone: ${phone}
- City/State: ${city}, ${state}
- Contact Method: ${contact}
- Payment Method: ${payment}
- Horse: ${horseName}
- Fee: ${horseFee}`;

  // Store request in session
  const userRequests = req.session.userRequests || [];
  userRequests.push({
    name,
    email,
    phone,
    city,
    state,
    contact,
    paymentMethod: payment,
    horseName,
    horseFee
  });
  req.session.userRequests = userRequests;

  // Send WhatsApp Notification
  client.messages
    .create({
      from: FROM_WHATSAPP_NUMBER,
      to: TO_WHATSAPP_NUMBER,
      body: messageBody
    })
    .then(() => res.redirect('/thankyou'))
    .catch(error => {
      console.error('Twilio error:', error);
      res.send('Something went wrong.');
    });
});

// Admin Panel
app.get('/kudi', (req, res) => {
  const userRequests = req.session.userRequests || [];
  const userContact = req.session.newContact || [];
  res.render('admin', { userRequests, userContact });
});

// Delete inquiry from admin panel
app.post('/delete-inquiry/:index', (req, res) => {
  const index = parseInt(req.params.index);
  const userRequests = req.session.userRequests || [];

  if (index >= 0 && index < userRequests.length) {
    userRequests.splice(index, 1);
    req.session.userRequests = userRequests;
  }

  res.redirect('/kudi');
});

// Start Server
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
