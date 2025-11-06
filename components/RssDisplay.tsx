import React, { useState, useCallback } from 'react';
import { CopyIcon, CheckIcon } from './icons';

interface RssDisplayProps {
  rssXml: string;
  feedUrl: string | null;
}

export const RssDisplay: React.FC<RssDisplayProps> = ({ rssXml, feedUrl }) => {
  const [xmlCopied, setXmlCopied] = useState(false);
  const [urlCopied, setUrlCopied] = useState(false);

  const handleXmlCopy = useCallback(() => {
    navigator.clipboard.writeText(rssXml).then(() => {
      setXmlCopied(true);
      setTimeout(() => setXmlCopied(false), 2000);
    });
  }, [rssXml]);

  const handleUrlCopy = useCallback(() => {
    if (!feedUrl) return;
    navigator.clipboard.writeText(feedUrl).then(() => {
      setUrlCopied(true);
      setTimeout(() => setUrlCopied(false), 2000);
    });
  }, [feedUrl]);

  return (
    <div className="space-y-6">
      {feedUrl && (
        <div className="relative bg-slate-800/60 border border-slate-700 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-slate-300 mb-2">URL của Feed</h3>
          <p className="text-sm text-slate-400 mb-3">Bạn có thể sử dụng URL này trong trình đọc RSS của mình.</p>
          <div className="flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={feedUrl}
              className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-md text-cyan-300 text-sm focus:ring-2 focus:ring-cyan-500 focus:outline-none"
              onFocus={(e) => e.target.select()}
            />
            <button
              onClick={handleUrlCopy}
              className="flex-shrink-0 flex items-center gap-2 px-3 py-2 text-sm bg-slate-700 hover:bg-slate-600 rounded-md transition-colors text-slate-300"
              aria-label="Copy Feed URL"
            >
              {urlCopied ? (
                <>
                  <CheckIcon className="w-4 h-4 text-green-400" />
                  <span>Đã chép</span>
                </>
              ) : (
                <>
                  <CopyIcon className="w-4 h-4" />
                  <span>Chép URL</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      <div className="relative bg-slate-900/70 border border-slate-700 rounded-lg shadow-xl overflow-hidden">
        <div className="flex justify-between items-center px-4 py-2 bg-slate-800 border-b border-slate-700">
          <span className="text-sm font-medium text-slate-400">Nội dung Feed (XML)</span>
          <button
            onClick={handleXmlCopy}
            className="flex items-center gap-2 px-3 py-1 text-sm bg-slate-700 hover:bg-slate-600 rounded-md transition-colors text-slate-300"
            aria-label="Copy XML Content"
          >
            {xmlCopied ? (
              <>
                <CheckIcon className="w-4 h-4 text-green-400" />
                <span>Đã chép!</span>
              </>
            ) : (
              <>
                <CopyIcon className="w-4 h-4" />
                <span>Chép XML</span>
              </>
            )}
          </button>
        </div>
        <pre className="p-4 text-sm text-slate-300 overflow-x-auto max-h-[60vh]">
          <code className="language-xml">
            {rssXml}
          </code>
        </pre>
      </div>
    </div>
  );
};