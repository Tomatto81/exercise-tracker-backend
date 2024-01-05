const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config()
const mongoose = require('mongoose')
const { Schema } = mongoose

mongoose.connect(process.env.DB_URL)

const userSchema = new Schema({
  username: String,
})

const userModel = mongoose.model('user', userSchema)

const exerciseSchema = new Schema({
  user_id: {type: String, required: true},
  description: String,
  duration: Number,
  date: Date,
})

const ExerModel = mongoose.model('exercise', exerciseSchema)

app.use(cors())
app.use(express.urlencoded({extended: true}))
app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

app.get('/api/users', async (req, res) => {
  const users = await userModel.find({}).select('username _id')
  if (!users) {
    res.json({error: 'No users found'})
  } else {
    res.json(users)
  }
})

app.post('/api/users', async (req, res) => {
  console.log(req.body)
  const userObj = new userModel({
    username: req.body.username,
  })

  try {
    const savedUser = await userObj.save()
    console.log(savedUser)
    res.json(savedUser)
  } catch (err) {
    console.log(err)
  }
})

app.post('/api/users/:_id/exercises', async (req, res) => {
  const id = req.params._id
  const {description, duration, date} = req.body

  try {
    const user = await userModel.findById(id)
    if (!user) {
      res.json({error: 'user not found'})
    } else {
      const exerciseObj = new ExerModel({
        user_id: id,
        description,
        duration,
        date: date ? new Date(date) : new Date(),
      })
      const savedExercise = await exerciseObj.save()
      res.json({
        _id: id,
        username: user.username,
        description: savedExercise.description,
        duration: savedExercise.duration,
        date: savedExercise.date.toDateString(),
      })
    }
  }
  catch (err) {
    console.log(err)
    res.send('Error')
  }
})

app.get('/api/users/:_id/logs', async (req, res) => {
  const { from, to, limit } = req.query
  const id = req.params._id
  const user = await userModel.findById(id)
  if (!user) {
    res.json({error: 'user not found'})
    return
  }
  let dateObj = {}
  if (from) {
    dateObj['$gte'] = new Date(from)
  }
  if (to) {
    dateObj['$lte'] = new Date(to)
  }
  let filter = {
    user_id: id,
  }
  if (from || to) {
    filter.date = dateObj
  }

  const exercises = await ExerModel.find(filter).limit(+limit ?? 500)
  res.json({
    username: user.username,
    count: exercises.length,
    _id: id,
    log: exercises.map(e => ({
      description: e.description,
      duration: e.duration,
      date: e.date.toDateString(),
    }))
  })
})

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
