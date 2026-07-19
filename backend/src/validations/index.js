const Joi = require('joi');

const registerSchema = {
  body: Joi.object({
    name: Joi.string().required().min(2).max(100),
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
    role: Joi.string().valid('student', 'teacher', 'admin').default('student'),
  }),
};

const loginSchema = {
  body: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required(),
  }),
};

const createExamSchema = {
  body: Joi.object({
    title: Joi.string().required().min(3).max(255),
    description: Joi.string().allow('', null).optional(),
    durationMinutes: Joi.number().integer().min(1).max(300).required(),
    startTime: Joi.date().iso().required(),
    endTime: Joi.date().iso().greater(Joi.ref('startTime')).required(),
  }),
};

const autosaveSchema = {
  body: Joi.object({
    answers: Joi.object().pattern(Joi.number().integer(), Joi.any()).required(),
  }),
};

const submitExamSchema = {
  body: Joi.object({
    answers: Joi.object().pattern(Joi.number().integer(), Joi.any()).required(),
  }),
};

const forgotPasswordSchema = {
  body: Joi.object({
    email: Joi.string().email().required(),
  }),
};

const resetPasswordSchema = {
  body: Joi.object({
    token: Joi.string().required(),
    newPassword: Joi.string().min(6).required(),
  }),
};

module.exports = {
  registerSchema,
  loginSchema,
  createExamSchema,
  autosaveSchema,
  submitExamSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
};
