const express = require('express');
const path = require('path');
const axios = require('axios');

const app = express();
const port = 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static files
app.use(express.static(path.join(__dirname, 'public')));

// Serve HTML views
app.get('/ielts', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'ielts.html'));
});

app.get('/sat', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'sat.html'));
});

app.get('/gre', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'gre.html'));
});

// Handle essay submission to Django backend
app.post('/send-essay', async (req, res) => {
  const { essay, test_type, prompt } = req.body;

  try {
    const response = await axios.post('http://127.0.0.1:8000/hello/receive_essay', {
      essay,
      test_type,
      prompt
    }, {
      headers: { 'Content-Type': 'application/json' }
    });

    res.json({ evaluation: response.data.evaluation });

  } catch (error) {
    console.error("Error sending essay to Django:", error.message);
    res.status(500).json({ error: 'Failed to send essay to Django' });
  }
});

// NEW: Handle prompt fetching from Django backend
app.get('/generate_prompt', async (req, res) => {
  const { test_type } = req.query;

  try {
    const response = await axios.get('http://127.0.0.1:8000/hello/generate_prompt?test_type=${test_type}');
    res.json(response.data);
  } catch (error) {
    console.error("Error fetching prompt from Django:", error.message);
    res.status(500).json({ error: 'Failed to fetch prompt from Django' });
  }
});

app.listen(port, () => {
  console.log(`EvaluateHub frontend is running at http://localhost:${port}`);
});
