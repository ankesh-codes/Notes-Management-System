const express = require('express');
const NoteRoute = express.Router();
const NoteController = require('../controllers/note.controller');
const { protect } = require('../middlewares/auth.middleware');

NoteRoute.post('/', protect, NoteController.createNote);
NoteRoute.get('/:id', protect, NoteController.readOneNote);
NoteRoute.get('/', protect, NoteController.readAllNote);
NoteRoute.put('/:id', protect, NoteController.updateNote);
NoteRoute.delete('/:id', protect, NoteController.deleteNote);


module.exports = NoteRoute;