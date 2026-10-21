// 브라우저 내장 음성 합성(Web Speech API)으로 영어를 읽어 준다. 서버·API 키·비용이 필요 없다.
// 음성 품질은 기기와 브라우저에 따라 다르고, 지원하지 않는 환경에서는 발음 버튼을 숨긴다.

export const speechSupported = () =>
  typeof window !== "undefined" && "speechSynthesis" in window && typeof SpeechSynthesisUtterance !== "undefined";

/** 미국 영어 음성 중 자연스러운 쪽을 우선 고른다. 음성 목록은 늦게 채워질 수 있어 읽을 때마다 고른다. */
function pickVoice(): SpeechSynthesisVoice | undefined {
  const voices = window.speechSynthesis.getVoices().filter((v) => v.lang.replace("_", "-").toLowerCase().startsWith("en-us"));
  return voices.find((v) => /natural|online|google|samantha|aria|jenny/i.test(v.name)) ?? voices[0];
}

export function stopSpeaking() {
  if (speechSupported()) window.speechSynthesis.cancel();
}

/** 읽고 있던 음성은 멈추고 새로 읽는다. 끝나거나 멈추면 onEnd를 부른다. */
export function speak(text: string, opts: { rate?: number | undefined; onEnd?: () => void } = {}) {
  if (!speechSupported()) return;
  stopSpeaking();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "en-US";
  utterance.rate = opts.rate ?? 0.9;
  const voice = pickVoice();
  if (voice) utterance.voice = voice;
  utterance.onend = () => opts.onEnd?.();
  utterance.onerror = () => opts.onEnd?.();
  window.speechSynthesis.speak(utterance);
}
