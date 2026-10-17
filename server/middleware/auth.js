export default function requireAuth(req, res, next) {
  if (!req.session?.userId) {
    return res.status(401).json({ message: "Please sign in." });
  }

  req.userId = req.session.userId;
  next();
}
