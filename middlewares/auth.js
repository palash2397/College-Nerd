import jwt from "jsonwebtoken";
import { Msg } from "../utils/responseMsg.js";
import { ApiResponse } from "../utils/ApiResponse.js";

export const auth = (req, res, next) => {
  const token = req.header("Authorization")?.replace("Bearer ", "").trim();
  console.log("Token:", token);

  if (!token)
    return res.status(401).json(new ApiResponse(401, {}, Msg.FORBIDDEN));
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log("Decoded:", decoded);
    req.user = decoded;
    next();
  } catch (error) {

    res.status(401).json(new ApiResponse(401, {}, Msg.UNAUTHORIZED));
  }
};




export const isAdmin = (req, res, next) => {
  console.log("User Role:", req.user.role);
  if (req.user.role !== 'admin') {
    return res.status(401).json(new ApiResponse(401, {}, Msg.FORBIDDEN));
  }
  next();
};
