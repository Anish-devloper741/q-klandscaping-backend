import jwt from "jsonwebtoken";

export function requireAuth(req, res, next) {
  const [scheme, token] = (req.headers.authorization || "").split(" ");

  if (scheme !== "Bearer" || !token) {
    return res.status(401).json({ ok: false, message: "Please log in" });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET, { algorithms: ["HS256"] });
    req.admin = { id: payload.sub, email: payload.email };
    next();
  } catch {
    res.status(401).json({ ok: false, message: "Session expired. Please log in again" });
  }
}