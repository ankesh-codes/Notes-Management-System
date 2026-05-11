const Note = require('../models/note.model');
const { createNoteSchema, updateNoteSchema } = require('../schemas/notes.schema');

exports.createNote = async (req, res) => {
  try {
    
    const result = createNoteSchema.safeParse(req.body)
    if(!result.success) {
      return res.status(400).json({ 
        errors: result.error.flatten().fieldErrors
      });
    }

    const { title, content } = result.data;

    const note  = await Note.create({
      title,
      content,
      user: req.user._id
    });

    res.status(201).json(note);

  } catch (error) {
    console.log(`Notes Creating Error ${error}`);
    res.status(500).json({ msg: "Server Error" });
  }
};

exports.readOneNote = async (req, res) => {
  try {
    const note = await Note.findOne({
      _id: req.params.id,
      user: req.user._id
    });
    
    if(!note) {
      return res.status(404).json({ msg: "Note Not Found" });
    };

    res.json(note);

  } catch (error) {
    console.log(`ReadOneNote Error ${error}`);
    res.json({ msg: "Server Error" });
  }
}

exports.readAllNote = async (req, res) => {
  try {
    const note = await Note.find({
      user: req.user._id
    }).sort({ createdAt: -1 });

    res.status(200).json({ note });

  } catch (error) {
    console.log(`ReadAllNote Error ${error}`);
    res.status(500).json({ msg: "Server Error" });
  };
}

exports.updateNote = async (req, res) => {
  try {

    const result = updateNoteSchema.safeParse(req.body);
    
    if(!result.success) {
      return res.status(400).json({
        errors: result.error.flatten().fieldErrors
      });
    }

    const { title, content } = result.data;

    const note = await Note.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      { title, content },
      { new: true }
    );

    if(!note) {
      return res.json({ msg: "Note Not found" });
    }
    res.status(200).json(note);

  } catch (error) {
    console.log(`UpdateNote Error ${error}`);
    res.status(500).json({ msg: "Server Error" });
  }
}

exports.deleteNote = async (req, res) => {
  try {
    const note = await Note.findOneAndDelete({
      _id: req.params.id, 
      user: req.user._id
    });

    if(!note) {
      return res.status(404).json({ msg: "Note not found" });
    }

    res.status(200).json({ msg: "Note deleted" });
    
  } catch (error) {
    console.log(`ReadAllNote Error ${error}`);
    res.status(500).json({ msg: "Server Error" });
  }
}