const express = require('express');
const router = express.Router();

// Home page
router.get('/', (req, res) => {
  res.render('index', { title: 'Home Page' });
});

// About page
router.get('/horse', (req, res) => {
  res.render('horse', { title: 'Available horses' });
});

// Contact page
router.get('/contact', (req, res) => {
  res.render('contact', { title: 'Contact Us' });
});

router.post('/contact', (req, res) => {
    const { name, email, message } = req.body;
  
    // For now, just log the data
    console.log('Contact Form Submitted:', { name, email, message });
  
    // Send success message or redirect
    res.send('Thank you for contacting us!');
  });
  


module.exports = router;
