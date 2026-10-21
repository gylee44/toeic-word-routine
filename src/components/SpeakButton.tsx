import { useEffect, useState } from "react";
import { Volume2 } from "lucide-react";
import { speak, speechSupported } from "@/lib/speech";
import { cn } from "@/lib/utils";

/** 작은 스피커 버튼. 누르면 영어 텍스트를 읽어 주고, 음성을 지원하지 않는 브라우저에서는 보이지 않는다. */
export function SpeakButton({ text, label, rate, className }: { text: string; label: string; rate?: number; className?: string }) {
  const [supported, setSupported] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  useEffect(() => setSupported(speechSupported()), []);
  if (!supported) return null;
  return (
    <button
      type="button"
      aria-label={label}
      onClick={(e) => {
        e.stopPropagation();
        setSpeaking(true);
        speak(text, { rate, onEnd: () => setSpeaking(false) });
      }}
      className={cn(
        "pointer-events-auto flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-primary",
        speaking && "bg-accent text-primary",
        className,
      )}
    >
      <Volume2 className="h-[18px] w-[18px]" aria-hidden />
    </button>
  );
}
