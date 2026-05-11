const { z } = require('zod');

const createNoteSchema = z.object({
  title: z.string().trim().min(1, "Title must be at least 3 characters").optional(),
  content: z.string().min(1, "Title must be at least 1 characters").optional()
}).refine(
  (data) => data.title || data.content, 
  {
    msg: "Title or content required",
  }
);
const updateNoteSchema = z.object({
  title: z.string().trim().min(1, "Title must be at least 3 characters").optional(),
  content: z.string().min(1, "Title must be at least 1 characters").optional()
}).refine(
  (data) => Object.keys(data).length > 0, 
  {
    msg: "At least one field must be provided for update"
  }
);
// We use Object.keys(data).length > 0 to ensure the client actually sent at least one field in the request body, preventing empty update requests.
module.exports = { createNoteSchema, updateNoteSchema };