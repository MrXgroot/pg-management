import { useState, useEffect } from "react";
import { Signal, Wifi } from "lucide-react";

export function MobileDeviceFrame({ children }) {
  const [time, setTime] = useState("9:41");

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      let hours = now.getHours() % 12 || 12;
      let minutes = now.getMinutes();
      setTime(`${hours}:${minutes < 10 ? `0${minutes}` : minutes}`);
    };

    updateTime();
    const interval = setInterval(updateTime, 20000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#E2E8F0] p-0 antialiased sm:p-5 dark:bg-[#07080A]">
      {/* Outer Mobile Hardware Shell */}
      <div className="relative flex h-[100dvh] w-full max-w-[420px] flex-col overflow-hidden border-0 bg-[#F1F4F9] shadow-[0_30px_90px_rgba(15,23,42,0.22)] sm:h-[900px] sm:max-h-[96vh] sm:rounded-[44px] sm:border-[9px] sm:border-[#1E1F24] dark:bg-[#111215]">
        {/* Dynamic Island & Status Bar */}
        <div className="z-30 flex shrink-0 select-none items-center justify-between px-7 pb-1 pt-3 text-xs font-semibold text-slate-800 dark:text-neutral-200">
          <span className="font-bold tracking-tight">{time}</span>

          {/* Dynamic Island pill */}
          <div className="mx-auto hidden h-5 w-24 items-center justify-end rounded-full bg-black pr-2.5 sm:flex dark:bg-[#1A1B1F]">
            <div className="h-2 w-2 rounded-full border border-blue-500/30 bg-[#182035]/80" />
          </div>

          {/* Network & Battery Status Icons */}
          <div className="flex items-center space-x-1.5">
            <Signal className="h-3.5 w-3.5 stroke-[2.2]" />
            <Wifi className="h-3.5 w-3.5 stroke-[2.2]" />
            <div className="flex h-2.5 w-4 items-center rounded-[3px] border border-current p-0.5">
              <div className="h-full w-2.5 rounded-[1px] bg-current" />
            </div>
          </div>
        </div>

        {/* Root Screen Viewport */}
        <div className="relative flex flex-1 flex-col overflow-hidden">
          {children}
        </div>
      </div>
    </div>
  );
}
