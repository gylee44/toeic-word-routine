import { useEffect } from "react";
import { toast } from "sonner";

export function useErrorToast(error: unknown, retry: () => void) {
  useEffect(() => {
    if (!error) return;
    toast.error(error instanceof Error ? error.message : "문제가 발생했어요.", {
      action: { label: "다시 시도", onClick: retry },
    });
  }, [error, retry]);
}

export function errorMessage(e: unknown) {
  return e instanceof Error ? e.message : "문제가 발생했어요. 다시 시도해 주세요.";
}
