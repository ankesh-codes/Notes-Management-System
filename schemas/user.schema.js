const { z } = require('zod');

const registerSchema = z.object({
  name: z.string({ required_error: "Name is required" })
          .trim().min(3, "Name must be at least 3 characters"),
  email: z.string().trim().email("Invalid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const loginSchema = z.object({
  email: z.string({ required_error: "email is required" })
          .trim()
          .email("Invalid email")
  ,
  password: z.string({ required_error: "Password is required" })
              .min(6, "Password must be at least 6 characters"),
});

module.exports = { registerSchema, loginSchema };

// z.object() is a Zod function used to define a schema for an object with specific key-value validation rules.