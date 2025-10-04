import React from 'react';

interface TooltipProps {
  text: string;
  children: React.ReactNode;
}

export default function Tooltip({ text, children }: TooltipProps) {
  return (
    <span className="relative group">
      {children}
      <span className="invisible group-hover:visible absolute z-50 left-1/2 -translate-x-1/2 mt-2
        rounded-lg px-3 py-2 bg-[#0b1220] border border-[#21304d] text-slate-200 text-[12px] leading-[1.2]
        max-w-[360px] whitespace-normal [text-wrap:balance] shadow-2xl">
        {text}
      </span>
    </span>
  );
}
