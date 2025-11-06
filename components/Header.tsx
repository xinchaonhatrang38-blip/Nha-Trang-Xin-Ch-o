
import React from 'react';

export const Header: React.FC = () => {
  return (
    <header className="text-center">
      <h1 className="text-4xl sm:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-teal-500">
        AI RSS Feed Generator
      </h1>
      <p className="mt-3 text-lg text-slate-400 max-w-2xl mx-auto">
        Chuyển đổi bất kỳ trang báo hoặc blog nào thành một RSS feed hợp lệ bằng sức mạnh của AI.
      </p>
    </header>
  );
};
