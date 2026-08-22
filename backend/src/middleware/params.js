import { ApiError } from '../utils/ApiError.js';

/** Coerces the named route params to positive integers, or 400s. */
export const numericParams = (...names) => (req, _res, next) => {
  for (const name of names) {
    const value = Number(req.params[name]);
    if (!Number.isInteger(value) || value <= 0) {
      return next(ApiError.badRequest(`"${req.params[name]}" is not a valid ${name}`));
    }
    req.params[name] = value;
  }
  return next();
};
