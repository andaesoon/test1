const STORAGE_KEY = 'shinchan-ai-quota-widget-v2';
const REFRESH_MS = 5 * 60 * 1000;
const FILE_MODE = location.protocol === 'file:';
const CLOUD_USAGE_URL = 'https://ansanseo-sports-default-rtdb.firebaseio.com/ai-quota.json';

const services = [
  { id: 'codex', name: 'Codex', mark: 'C', color: '#ef6a61', fiveHour: null, weekly: null },
  { id: 'claude', name: 'Claude', mark: 'Cl', color: '#e89752', fiveHour: null, weekly: null },
  { id: 'antigravity', name: 'Antigravity', mark: 'A', color: '#4ebaa1', fiveHour: null, weekly: null }
];

const defaults = Object.fromEntries(services.map((service) => [service.id, {
  fiveHour: service.fiveHour,
  weekly: service.weekly,
  resetAt: null,
  weeklyResetAt: null,
  ok: false,
  status: '연결 확인 중',
  source: 'manual'
}]));

let state = loadState();
let refreshInProgress = false;

function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return saved ? mergeState(defaults, saved) : structuredClone(defaults);
  } catch {
    return structuredClone(defaults);
  }
}

function mergeState(base, update) {
  const result = structuredClone(base);
  services.forEach((service) => {
    result[service.id] = { ...base[service.id], ...(update?.[service.id] || {}) };
  });
  return result;
}

function clamp(value) {
  return Math.max(0, Math.min(100, Number(value) || 0));
}

function remaining(value) {
  return 100 - clamp(value);
}

function escapeHtml(value) {
  return String(value).replace(/[&<>'"]/g, (char) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
  })[char]);
}

function formatKstTime(iso) {
  const date = new Date(iso);
  if (!Number.isFinite(date.getTime())) return '';
  const kstParts = (target) => {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Asia/Seoul',
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: false
    }).formatToParts(target);
    const get = (type) => Number(parts.find((p) => p.type === type)?.value || 0);
    return { year: get('year'), month: get('month'), day: get('day'), hour: get('hour') % 24, minute: get('minute') };
  };
  const target = kstParts(date);
  const now = kstParts(new Date());
  const period = target.hour < 12 ? '오전' : '오후';
  const hour12 = target.hour % 12 === 0 ? 12 : target.hour % 12;
  const timeText = target.minute === 0 ? `${period} ${hour12}시` : `${period} ${hour12}시 ${target.minute}분`;
  const sameDay = target.year === now.year && target.month === now.month && target.day === now.day;
  return sameDay ? timeText : `${target.month}/${target.day} ${timeText}`;
}

function relativeReset(iso) {
  if (!iso) return '초기화 시각 확인 중';
  const diff = new Date(iso).getTime() - Date.now();
  const kst = formatKstTime(iso);
  if (!Number.isFinite(diff) || diff <= 0) return kst ? `${kst} 초기화 예정` : '초기화 확인 필요';
  const minutes = Math.ceil(diff / 60000);
  const days = Math.floor(minutes / 1440);
  const hours = Math.floor((minutes % 1440) / 60);
  const mins = minutes % 60;
  const rel = days > 0
    ? `${days}일 ${hours}시간 후`
    : (hours > 0 ? `${hours}시간 ${mins}분 후` : `${mins}분 후`);
  return kst ? `${rel} (${kst} 초기화)` : `${rel} 초기화`;
}

function meter(label, value, color, available = true, resetIso = null, resetAttr = '') {
  const remainingValue = remaining(value);
  const shownValue = available ? `${remainingValue}% 남음` : '—';
  const resetHtml = resetIso ? `<div class="meter-reset" ${resetAttr}>${relativeReset(resetIso)}</div>` : '';
  return `
    <div class="meter-row">
      <div class="meter-meta"><span>${escapeHtml(label)}</span><strong>${shownValue}</strong></div>
      <div class="track"><div class="fill" style="width:${available ? remainingValue : 0}%;background:${color}"></div></div>
      ${resetHtml}
    </div>`;
}

function poolMeter(pool, color) {
  const rows = [
    ['5시간', pool.fiveHour, pool.resetAt],
    ['주간', pool.weekly, pool.weeklyResetAt]
  ].filter(([, value]) => value !== null && Number.isFinite(Number(value)));
  return `
    <div class="pool-block">
      <div class="pool-name">${escapeHtml(pool.name)}</div>
      ${rows.map(([label, value, resetAt]) => `
        <div class="pool-meter">
          <span>${label}</span>
          <div class="track"><div class="fill" style="width:${remaining(value)}%;background:${color}"></div></div>
          <strong>${remaining(value)}% 남음</strong>
          <small>${relativeReset(resetAt)}</small>
        </div>`).join('')}
    </div>`;
}

function render() {
  const dateText = new Intl.DateTimeFormat('ko-KR', {
    month: 'long', day: 'numeric', weekday: 'short'
  }).format(new Date());
  document.querySelector('#todayLabel').textContent = `${dateText} · 한국시간`;

  document.querySelector('#serviceList').innerHTML = services.map((service) => {
    const usage = state[service.id];
    const hasFiveHour = usage.fiveHour !== null && Number.isFinite(Number(usage.fiveHour));
    const hasWeekly = usage.weekly !== null && Number.isFinite(Number(usage.weekly));
    const poolContent = service.id === 'antigravity' && Array.isArray(usage.pools) && usage.pools.length
      ? `<div class="pool-list">${usage.pools.map((pool) => poolMeter(pool, service.color)).join('')}</div>`
      : `${meter('5시간', usage.fiveHour, service.color, hasFiveHour)}${meter('주간', usage.weekly, service.color, hasWeekly, usage.weeklyResetAt, `data-weekly-reset="${service.id}"`)}`;
    return `
      <article class="service-card">
        <div class="service-head">
          <div class="service-name">
            <span class="service-mark" style="background:${service.color}">${service.mark}</span>
            ${service.name}
          </div>
          <div class="service-status">
            <span class="connection-state ${usage.ok ? '' : 'is-error'}">${escapeHtml(usage.status || '상태 확인 필요')}</span>
            <span class="reset-time" data-reset="${service.id}">${relativeReset(usage.resetAt)}</span>
          </div>
        </div>
        ${poolContent}
      </article>`;
  }).join('');

  const connected = services.filter((service) => state[service.id].ok);
  const weeklyValues = connected
    .map((service) => Number(state[service.id].weekly))
    .filter(Number.isFinite);
  let message = connected.length
    ? `${connected.length}개 서비스가 자동 연결됐어요`
    : '로그인 상태를 확인하면 자동 연결돼요';
  if (weeklyValues.length) {
    const average = weeklyValues.reduce((sum, value) => sum + value, 0) / weeklyValues.length;
    message = average >= 85
      ? '거의 다 썼어요! 마무리·검증 작업에 집중해요'
      : average >= 60
        ? '좋은 속도예요. 큰 작업 하나 더 가능해요'
        : '여유가 있어요. 구현 작업을 힘차게 시작해요';
  }
  document.querySelector('#recommendation').textContent = message;
}

function toLocalInputValue(iso) {
  if (!iso) return '';
  const date = new Date(iso);
  if (!Number.isFinite(date.getTime())) return '';
  const shifted = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return shifted.toISOString().slice(0, 16);
}

function buildSettings() {
  document.querySelector('#settingsFields').innerHTML = services.map((service) => {
    const usage = state[service.id];
    const fiveRemain = usage.fiveHour == null ? 100 : remaining(usage.fiveHour);
    const weekRemain = usage.weekly == null ? 100 : remaining(usage.weekly);
    return `
      <section class="settings-group" style="--accent:${service.color}">
        <h3>${service.name} · 수동 보정</h3>
        <div class="field-row">
          <label for="${service.id}-five">5시간 남음</label>
          <input id="${service.id}-five" name="${service.id}-five" type="range" min="0" max="100" value="${fiveRemain}">
          <output for="${service.id}-five">${fiveRemain}%</output>
        </div>
        <div class="field-row">
          <label for="${service.id}-week">주간 남음</label>
          <input id="${service.id}-week" name="${service.id}-week" type="range" min="0" max="100" value="${weekRemain}">
          <output for="${service.id}-week">${weekRemain}%</output>
        </div>
        <div class="reset-field">
          <label for="${service.id}-reset">초기화</label>
          <input id="${service.id}-reset" name="${service.id}-reset" type="datetime-local" value="${toLocalInputValue(usage.resetAt)}">
        </div>
      </section>`;
  }).join('');

  document.querySelectorAll('input[type="range"]').forEach((input) => {
    input.addEventListener('input', () => {
      input.parentElement.querySelector('output').textContent = `${input.value}%`;
    });
  });
}

async function refreshUsage(force = false) {
  if (refreshInProgress) return;
  refreshInProgress = true;
  const button = document.querySelector('#refreshButton');
  button.classList.add('loading');
  button.disabled = true;
  document.querySelector('#updatedLabel').textContent = '계정 사용량 확인 중…';

  try {
    const isLocal = location.hostname === 'localhost' || location.hostname === '127.0.0.1';
    const endpoint = (!isLocal && CLOUD_USAGE_URL) ? CLOUD_USAGE_URL : `/api/usage${force ? '?force=1' : ''}`;
    const response = await fetch(endpoint, { cache: 'no-store' });
    if (!response.ok) throw new Error('서버 응답 오류');
    const payload = await response.json();
    services.forEach((service) => {
      const live = payload.services?.[service.id];
      if (!live) return;
      if (live.ok) {
        state[service.id] = {
          ...state[service.id],
          ...live,
          fiveHour: live.fiveHour == null ? state[service.id].fiveHour : live.fiveHour,
          weekly: live.weekly == null ? state[service.id].weekly : live.weekly
        };
      } else {
        state[service.id] = {
          ...state[service.id],
          ok: false,
          status: live.status,
          source: live.source,
          fiveHour: null,
          weekly: null,
          resetAt: null,
          weeklyResetAt: null,
          pools: null
        };
      }
    });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    const time = new Intl.DateTimeFormat('ko-KR', { hour: '2-digit', minute: '2-digit' }).format(new Date(payload.updatedAt));
    document.querySelector('#updatedLabel').textContent = `${time} 자동 조회 · 5분마다 갱신`;
  } catch {
    document.querySelector('#updatedLabel').textContent = '로컬 수집 서버에 연결할 수 없음';
  } finally {
    refreshInProgress = false;
    button.classList.remove('loading');
    button.disabled = false;
    render();
  }
}

document.querySelector('#refreshButton').addEventListener('click', () => {
  if (!FILE_MODE) refreshUsage(true);
});

document.querySelector('#editButton').addEventListener('click', () => {
  buildSettings();
  document.querySelector('#settingsDialog').showModal();
});

document.querySelector('#settingsForm').addEventListener('submit', (event) => {
  event.preventDefault();
  const form = new FormData(event.currentTarget);
  services.forEach((service) => {
    const resetValue = form.get(`${service.id}-reset`);
    state[service.id] = {
      ...state[service.id],
      fiveHour: 100 - clamp(form.get(`${service.id}-five`)),
      weekly: 100 - clamp(form.get(`${service.id}-week`)),
      resetAt: resetValue ? new Date(resetValue).toISOString() : state[service.id].resetAt,
      ok: false,
      status: '수동 보정값'
    };
  });
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  document.querySelector('#updatedLabel').textContent = '방금 수동 수정됨 · 다음 갱신 시 자동값 우선';
  document.querySelector('#settingsDialog').close();
  render();
});

setInterval(() => {
  services.forEach((service) => {
    const target = document.querySelector(`[data-reset="${service.id}"]`);
    if (target) target.textContent = relativeReset(state[service.id].resetAt);
    const weeklyTarget = document.querySelector(`[data-weekly-reset="${service.id}"]`);
    if (weeklyTarget) weeklyTarget.textContent = relativeReset(state[service.id].weeklyResetAt);
  });
}, 30_000);

if (FILE_MODE) {
  services.forEach((service) => {
    state[service.id] = {
      ...state[service.id],
      fiveHour: null,
      weekly: null,
      resetAt: null,
      ok: false,
      status: '위젯 실행.cmd로 열어주세요'
    };
  });
  document.querySelector('#refreshButton').disabled = true;
  render();
  document.querySelector('#recommendation').textContent = 'HTML 파일이 아닌 “위젯 실행.cmd”를 더블클릭하세요';
  document.querySelector('#updatedLabel').textContent = '파일 직접 실행 모드 · 자동 조회를 사용할 수 없음';
} else {
  setInterval(() => refreshUsage(false), REFRESH_MS);
  render();
  refreshUsage(true);
}
