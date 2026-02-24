import React, { useState, useEffect, useRef } from "react";
import { MousePointer2 } from "lucide-react";
import { getCurrentWindow } from "@tauri-apps/api/window";

const Overlay = () => {
  const [isSelecting, setIsSelecting] = useState(false);
  const [startCoords, setStartCoords] = useState({ x: 0, y: 0 });
  const [selectionStyle, setSelectionStyle] = useState({
    left: 0,
    top: 0,
    width: 0,
    height: 0,
    display: "none",
  });
  const [cursorPos, setCursorPos] = useState({ x: 0, y: 0 });
  const [cursorVisible, setCursorVisible] = useState(false);

  const tauriWindow = getCurrentWindow();

  // Force proctor/lockdown mode when overlay mounts
  useEffect(() => {
    const lockScreen = async () => {
      await tauriWindow.setAlwaysOnTop(true);
      await tauriWindow.setFullscreen(false);
      await tauriWindow.maximize();
      await tauriWindow.setDecorations(false);

      // Make it invisible in screen recordings (macOS panel)
      if (typeof tauriWindow.toPanel === "function") {
        tauriWindow.toPanel();
      }
    };

    lockScreen();
  }, [tauriWindow]);

  // Mouse selection handlers
  const handleMouseDown = (e) => {
    setIsSelecting(true);
    setStartCoords({ x: e.clientX, y: e.clientY });
    setSelectionStyle({
      left: e.clientX,
      top: e.clientY,
      width: 0,
      height: 0,
      display: "block",
    });
  };

  const handleMouseMove = (e) => {
    setCursorPos({ x: e.clientX, y: e.clientY });
    if (!cursorVisible) setCursorVisible(true);

    if (!isSelecting) return;

    const width = Math.abs(e.clientX - startCoords.x);
    const height = Math.abs(e.clientY - startCoords.y);
    const left = Math.min(e.clientX, startCoords.x);
    const top = Math.min(e.clientY, startCoords.y);

    setSelectionStyle({ left, top, width, height, display: "block" });
  };

  const handleMouseUp = () => {
    setIsSelecting(false);
    setSelectionStyle((prev) => ({ ...prev, display: "none" }));

    // You can add your own logic here (e.g. send coordinates to interviewer)
    console.log("Selection ended");
  };

  // ESC key to exit proctor mode
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === "Escape") {
        tauriWindow.emit("proctor-cancelled", {});
      }
    };

    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, [tauriWindow]);

  return (
    <div
      className="fixed inset-0 w-screen h-screen overflow-hidden z-[99999]"
      style={{
        backgroundColor: "rgba(15, 23, 42, 0.45)",
        backdropFilter: "blur(4px)",
        cursor: "none",
      }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    >
      {/* Locked Interview Banner */}
      <div className="fixed top-6 left-1/2 -translate-x-1/2 bg-black/90 text-white px-8 py-3 rounded-2xl text-sm font-medium pointer-events-none shadow-2xl">
        Interview Locked • Press ESC to exit
      </div>

      {/* Questions Panel */}
      <div className="fixed right-8 top-1/4 w-96 bg-black/40 backdrop-blur-md border border-white/10 p-6 rounded-2xl text-white shadow-2xl pointer-events-auto flex flex-col gap-4">
        <h2 className="text-xl font-bold border-b border-white/10 pb-3">Interview Questions</h2>
        
        <div className="bg-white/5 p-4 rounded-xl border border-white/5 hover:bg-white/10 transition-colors cursor-pointer">
          <h3 className="font-semibold text-red-400 mb-2 truncate">Q1. Event Loop in JS</h3>
          <p className="text-sm text-gray-200 line-clamp-3">Explain how the event loop works in JavaScript. What is the difference between the microtask queue and the macrotask queue?</p>
        </div>

        <div className="bg-white/5 p-4 rounded-xl border border-white/5 hover:bg-white/10 transition-colors cursor-pointer">
          <h3 className="font-semibold text-red-400 mb-2 truncate">Q2. React Component Lifecycle</h3>
          <p className="text-sm text-gray-200 line-clamp-3">Describe the React hook equivalents of `componentDidMount`, `componentDidUpdate`, and `componentWillUnmount`. How does the dependency array affect execution?</p>
        </div>

        <div className="bg-white/5 p-4 rounded-xl border border-white/5 hover:bg-white/10 transition-colors cursor-pointer">
          <h3 className="font-semibold text-red-400 mb-2 truncate">Q3. Web Security (XSS/CSRF)</h3>
          <p className="text-sm text-gray-200 line-clamp-3">How do Cross-Site Scripting (XSS) and Cross-Site Request Forgery (CSRF) differ? What strategies would you use to mitigate these vulnerabilities in a modern web app?</p>
        </div>
      </div>

      {/* Selection Rectangle */}
      <div
        className="absolute border-2 border-red-500 bg-red-500/10 pointer-events-none rounded-xl"
        style={{
          left: selectionStyle.left,
          top: selectionStyle.top,
          width: selectionStyle.width,
          height: selectionStyle.height,
          display: selectionStyle.display,
        }}
      />

      {/* Custom Cursor */}
      <div
        className="fixed pointer-events-none z-[100000] transition-opacity duration-100"
        style={{
          left: cursorPos.x,
          top: cursorPos.y,
          transform: "translate(-50%, -50%)",
          opacity: cursorVisible ? 1 : 0,
        }}
      >
        <MousePointer2 className="w-7 h-7 text-red-500 drop-shadow-2xl" />
      </div>
    </div>
  );
};

export default Overlay;