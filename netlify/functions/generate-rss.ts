import { GoogleGenAI } from "@google/genai";
import type { Handler, HandlerEvent } from "@netlify/functions";

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
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

  const prompt = `
    You are an expert web scraper and RSS feed generator. Your task is to analyze the content of the given URL and generate a valid RSS 2.0 feed in XML format.

    Given the URL: "${url}"

    Please perform the following steps:
    1. Identify the main list of articles on the page. Look for common HTML patterns like <article>, .post-item, .story-item, etc.
    2. For each article, extract the following information:
      - Title of the article.
      - A direct link (href). Ensure this is a full URL. If you find a relative path like '/path/to/article', prepend it with the original site's base URL (e.g., '${new URL(url).origin}/path/to/article').
      - A short description or summary.
      - A thumbnail image URL. Make sure it's a full URL.
      - A publication date. Format it as a valid RFC 822 date (e.g., Wed, 02 Oct 2002 15:00:00 GMT). If no date is found, use the current date.
    3. Construct a valid RSS 2.0 XML document. The feed should have a main <channel> with a title (e.g., "RSS Feed for ${url}"), link (the original URL), and a suitable description.
    4. Each article should be an <item> inside the channel. Include <title>, <link>, <description>, <pubDate>, and <guid>. Use the article link for the <guid>. Enclose the description in <![CDATA[]]> if it contains HTML.
    5. Generate between 5 to 10 <item> entries.
    
    IMPORTANT: Your output MUST be only the raw XML content. Do not include any explanations, comments, or markdown fences like \`\`\`xml. Start your response directly with \`<?xml version="1.0" encoding="UTF-8" ?>\`.

    If you cannot access the URL or find any articles, return a valid RSS feed with a single <item> explaining the error in the title and description.
  `;

  try {
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
    });
    const rssFeed = response.text;

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/xml; charset=utf-8",
      },
      body: rssFeed,
    };
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    return {
      statusCode: 500,
      body: "Error: Failed to generate content from Gemini API.",
    };
  }
};

export { handler };
