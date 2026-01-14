// import OpenAI from "openai";

// const openai = new OpenAI({
//   apiKey: ``,
// });

// export async function generateMcqFromTranscriptText(transcriptText) {
//   const prompt = `
// Generate 10 Multiple-Choice Questions from the following transcript.

// Requirements:
// - Difficulty: medical student level
// - 4 options per question
// - Only ONE correct answer
// - Provide a short explanation
// - Return ONLY valid JSON in this format:

// [
//   {
//     "question": "",
//     "options": ["", "", "", ""],
//     "answer": "",
//     "explanation": ""
//   }
// ]

// Transcript:
// ${transcriptText}
// `;

//   const completion = await openai.chat.completions.create({
//     model: "gpt-4.1-mini",
//     messages: [
//       { role: "system", content: "You generate clinical MCQ questions." },
//       { role: "user", content: prompt },
//     ],
//     temperature: 0.3,
//   });

//   const raw = completion.choices[0].message.content;

//   // Ensure JSON parsing
//   const mcq = JSON.parse(raw);

//   console.log("mcq --->", mcq);

//   return mcq;
// }

// const transcript =
//   "CT (Computed Tomography) is a diagnostic imaging technique that uses a series of X-ray beams and computer processing to create detailed cross-sectional images of the body. It is especially useful for evaluating bones, lungs, blood vessels, and internal organs, making it highly valuable in detecting fractures, internal bleeding, tumors, infections, and stroke. CT scans are faster than MRI and typically take only a few minutes, which makes them particularly helpful in emergency situations and trauma cases. However, CT scanning exposes patients to ionizing radiation, so repeated scans should be avoided unless medically necessary. In some cases, contrast dye may be used to improve image clarity, but it can cause allergic reactions or kidney-related complications in sensitive individuals, and patients with known allergies or kidney disease should inform their doctor beforehand";

// const mcq = await generateMcqFromTranscriptText(transcript);

// console.log(mcq);

