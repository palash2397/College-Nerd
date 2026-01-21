import fs from "fs";
import path from "path";
import axios from "axios";
import FormData from "form-data";
import MarkdownIt from "markdown-it";

import { ApiResponse } from "../../utils/ApiResponse.js";
import { Msg } from "../../utils/responseMsg.js";
import { deleteFile } from "../../utils/helpers.js";
import AiNotes from "../../models/ai-notes/aiNotes.js";

const md = new MarkdownIt();

export const generateNotesFromFileHandle = async (req, res) => {
  let filePath;

  try {
    if (!req.file) {
      return res.status(400).json({ message: "File required" });
    }

    filePath = req.file.path;
    const absolutePath = path.resolve(filePath);

    if (!fs.existsSync(absolutePath)) {
      throw new Error("File does not exist on disk");
    }

    // ✅ 1) Send file to python
    const formData = new FormData();
    formData.append(
      "file",
      fs.createReadStream(absolutePath),
      path.basename(absolutePath),
    );

    const processResponse = await axios.post(
      "https://python.aitechnotech.in/app3/process-file",
      formData,
      {
        headers: {
          ...formData.getHeaders(),
        },
        maxBodyLength: Infinity,
      },
    );

    const extractedText = processResponse.data?.text;
    if (!extractedText) throw new Error("No text extracted");

    // ✅ 2) Generate notes (markdown)
    const notesRes = await axios.post(
      "https://python.aitechnotech.in/app3/generate-multinotes",
      {
        text: extractedText,
        note_type: "detailed",
      },
    );

    const noteType = notesRes.data?.note_type || "detailed";
    const markdown = notesRes.data?.notes;

    if (!markdown) throw new Error("No notes generated");

    // ✅ 3) Convert markdown -> html
    const html = md.render(markdown);

    // ✅ 4) Save into MongoDB
    const savedNote = await AiNotes.create({
      userId: req.user.id, // must have auth middleware
      noteType: noteType,
      title: req.file?.originalname || "",
      markdown,
      html,
      source: {
        fileName: req.file?.originalname || "",
        mimeType: req.file?.mimetype || "",
        size: req.file?.size || 0,
      },
      status: "generated",
    });

    // ✅ Delete local file AFTER success
    deleteFile(absolutePath);

    // ✅ 5) Return clean response
    return res.status(200).json(
      new ApiResponse(
        200,
        {
          noteId: savedNote._id,
          noteType: savedNote.noteType,
          title: savedNote.title,
          html: savedNote.html, // ✅ main for PDF
          markdown: savedNote.markdown, // optional
          createdAt: savedNote.createdAt,
        },
        Msg.DATA_FETCHED,
      ),
    );
  } catch (error) {
    console.error("Generate notes error:", error);

    if (filePath && fs.existsSync(filePath)) {
      deleteFile(filePath);
    }

    return res.status(500).json(new ApiResponse(500, {}, Msg.SERVER_ERROR));
  }
};

export const myNotesHandle = async (req, res) => {
  try {
    const notes = await AiNotes.find({ userId: req.user.id });
    if (!notes) {
      return res.status(404).json(new ApiResponse(404, {}, Msg.NOT_FOUND));
    }
    return res.status(200).json(new ApiResponse(200, notes, Msg.DATA_FETCHED));
  } catch (error) {
    return res.status(500).json(new ApiResponse(500, {}, Msg.SERVER_ERROR));
  }
};

export const myNoteHandle = async (req, res) => {
  try {
    const note = await AiNotes.findOne({
      userId: req.user.id,
      _id: req.params.id,
    });
    if (!note) {
      return res.status(404).json(new ApiResponse(404, {}, Msg.NOT_FOUND));
    }
    return res.status(200).json(new ApiResponse(200, note, Msg.DATA_FETCHED));
  } catch (error) {
    console.error("Get note error:", error);
    return res.status(500).json(new ApiResponse(500, {}, Msg.SERVER_ERROR));
  }
};
