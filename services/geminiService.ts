export async function generateRssFromUrl(url: string): Promise<string> {
  if (!url) {
    throw new Error("URL is required.");
  }
  
  // The endpoint for our Netlify Function.
  // This relative path works both in local development (with Netlify Dev) and in production.
  const endpoint = `/.netlify/functions/generate-rss?url=${encodeURIComponent(url)}`;

  try {
    const response = await fetch(endpoint);
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Server error: ${response.status} - ${errorText}`);
    }
    
    const rssFeed = await response.text();
    return rssFeed;
  } catch (error) {
    console.error("Error fetching from Netlify function:", error);
    if (error instanceof Error) {
        throw new Error(`Không thể tạo RSS feed: ${error.message}`);
    }
    throw new Error("Đã xảy ra lỗi không xác định khi tạo RSS feed.");
  }
}
