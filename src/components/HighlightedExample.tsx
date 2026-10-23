/** 예문 안의 해당 단어를 강조한다 (활용형은 그대로 둔다). 퀴즈 해설, 플래시카드, 단어장에서 함께 쓴다. */
export function HighlightedExample({ text, headword }: { text: string; headword: string }) {
  const i = text.toLowerCase().indexOf(headword.toLowerCase());
  if (i < 0) return <>{text}</>;
  return (
    <>
      {text.slice(0, i)}
      <span className="text-primary">{text.slice(i, i + headword.length)}</span>
      {text.slice(i + headword.length)}
    </>
  );
}
