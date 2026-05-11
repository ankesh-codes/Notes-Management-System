// app.js = factory setup
const path = require('path');
const express = require('express');
// 
const app = express();
const NoteRoute = require('./routers/note.routes');
const UserRouter = require('./routers/user.routes');
const { errorHandler } = require('./middlewares/error.middleware');
const { safeDecode } = require('zod/mini');

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.urlencoded({ extended: false })); // body.req
app.use(express.json());

app.use('/note', NoteRoute);
app.use('/user', UserRouter);
safeD

app.use(errorHandler);
app.use((req, res) => {
  res.status(404).render('404');
});

module.exports = app;