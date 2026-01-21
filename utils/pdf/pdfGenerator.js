import puppeteer from "puppeteer";
 import { buildNotesHtmlTemplate } from "./pdfTemplate.js";

export const generatePdfFromHtml = async ({ title, subtitle, html }, res) => {
  // ✅ wrap content inside full template
  const finalHtml = buildNotesHtmlTemplate({
    title,
    subtitle,
    html, // this is note.html from db
  });

  const launchOptions = {
    headless: "new",
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-gpu",
      "--no-zygote",
    ],
  };

  // ✅ use chromium path only on linux server
  if (process.platform === "linux") {
    launchOptions.executablePath =
      process.env.PUPPETEER_EXECUTABLE_PATH || "/usr/bin/chromium-browser";
  }

  const browser = await puppeteer.launch(launchOptions);
  const page = await browser.newPage();

  // ✅ use finalHtml (template + css)
  await page.setContent(finalHtml, { waitUntil: "networkidle0" });

  const pdfBuffer = await page.pdf({
    format: "A4",
    printBackground: true,
    margin: { top: "30px", right: "30px", bottom: "40px", left: "30px" },
  });

  await browser.close();

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="${(title || "notes").replace(/"/g, "")}.pdf"`
  );

  return res.end(pdfBuffer);
};