const jwt = require('jsonwebtoken');

const authenticate = (req, res, next) => {
  const token = req.headers['x-token'];
  if (!token) return res.status(401).send({ auth: false, message: 'Usuário não está logado' });

  return jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) return res.status(500).send({ auth: false, message: 'Falha ao autenticar usuário' });
    req.userId = decoded.id;
    return next();
  });
};

module.exports = authenticate;
