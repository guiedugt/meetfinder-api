// eslint-disable-next-line no-unused-vars
const serverError = (err, _req, res, _next) => {
  console.error(err.stack);
  res.status(500).send({ error: err.message });
};

module.exports = serverError;
