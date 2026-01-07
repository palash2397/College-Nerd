import fs from "fs";
import path, { dirname } from "path";
import { fileURLToPath } from "url";
import OpenAI from "openai";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export const generateOtp = () => {
  return Math.floor(1000 + Math.random() * 9000).toString();
};

export const getExpirationTime = () => {
  return new Date(Date.now() + 5 * 60 * 1000); // Current time + 5 minutes
};

export const setUploadPath = (folder) => {
  return (req, res, next) => {
    req.folderType = folder;
    next();
  };
};

export const deleteOldImages = (folder, file) => {
  try {
    if (!file) return;
    const p = path.join(__dirname, "..", "public", folder, file);
    fs.existsSync(p)
      ? (fs.unlinkSync(p), console.log("Deleted:", p))
      : console.log("No file:", p);
  } catch (error) {
    console.log("error while deleting file --------->", error);
  }
};

export const allowedFields = [
  "generalNotification",
  "sound",
  "vibrate",
  "appUpdates",
];

export const allowedLanguages = ["en", "fr", "es"];

export const openai = new OpenAI({
  apiKey: process.env.OPENAI_KEY,
});

export const formatDate = (dateString) => {
  if (!dateString) return "";
  const date = new Date(dateString);

  if (isNaN(date.getTime())) {
    console.error("Invalid date:", dateString);
    return "Invalid date";
  }

  return date
    .toLocaleString("en-US", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    })
    .replace(",", "");
};
