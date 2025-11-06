import { GoogleGenAI } from "@google/genai";
import type { Handler, HandlerEvent } from "@netlify/functions";

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  // This error is for the developer/deployer, not the end user.
  throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

const handler: Handler = async (event: HandlerEvent) => {
  const url = event.queryStringParameters?.url;

  if (!url) {
    return {
      statusCode: 400,
      body: "Error: URL query parameter is required.",
    };
  }

  // Server-side URL validation
  try {
    new URL(url);
  } catch (_) {
    return {
      statusCode: 400,
      body: "Error: Invalid URL format provided.",
    };
  }
  
  const siteOrigin = new URL(url).origin;

  const prompt = `
    You are an expert web scraper and RSS feed generator. Your task is to analyze the content of the given URL and generate a valid RSS 2.0 feed in XML format.

    Given the URL: "${url}"

    Please perform the following steps:
    1. Identify the main list of articles on the page. Look for common HTML patterns like <article>, .post-item, .story-item, etc.
    2. For each article, extract the following information:
      - Title of the article.
      - A direct link (href). Ensure this is a full URL. If you find a relative path like '/path/to/article', prepend it with the site's origin: '${siteOrigin}'.
      - A short description or summary.
      - A thumbnail image URL. Make sure it's a full URL.
      - A publication date. Format it as a valid RFC 822 date (e.g., Wed, 02 Oct 2002 15:00:00 GMT). If no date is found, use the current date.
    3. Construct a valid RSS 2.0 XML document. The feed should have a main <channel> with a title (e.g., "RSS Feed for ${url}"), link (the original URL), and a suitable description.
    4. Each article should be an <item> inside the channel. Include <title>, <link>, <description>, <pubDate>, and <guid>. Use the article link for the <guid>. Enclose the description in <![CDATA[]]> if it contains HTML.
    5. Generate between 5 to 10 <item> entries.
    
    **CRITICAL ERROR HANDLING RULES:**
    - If you cannot access the URL, cannot parse the HTML, or cannot find any articles, DO NOT generate a sample RSS feed.
    - Instead, your entire output MUST be a single XML element in the following format:
      <error>
        <message>A user-friendly error message explaining the problem (e.g., 'Could not access the provided URL.' or 'No articles were found on this page.')</message>
      </error>
    - This <error> block is the ONLY thing you should return in case of a failure.
    
    **OUTPUT FORMAT RULES:**
    - If successful, your output MUST be only the raw XML content. 
    - Start your response directly with \`<?xml version="1.0" encoding="UTF-8" ?>\`.
    - Do not include any explanations, comments, or markdown fences like \`\`\`xml.
  `;

  try {
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
    });
    const resultText = response.text;

    // The backend should still respect the content type for the client
    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/xml; charset=utf-8",
      },
      body: resultText,
    };
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    // Return a generic server error if the API call itself fails
    const errorXml = `<error><message>An internal error occurred while contacting the AI service.</message></error>`;
    return {
      statusCode: 500,
      headers: {
        "Content-Type": "application/xml; charset=utf-8",
      },
      body: errorXml,
    };
  }
};

export { handler };