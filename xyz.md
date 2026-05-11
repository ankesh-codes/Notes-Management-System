const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB Connected");
  } catch (error) {
    console.log(`MongoDB Failed to Connect ${error}`);
    process.exit(1);  
  }
};

module.exports = connectDB;


======
const Note = require('../models/note.model');

exports.createNote = async (req, res) => {
  try {
    const { title, content } = req.body;

    if( !title && !content ) {
      return res.status(400).json({ msg: "Title or content is required" });
    }

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
    res.json({ msg: "Server Error" });
  };
}

exports.updateNote = async (req, res) => {
  try {
    const { title, content } = req.body;
    if( !title && !content ) {
      return res.status(404).json({ msg: "Nothing to Update" });
    };

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

    res.status(200).json({ msg: "Note deleted" });
    
  } catch (error) {
    console.log(`ReadAllNote Error ${error}`);
    res.status(500).json({ msg: "Server Error" });
  }
}
=======
const User = require('../models/user.model');
const bcrypt = require('bcrypt');
const generateToken = require('../utils/generaterToken');
const registerSchema = require('../schemas/user.schema');

exports.createUser = async (req, res) => {
  try {
    const result = registerSchema.safeParse(req.body);

    if (!result.success) {
      return res.status(400).json({
        errors: result.error.issues.map(err => err.message)
      });
    }

    const { name, email, password } = result.data;

    const existUser = await User.findOne({ email });
    if (existUser) {
      return res.status(409).json({ msg: "Email already registered" });
    };

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await User.create({
      name,
      email,
      password: hashedPassword
    });

    res.status(201).json({ msg: "User is created" });

  } catch (error) {
    console.error("User not created", error);
    res.status(500).json({ msg: "Server error" });
  }
};

exports.loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ msg: "Email and password required" });
    }

    const user = await User.findOne({ email }).select("+password");

    if (!user) {
      return res.status(401).json({ msg: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({ msg: "Wrong password or Invalid credentials" });
    }

    const token = generateToken(user._id);

    res.status(200).json({
      msg: "Login Successfull",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email
      }
    });

  } catch (error) {
    console.log(`Login User Error ${error}`);
    res.status(500).json("Server Error");
  }
}
==============
const jwt = require('jsonwebtoken');
const User = require('../models/user.model');

exports.protect = async (req, res, next) => {
  let token;

  if(
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  if(!token) {
    return res.status(401).json({ msg: "Not authorized" });
  }

  try {
    const decode = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decode.id);

    if(!user) {
      return res.status(401).json({ msg: "User not found" });
    }

    req.user = user;
    next();

  } catch (error) {
    return res.status(401).json({ msg: "Token Invalid" });
  };
};
===============
const mongoose = require('mongoose');

const noteSchema = new mongoose.Schema({
  title: {
    type: String,
    trim: true
  },
  content: {
    type: String,
  },
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  }
}, { timestamps: true });

module.exports = mongoose.model("Note", noteSchema);
=============
const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    lowercase: true,
    unique: true
  },
  password: {
    type: String,
    required: true,
    select: false
  }
}, { timestamps: true });

module.exports = mongoose.model('User', UserSchema);
=============
const express = require('express');
const NoteRoute = express.Router();
const NoteController = require('../controllers/note.controller');
const { protect } = require('../middlewares/auth.middleare.js');

NoteRoute.post('/', protect, NoteController.createNote);
NoteRoute.get('/:id', protect, NoteController.readOneNote);
NoteRoute.get('/', protect, NoteController.readAllNote);
NoteRoute.put('/:id', protect, NoteController.updateNote);
NoteRoute.delete('/:id', protect, NoteController.deleteNote);


module.exports = NoteRoute;
=============
const express = require('express');
const UserRouter = express.Router();
const UserController = require('../controllers/user.controller');


UserRouter.post('/register', UserController.createUser);
UserRouter.post('/login', UserController.loginUser);


module.exports = UserRouter;
================
const { z } = require('zod');

const registerSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters"),
  email: z.string().email("Invalid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

module.exports = registerSchema;
===============
const jwt = require('jsonwebtoken');

const generateToken = (userId) => {
  return jwt.sign(
    { id: userId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN }
  );
}

module.exports = generateToken;
==============
PORT = 1502
JWT_SECRET = `~leo@leo~`
JWT_EXPIRES_IN = 7d
MONGO_URI = mongodb://127.0.0.1:27017/Note0_2
=========
// app.js = factory setup
const path = require('path');
const express = require('express');

const app = express();
const NoteRoute = require('./routers/note.routes');
const UserRouter = require('./routers/user.routes');
const { errorHandler } = require('./middlewares/error.middleware');

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.urlencoded({ extended: false })); // body.req
app.use(express.json());

app.use('/note', NoteRoute);
app.use('/user', UserRouter);

app.use(errorHandler);
app.use((req, res) => {
  res.status(404).render('404');
});

module.exports = app;
===========
// server.js = engine start
require('dotenv').config();

const app = require('./app');
const connectDB = require('./config/db');

connectDB();

if (!process.env.MONGO_URI || !process.env.JWT_SECRET) {
  console.error("Missing ENV variables");
  process.exit(1);
}

app.listen(() => {
    console.log(`Your Server is running`);
});
===============
