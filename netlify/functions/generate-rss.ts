import type { Handler, HandlerEvent } from "@netlify/functions";
import { GoogleGenAI } from "@google/genai";
import axios from 'axios';

// --- Caching Layer ---
// This simple in-memory cache helps reduce redundant API calls for the same URL.
// It's effective within the lifecycle of a single serverless function instance.
interface CacheEntry {
  timestamp: number;
  data: string;
}
const cache = new Map<string, CacheEntry>();
const CACHE_DURATION_MS = 10 * 60 * 1000; // 10 minutes

// --- Helper Functions ---
const createErrorResponse = (message: string, statusCode: number = 500) => {
  return {
    statusCode,
    headers: { 'Content-Type': 'application/xml; charset=utf-8' },
    body: `<error><message>${message}</message></error>`,
  };
};

// --- Main Handler ---
const handler: Handler = async (event: HandlerEvent) => {
  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const { url } = event.queryStringParameters || {};

  if (!url) {
    return createErrorResponse("URL parameter is missing.", 400);
  }

  let decodedUrl: string;
  try {
    decodedUrl = decodeURIComponent(url);
    new URL(decodedUrl);
  } catch (error) {
    return createErrorResponse("Invalid URL format provided.", 400);
  }

  // Check cache first
  const cachedItem = cache.get(decodedUrl);
  if (cachedItem && Date.now() - cachedItem.timestamp < CACHE_DURATION_MS) {
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/xml; charset=utf-8', 'X-Cache': 'HIT' },
      body: cachedItem.data,
    };
  }

  try {
    // 1. Fetch HTML content more reliably using axios
    const { data: htmlContent } = await axios.get(decodedUrl, {
      timeout: 15000, // 15-second timeout
      headers: {
        // Use a common browser User-Agent to avoid being blocked
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      },
    });

    // 2. Initialize Gemini API
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
      console.error("API_KEY environment variable is not set.");
      return createErrorResponse("Server configuration error.", 500);
    }
    const ai = new GoogleGenAI({ apiKey });

    // 3. Construct the prompt for Gemini
    const prompt = `
      You are an expert AI that converts a news or blog website's HTML into a valid RSS 2.0 feed.
      Analyze the following HTML from the URL: ${decodedUrl}
      Your task is to generate a complete and valid RSS 2.0 XML feed.

      **Instructions:**
      1.  The output MUST be only the raw XML content, starting with \`<?xml version="1.0" encoding="UTF-8" ?>\`. Do not add any other text, markdown, or explanations.
      2.  Create a \`<channel>\` with appropriate \`<title>\`, \`<link>\`, \`<description>\`, \`<language>\`, and \`<lastBuildDate>\`.
      3.  Create multiple \`<item>\` elements for each article (target 5-15 items). Each must have \`<title>\`, \`<link>\` (absolute URL), \`<description>\`, and optionally \`<pubDate>\`.

      **Error Handling:**
      -   If you cannot process the HTML or find any articles, you MUST return a response containing ONLY the following XML structure:
          \`<error><message>The AI could not find any articles on the provided URL. It may not be a valid news or blog page.</message></error>\`

      **HTML Content to Analyze:**
      \`\`\`html
      ${htmlContent}
      \`\`\`
    `;

    // 4. Generate content
    const geminiResponse = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
    });
    
    // 5. Extract and validate the response
    const rssFeed = geminiResponse.text.trim();
    
    if (!rssFeed) {
        return createErrorResponse("The AI returned an empty response.", 500);
    }

    if (rssFeed.startsWith('<error>')) {
        // This is a valid error response from the AI, pass it through but don't cache it.
        return {
            statusCode: 200, // The function worked, but AI couldn't find content
            headers: { 'Content-Type': 'application/xml; charset=utf-8' },
            body: rssFeed,
        };
    }

    if (!rssFeed.startsWith('<?xml')) {
        console.error("AI response did not conform to the expected XML format. Response:", rssFeed);
        return createErrorResponse("The AI returned a response in an unexpected format.", 500);
    }

    // Cache the successful result
    cache.set(decodedUrl, { timestamp: Date.now(), data: rssFeed });

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/xml; charset=utf-8', 'X-Cache': 'MISS' },
      body: rssFeed,
    };

  } catch (error) {
    console.error("Error in generate-rss function:", error);
    const errorMessage = axios.isAxiosError(error) 
        ? `Failed to fetch URL: ${error.message}` 
        : (error instanceof Error ? error.message : "An unknown internal error occurred.");
    return createErrorResponse(errorMessage, 500);
  }
};

export { handler };
