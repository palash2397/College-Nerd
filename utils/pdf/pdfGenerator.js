import puppeteer from "puppeteer";
// import { buildNotesHtmlTemplate } from "./pdfTemplate.js";

export const generatePdfFromHtml = async ({ title, subtitle, html }, res) => {
  const browser = await puppeteer.launch({
    headless: "new",
    executablePath: "/usr/bin/chromium-browser",
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-gpu",
      "--no-zygote",
    ],
  });

  const page = await browser.newPage();

  await page.setContent(html, { waitUntil: "networkidle0" });

  const pdfBuffer = await page.pdf({
    format: "A4",
    printBackground: true,
    margin: {
      top: "30px",
      right: "30px",
      bottom: "40px",
      left: "30px",
    },
  });

  await browser.close();

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="${(title || "notes").replace(/"/g, "")}.pdf"`
  );

  return res.end(pdfBuffer);
};