const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config()
const bodyParser = require("body-parser");

app.use(cors())
app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});


app.use(bodyParser.urlencoded({ extended: false }));

const mongoose = require('mongoose');
const Schema = mongoose.Schema;
mongoose.connect(process.env.MONGO_URI);


const userSchema = new Schema({
  username: { type: String, required: true }
});

const User = mongoose.model("User", userSchema);

app.get('/api/users', async (req, res) => {
  const users = await User.find({}, "username _id");
  res.send(users);
});

app.post('/api/users', async (req, res) => {
  console.log(`Creating ${req.body.username}`);
  const user = await User.create({username: req.body.username});

  if (!user) {
    return res.status(400).send('User not created');
  }

  res.json({
    username: user.username,
    _id: user._id
  });
});


const exerciseSchema = new Schema({
  username: { type: String, required: true },
  description: { type: String, required: true },
  duration: { type: Number, required: true },
  date: { type: Number, required: true }
});

const Exercise = mongoose.model("Exercise", exerciseSchema);

app.post('/api/users/:id/exercises', async (req, res) => {
  let date = Date.parse(req.body.date);
  if (isNaN(date)) {
    date = Date.now();
  }

  const user = await User.findById(req.params.id, "username _id");

  const exercise = await Exercise.create({
    username: user.username,
    description: req.body.description,
    duration: req.body.duration,
    date: date,
  })

  res.json({
    username: user.username,
    description: exercise.description,
    duration: exercise.duration,
    date: new Date(exercise.date).toDateString(),
    _id: user._id
  });
});


app.get('/api/users/:_id/logs', async (req, res) => {
  const user = await User.findById(req.params._id);
  if (!user) {
    return res.status(400).send('User not found');
  }

  let query = Exercise.find({ username: user.username });
  if (req.params.from) {
    query = query.where('date').gte(new Date(req.params.from));
  }
  if (req.params.to) {
    query = query.where('date').lte(new Date(req.params.to));
  }
  if (req.params.limit) {
    query = query.limit(parseInt(req.params.limit));
  }

  const results = await query.sort('-date').exec();

  let exercises = [];
  for (let exercise of results) {
    exercises.push({
      description: exercise.description,
      duration: exercise.duration,
      date: new Date(exercise.date).toDateString()
    });
  }

  res.json({
    username: user.username,
    count: exercises.length,
    _id: user._id,
    log: exercises
  });
});



const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
