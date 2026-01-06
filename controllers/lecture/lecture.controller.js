import Jwt from "jsonwebtoken";
import Joi from "joi";
import axios from "axios";
import fs from "fs";
import FormData from "form-data";

import User from "../../models/user/user.js";

import Transcription from "../../models/transcription/transcription.js";
import Lecture from "../../models/lecture/lecture.js";
import Notes from "../../models/lecture/notes/notes.js";
import Summary from "../../models/lecture/summary/summary.js";

import { allowedLanguages } from "../../utils/helpers.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { Msg } from "../../utils/responseMsg.js";
import { title } from "process";

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
