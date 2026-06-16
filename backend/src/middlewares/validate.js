const ApiError = require('../core/ApiError');

const pickSource = (req, source) => {
  if (source === 'query') return req.query;
  if (source === 'params') return req.params;
  return req.body;
};

const getValue = (payload, path) => {
  return path.split('.').reduce((acc, key) => {
    if (acc && Object.prototype.hasOwnProperty.call(acc, key)) {
      return acc[key];
    }
    return undefined;
  }, payload);
};

const validate =
  (fields = [], { source = 'body', allowPartial = false } = {}) =>
  (req, _res, next) => {
    const payload = pickSource(req, source);
    if (!payload || typeof payload !== 'object') {
      return next(new ApiError(400, `Invalid ${source} payload`));
    }

    const missing = [];
    fields.forEach((field) => {
      const value = getValue(payload, field);
      if (allowPartial && typeof value === 'undefined') {
        return;
      }
      if (
        typeof value === 'undefined' ||
        value === null ||
        (typeof value === 'string' && value.trim() === '')
      ) {
        missing.push(field);
      }
    });

    if (missing.length) {
      return next(
        new ApiError(400, `Missing or invalid fields: ${missing.join(', ')}`)
      );
    }

    return next();
  };

module.exports = validate;

