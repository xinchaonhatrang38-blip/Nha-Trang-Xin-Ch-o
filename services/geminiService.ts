export async function generateRssFromUrl(url: string): Promise<string> {
  if (!url) {
    throw new Error("URL is required.");
  }
  
  const endpoint = `/.netlify/functions/generate-rss?url=${encodeURIComponent(url)}`;

  try {
    const response = await fetch(endpoint);
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Server error: ${response.status} - ${errorText || 'Unknown server error'}`);
    }
    
    const responseText = await response.text();

    // Check if the AI returned a structured error message
    if (responseText.trim().startsWith('<error>')) {
      // Extract the user-friendly message from the XML
      const errorMessage = responseText.match(/<message>(.*?)<\/message>/)?.[1] || 'AI could not process the URL.';
      throw new Error(errorMessage);
    }
    
    if (!responseText.trim().startsWith('<?xml')) {
      throw new Error('Phản hồi từ AI không phải là một XML hợp lệ.');
    }

    return responseText;
  } catch (error) {
    console.error("Error fetching from Netlify function:", error);
    if (error instanceof Error) {
        // Re-throw the specific error message for the UI to catch
        throw error;
    }
    throw new Error("Đã xảy ra lỗi không xác định khi tạo RSS feed.");
  }
}
