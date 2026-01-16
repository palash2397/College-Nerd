import Jwt from "jsonwebtoken";
import mongoose from "mongoose";
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
import { deleteFile } from "../../utils/helpers.js";

export const createContestHandle = async (req, res) => {
  try {
    const {
      title,
      description,
      totalQuestions,
      durationMinutes,
      entryCoins,
      rewardCoins,
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
      rewardCoins: Joi.number().min(0).required(),
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
      rewardCoins,
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
      return res.status(404).json(new ApiResponse(404, {}, Msg.DATA_NOT_FOUND));
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

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          { totalQuestions: questions.length },
          Msg.DATA_GENERATED
        )
      );

    return res.status(200).json(new ApiResponse(200, mcqs, Msg.DATA_GENERATED));
  } catch (error) {
    console.error("Error generating contest questions:", error);

    if (req.file?.path) {
      deleteFile(req.file.path);
    }

    return res.status(500).json(new ApiResponse(500, {}, Msg.SERVER_ERROR));
  }
};

export const publishContestHandle = async (req, res) => {
  try {
    const { contestId } = req.params;

    // 1. Validate contest
    const contest = await Contest.findById(contestId);
    if (!contest) {
      return res.status(404).json(new ApiResponse(404, {}, Msg.DATA_NOT_FOUND));
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

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          { contestId: contest._id, status: contest.status },
          "Contest published successfully"
        )
      );
  } catch (error) {
    console.error("Error publishing contest:", error);
    return res.status(500).json(new ApiResponse(500, {}, Msg.SERVER_ERROR));
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
      contest.thumbnail = `${process.env.BASE_URL}/contest/thumbnail/${contest.thumbnail}`;
      if (contest.startAt > now) {
        data.upcoming.push(contest);
      } else if (contest.endAt < now) {
        data.finished.push(contest);
      } else {
        data.ongoing.push(contest);
      }
    });

    return res.status(200).json(new ApiResponse(200, data, Msg.DATA_FETCHED));
  } catch (error) {
    console.error("Error fetching contest list:", error);
    return res.status(500).json(new ApiResponse(500, {}, Msg.SERVER_ERROR));
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
      return res.status(404).json(new ApiResponse(404, {}, Msg.DATA_NOT_FOUND));
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
      return res
        .status(400)
        .json(
          new ApiResponse(
            400,
            { attemptId: existingAttempt._id },
            "Contest already attempted"
          )
        );
    }

    const user = await User.findById(userId);
    if (user.coins < contest.entryCoins) {
      return res.status(400).json(new ApiResponse(400, {}, "Not enough coins"));
    }

    // 4. Create attempt
    const attempt = await ContestAttempt.create({
      contestId,
      userId,
      totalQuestions: contest.totalQuestions,
      startedAt: now,
      status: "started",
    });

    user.coins -= contest.entryCoins;
    await user.save();

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
            attempt.startedAt.getTime() + contest.durationMinutes * 60 * 1000
          ),
        },
        "Contest started successfully"
      )
    );
  } catch (error) {
    console.error("Error starting contest:", error);
    return res.status(500).json(new ApiResponse(500, {}, Msg.SERVER_ERROR));
  }
};

export const contestQuestionsHandle = async (req, res) => {
  try {
    const { attemptId } = req.params;
    const userId = req.user.id;

    // 1. Validate attempt
    const attempt = await ContestAttempt.findById(attemptId);
    if (!attempt || attempt.userId.toString() !== userId) {
      return res.status(404).json(new ApiResponse(404, {}, Msg.DATA_NOT_FOUND));
    }

    // 2. Validate contest timing
    const contest = await Contest.findById(attempt.contestId);
    if (!contest) {
      return res.status(404).json(new ApiResponse(404, {}, Msg.DATA_NOT_FOUND));
    }

    const now = new Date();
    if (now > contest.endAt) {
      return res
        .status(400)
        .json(new ApiResponse(400, {}, "Contest has ended"));
    }

    // 3. Fetch questions (hide answers)
    const questions = await ContestQuestion.find({
      contestId: contest._id,
    })
      .sort({ order: 1 })
      .select("_id question options order");

    if (!questions.length) {
      return res
        .status(404)
        .json(new ApiResponse(404, {}, "No questions found"));
    }

    // 4. Optional shuffle
    const shuffled = questions.sort(() => Math.random() - 0.5);

    return res.status(200).json(
      new ApiResponse(
        200,
        {
          attemptId,
          contestId: contest._id,
          totalQuestions: shuffled.length,
          questions: shuffled,
        },
        Msg.DATA_FETCHED
      )
    );
  } catch (error) {
    console.error("Error fetching contest questions:", error);
    return res.status(500).json(new ApiResponse(500, {}, Msg.SERVER_ERROR));
  }
};

export const submitContestHandle = async (req, res) => {
  try {
    let reward = 0;
    const userId = req.user.id;
    const { attemptId, answers } = req.body;

    if (!Array.isArray(answers) || answers.length === 0) {
      return res
        .status(400)
        .json(new ApiResponse(400, {}, "Answers are required"));
    }

    const attempt = await ContestAttempt.findById(attemptId);
    if (!attempt || attempt.userId.toString() !== userId) {
      return res.status(404).json(new ApiResponse(404, {}, Msg.DATA_NOT_FOUND));
    }

    if (attempt.status !== "started") {
      return res
        .status(400)
        .json(new ApiResponse(400, {}, "Contest already submitted"));
    }

    const questionIds = answers.map((a) => a.questionId);

    const questions = await ContestQuestion.find({
      _id: { $in: questionIds },
      contestId: attempt.contestId,
    });

    const contest = await Contest.findById(attempt.contestId);
    if (!contest) {
      return res.status(404).json(new ApiResponse(404, {}, Msg.DATA_NOT_FOUND));
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json(new ApiResponse(404, {}, Msg.USER_NOT_FOUND));
    }

    let correctCount = 0;

    const resultDetails = questions.map((question) => {
      const userAnswer = answers.find(
        (a) => a.questionId.toString() === question._id.toString()
      );

      const isCorrect = userAnswer?.answerIndex === question.correctIndex;

      if (isCorrect) correctCount++;

      return {
        questionId: question._id,
        question: question.question,
        options: question.options,
        correctIndex: question.correctIndex,
        userAnswerIndex: userAnswer?.answerIndex ?? null,
        isCorrect,
        explanation: question.explanation,
      };
    });

    const totalQuestions = questions.length;
    const wrongCount = totalQuestions - correctCount;
    const scorePercent = Math.round((correctCount / totalQuestions) * 100);

    const finishedAt = new Date();
    const timeTaken = Math.floor((finishedAt - attempt.startedAt) / 1000); // seconds

    attempt.totalQuestions = totalQuestions;
    attempt.correctCount = correctCount;
    attempt.wrongCount = wrongCount;
    attempt.scorePercent = scorePercent;
    attempt.finishedAt = finishedAt;
    attempt.timeTakenSeconds = timeTaken;
    attempt.status = "submitted";
    attempt.rewardCoins = reward;

    console.log("contest.rewardCoins", contest.rewardCoins);

    if (scorePercent >= 80) reward = contest.rewardCoins;
    else if (scorePercent >= 50) reward = Math.floor(contest.rewardCoins / 2);

    user.coins += reward;
    await user.save();
     
    attempt.rewardCoins = reward || 0;
    await attempt.save();

    /* ---------------- RESPONSE ---------------- */

    return res.status(200).json(
      new ApiResponse(
        200,
        {
          summary: {
            totalQuestions,
            correct: correctCount,
            wrong: wrongCount,
            scorePercent,
            timeTaken,
          },
          details: resultDetails,
        },
        "Contest submitted successfully"
      )
    );
  } catch (error) {
    console.error("Error submitting contest:", error);
    return res.status(500).json(new ApiResponse(500, {}, Msg.SERVER_ERROR));
  }
};


export const contestLeaderboardHandle = async (req, res) => {
  try {
    const { contestId } = req.params;

    const contest = await Contest.findById(contestId);
    if (!contest) {
      return res.status(404).json(new ApiResponse(404, {}, Msg.DATA_NOT_FOUND));
    }

    const leaderboard = await ContestAttempt.aggregate([
      {
        $match: {
          contestId: new mongoose.Types.ObjectId(contestId),
          status: "submitted",
        },
      },
      {
        $sort: {
          scorePercent: -1,
          timeTaken: 1,
          finishedAt: 1,
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "userId",
          foreignField: "_id",
          as: "user",
        },
      },
      { $unwind: "$user" },
      {
        $project: {
          _id: 0,
          userId: "$user._id",
          name: "$user.name",
          avatar: "$user.avatar",
          scorePercent: 1,
          correctCount: 1,
          wrongCount: 1,
          timeTaken: 1,
        },
      },
    ]);

    console.log("leaderboard", leaderboard);

    if (!leaderboard || leaderboard.length === 0) {
      return res.status(404).json(new ApiResponse(404, {}, Msg.DATA_NOT_FOUND));
    }

    leaderboard.map((user) => {
      user.avatar = user.avatar ? `${process.env.BASE_URL}/profile/${user.avatar}` : `${process.env.DEFAULT_PROFILE_PIC}`;
    });

    return res.status(200).json(
      new ApiResponse(200, leaderboard, "Contest leaderboard fetched")
    );
  } catch (error) {
    console.error("Contest leaderboard error:", error);
    return res
      .status(500)
      .json(new ApiResponse(500, {}, Msg.SERVER_ERROR));
  }
};



export const globalLeaderboardHandle = async (req, res) => {
  try {
    const limit = Number(req.query.limit) || 50;

    const users = await User.find({ coins: { $gt: 0 } })
      .sort({ coins: -1 })
      .limit(limit)
      .select("name avatar coins");

    const leaderboard = users.map((u, index) => ({
      rank: index + 1,
      userId: u._id,
      name: u.name,
      avatar: u.avatar
        ? `${process.env.BASE_URL}/profile/${u.avatar}`
        : process.env.DEFAULT_PROFILE_PIC,
      coins: u.coins,
    }));

    return res.status(200).json(
      new ApiResponse(200, leaderboard, "Global leaderboard fetched")
    );
  } catch (error) {
    console.error("Global leaderboard error:", error);
    return res
      .status(500)
      .json(new ApiResponse(500, {}, Msg.SERVER_ERROR));
  }
};

export const globalLeaderboardTodayHandle = async (req, res) => {
  try {
    // ✅ Use UTC-safe day range
    const start = new Date();
    start.setUTCHours(0, 0, 0, 0);

    const end = new Date();
    end.setUTCHours(23, 59, 59, 999);

    const leaderboard = await ContestAttempt.aggregate([
      {
        $match: {
          finishedAt: { $gte: start, $lte: end },
          status: "submitted", // ✅ include all participants
        },
      },
      {
        $group: {
          _id: "$userId",
          coins: { $sum: { $ifNull: ["$rewardCoins", 0] } },
        },
      },
      { $sort: { coins: -1 } },
      { $limit: 50 },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "user",
        },
      },
      { $unwind: "$user" },
      {
        $project: {
          userId: "$user._id",
          name: "$user.name",
          avatar: "$user.avatar",
          coins: 1,
        },
      },
    ]);

    if (!leaderboard.length) {
      return res
        .status(404)
        .json(new ApiResponse(404, {}, Msg.DATA_NOT_FOUND));
    }

    const data = leaderboard.map((u, i) => ({
      rank: i + 1,
      userId: u.userId,
      name: u.name,
      avatar: u.avatar
        ? `${process.env.BASE_URL}/profile/${u.avatar}`
        : process.env.DEFAULT_PROFILE_PIC,
      coins: u.coins,
    }));

    return res
      .status(200)
      .json(new ApiResponse(200, data, Msg.DATA_FETCHED));
  } catch (error) {
    console.error("Today leaderboard error:", error);
    return res
      .status(500)
      .json(new ApiResponse(500, {}, Msg.SERVER_ERROR));
  }
};

 export const globalLeaderboardMonthlyHandle = async (req, res) => {
  try {
    const start = new Date();
    start.setDate(1);
    start.setHours(0, 0, 0, 0);

    const end = new Date(start);
    end.setMonth(end.getMonth() + 1);
    end.setMilliseconds(-1);

    const leaderboard = await ContestAttempt.aggregate([
      {
        $match: {
          finishedAt: { $gte: start, $lte: end },
          rewardCoins: { $gt: 0 },
          status: "submitted",
        },
      },
      {
        $group: {
          _id: "$userId",
          coins: { $sum: "$rewardCoins" },
        },
      },
      { $sort: { coins: -1 } },
      { $limit: 50 },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "user",
        },
      },
      { $unwind: "$user" },
      {
        $project: {
          userId: "$user._id",
          name: "$user.name",
          avatar: "$user.avatar",
          coins: 1,
        },
      },
    ]);

    if (!leaderboard.length) {
      return res
        .status(404)
        .json(new ApiResponse(404, {}, Msg.DATA_NOT_FOUND));
    }

    const data = leaderboard.map((u, i) => ({
      rank: i + 1,
      userId: u.userId,
      name: u.name,
      avatar: u.avatar
        ? `${process.env.BASE_URL}/profile/${u.avatar}`
        : process.env.DEFAULT_PROFILE_PIC,
      coins: u.coins,
    }));

    return res
      .status(200)
      .json(new ApiResponse(200, data, Msg.DATA_FETCHED));
  } catch (error) {
    console.error("Monthly leaderboard error:", error);
    return res
      .status(500)
      .json(new ApiResponse(500, {}, Msg.SERVER_ERROR));
  }
};

