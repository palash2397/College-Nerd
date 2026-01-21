// import fs from "fs";
// import {openai} from "../../utils/openAi/index.js";
// import { ApiResponse } from "../../utils/ApiResponse.js";
// import { Msg } from "../../utils/responseMsg.js";
// import { extractTextFromFile, deleteFile, chunkText } from "../../utils/helpers.js";

// export const generateNotesHandle = async (req, res) => {
//   let filePath;

//   try {
//     const { format = "structured" } = req.body;

//     if (!req.file) {
//       return res
//         .status(400)
//         .json(new ApiResponse(400, {}, "File is required"));
//     }

//     filePath = req.file.path;

//     /* -------- Extract PDF Text -------- */
//     const fullText = await extractTextFromFile(filePath);

//     if (!fullText || fullText.length < 100) {
//       deleteFile(filePath);
//       return res
//         .status(400)
//         .json(new ApiResponse(400, {}, "Unable to extract text"));
//     }

//     /* -------- Chunk Text -------- */
//     const chunks = chunkText(fullText);

//     const promptMap = {
//       structured: "Create structured notes with headings and bullet points.",
//       detailed: "Create detailed explanatory notes.",
//       short: "Create concise revision notes.",
//       highlight: "Extract only important terms with brief explanations.",
//     };

//     const notesParts = [];

//     /* -------- OpenAI Calls (SAFE LOOP) -------- */
//     for (const chunk of chunks) {
//       const completion = await openai.chat.completions.create({
//         model: "gpt-4o-mini",
//         messages: [
//           {
//             role: "system",
//             content: "You are an expert educational assistant.",
//           },
//           {
//             role: "user",
//             content: `${promptMap[format]}\n\n${chunk}`,
//           },
//         ],
//         temperature: 0.3,
//       });

//       notesParts.push(completion.choices[0].message.content);
//     }

//     /* -------- Merge Notes -------- */
//     const finalNotes = notesParts.join("\n\n");

//     deleteFile(filePath);

//     return res.status(200).json(
//       new ApiResponse(
//         200,
//         {
//           format,
//           notes: finalNotes,
//         },
//         Msg.DATA_GENERATED
//       )
//     );
//   } catch (error) {
//     console.error("Generate notes error:", error);

//     if (filePath) deleteFile(filePath);

//     return res
//       .status(500)
//       .json(new ApiResponse(500, {}, error.message));
//   }
// };
