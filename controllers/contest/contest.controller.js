import Jwt from "jsonwebtoken";
import FormData from "form-data";
import Joi from "joi";
import fs from "fs";
import axios from "axios";

import User from "../../models/user/user.js";

import Contest from "../../models/contest/contest.js";
import ContestAttempt from "../../models/contest/contestAttempt.js";
import ContestAnswer from "../../models/contest/contestAnswer.js";
import ContestQuestion from "../../models/contest/contestQuestion.js";

import { ApiResponse } from "../../utils/ApiResponse.js";
import { Msg } from "../../utils/responseMsg.js";
import { deleteFile, generatePdf } from "../../utils/helpers.js";

export const createContestHandle = async (req, res) => {
  try {
    const {
      title,
      description,
      totalQuestions,
      durationMinutes,
      entryCoins,
      startAt,
      endAt,
      status,
    } = req.body;

    const schema = Joi.object({
      title: Joi.string().required(),
      description: Joi.string().allow("").optional(),
      totalQuestions: Joi.number().min(1).required(),
      durationMinutes: Joi.number().min(1).required(),
      entryCoins: Joi.number().min(0).default(0),
      startAt: Joi.date().required(),
      endAt: Joi.date().required(),
      status: Joi.string().valid("draft", "published").default("draft"),
    });

    const { error } = schema.validate(req.body);
    if (error) {
      return res
        .status(400)
        .json(new ApiResponse(400, {}, error.details[0].message));
    }

    if (!req.file) {
      return res.status(400).json(new ApiResponse(400, {}, Msg.DATA_REQUIRED));
    }

    const contest = await Contest.create({
      title,
      description,
      totalQuestions,
      durationMinutes,
      entryCoins,
      startAt,
      endAt,
      status,
      createdBy: req.user.id,
      thumbnail: req.file.filename,
    });

    return res
      .status(201)
      .json(
        new ApiResponse(201, { contestId: contest._id }, Msg.DATA_GENERATED)
      );
  } catch (error) {
    console.error("Error creating contest:", error);
    return res.status(500).json(new ApiResponse(500, {}, Msg.SERVER_ERROR));
  }
};

export const generateContestQuestionsHandle = async (req, res) => {
  try {
    const { contestId } = req.params;

    const contest = await Contest.findById(contestId);
    if (!contest) {
      return res
        .status(404)
        .json(new ApiResponse(404, {}, Msg.DATA_NOT_FOUND));
    }

    if (!req.file) {
      return res
        .status(400)
        .json(new ApiResponse(400, {}, "PDF file is required"));
    }

    const existingCount = await ContestQuestion.countDocuments({ contestId });
    if (existingCount > 0) {
      deleteFile(req.file.path);
      return res
        .status(400)
        .json(new ApiResponse(400, {}, Msg.DATA_ALREADY_EXISTS));
    }

    // ✅ Send file properly to AI
    const formData = new FormData();
    formData.append(
      "pdf_file", // 👈 MUST MATCH PYTHON API
      fs.createReadStream(req.file.path),
      req.file.originalname
    );
    formData.append("totalQuestions", contest.totalQuestions);

    const aiResponse = await axios.post(
      "https://python.aitechnotech.in/quiz/convert-to-mcqs",
      formData,
      { headers: formData.getHeaders() }
    );

    const { mcqs } = aiResponse.data;

    if (!Array.isArray(mcqs)) {
      deleteFile(req.file.path);
      return res
        .status(400)
        .json(new ApiResponse(400, {}, "Invalid AI response"));
    }

    // 🔹 (Later) store in DB here

    deleteFile(req.file.path);

    const questions = mcqs.map((q, index) => ({
      contestId,
      type: "mcq",
      question: q.question,
      options: q.options,
      correctIndex: q.correct_index,
      correctAnswer: q.correct_answer,
      explanation: q.explanation || null,
      order: index + 1,
    }));

    await ContestQuestion.insertMany(questions);

    // 6. Delete local PDF after processing (recommended)
    deleteFile(req.file.path);

    return res.status(200).json(
      new ApiResponse(
        200,
        { totalQuestions: questions.length },
        Msg.DATA_GENERATED
      )
    );

    return res
      .status(200)
      .json(new ApiResponse(200, mcqs, Msg.DATA_GENERATED));
  } catch (error) {
    console.error("Error generating contest questions:", error);

    if (req.file?.path) {
      deleteFile(req.file.path);
    }

    return res
      .status(500)
      .json(new ApiResponse(500, {}, Msg.SERVER_ERROR));
  }
};


export const publishContestHandle = async (req, res) => {
  try {
    const { contestId } = req.params;

    // 1. Validate contest
    const contest = await Contest.findById(contestId);
    if (!contest) {
      return res
        .status(404)
        .json(new ApiResponse(404, {}, Msg.DATA_NOT_FOUND));
    }

    // 2. Already published check
    if (contest.status === "published") {
      return res
        .status(400)
        .json(new ApiResponse(400, {}, "Contest already published"));
    }

    // 3. Publish contest
    contest.status = "published";
    await contest.save();

    return res.status(200).json(
      new ApiResponse(
        200,
        { contestId: contest._id, status: contest.status },
        "Contest published successfully"
      )
    );
  } catch (error) {
    console.error("Error publishing contest:", error);
    return res
      .status(500)
      .json(new ApiResponse(500, {}, Msg.SERVER_ERROR));
  }
};

export const getContestListHandle = async (req, res) => {
  try {
    const now = new Date();

    const contests = await Contest.find({ status: "published" })
      .select(
        "title thumbnail entryCoins durationMinutes startAt endAt createdAt"
      )
      .sort({ startAt: 1 });

    const data = {
      upcoming: [],
      ongoing: [],
      finished: [],
    };

    contests.forEach((contest) => {
        contest.thumbnail = `${process.env.BASE_URL}/contest/thumbnail/${contest.thumbnail}`
      if (contest.startAt > now) {
        data.upcoming.push(contest);
      } else if (contest.endAt < now) {
        data.finished.push(contest);
      } else {
        data.ongoing.push(contest);
      }
    });

    return res
      .status(200)
      .json(new ApiResponse(200, data, Msg.DATA_FETCHED));
  } catch (error) {
    console.error("Error fetching contest list:", error);
    return res
      .status(500)
      .json(new ApiResponse(500, {}, Msg.SERVER_ERROR));
  }
};


export const startContestHandle = async (req, res) => {
  try {
    const { contestId } = req.params;
    const userId = req.user.id;

    // 1. Validate contest
    const contest = await Contest.findOne({
      _id: contestId,
      status: "published",
    });

    if (!contest) {
      return res
        .status(404)
        .json(new ApiResponse(404, {}, Msg.DATA_NOT_FOUND));
    }

    const now = new Date();

    // 2. Time validation
    if (now < contest.startAt) {
      return res
        .status(400)
        .json(new ApiResponse(400, {}, "Contest has not started yet"));
    }

    if (now > contest.endAt) {
      return res
        .status(400)
        .json(new ApiResponse(400, {}, "Contest has already ended"));
    }

    // 3. Prevent multiple attempts
    const existingAttempt = await ContestAttempt.findOne({
      contestId,
      userId,
    });

    if (existingAttempt) {
      return res.status(400).json(
        new ApiResponse(
          400,
          { attemptId: existingAttempt._id },
          "Contest already attempted"
        )
      );
    }

    // 4. Create attempt
    const attempt = await ContestAttempt.create({
      contestId,
      userId,
      totalQuestions: contest.totalQuestions,
      startedAt: now,
      status: "started",
    });

    // 5. Response
    return res.status(200).json(
      new ApiResponse(
        200,
        {
          attemptId: attempt._id,
          contestId,
          startedAt: attempt.startedAt,
          durationMinutes: contest.durationMinutes,
          endsAt: new Date(
            attempt.startedAt.getTime() +
              contest.durationMinutes * 60 * 1000
          ),
        },
        "Contest started successfully"
      )
    );
  } catch (error) {
    console.error("Error starting contest:", error);
    return res
      .status(500)
      .json(new ApiResponse(500, {}, Msg.SERVER_ERROR));
  }
};