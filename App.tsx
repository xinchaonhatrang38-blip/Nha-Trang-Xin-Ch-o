import React, { useState, useCallback } from 'react';
import { Header } from './components/Header';
import { UrlInputForm } from './components/UrlInputForm';
import { RssDisplay } from './components/RssDisplay';
import { Loader } from './components/Loader';
import { generateRssFromUrl } from './services/geminiService';

const App: React.FC = () => {
  const [url, setUrl] = useState<string>('https://vnexpress.net/kinh-doanh');
  const [rssFeed, setRssFeed] = useState<string | null>(null);
  const [feedUrl, setFeedUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = useCallback(async (submittedUrl: string) => {
    if (!submittedUrl) {
      setError('Vui lòng nhập một URL.');
      return;
    }
    
    // Client-side URL validation for immediate feedback
    try {
      new URL(submittedUrl);
    } catch (_) {
      setError('URL không hợp lệ. Vui lòng kiểm tra lại định dạng (ví dụ: https://example.com).');
      return;
    }

    setUrl(submittedUrl);
    setIsLoading(true);
    setError(null);
    setRssFeed(null);
    setFeedUrl(null);

    try {
      const feed = await generateRssFromUrl(submittedUrl);
      setRssFeed(feed);
      const fullFeedUrl = `${window.location.origin}/.netlify/functions/generate-rss?url=${encodeURIComponent(submittedUrl)}`;
      setFeedUrl(fullFeedUrl);
    } catch (e) {
      console.error(e);
      const errorMessage = e instanceof Error ? e.message : 'Đã xảy ra lỗi không xác định.';
      setError(`Không thể tạo RSS feed. Lỗi: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 font-sans p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto">
        <Header />
        <main className="mt-8">
          <UrlInputForm
            initialUrl={url}
            onSubmit={handleSubmit}
            isLoading={isLoading}
          />

          {error && (
            <div className="mt-6 bg-red-900/50 border border-red-700 text-red-300 px-4 py-3 rounded-lg" role="alert">
              <strong className="font-bold">Lỗi!</strong>
              <span className="block sm:inline ml-2">{error}</span>
            </div>
          )}

          {isLoading && <Loader />}

          {rssFeed && !isLoading && (
            <div className="mt-8">
              <h2 className="text-2xl font-bold text-cyan-400 mb-4">RSS Feed được tạo</h2>
              <RssDisplay rssXml={rssFeed} feedUrl={feedUrl} />
            </div>
          )}

          {!isLoading && !rssFeed && !error && (
             <div className="mt-8 text-center text-slate-400 p-8 bg-slate-800/50 rounded-lg border border-slate-700">
                <p className="text-lg">Nhập một URL của trang tin tức hoặc blog để bắt đầu.</p>
                <p className="mt-2 text-sm">AI sẽ phân tích và tạo ra một RSS feed cho bạn.</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default App;