import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();

const authorization = async (req, res, next) => {
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "") || req.cookies?.jwt;
    //console.log("jwtToken", jwtToken);

    if (!token) {
      return res.status(403).json("Not authorized. No token provided.");
    }
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = payload.user || payload;
    //console.log(req.user);

    next();
  } catch (err) {
    console.log(err.message);
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};
export default authorization;
