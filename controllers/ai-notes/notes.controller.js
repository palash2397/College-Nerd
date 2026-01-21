import fs from "fs";
import {openai} from "../../utils/openAi/index.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { Msg } from "../../utils/responseMsg.js";
import { extractTextFromFile, deleteFile } from "../../utils/helpers.js";

export const generateNotesHandle = async (req, res) => {
    let filePath;

    try {
        const { format = "structured", title = "Lecture Notes" } = req.body;

        if (!req.file) {
            return res.status(400).json(new ApiResponse(400, {}, "File is required"));
        }

        filePath = req.file.path;

        /* ---------------- Extract text from file ---------------- */
        const lectureText = await extractTextFromFile(filePath);

        if (!lectureText || lectureText.length < 50) {
            return res
                .status(400)
                .json(new ApiResponse(400, {}, "Unable to extract meaningful text"));
        }

        /* ---------------- Prompt based on format ---------------- */
        const formatPromptMap = {
            structured:
                "Create structured notes with headings, bullet points, and sections.",
            detailed: "Create detailed notes with explanations and examples.",
            short: "Create concise short notes focusing on key points only.",
            highlight:
                "Extract and list only important terms with brief explanations.",
        };

        const systemPrompt = `
                 You are an expert educational assistant.
                 ${formatPromptMap[format] || formatPromptMap.structured}
                 Keep output clean and easy to read.
                 `;

        /* ---------------- OpenAI Call ---------------- */
        const aiResponse = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                { role: "system", content: systemPrompt },
                {
                    role: "user",
                    content: `Title: ${title}\n\nContent:\n${lectureText}`,
                },
            ],
            temperature: 0.4,
        });

        const notes =
            aiResponse.choices?.[0]?.message?.content || "No notes generated";

        /* ---------------- Cleanup ---------------- */
        deleteFile(filePath);

        /* ---------------- Response ---------------- */
        return res.status(200).json(
            new ApiResponse(
                200,
                {
                    title,
                    format,
                    notes,
                },
                Msg.DATA_GENERATED,
            ),
        );
    } catch (error) {
        console.error("Generate notes error:", error);

        if (filePath) deleteFile(filePath);

        return res.status(500).json(new ApiResponse(500, {}, Msg.SERVER_ERROR));
    }
};
