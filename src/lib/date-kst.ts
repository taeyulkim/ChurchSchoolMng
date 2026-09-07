const KST_TIME_ZONE = 'Asia/Seoul';

function getKstParts(at: Date) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: KST_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).formatToParts(at);

  const map: Record<string, string> = {};
  parts.forEach((p) => { map[p.type] = p.value; });
  return map;
}

/**
 * 서버 실행 환경(예: Vercel의 UTC 런타임)의 시간대와 무관하게,
 * 한국 시간(KST) 기준 "지금"을 나타내는 Date 객체를 반환합니다.
 * 반환된 Date의 로컬 getter(getFullYear/getMonth/getDate 등)를 그대로 쓰면
 * KST 달력 기준 값을 얻을 수 있습니다.
 */
export function getKstNow(at: Date = new Date()): Date {
  const { year, month, day, hour, minute, second } = getKstParts(at);
  return new Date(
    Number(year),
    Number(month) - 1,
    Number(day),
    Number(hour),
    Number(minute),
    Number(second)
  );
}

/** 한국 시간(KST) 기준 오늘 날짜를 'yyyy-MM-dd' 형식으로 반환합니다. */
export function getKstDateString(at: Date = new Date()): string {
  const { year, month, day } = getKstParts(at);
  return `${year}-${month}-${day}`;
}
