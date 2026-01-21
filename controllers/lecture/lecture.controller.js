import Jwt from "jsonwebtoken";
import Joi from "joi";

import axios from "axios";
import fs from "fs";
import FormData from "form-data";

import User from "../../models/user/user.js";

import { generatePdfFromHtml } from "../../utils/pdf/pdfGenerator.js";
import Transcription from "../../models/transcription/transcription.js";
import Lecture from "../../models/lecture/lecture.js";
import Notes from "../../models/lecture/notes/notes.js";
import Summary from "../../models/lecture/summary/summary.js";
import McqAttempt from "../../models/lecture/mcq/mcq.js";
import Transcript from "../../models/transcript/transcript.js";

import { ApiResponse } from "../../utils/ApiResponse.js";
import { Msg } from "../../utils/responseMsg.js";
import { deleteFile, generatePdf } from "../../utils/helpers.js";

export const lectureDetails = async (req, res) => {
  try {
    const { id } = req.params;

    const lecture = await Lecture.findOne({
      _id: id,
      user: req.user.id,
    })
      .select("-__v")
      .lean();

    if (!lecture) {
      return res
        .status(404)
        .json(new ApiResponse(404, {}, "Lecture not found"));
    }

    return res.status(200).json(
      new ApiResponse(
        200,
        {
          id: lecture._id,
          sessionId: lecture.sessionId,
          sourceType: lecture.sourceType,
          status: lecture.status,

          transcriptId: lecture.transcriptId || null,

          durationSeconds: lecture.durationSeconds || null,
          audioUrl: lecture.audioUrl || null,

          createdAt: lecture.createdAt,
          updatedAt: lecture.updatedAt,
        },
        "Lecture details fetched successfully"
      )
    );
  } catch (err) {
    console.log("Error fetching lecture", err);

    return res
      .status(500)
      .json(new ApiResponse(500, {}, "Server error while fetching lecture"));
  }
};

export const userLecturesHandle = async (req, res) => {
  try {
    const lectures = await Lecture.find({ user: req.user.id })
      .sort({ createdAt: -1 })
      .lean();

    console.log(lectures);

    if (!lectures || lectures.length === 0) {
      return res.status(200).json(new ApiResponse(200, [], Msg.DATA_NOT_FOUND));
    }

    const transcript = await Transcription.find({
      lectureId: { $in: lectures.map((l) => l._id) },
    }).lean();
    console.log(transcript);

    if (!transcript || transcript.length === 0) {
      return res.status(200).json(new ApiResponse(200, [], Msg.DATA_NOT_FOUND));
    }

    const result = lectures.map((lec) => {
      const foundTranscript = transcript.find(
        (t) => t.lectureId && t.lectureId.toString() === lec._id.toString()
      );

      return {
        id: lec._id,
        sessionId: lec.sessionId,
        status: lec.status,
        courseType: lec.courseType,
        title: lec.title,
        moduleType: lec.moduleType,
        sourceType: lec.sourceType,
        createdAt: lec.createdAt,
        transcriptId: foundTranscript ? foundTranscript._id.toString() : null,
      };
    });

    return res.status(200).json(new ApiResponse(200, result, Msg.DATA_FETCHED));
  } catch (error) {
    console.log("Error fetching lectures", error);

    return res.status(500).json(new ApiResponse(500, {}, Msg.SERVER_ERROR));
  }
};

export const notesbyTranscriptIdHandle = async (req, res) => {
  try {
    const { id } = req.params;
    const schema = Joi.object({
      id: Joi.string().required(),
    });

    const { error } = schema.validate({ id });
    if (error) {
      return res
        .status(400)
        .json(new ApiResponse(400, {}, error.details[0].message));
    }

    const notes = await Notes.find({
      transcriptId: id,
      user: req.user.id,
    }).lean();

    if (!notes || notes.length === 0) {
      return res.status(200).json(new ApiResponse(200, [], Msg.DATA_NOT_FOUND));
    }

    return res.status(200).json(new ApiResponse(200, notes, Msg.DATA_FETCHED));
  } catch (error) {
    console.log("Error fetching notes", error);

    return res.status(500).json(new ApiResponse(500, {}, Msg.SERVER_ERROR));
  }
};

export const summarybyTranscriptIdHandle = async (req, res) => {
  try {
    const { id } = req.params;
    const schema = Joi.object({
      id: Joi.string().required(),
    });

    const { error } = schema.validate({ id });
    if (error) {
      return res
        .status(400)
        .json(new ApiResponse(400, {}, error.details[0].message));
    }

    const summary = await Summary.find({
      transcriptId: id,
      user: req.user.id,
    }).lean();

    if (!summary || summary.length === 0) {
      return res.status(200).json(new ApiResponse(200, [], Msg.DATA_NOT_FOUND));
    }

    return res
      .status(200)
      .json(new ApiResponse(200, summary, Msg.DATA_FETCHED));
  } catch (error) {
    console.log("Error fetching summary", error);

    return res.status(500).json(new ApiResponse(500, {}, Msg.SERVER_ERROR));
  }
};

export const allNotesHandle = async (req, res) => {
  try {
    const notes = await Notes.find({ user: req.user.id }).lean();

    if (!notes || notes.length === 0) {
      return res.status(200).json(new ApiResponse(200, [], Msg.DATA_NOT_FOUND));
    }

    return res.status(200).json(new ApiResponse(200, notes, Msg.DATA_FETCHED));
  } catch (error) {
    console.log("Error fetching notes", error);

    return res.status(500).json(new ApiResponse(500, {}, Msg.SERVER_ERROR));
  }
};

export const allSummaryHandle = async (req, res) => {
  try {
    const summary = await Summary.find({ user: req.user.id }).lean();

    if (!summary || summary.length === 0) {
      return res.status(200).json(new ApiResponse(200, [], Msg.DATA_NOT_FOUND));
    }

    return res
      .status(200)
      .json(new ApiResponse(200, summary, Msg.DATA_FETCHED));
  } catch (error) {
    console.log("Error fetching summary", error);

    return res.status(500).json(new ApiResponse(500, {}, Msg.SERVER_ERROR));
  }
};

// export const generateTranscriptMcqHandle = async (req, res) => {
//   try {
//     const { id } = req.params;

//     const schema = Joi.object({
//       id: Joi.string().required(),
//     });

//     const { error } = schema.validate({ id });
//     if (error) {
//       return res
//         .status(400)
//         .json(new ApiResponse(400, {}, error.details[0].message));
//     }

//     const transcription = await Transcription.findById(id);
//     console.log(transcription);

//     if (!transcription) {
//       return res.status(404).json(new ApiResponse(404, {}, Msg.DATA_NOT_FOUND));
//     }

//     const transcriptText = transcription.text;

//     const prompt = `
//     Generate 5 Multiple-Choice Questions based on the content below.

//     Requirements:
//     - Questions must be directly derived from the content
//     - Each question must have exactly 4 options
//     - Only ONE option should be correct
//     - Provide a short explanation for the correct answer
//     - Keep questions clear and concise
//     - Do NOT add external knowledge
//     - Return ONLY valid JSON in this format:

//     [
//     {
//      "question": "",
//      "options": ["", "", "", ""],
//      "answer": "",
//      "explanation": ""
//     }
//     ]

//     Content:
//    ${transcriptText}
//     `;

//     const completion = await openai.chat.completions.create({
//       model: "gpt-4.1-mini",
//       messages: [
//         {
//           role: "system",
//           content:
//             "You generate high-quality, concept-based MCQ questions from text content.",
//         },
//         { role: "user", content: prompt },
//       ],
//       temperature: 0.3,
//     });

//     const raw = completion.choices[0].message.content;

//     let mcq;
//     try {
//       mcq = JSON.parse(raw);
//     } catch {
//       return res
//         .status(500)
//         .json(
//           new ApiResponse(
//             500,
//             { raw },
//             "MCQ generation failed — AI returned invalid JSON"
//           )
//         );
//     }

//     return res.status(200).json(
//       new ApiResponse(
//         200,
//         {
//           transcription,
//           mcq,
//         },
//         "MCQ generated successfully"
//       )
//     );
//   } catch (error) {
//     console.log("Error generating MCQ", error);

//     return res.status(500).json(new ApiResponse(500, {}, Msg.SERVER_ERROR));
//   }
// };

export const generateTranscriptMcqHandle = async (req, res) => {
  try {
    const { id } = req.params; // transcriptionId

    const schema = Joi.object({
      id: Joi.string().required(),
    });

    const { error } = schema.validate({ id });
    if (error) {
      return res
        .status(400)
        .json(new ApiResponse(400, {}, error.details[0].message));
    }

    // 1️⃣ Fetch transcription
    const transcription = await Transcription.findById(id);

    if (!transcription) {
      return res.status(404).json(new ApiResponse(404, {}, Msg.DATA_NOT_FOUND));
    }

    // 2️⃣ Ensure lecture exists
    const lecture = await Lecture.findById(transcription.lectureId);

    if (!lecture) {
      return res.status(404).json(new ApiResponse(404, {}, Msg.DATA_NOT_FOUND));
    }

    const response = await axios.post(
      "https://python.aitechnotech.in/mcq/convert-to-mcqs",
      {
        transcription: transcription.text,
        num_questions: 10
      }
    );

    const aiMcq = response.data;

    if (!aiMcq) {
      return res.status(500).json(new ApiResponse(500, {}, Msg.DATA_NOT_FOUND));
    }

    return res.status(200).json(
      new ApiResponse(
        200,
        {
          transcription,
          aiMcq,
        },
        Msg.DATA_GENERATED
      )
    );
  } catch (error) {
    console.log("Error while generating medical transcription file", error);

    return res.status(500).json(new ApiResponse(500, {}, Msg.SERVER_ERROR));
  }
};

export const generateTranscriptCardsHandle = async (req, res) => {
  try {
    const { id } = req.params; // transcriptionId

    const schema = Joi.object({
      id: Joi.string().required(),
    });

    const { error } = schema.validate({ id });
    if (error) {
      return res
        .status(400)
        .json(new ApiResponse(400, {}, error.details[0].message));
    }

    // 1️⃣ Fetch transcription
    const transcription = await Transcription.findById(id);
    console.log("transcription", transcription);

    if (!transcription) {
      return res.status(404).json(new ApiResponse(404, {}, Msg.DATA_NOT_FOUND));
    }

    // 2️⃣ Ensure lecture exists
    const lecture = await Lecture.findById(transcription.lectureId);
    console.log("lecture", lecture);

    if (!lecture) {
      return res.status(404).json(new ApiResponse(404, {}, Msg.DATA_NOT_FOUND));
    }

    const response = await axios.post(
      "https://python.aitechnotech.in/flash/convert-to-flashcards",
      {
        transcription: transcription.text,
      }
    );

    const cards = response.data;

    if (!cards) {
      return res.status(500).json(new ApiResponse(500, {}, Msg.DATA_NOT_FOUND));
    }

    return res.status(200).json(
      new ApiResponse(
        200,
        {
          transcription,
          cards,
        },
        Msg.DATA_GENERATED
      )
    );
  } catch (error) {
    console.log("Error while generating medical transcription file", error);

    return res.status(500).json(new ApiResponse(500, {}, Msg.SERVER_ERROR));
  }
};

export const submitMcqHandle = async (req, res) => {
  try {
    const { transcriptId, questions } = req.body;

    const schema = Joi.object({
      transcriptId: Joi.string().required(),
      questions: Joi.array().min(1).required(),
    });

    const { error } = schema.validate(req.body);
    if (error)
      return res
        .status(400)
        .json(new ApiResponse(400, {}, error.details[0].message));

    const attempt = await McqAttempt.create({
      user: req.user.id,
      transcriptId,
      questions,
      status: "submitted",
    });

    return res
      .status(200)
      .json(new ApiResponse(200, { attemptId: attempt._id }, Msg.DATA_ADDED));
  } catch (err) {
    console.log("MCQ submit error", err);
    return res.status(500).json(new ApiResponse(500, {}, Msg.SERVER_ERROR));
  }
};

export const resultMcqHandle = async (req, res) => {
  try {
    const { id } = req.params;

    const attempt = await McqAttempt.findOne({
      _id: id,
      user: req.user.id,
    });

    if (!attempt)
      return res.status(404).json(new ApiResponse(404, {}, Msg.DATA_NOT_FOUND));

    if (attempt.status === "evaluated") {
      return res
        .status(200)
        .json(new ApiResponse(200, attempt, Msg.DATA_FETCHED));
    }

    let correct = 0;

    attempt.questions = attempt.questions.map((q) => {
      const isCorrect = q.userAnswer === q.correctAnswer;
      if (isCorrect) correct++;

      return { ...q, isCorrect };
    });

    const total = attempt.questions.length;
    const wrong = total - correct;
    const percent = Math.round((correct / total) * 100);

    attempt.totalQuestions = total;
    attempt.correctCount = correct;
    attempt.wrongCount = wrong;
    attempt.scorePercent = percent;
    attempt.status = "evaluated";

    await attempt.save();

    return res
      .status(200)
      .json(new ApiResponse(200, attempt, Msg.DATA_FETCHED));
  } catch (err) {
    console.log("Evaluate MCQ error", err);
    return res.status(500).json(new ApiResponse(500, {}, Msg.SERVER_ERROR));
  }
};

export const transcriptAudioFileHandle = async (req, res) => {
  let filePath;
  try {
    const { id } = req.params;
    const schema = Joi.object({
      id: Joi.string().required(),
    });

    const { error } = schema.validate({ id });
    if (error) {
      return res
        .status(400)
        .json(new ApiResponse(400, {}, error.details[0].message));
    }
    if (!req.file) {
      return res.status(400).json(new ApiResponse(400, {}, Msg.DATA_REQUIRED));
    }

    const transcription = await Transcription.findById(id);
    if (!transcription) {
      return res.status(404).json(new ApiResponse(404, {}, Msg.DATA_NOT_FOUND));
    }

    console.log("-------->", req.user);
    filePath = req.file.path;
    const formData = new FormData();
    formData.append(
      "file",
      fs.createReadStream(filePath),
      req.file.originalname
    );

    const response = await axios.post(
      "https://python.aitechnotech.in/timestamp/upload-audio",
      formData,
      { headers: formData.getHeaders() }
    );

    console.log("response", response.data);

    const aiData = response.data;

    // 3️⃣ Prepare timed transcript payload
    const timedTranscriptPayload = {
      status: aiData.status,
      totalSegments: aiData.total_segments,
      duration: aiData.duration,
      segments: aiData.data.map((seg) => ({
        time: seg.time,
        speaker: seg.speaker,
        text: seg.text,
      })),
    };

    const transcript = await Transcript.findOneAndUpdate(
      { transcriptId: id },
      {
        user: req.user.id,
        transcriptId: id,
        text: transcription.text, // copy plain text
        timedTranscript: timedTranscriptPayload,
        status: "approved",
      },
      { upsert: true, new: true }
    );

    return res.status(200).json(
      new ApiResponse(
        200,
        {
          transcriptId: id,
          status: aiData.status,
          total_segments: aiData.total_segments,
          duration: aiData.duration,
          data: aiData.data,
        },
        Msg.DATA_GENERATED
      )
    );
  } catch (error) {
    console.log("Error while transcribing file", error);

    return res.status(500).json(new ApiResponse(500, {}, Msg.SERVER_ERROR));
  } finally {
    deleteFile(filePath);
  }
};

export const transcriptHandle = async (req, res) => {
  try {
    const { id } = req.params;
    const schema = Joi.object({
      id: Joi.string().required(),
    });

    const { error } = schema.validate({ id });
    if (error) {
      return res
        .status(400)
        .json(new ApiResponse(400, {}, error.details[0].message));
    }

    const transcript = await Transcript.findOne({ transcriptId: id }).select(
      "-__v -updatedAt -createdAt -text"
    );
    if (!transcript) {
      return res.status(404).json(new ApiResponse(404, {}, Msg.DATA_NOT_FOUND));
    }

    return res
      .status(200)
      .json(new ApiResponse(200, transcript, Msg.DATA_FETCHED));
  } catch (error) {
    console.log("Error while handling transcript", error);
    return res.status(500).json(new ApiResponse(500, {}, Msg.SERVER_ERROR));
  } finally {
    deleteFile(filePath);
  }
};

export const lecturePdfHandle = async (req, res) => {
  try {
    const { id, flag } = req.body;

    const schema = Joi.object({
      id: Joi.string().required(),
      flag: Joi.string().valid("transcript", "notes", "summary").required(),
    });

    const { error } = schema.validate({ id, flag });
    if (error) {
      return res
        .status(400)
        .json(new ApiResponse(400, {}, error.details[0].message));
    }

    // -------------------------------
    // TRANSCRIPT PDF
    // -------------------------------
    if (flag === "transcript") {
      const transcription = await Transcription.findById(id);

      if (!transcription) {
        return res
          .status(404)
          .json(new ApiResponse(404, {}, Msg.DATA_NOT_FOUND));
      }

      return generatePdf(
        {
          title: "Lecture Transcript",
          subtitle: "Transcription Output",
          content: transcription.text,
        },
        res
      );
    }

    // -------------------------------
    // SUMMARY PDF
    // -------------------------------
    if (flag === "summary") {
      const summary = await Summary.findOne({ transcriptId: id });

      if (!summary) {
        return res
          .status(404)
          .json(new ApiResponse(404, {}, Msg.DATA_NOT_FOUND));
      }

      return generatePdf(
        {
          title: "Lecture Summary",
          subtitle: "Summary Output",
          content: summary.summaryAi,
        },
        res
      );
    }

    // -------------------------------
    // NOTES PDF
    // -------------------------------
    if (flag === "notes") {
      const notes = await Notes.findOne({ transcriptId: id });

      if (!notes) {
        return res
          .status(404)
          .json(new ApiResponse(404, {}, Msg.DATA_NOT_FOUND));
      }

      const n = notes.notesAi;

      const content = `
${n.title}

${n.description}

Key Features:
${n.key_features.map((f) => `- ${f}`).join("\n")}

Advantages:
${n.advantages.map((a) => `- ${a}`).join("\n")}

Limitations:
${n.limitations.map((l) => `- ${l}`).join("\n")}
      `;

      return generatePdfFromHtml(
        {
          title: "Lecture Notes",
          subtitle: "Notes Output",
          content,
        },
        res
      );
    }
  } catch (error) {
    console.error("Lecture PDF error", error);
    return res.status(500).json(new ApiResponse(500, {}, Msg.SERVER_ERROR));
  }
};
