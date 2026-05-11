const User = require('../models/user.model');
const bcrypt = require('bcrypt');
const generateToken = require('../utils/generaterToken');
const { registerSchema, loginSchema } = require('../schemas/user.schema');

exports.createUser = async (req, res) => {
  try {
    
    const result = registerSchema.safeParse(req.body);

    if (!result.success) {
      return res.status(400).json({
        errors: result.error.flatten().fieldErrors
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
    // const { email, password } = req.body;

    const result = loginSchema.safeParse(req.body);

    if (!result.success) {
      return res.status(400).json({ 
        errors: result.error.flatten().fieldErrors
       });
    }

    const { email, password } = result.data;

    const user = await User.findOne({ email }).select("+password");

    if (!user) {
      return res.status(401).json({ msg: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({ msg: "Invalid credentials" });
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
    res.status(500).json({ msg: "Server Error" });
  }
}