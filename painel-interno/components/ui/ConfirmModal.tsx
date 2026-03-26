"use client";

type Props = {
  open: boolean;
  title: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
};

export default function ConfirmModal({
  open,
  title,
  description,
  confirmText = "Confirmar",
  cancelText = "Cancelar",
  onConfirm,
  onCancel,
}: Props) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center">
      {/* overlay */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onCancel}
      />

      {/* modal */}
      <div
        className="
          relative
          bs-glass
          border border-white/10
          rounded-3xl
          p-6
          w-full
          max-w-md
          mx-4
        "
      >
        <h2 className="text-lg font-medium text-white mb-2">{title}</h2>

        {description && (
          <p className="text-sm text-white/60 mb-6">{description}</p>
        )}

        <div className="flex gap-3 justify-end">
          <button
            onClick={onCancel}
            className="
              px-4 py-2
              rounded-lg
              border border-white/20
              text-white/70
              hover:border-white/40
              transition
            "
          >
            {cancelText}
          </button>

          <button
            onClick={onConfirm}
            className="
              px-4 py-2
              rounded-lg
              bg-red-500
              text-white
              hover:bg-red-600
              transition
            "
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
