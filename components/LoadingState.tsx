import React from "react";

const LoadingState = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 rounded-full border-2 border-teal-500 border-t-transparent animate-spin" />
        <span className="text-sm text-gray-400">Loading…</span>
      </div>
    </div>
  );
};

export default LoadingState;
