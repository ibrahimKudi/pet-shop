const express = require('express');
const path = require('path');
const expressLayouts = require('express-ejs-layouts');
const session = require('express-session');
const horses = require('./data/horses');

const app = express();
const PORT = process.env.PORT || 3000;

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

// Home page - Featured Horses
app.get('/', (req, res) => {
  const featuredHorses = horses.slice(0, 3); // Only first 3 horses
  res.render('index', { horses: featuredHorses });
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

// Handle Inquiry Form Submission
app.post('/submit-details', (req, res) => {
  const { name, email, phone, city, state, contact, horseId, horseName, horseFee } = req.body;

  // Store inquiry details in session or an array for admin review
  const inquiryData = {
    name,
    email,
    phone,
    city,
    state,
    contact,
    horseId,
    horseName,
    horseFee
  };

  // Save to session or an array
  req.session.inquiryDetails = inquiryData;

  // Redirect to payment page
  res.redirect(`/payment/${horseId}`);
});

// Payment Page
app.get('/payment/:id', (req, res) => {
  const horseId = parseInt(req.params.id);
  const horse = horses.find(h => h.id === horseId);
  const inquiryDetails = req.session.inquiryDetails; // Retrieve inquiry data from session

  if (!horse) {
    return res.status(404).send('Horse not found');
  }

  // Render payment page with horse details and inquiry data
  res.render('payment', { horse, inquiryDetails });
});

// Payment Confirmation (After Payment Selection)
app.post('/payment-confirmation/:id', (req, res) => {
  const horseId = parseInt(req.params.id);
  const paymentMethod = req.body['payment-method']; // Get selected payment method from form
  const inquiryDetails = req.session.inquiryDetails; // Retrieve inquiry data

  if (!paymentMethod) {
    return res.status(400).send('Payment method is required');
  }

  // Save the payment method and inquiry details to session or a database
  req.session.paymentDetails = { paymentMethod, inquiryDetails };

  // Store payment details and user inquiry for admin panel
  const userRequests = req.session.userRequests || [];
  userRequests.push({ ...inquiryDetails, paymentMethod });

  // Save updated user requests back to session
  req.session.userRequests = userRequests;

  // Redirect to thank you page
  res.redirect('/thankyou');
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
