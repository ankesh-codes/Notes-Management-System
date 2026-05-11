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