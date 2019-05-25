const notFound = (_req, res) => {
  res.status(404).send({ error: 'Não encontrado' });
};

module.exports = notFound;
