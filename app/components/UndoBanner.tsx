"use client";
import { ReactNode, useEffect } from "react";

type Props = {
  message: ReactNode;
  open: boolean;
  timeoutMs?: number;
  onUndo: () => void;
  onClose: () => void;
};

export default function UndoBanner({ message, open, timeoutMs = 5000, onUndo, onClose }: Props) {
  useEffect(() => {
    if (!open) return;
    const id = setTimeout(onClose, timeoutMs);
    return () => clearTimeout(id);
  }, [open, timeoutMs, onClose]);
  if (!open) return null;
  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 bg-black text-white rounded-full px-4 py-2 text-sm flex items-center gap-3 shadow-lg">
      <div>{message}</div>
      <button onClick={onUndo} className="underline underline-offset-2">Undo</button>
    </div>
  );
}


