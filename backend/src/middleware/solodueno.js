function solodueno(req, res, next) {
  if (!req.usuario || req.usuario.rol !== 'dueno') {
    return res.status(403).json({ error: 'Acceso restringido al dueño del taller' });
  }
  next();
}

module.exports = solodueno;
