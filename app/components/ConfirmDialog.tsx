"use client";
import { ReactNode } from "react";

type Props = {
  open: boolean;
  title?: string;
  description?: string | ReactNode;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
};

export default function ConfirmDialog({ open, title = "Are you sure?", description, confirmText = "Delete", cancelText = "Cancel", onConfirm, onCancel }: Props) {
  if (!open) return null;
  return (
    <div role="dialog" aria-modal className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onCancel} />
      <div className="relative bg-white rounded-lg shadow-lg w-[90%] max-w-sm p-4 grid gap-3">
        <div className="text-lg font-semibold">{title}</div>
        {description ? <div className="text-sm text-gray-600">{description}</div> : null}
        <div className="flex gap-2 justify-end">
          <button onClick={onCancel} className="border rounded px-3 py-1 text-sm">{cancelText}</button>
          <button onClick={onConfirm} className="border rounded px-3 py-1 text-sm bg-red-600 text-white">{confirmText}</button>
        </div>
      </div>
    </div>
  );
}


