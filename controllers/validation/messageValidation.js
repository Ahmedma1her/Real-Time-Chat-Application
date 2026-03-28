const joi = require("joi");

// Validate the payload before creating a message.
const sendMessageSchema = joi.object({
  receiverId: joi.string().required().messages({
    'string.empty': 'Receiver ID is required',
    'any.required': 'Receiver ID is required'
  }),
  
  content: joi.string().min(1).max(1000).required().messages({
    'string.empty': 'Message content cannot be empty',
    'string.min': 'Message content cannot be empty',
    'string.max': 'Message content cannot exceed 1000 characters',
    'any.required': 'Message content is required'
  })
});

module.exports = { sendMessageSchema };
