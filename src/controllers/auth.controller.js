import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { Admin } from "../models/Admin.js";
import { env } from "../config/env.js";
import { loginSchema } from "../validators/auth.js";

// Makes a missing account take as long as a wrong password
const DUMMY_HASH = bcrypt.hashSync("not-a-real-password", 12);

export async function login(req, res, next) {
  try {
    const { email, password } = loginSchema.parse(req.body);

    const admin = await Admin.findOne({ email: email.toLowerCase() }).select("+passwordHash");
    const valid = await bcrypt.compare(password, admin ? admin.passwordHash : DUMMY_HASH);

    if (!admin || !valid) {
      return res.status(401).json({ ok: false, message: "Invalid email or password" });
    }

    const token = jwt.sign({ email: admin.email }, env.JWT_SECRET, {
      subject: String(admin._id),
      expiresIn: env.JWT_EXPIRES_IN,
      algorithm: "HS256",
    });

    res.json({ ok: true, token, admin: { id: admin._id, email: admin.email } });
  } catch (err) {
    next(err);
  }
}

export function me(req, res) {
  res.json({ ok: true, admin: req.admin });
}