// eslint-disable-next-line no-unused-vars
const serverError = (error, _req, res, _next) => {
  res.status(error.status || 500);
  res.send({ error: error.message });
};

module.exports = serverError;
