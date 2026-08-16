const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const path = require('path');
const http = require('http');
const url = require('url');
const MongoClient = require('mongodb').MongoClient;

const app = express();
const PORT = process.env.PORT || 3000;
const MONGODB_URI = 'mongodb+srv://idhar01:bearniles7@cluster0.m9zr1ap.mongodb.net/?retryWrites=true&w=majority';

app.use(express.static('public'));

mongoose.connect(MONGODB_URI);
const db = mongoose.connection;

const loginSchema = new mongoose.Schema({
  username: String,
  password: String,
  highScore: {
    type: Number,
    default: 0,
  },
});

const Login = mongoose.model('logins', loginSchema);

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Login route
app.get('/login', (req, res) => {
  res.sendFile(__dirname, 'public', '/login.html');
});

app.post('/login', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).send('Username and password are required.');
  }

  try {
    const user = await Login.findOne({ username, password }).exec();

    if (user) {
      // Redirect to spusic.html on successful login
      return res.redirect('/spusic.html');
    } else {
      res.status(401).send('Invalid username or password.');
    }
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
});

// Registration route
app.get('/register', (req, res) => {
  res.sendFile(__dirname, 'public', '/register.html');
});

app.post('/register', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).send('Username and password are required.');
  }

  try {
    const existingUser = await Login.findOne({ username }).exec();
    if (existingUser) {
      return res.status(409).send('Username already exists. Please choose another one.');
    }

    const newUser = new Login({ username, password });
    await newUser.save();

    res.send(`Account created successfully for ${username}!`);
    return res.redirect('/login.html');
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
});

// Serve static files from the 'public' folder
app.use(express.static('public'));

// Route for the main page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

// Route for serving spusic.js
app.get('/spusic', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'spusic.html'));
});

// Route for serving index.js
app.get('/index.js', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.js'));
});

// Route for serving style.css
app.get('/style.css', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'style.css'));
});


app.post('/submitScore', async (req, res) => {
        const username = req.body.username; // Assuming username is sent with the request
        const score = parseInt(req.body.score, 10);
      
        console.log("We are in the post");
        console.log(`Here is the current score ${score}`);
      
        // Validate username and score
        if (!username || isNaN(score)) {
          res.status(400).json({ error: 'Invalid data format' });
          return;
        }
      
        console.log("We passed validation");
      
        try {
          // Connect to MongoDB and save the score
          const client = await MongoClient.connect(MONGODB_URI);
          console.log("Connected to MongoDB");
      
          const dbo = client.db('test');
          const collection = dbo.collection('logins');
      
          // Find the existing user
          const existingUser = await collection.findOne({ username });
          console.log(score);
      
          if (!existingUser || score > parseInt(existingUser.highScore, 10)) {
            // Update the score for the logged-in user only if the new score is higher
            const result = await collection.updateOne(
              { username: username },
              { $set: { highScore: score } },
              { upsert: true } // Create a new document if the username doesn't exist
            );
      
            console.log('Score saved successfully');
            res.status(200).json({ message: 'Score saved successfully' });
          } else {
            console.log('New score is not higher. Score not updated.');
            res.status(200).json({ message: 'Score not updated. New score is not higher.' });
          }
      
          // Close the MongoDB connection
          client.close();
        } catch (error) {
          console.error('Error connecting to the database or saving score:', error);
          res.status(500).json({ error: 'Internal Server Error' });
        }
      });

      app.get('/getTopScores', async (req, res) => {
        let client;  // Declare the client variable outside the try block
    
        try {
            client = await MongoClient.connect(MONGODB_URI);
            const dbo = client.db('test');
            const collection = dbo.collection('logins');
            console.log("Connected");
    
            // Find the top 10 scores, sorted in descending order
            const result = await collection.find().sort({ highScore: -1 }).limit(10).toArray();
            console.log('MongoDB Query Result:', result);
            // Extract relevant data for response
            const topScores = result.map(({ username, highScore }) => ({ username, highScore }));
    
            console.log('Top Scores:', topScores);
    
            res.status(200).json({ topScores });
        } catch (error) {
            console.error('Error connecting to the database or getting top scores:', error);
            res.status(500).json({ error: 'Internal Server Error' });
        } finally {
            if (client) {
                client.close();  // Close the client in the finally block
            }
        }
    });
    
      
      

// Route for getting the highest score
app.get('/getHighScore', async (req, res) => {
  try {
    const client = await MongoClient.connect(MONGODB_URI);
    const dbo = client.db('test');
    const collection = dbo.collection('logins');

    // Find the document with the highest score
    const result = await collection.find().sort({ highScore: -1 }).limit(1).toArray();
        console.log(result);
    if (result.length > 0) {
      const highScore = result[0].highScore;
      res.status(200).json({ username, highScore });
    } else {
      res.status(404).json({ error: 'No high score found' });
    }

    client.close();
  } catch (error) {
    console.error('Error connecting to the database or getting high score:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});
      

// Start the server
app.listen(PORT, () => {
  console.log(`Server is listening on http://localhost:${PORT}`);
});
