import type { Word, Pos } from "@/types";

type Row = [string, Pos, string, string, string];

const raw: Record<number, Row[]> = {
  500: [
    ["schedule", "noun", "일정, 스케줄", "Please check the schedule before booking the meeting room.", "회의실을 예약하기 전에 일정을 확인해 주세요."],
    ["deliver", "verb", "배달하다, 전달하다", "The courier will deliver the samples by Friday.", "택배 기사가 금요일까지 샘플을 배달할 것입니다."],
    ["available", "adj", "이용 가능한, 시간이 있는", "The manager is available for a call after lunch.", "매니저는 점심 이후 통화가 가능합니다."],
    ["receipt", "noun", "영수증", "Keep the receipt for your travel expense report.", "출장 경비 보고서를 위해 영수증을 보관하세요."],
    ["order", "verb", "주문하다", "We ordered new chairs for the lobby.", "우리는 로비용 새 의자를 주문했습니다."],
    ["customer", "noun", "고객", "Every customer receives a welcome coupon.", "모든 고객은 환영 쿠폰을 받습니다."],
    ["quickly", "adv", "빠르게", "The team quickly fixed the printer problem.", "팀은 프린터 문제를 빠르게 해결했습니다."],
    ["employee", "noun", "직원", "Each employee must wear an ID badge.", "모든 직원은 사원증을 착용해야 합니다."],
  ],
  600: [
    ["invoice", "noun", "송장, 청구서", "The invoice was sent to the accounting department.", "청구서가 회계 부서로 발송되었습니다."],
    ["confirm", "verb", "확인하다, 확정하다", "Please confirm your attendance by email.", "이메일로 참석 여부를 확정해 주세요."],
    ["reasonable", "adj", "합리적인, 적당한", "The supplier offered a reasonable price.", "공급업체가 합리적인 가격을 제시했습니다."],
    ["branch", "noun", "지점, 지사", "Our new branch opens in Busan next month.", "새 지점이 다음 달 부산에 문을 엽니다."],
    ["postpone", "verb", "연기하다", "The launch was postponed due to bad weather.", "악천후로 출시가 연기되었습니다."],
    ["equipment", "noun", "장비, 설비", "Safety equipment is stored in the warehouse.", "안전 장비는 창고에 보관되어 있습니다."],
    ["regularly", "adv", "정기적으로", "The machines are inspected regularly.", "기계들은 정기적으로 점검됩니다."],
    ["mandatory", "adj", "의무적인", "Attendance at the training is mandatory.", "교육 참석은 의무입니다."],
  ],
  700: [
    ["revenue", "noun", "수익, 매출", "Quarterly revenue rose by twelve percent.", "분기 매출이 12% 증가했습니다."],
    ["allocate", "verb", "할당하다, 배분하다", "The director allocated more funds to marketing.", "이사는 마케팅에 더 많은 자금을 배정했습니다."],
    ["tentative", "adj", "잠정적인", "We have a tentative date for the conference.", "회의 날짜가 잠정적으로 정해졌습니다."],
    ["merger", "noun", "합병", "The merger created the region's largest bank.", "그 합병으로 지역 최대 은행이 탄생했습니다."],
    ["implement", "verb", "시행하다, 실행하다", "The company will implement the new policy in May.", "회사는 5월에 새 정책을 시행할 예정입니다."],
    ["incentive", "noun", "장려책, 보상", "Sales staff receive an incentive for every contract.", "영업 직원은 계약마다 성과급을 받습니다."],
    ["promptly", "adv", "즉시, 지체 없이", "Complaints should be handled promptly.", "불만 사항은 즉시 처리되어야 합니다."],
    ["eligible", "adj", "자격이 있는", "Full-time staff are eligible for the bonus.", "정규직 직원은 상여금을 받을 자격이 있습니다."],
  ],
  800: [
    ["procurement", "noun", "조달, 구매", "Procurement handles all vendor negotiations.", "조달팀이 모든 공급업체 협상을 담당합니다."],
    ["expedite", "verb", "신속히 처리하다", "Could you expedite the shipment for our client?", "고객을 위해 배송을 신속히 처리해 주실 수 있나요?"],
    ["comprehensive", "adj", "포괄적인, 종합적인", "The report offers a comprehensive market analysis.", "보고서는 종합적인 시장 분석을 제공합니다."],
    ["liability", "noun", "법적 책임, 부채", "The contract limits the firm's liability.", "계약서는 회사의 법적 책임을 제한합니다."],
    ["reimburse", "verb", "환급하다, 변제하다", "We will reimburse your hotel costs.", "호텔 비용을 환급해 드리겠습니다."],
    ["stipulation", "noun", "조항, 규정", "A key stipulation concerns delivery deadlines.", "핵심 조항은 납품 기한에 관한 것입니다."],
    ["substantially", "adv", "상당히", "Costs were reduced substantially last year.", "작년에 비용이 상당히 절감되었습니다."],
    ["provisional", "adj", "임시의", "A provisional budget was approved.", "임시 예산이 승인되었습니다."],
  ],
  900: [
    ["contingency", "noun", "비상 사태, 만일의 경우", "We set aside funds for contingencies.", "만일의 경우를 대비해 자금을 따로 마련했습니다."],
    ["delineate", "verb", "명확히 기술하다", "The memo delineates each team's duties.", "그 메모는 각 팀의 업무를 명확히 기술합니다."],
    ["meticulous", "adj", "꼼꼼한, 세심한", "Her meticulous records impressed the auditors.", "그녀의 꼼꼼한 기록은 감사관들에게 깊은 인상을 주었습니다."],
    ["remuneration", "noun", "보수, 급여", "Remuneration is reviewed every January.", "보수는 매년 1월에 검토됩니다."],
    ["mitigate", "verb", "완화하다", "New suppliers will mitigate the risk of delays.", "새 공급업체들이 지연 위험을 완화할 것입니다."],
    ["discrepancy", "noun", "불일치, 차이", "The auditor found a discrepancy in the figures.", "감사관이 수치에서 불일치를 발견했습니다."],
    ["concurrently", "adv", "동시에", "The two projects will run concurrently.", "두 프로젝트는 동시에 진행될 것입니다."],
    ["stringent", "adj", "엄격한", "The factory follows stringent safety rules.", "공장은 엄격한 안전 규정을 따릅니다."],
  ],
};

export const WORDS: Word[] = Object.entries(raw).flatMap(([tierStr, rows]) => {
  const tier = Number(tierStr);
  const tierIdx = (tier - 500) / 100;
  return rows.map(([headword, pos, meaningKo, exampleEn, exampleKo], i) => ({
    id: `${tier}-${i + 1}`,
    headword,
    pos,
    meaningKo,
    exampleEn,
    exampleKo,
    tier,
    dayNo: tierIdx * 2 + (i < 4 ? 1 : 2),
    freqRank: i + 1,
  }));
});

export const MAX_DAY = Math.max(...WORDS.map((w) => w.dayNo));
