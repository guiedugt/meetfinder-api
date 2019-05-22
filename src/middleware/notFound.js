const notFound = (_req, _res, next) => {
  const error = new Error('Not found');
  error.status = 404;
  next(error);
};

module.exports = notFound;
