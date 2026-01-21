import fs from "fs";

import { ApiResponse } from "../../utils/ApiResponse.js";
import { Msg } from "../../utils/responseMsg.js";
import { deleteFile} from "../../utils/helpers.js";

export const generateNotesFromFileHandle = async (req, res) => {
  let filePath;

  try {
    if (!req.file) {
      return res.status(400).json({ message: "File required" });
    }

    filePath = req.file.path;
    const absolutePath = path.resolve(filePath);

    console.log("File exists:", fs.existsSync(absolutePath));
    console.log("Absolute path:", absolutePath);

    if (!fs.existsSync(absolutePath)) {
      throw new Error("File does not exist on disk");
    }

    /* ---------- SEND FILE TO PYTHON ---------- */
    const formData = new FormData();
    formData.append("file", fs.createReadStream(absolutePath));

    const extractRes = await axios.post(
      "https://python.aitechnotech.in/process-file",
      formData,
      { headers: formData.getHeaders() }
    );

    const extractedText = extractRes.data?.text;

    if (!extractedText) {
      throw new Error("No text extracted");
    }

    /* ---------- GENERATE NOTES ---------- */
    const notesRes = await axios.post(
      "https://python.aitechnotech.in/generate-multinotes",
      {
        text: extractedText,
        note_type: "structured",
      }
    );

    // ✅ DELETE ONLY AFTER EVERYTHING IS DONE
    deleteFile(absolutePath);

    return res.json({
      success: true,
      notes: notesRes.data,
    });
  } catch (error) {
    console.error("Generate notes error:", error);

    if (filePath && fs.existsSync(filePath)) {
      deleteFile(filePath);
    }

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};