exports.loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ msg: "Email and password required" });
    }

    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      return res.status(401).json({ msg: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({ msg: "Invalid credentials" });
    }

    res.status(200).json({
      msg: "Login successful",
      user: {
        id: user._id,
        name: user.name,
        email: user.email
      }
    });

  } catch (error) {
    console.error("Login error", error);
    res.status(500).json({ msg: "Server error" });
  }
};



JWT CORE (token creation only)

Now JWT enters.

Install
npm install jsonwebtoken

Add env
JWT_SECRET=supersecretkey
JWT_EXPIRES_IN=7d

Create utility (industry style)

utils/generateToken.js

const jwt = require('jsonwebtoken');

const generateToken = (userId) => {
  return jwt.sign(
    { id: userId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN }
  );
};

module.exports = generateToken;

STEP 3 — Attach JWT to login

Modify login controller:

const generateToken = require('../utils/generateToken');


Inside success response:

const token = generateToken(user._id);

res.status(200).json({
  msg: "Login successful",
  token,
  user: {
    id: user._id,
    name: user.name,
    email: user.email
  }
});


Now you understand:

JWT stores user id only

Password never inside token

Client stores token

STEP 4 — AUTH MIDDLEWARE (MOST IMPORTANT PART)

This is where most people fail.

Create middleware

middlewares/auth.middleware.js

const jwt = require('jsonwebtoken');
const User = require('../models/user.model');

exports.protect = async (req, res, next) => {
  let token;
/*
Ye line token VALID hai ya nahi check nahi karti.
Sirf token present hai ya nahi check karti hai.
/*
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ msg: "Not authorized" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET); //👉 Server check karta hai:
// token original hai ya fake
// token expire to nahi
// secret match karta hai ya nahi
//✔️ Sahi hua → decoded milta hai
// ❌ Galat → seedha catch

    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(401).json({ msg: "User not found" });
    }

    req.user = user;
    next();

  } catch (error) {
    return res.status(401).json({ msg: "Token invalid" });
  }
};


🔥 This file decides who can access your system.

STEP 5 — Protect Notes routes

routes/note.routes.js

const { protect } = require('../middlewares/auth.middleware');

NoteRoute.post('/', protect, NoteController.createNote);
NoteRoute.get('/', protect, NoteController.readAllNote);
NoteRoute.get('/:id', protect, NoteController.readOneNote);
NoteRoute.put('/:id', protect, NoteController.updateNote);
NoteRoute.delete('/:id', protect, NoteController.deleteNote);


Now req.user works.
Your earlier bug is fixed naturally.

STEP 6 — Fix your note controllers (mandatory)

Replace ALL:

user: user._id


With:

user: req.user._id


If you miss this → runtime crash.




==============================================

auth.middleware.js
1️⃣ JWT aur User import karte hain
✔️ YES — middleware ko token verify karna hai + DB se user nikalna hai

2️⃣ protect function route ko protect karta hai
✔️ YES — gatekeeper function

3️⃣ Client se req.headers.authorization aata hai
✔️ YES — header client/Postman bhejta hai

4️⃣ Format Bearer <token> hota hai
✔️ YES — standard format

5️⃣ Space se split karte hain
✔️ YES

6️⃣ Index [0] = Bearer, `[1] = token
✔️ YES — bilkul correct

7️⃣ Token empty ho to Not authorized
✔️ YES

8️⃣ jwt.verify(token, secret) se verify hota hai
✔️ YES — client token + server secret match hote hain
Client ke paas SECRET hota hi nahi

Client sirf token bhejta hai

Server ke paas SECRET hota hai

jwt.verify() check karta hai:

Token isi SECRET se bana tha ya nahi

Token change to nahi hua

Token expire to nahi hua.



const user = await User.findById(decoded.id);
Yeh check isliye hai kyunki:

User delete ho chuka ho sakta hai

Token purana ho sakta hai

Token valid ho, but user invalid

🔥 Token valid ≠ user valid

Isliye DB check zaroori hai.


----

Try-catch kyu?

...

 try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(401).json({ msg: "User not found" });
    }

    req.user = user;
    next();

  } catch (error) {
    return res.status(401).json({ msg: "Token invalid" });
  }
};

Reason:

jwt.verify() error throw karta hai agar:

Token fake ho

Token expire ho

Token change ho

Aur error aaye to server crash na ho, isliye try–catch.

📌 req.user = user KYU?

req.user._id
req.user.email


Auth dobara check karne ki zarurat nahi.

🔁 PERFECT ONE-LINE FLOW (WRITE THIS)

Client token bhejta hai → middleware header se token nikalta hai → jwt.verify karta hai → userId nikalta hai → DB me user check karta hai → req.user set karta hai → next()

🔴 Pehle ek simple sawal

Middleware ka kaam kya hota hai?

👉 Controller se pehle chalna
👉 Decision lena: allow kare ya block

Agar allow karna hai → next()
Agar block → res.status(...).json(...)

AB CONFUSION WALI LINE
req.user = user;
next();


Isko 2 parts me samjho.

PART 1️⃣ — req.user = user;
Ye kya kar raha hai?

👉 Request ke andar user data chipka raha hai

Ya simple words me:

“Is request ke sath ye user attached hai”

user kya hai?
const user = await User.findById(decoded.id);


Matlab DB se nikla hua real user object.

Example:

user = {
  _id: "65fa...",
  name: "Ankesh",
  email: "ankesh@gmail.com"
}

req kya hai?

req = current request object

Is request ke sath tum extra data jod sakte ho.

So:

req.user = user;


Matlab:

req = {
  headers: {...},
  body: {...},
  user: { Ankesh ka data }
}


🔥 Ab ye user poori request lifetime me available hai.

PART 2️⃣ — next();
Ye kya karta hai?

👉 Express ko bolta hai:

“Middleware ka kaam khatam, ab next function chalao”

Next function kaun sa?

Example:

router.post('/note', protect, createNote);


Flow:

protect middleware chala

Sab OK mila

next() call hua

createNote controller chala

Agar next() nahi likha:
❌ Request yahin atak jaayegi
❌ Controller kabhi nahi chalega

🔁 DONO LINE SAATH ME KYU?
req.user = user;
next();


Meaning:

“User verified hai, user ko request me attach karo, ab controller ko allow karo”

CONTROLLER ME USE (REAL MAGIC)
exports.createNote = async (req, res) => {
  console.log(req.user._id);
}


Tumhein:

Token dobara verify nahi karna

User dobara find nahi karna

Sab ready hai 🔥

VERY SIMPLE ANALOGY 🪪

Middleware = Security guard

req.user = user = Visitor ko badge de diya

next() = Gate open

Controller bolta hai:

“Badge dikhao” → req.user

ONE LINE FOR ROUGH BOOK

req.user = user request ko batata hai kaun user hai, next() controller ko chalne deta hai

FINAL MENTOR CHECK

Agar main poochu:

❓ next() hata do to kya hoga?

Answer:
❌ Request freeze
❌ Controller nahi chalega


auth.middleware hai na isme sabse phle jwt, User jo imporat karte hai then route protect karne ke liye function create karte hai protect karke and then usme hm client se req mangte hai ki req.headers.authorization && token lete hai split karke wo Bearer <Token> aisa rhta hai to space se split karte hai and then for geting the token we indexing call karenge by 1 becuase 0 is Bearer hai and at 1 is token so then affter that we store the token in our empty token variable and then first we cehck is it empty not there token so we send not authozition else is the token is there so we verify using jwt.verify(token ye jo client se mila hai wo, aur ye wo hoga jo server pe scerate code hai to dono ko verify karega ki ye token isse bana hai ya nhi and ye code server pe hota hai) then uske baad hm user ko database me check karenge ki wo hai ki nhi hai tothik hai nhi to not user found nhi to req.user = user; fir next(); ye thoda nhi ssamjha Ab kuch galt hu to btao. vese mujhe ye nhi samjha tha bs code dekhke bol diya aisa kuch hoga try { const decoded = jwt.verify(token, process.env.JWT_SECRET); const user = await User.findById(decoded.id); if (!user) { return res.status(401).json({ msg: "User not found" }); } req.user = user; next(); }.




//// ============= ////

Why this exists in real companies
What problem it solves
How it's structured
How to implement clean
Common mistakes
How interviewer thinks about it
------------------------------------
