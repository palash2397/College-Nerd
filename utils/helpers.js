import fs from "fs";
import path, { dirname } from "path";
import { fileURLToPath } from "url";
import PDFDocument from "pdfkit";
import { PDFParse } from "pdf-parse";

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

export const deleteFile = (filePath) => {
  if (!filePath) return;

  fs.unlink(filePath, (err) => {
    if (err) {
      console.error("Failed to delete file:", filePath, err.message);
    } else {
      console.log("Temporary file deleted:", filePath);
    }
  });
};

export const generatePdf = ({ title, subtitle, content }, res) => {
  const doc = new PDFDocument({ margin: 50 });

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="${title || "document"}.pdf"`,
  );

  doc.pipe(res);

  if (title) {
    doc.fontSize(18).text(title, { align: "center" });
    doc.moveDown();
  }

  if (subtitle) {
    doc.fontSize(12).fillColor("gray").text(subtitle, {
      align: "center",
    });
    doc.moveDown(2);
  }

  // Main Content
  doc.fontSize(11).fillColor("black").text(content, {
    align: "left",
    lineGap: 6,
  });

  doc.end();
};

export const extractTextFromFile = async (filePath) => {
  const buffer = fs.readFileSync(filePath);

  if (filePath.endsWith(".pdf")) {
    const data = await new PDFParse(buffer);
    console.log(data);
    console.log(data.text);
    return data.text;
  }

  // TXT fallback
  return buffer.toString("utf-8");
};
