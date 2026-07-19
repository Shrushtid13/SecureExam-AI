const Joi = require('joi');

const validate = (schema) => {
  return (req, res, next) => {
    // Validate req.body, req.query, and req.params based on schema keys
    const validations = ['body', 'query', 'params'].map(key => {
      if (schema[key]) {
        const { error } = schema[key].validate(req[key], { abortEarly: false });
        if (error) {
          return error.details.map(detail => detail.message);
        }
      }
      return null;
    });

    const errors = validations.flat().filter(e => e !== null);

    if (errors.length > 0) {
      return res.status(400).json({ error: 'Validation failed', details: errors });
    }

    next();
  };
};

module.exports = validate;
