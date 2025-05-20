const express = require('express');
const path = require('path');
const expressLayouts = require('express-ejs-layouts');
const session = require('express-session');
const horses = require('./data/horses');
const bodyParser = require('body-parser');
const twilio = require('twilio');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(bodyParser.urlencoded({ extended: true }));

// Twilio Credentials
const accountSid = 'AC86475cad9ad17f819ab3135c9ef1b131';
const authToken = '50857304909458125314ca27014ceec6';
const client = new twilio(accountSid, authToken);

// Your Twilio Sandbox WhatsApp number
const FROM_WHATSAPP_NUMBER = 'whatsapp:+14155238886';
// Your verified WhatsApp number
const TO_WHATSAPP_NUMBER = 'whatsapp:+2348073669696'; // <-- Your WhatsApp

app.post('/thankyou', (req, res) => {
  const {
    name,
    email,
    phone,
    city,
    state,
    contact,
    horseName,
    horseFee
  } = req.body;

  const messageBody = `🐎 New Adoption Request:
- Name: ${name}
- Email: ${email}
- Phone: ${phone}
- City/State: ${city}, ${state}
- Contact Method: ${contact}
- Horse: ${horseName}
- Fee: ${horseFee}`;

  client.messages
    .create({
      from: FROM_WHATSAPP_NUMBER,
      to: TO_WHATSAPP_NUMBER,
      body: messageBody
    })
    .then(() => {
      res.redirect('/thankyou-success'); // redirect after success
    })
    .catch(error => {
      console.error('Twilio error:', error);
      res.send('Something went wrong.');
    });
});

// Success Thank You Page
app.get('/thankyou-success', (req, res) => {
  res.render('thankyou'); // Make sure views/thankyou.ejs exists
});





app.get('/', (req, res) => {
  res.render('index', { horses });
  });

// Set EJS as the view engine and use layouts
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middleware
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: false }));

// Session Middleware
app.use(session({
  secret: 'your-secret-key', // A secret string for session signing
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false } // Set to true if using https
}));

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

// Thank You Page
app.get('/thankyou', (req, res) => {
  res.render('thankyou', { 
    message: 'Thanks for reaching out! We will be in touch shortly.' 
  });
});


// Adoption 101 Page
app.get('/adoption101', (req, res) => {
  res.render('adoption101');
});

app.get('/contact', (req, res) => {
  res.render('contact');
});

app.post('/contact', async(req, res)=> {
  try{
    const {name, email, message} = req.body
    const newContact = req.session.newContact || []
    newContact.push({name, email, message})
    req.session.newContact = newContact
    console.log(req.session.newContact)
    res.redirect('/thankyou')
  }catch(error){
    console.log(error)
  }
})
// Admin Panel to view user requests
app.get('/kudi', (req, res) => {
  const userRequests = req.session.userRequests || [];
  const userContact = req.session.newContact || []
  res.render('admin', { userRequests, userContact });
});

// Delete user request from admin panel
app.post('/delete-inquiry/:index', (req, res) => {
  const index = parseInt(req.params.index); // Get the index of the request to delete
  const userRequests = req.session.userRequests || [];

  // Check if index is valid
  if (index >= 0 && index < userRequests.length) {
    // Remove the inquiry from the userRequests array
    userRequests.splice(index, 1);
    req.session.userRequests = userRequests; // Save the updated list
  }

  // Redirect back to the admin panel
  res.redirect('/kudi');
});





// Start the server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});