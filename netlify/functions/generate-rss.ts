import type { Handler, HandlerEvent, HandlerContext } from "@netlify/functions";
import { GoogleGenAI } from "@google/genai";

// Helper function to return a structured error, which the frontend expects.
const createErrorResponse = (message: string, statusCode: number = 500) => {
  // The frontend code in `geminiService.ts` specifically looks for this format.
  return {
    statusCode,
    headers: { 'Content-Type': 'application/xml' },
    body: `<error><message>${message}</message></error>`,
  };
};

const handler: Handler = async (event: HandlerEvent, context: HandlerContext) => {
  if (event.httpMethod !== 'GET') {
    return { 
      statusCode: 405, 
      body: 'Method Not Allowed' 
    };
  }

  const { url } = event.queryStringParameters || {};

  if (!url) {
    return createErrorResponse("URL parameter is missing.", 400);
  }

  let decodedUrl: string;
  try {
    decodedUrl = decodeURIComponent(url);
    // Basic URL validation. The URL constructor will throw if it's invalid.
    new URL(decodedUrl);
  } catch (error) {
    return createErrorResponse("Invalid URL format provided.", 400);
  }

  try {
    // 1. Fetch the HTML content of the target URL.
    // Set a reasonable timeout to prevent long-running functions.
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 seconds
    
    const response = await fetch(decodedUrl, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (!response.ok) {
      return createErrorResponse(`Failed to fetch the URL. Server responded with status: ${response.status}`, 502);
    }
    const htmlContent = await response.text();

    // 2. Initialize Gemini API
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
      // This is a server configuration error, so we log it and return a generic error to the user.
      console.error("API_KEY environment variable is not set.");
      return createErrorResponse("Server configuration error. Unable to process request.", 500);
    }
    // Correct initialization following the guidelines.
    const ai = new GoogleGenAI({ apiKey });

    // 3. Construct the prompt for Gemini.
    const prompt = `
      You are an expert AI that converts a news or blog website's HTML into a valid RSS 2.0 feed.
      Analyze the following HTML from the URL: ${decodedUrl}
      Your task is to generate a complete and valid RSS 2.0 XML feed.

      **Instructions:**
      1.  The output MUST be only the raw XML content, starting with \`<?xml version="1.0" encoding="UTF-8" ?>\`. Do not add any other text, markdown, or explanations.
      2.  Create a \`<channel>\` with:
          - \`<title>\`: The main title of the website.
          - \`<link>\`: The original URL: ${decodedUrl}
          - \`<description>\`: A brief summary of the website's purpose.
          - \`<language>\`: Infer the language from the content (e.g., 'vi-vn' for Vietnamese, 'en-us' for English).
          - \`<lastBuildDate>\`: The current date and time in RFC 822 format.
      3.  Create multiple \`<item>\` elements for each article found on the page (target 5-15 items). Each \`<item>\` must have:
          - \`<title>\`: The article's headline.
          - \`<link>\`: The absolute URL to the full article. If you find a relative URL (e.g., "/path/to/article"), prepend it with "${new URL(decodedUrl).origin}".
          - \`<description>\`: A concise summary or the beginning of the article content.
          - \`<pubDate>\`: The publication date in RFC 822 format (e.g., "Wed, 02 Oct 2002 13:00:00 GMT"). If a date is not found, you can omit this tag for the item.

      **Error Handling:**
      -   If you cannot process the HTML or determine it's not a news/blog page, you MUST return a response containing ONLY the following XML structure:
          \`<error><message>The AI could not process the provided URL. It may not be a valid news or blog page.</message></error>\`

      **HTML Content to Analyze:**
      \`\`\`html
      ${htmlContent}
      \`\`\`
    `;

    // 4. Generate content using the Gemini API.
    const geminiResponse = await ai.models.generateContent({
        model: "gemini-2.5-flash", // A good balance of speed and capability for this task.
        contents: prompt,
    });
    
    // 5. Extract and validate the response.
    const rssFeed = geminiResponse.text.trim();
    
    if (!rssFeed) {
        return createErrorResponse("The AI returned an empty response.", 500);
    }

    // The frontend expects either an <error> tag or a valid XML feed.
    // If the AI followed instructions for an error, we pass it through.
    // Otherwise, we ensure it looks like a valid RSS feed.
    if (!rssFeed.startsWith('<error>') && !rssFeed.startsWith('<?xml')) {
        console.error("AI response did not conform to the expected format. Response:", rssFeed);
        return createErrorResponse("The AI returned a response in an unexpected format.", 500);
    }


    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/xml; charset=utf-8",
      },
      body: rssFeed,
    };

  } catch (error) {
    console.error("Error in generate-rss function:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown internal error occurred.";
    return createErrorResponse(`Failed to generate RSS feed. ${errorMessage}`, 500);
  }
};

export { handler };
