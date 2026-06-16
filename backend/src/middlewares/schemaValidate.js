const { ZodError } = require('zod');
const ApiError = require('../core/ApiError');

const pickSource = (req, source) => {
  if (source === 'query') return req.query;
  if (source === 'params') return req.params;
  return req.body;
};

const assignSource = (req, source, value) => {
  if (source === 'query') req.query = value;
  else if (source === 'params') req.params = value;
  else req.body = value;
};

const schemaValidate = (schema, { source = 'body' } = {}) => (req, _res, next) => {
  try {
    const parsed = schema.parse(pickSource(req, source));
    assignSource(req, source, parsed);
    next();
  } catch (error) {
    if (error instanceof ZodError) {
      return next(new ApiError(
        400,
        'Validation failed',
        error.issues.map((issue) => ({
          path: issue.path.join('.'),
          message: issue.message,
          code: issue.code,
        })),
        'VALIDATION_ERROR'
      ));
    }
    return next(error);
  }
};

module.exports = schemaValidate;
