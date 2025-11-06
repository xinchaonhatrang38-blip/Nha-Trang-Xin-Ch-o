import React from 'react';

export const Loader: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center my-12 text-center">
      <div className="relative w-16 h-16">
        <div className="absolute top-0 left-0 w-full h-full border-4 border-slate-700 rounded-full"></div>
        <div className="absolute top-0 left-0 w-full h-full border-t-4 border-cyan-500 rounded-full animate-spin"></div>
      </div>
      <p className="mt-4 text-slate-400">AI đang làm việc... Vui lòng đợi trong giây lát.</p>
    </div>
  );
};