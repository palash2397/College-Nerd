import puppeteer from "puppeteer";
import { buildNotesHtmlTemplate } from "./pdfTemplate.js";

const escapeHtml = (str = "") =>
  str
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;")
    .replaceAll("\n", "<br/>");

export const generatePdfFromHtml = async (
  { title, subtitle, html, text },
  res
) => {
  // ✅ If html is not given, convert text to html
  const bodyHtml = html ? html : `<p>${escapeHtml(text)}</p>`;

  // ✅ Wrap with template (CSS + layout)
  const finalHtml = buildNotesHtmlTemplate({
    title,
    subtitle,
    html: bodyHtml,
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

  // ✅ Linux server chromium
  if (process.platform === "linux") {
    launchOptions.executablePath =
      process.env.PUPPETEER_EXECUTABLE_PATH || "/usr/bin/chromium-browser";
  }

  const browser = await puppeteer.launch(launchOptions);
  const page = await browser.newPage();

  await page.setContent(finalHtml, { waitUntil: "networkidle0" });

  const pdfBuffer = await page.pdf({
    format: "A4",
    printBackground: true,
    margin: { top: "30px", right: "30px", bottom: "45px", left: "30px" },
  });

  await browser.close();

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="${(title || "document").replace(/"/g, "")}.pdf"`
  );

  return res.end(pdfBuffer);
};
