import React, { useState } from "react";
import { Trash2 } from "lucide-react";

interface SwipeableItemProps {
  children: React.ReactNode;
  onErase: () => void | Promise<void>;
  title?: string;
}

export const SwipeableItem: React.FC<SwipeableItemProps> = ({ children, onErase, title = "entry" }) => {
  const [dragOffset, setDragOffset] = useState(0);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartX(e.touches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartX === null) return;
    const currentX = e.touches[0].clientX;
    const diff = currentX - touchStartX;

    // Only allow left swipe up to -80px
    if (diff < 0) {
      setDragOffset(Math.max(diff, -80));
    }
  };

  const handleTouchEnd = () => {
    if (dragOffset < -40) {
      setDragOffset(-75); // Snap open erase action
    } else {
      setDragOffset(0);
    }
    setTouchStartX(null);
  };

  const handleConfirmErase = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm(`Erase this ${title}?`)) {
      setIsDeleting(true);
      setTimeout(async () => {
        await onErase();
      }, 200);
    }
  };

  if (isDeleting) return null;

  return (
    <div className="relative overflow-hidden rounded-2xl group transition-all">
      {/* Background Red Erase Layer */}
      <div className="absolute inset-0 bg-mood/20 border border-mood/40 rounded-2xl flex items-center justify-end px-4">
        <button
          onClick={handleConfirmErase}
          className="px-3 py-1.5 rounded-xl bg-mood text-background font-bold text-xs flex items-center gap-1.5 shadow-glow-mood"
        >
          <Trash2 className="w-4 h-4 stroke-[2.5]" />
          <span>Erase</span>
        </button>
      </div>

      {/* Foreground Main Item */}
      <div
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{ transform: `translateX(${dragOffset}px)` }}
        className="relative bg-surface-level2 transition-transform duration-150 ease-out rounded-2xl flex items-center justify-between"
      >
        <div className="flex-1">{children}</div>

        {/* Desktop Quick Erase Trash Icon on Hover */}
        <button
          onClick={handleConfirmErase}
          title={`Erase ${title}`}
          className="hidden group-hover:flex items-center gap-1 mr-3 px-2.5 py-1.5 rounded-xl bg-mood/15 hover:bg-mood text-mood hover:text-background border border-mood/30 text-xs font-bold transition-all"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Erase</span>
        </button>
      </div>
    </div>
  );
};
