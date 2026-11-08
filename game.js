import { config } from './data/config.js';
import { traits } from './data/traits.js';
import { scenes } from './data/scenes.js';
import { combos } from './data/combos.js';
import { createShareCard } from './share.js';

const c = config.copy;
const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));

const traitById = Object.fromEntries(traits.map((trait) => [trait.id, trait]));
const numeralById = new Map(
  traits.map((trait, index) => [trait.id, config.cardNumerals[index] || String(index + 1)]),
);
const scoreSpan = config.axisRange * config.maxTraits;

function sceneOf(id) {
  const trait = traitById[id];
  return (trait && scenes[trait.sceneId]) || {};
}

const state = {
  screen: 'start',
  relation: null,
  name: '',
  selected: [],
  result: null,
  contacts: loadContacts(),
  deckIndex: 0,
};

let audioCtx = null;
const timers = new Set();
let toastTimer = 0;

/* ---------- 工具 ---------- */

function esc(value) {
  return String(value ?? '').replace(/[&<>"']/g, (char) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  }[char]));
}

function later(fn, ms) {
  const id = setTimeout(() => {
    timers.delete(id);
    fn();
  }, ms);
  timers.add(id);
  return id;
}

function clearTimers() {
  timers.forEach((id) => clearTimeout(id));
  timers.clear();
}

function hueOf(name) {
  let hue = 216;
  for (const char of Array.from(name || '')) {
    hue = (hue * 37 + char.codePointAt(0)) % 360;
  }
  return hue;
}

function firstChar(name) {
  return Array.from((name || '').trim())[0] || '·';
}

function avatarHtml(name) {
  return `<span class="avatar" style="--h:${hueOf(name)}" aria-hidden="true"><span class="avatar-letter">${esc(firstChar(name))}</span></span>`;
}

function setAvatar(element, name) {
  if (!element) return;
  element.style.setProperty('--h', hueOf(name));
  const letter = $('.avatar-letter', element);
  if (letter) letter.textContent = firstChar(name);
}

function relationLabel(id) {
  return config.relation.find((item) => item.id === id)?.label || config.relation[0].label;
}

function formatDate(timestamp) {
  const date = new Date(timestamp || Date.now());
  const pad = (value) => String(value).padStart(2, '0');
  return `${date.getFullYear()}.${pad(date.getMonth() + 1)}.${pad(date.getDate())}`;
}

function makeId() {
  return `c-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function tick(kind) {
  try {
    audioCtx ||= new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const now = audioCtx.currentTime;
    const oscillator = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(kind === 'flip' ? 520 : 640, now);
    if (kind === 'flip') oscillator.frequency.exponentialRampToValueAtTime(240, now + 0.32);
    gain.gain.setValueAtTime(0.035, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + (kind === 'flip' ? 0.4 : 0.14));
    oscillator.connect(gain).connect(audioCtx.destination);
    oscillator.start(now);
    oscillator.stop(now + (kind === 'flip' ? 0.42 : 0.16));
  } catch {
    /* 音效失败时静默 */
  }
}

function toast(message) {
  const element = $('#toast');
  element.textContent = message;
  element.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => element.classList.remove('show'), 2200);
}

/* ---------- 存储 ---------- */

function loadContacts() {
  try {
    const raw = localStorage.getItem(config.storageKey);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((card) => card && typeof card.name === 'string' && Array.isArray(card.traits));
  } catch {
    return [];
  }
}

function persist() {
  try {
    localStorage.setItem(config.storageKey, JSON.stringify(state.contacts));
  } catch {
    toast(c.toast.noStorage);
  }
}

/* ---------- 页面骨架 ---------- */

function applyCopy() {
  $('#brand').textContent = c.brand;

  $('#start-eyebrow').textContent = c.start.eyebrow;
  $('#start-title').innerHTML = `${esc(c.start.titleA)}<br><span class="thin">${esc(c.start.titleB)}</span>`;
  $('#start-lead').textContent = c.start.lead;
  $('#start-btn').textContent = c.start.cta;

  $('#relation-step').textContent = c.relation.step;
  $('#relation-title').textContent = c.relation.title;
  $('#relation-hint').textContent = c.relation.hint;
  $('#relation-next').textContent = c.relation.next;

  $('#name-step').textContent = c.name.step;
  $('#name-title').textContent = c.name.title;
  $('#name-hint').textContent = c.name.hint;
  $('#name-next').textContent = c.name.next;
  $('#name-input').placeholder = c.name.placeholder;

  $('#select-step').textContent = c.select.step;
  $('#select-title').textContent = c.select.title;
  $('#select-hint').textContent = c.select.hint;
  $('#select-next').textContent = c.select.next;
  $('#sel-limit').textContent = c.select.limit;

  $('#reveal-title').textContent = c.reveal.title;
  $('#reveal-hint').textContent = c.reveal.hint;
  $('#reveal-next').textContent = c.reveal.next;

  $('#contacts-title').textContent = c.contacts.title;

  $('#result-save').textContent = c.result.save;
  $('#result-again').textContent = c.result.again;
  $('#result-share').textContent = c.share.button;

  $('#share-title').textContent = c.share.title;
  $('#share-close').textContent = c.share.close;
  $('#share-download').textContent = c.share.save;
  $('#share-image').alt = c.share.previewAlt;
}

function buildRelations() {
  $('#relation-list').innerHTML = config.relation
    .map((item) => `
      <button class="relation${item.available ? '' : ' locked'}" type="button" data-id="${esc(item.id)}"${item.available ? '' : ' disabled'}>
        <span class="relation-name">${esc(item.label)}</span>
        ${item.available ? '' : `<span class="relation-hint">${esc(c.relation.locked)}</span>`}
      </button>
    `)
    .join('');
}

function buildTraitGrid() {
  $('#traits-grid').innerHTML = traits
    .map((trait, index) => {
      const scene = sceneOf(trait.id);
      return `
      <button class="trait-card" type="button" data-id="${esc(trait.id)}" aria-pressed="false" style="--deal:${(index * 0.028).toFixed(3)}s">
        <span class="card-numeral">${esc(config.cardNumerals[index] || index + 1)}</span>
        <span class="trait-name">${esc(trait.name)}</span>
        <span class="trait-scene">${esc(scene.frontScene)}</span>
      </button>
    `;
    })
    .join('');
}

/* ---------- 流程 ---------- */

function showScreen(name) {
  clearTimers();
  if (!$('#overlay').hidden) closeDetail();
  if (!$('#share-overlay').hidden) closeShareCard();
  state.screen = name;

  $$('.screen').forEach((screen) => {
    screen.classList.toggle('active', screen.dataset.screen === name);
  });

  if (name === 'contacts') renderContacts();
  updateChrome();
  window.scrollTo(0, 0);

  if (name === 'name') {
    $('#name-input').focus({ preventScroll: true });
  }
}

function updateChrome() {
  $('#brand').textContent = c.brand;
  const count = state.contacts.length;

  const top = $('#top-contacts');
  if (state.screen === 'contacts') {
    top.textContent = c.back;
  } else {
    top.textContent = count ? `${c.topContacts} · ${count}` : c.topContacts;
  }
}

function resetRound() {
  state.relation = null;
  state.name = '';
  state.selected = [];
  state.result = null;
  $('#name-input').value = '';
  setAvatar($('#name-avatar'), '');
  $('.relation-list').querySelectorAll('.relation').forEach((item) => {
    item.classList.remove('chosen');
  });
  $('#relation-next').disabled = true;
  $('#name-next').disabled = true;
}

function openContacts() {
  state.deckIndex = 0;
  showScreen('contacts');
}

function updateNameField() {
  state.name = $('#name-input').value.trim();
  setAvatar($('#name-avatar'), state.name);
  $('#name-next').disabled = !state.name;
}

function goSelect() {
  if (!state.name) return;
  state.selected = [];
  renderSelection();
  showScreen('select');
}

function renderSelection() {
  const max = config.maxTraits;
  $('#sel-count').textContent = c.select.count
    .replace('{n}', state.selected.length)
    .replace('{max}', max);

  $$('.trait-card').forEach((card) => {
    const on = state.selected.includes(card.dataset.id);
    card.classList.toggle('selected', on);
    card.setAttribute('aria-pressed', String(on));
  });

  $('#sel-dots').innerHTML = Array.from(
    { length: max },
    (_, index) => `<span class="dot${index < state.selected.length ? ' on' : ''}"></span>`,
  ).join('');

  $('#sel-limit').classList.remove('show');
  $('#select-next').disabled = state.selected.length !== max;
}

function refuseSelection() {
  $('#sel-limit').classList.add('show');
  $$('.trait-card').forEach((card) => {
    if (state.selected.includes(card.dataset.id)) return;
    card.classList.remove('refuse');
    void card.offsetWidth;
    card.classList.add('refuse');
  });
  later(() => $('#sel-limit').classList.remove('show'), 1600);
}

function buildReveal() {
  $('#reveal-list').innerHTML = state.selected
    .map((id, index) => {
      const trait = traitById[id];
      const scene = sceneOf(id);
      return `
        <div class="flip-card" style="--deal:${(index * 0.06).toFixed(3)}s">
          <div class="flip-inner">
            <div class="face face-front">
              <span class="face-numeral">${esc(numeralById.get(id) || '')}</span>
              <span class="trait-name">${esc(trait.name)}</span>
              <span class="scene">${esc(scene.frontScene)}</span>
              <span class="face-mark">${esc(c.reveal.frontMark)}</span>
            </div>
            <div class="face face-back">
              <span class="face-numeral">${esc(numeralById.get(id) || '')}</span>
              <span class="cost-kicker">${esc(c.reveal.backMark)}</span>
              <span class="cost-label">${esc(scene.costLabel)}</span>
              <span class="scene">${esc(scene.backScene)}</span>
            </div>
          </div>
        </div>
      `;
    })
    .join('');

  const next = $('#reveal-next');
  next.hidden = true;
  next.classList.remove('shown');
}

function startRevealSequence() {
  const cards = $$('.flip-card', $('#reveal-list'));
  cards.forEach((card, index) => {
    later(() => {
      card.classList.add('flipped');
      tick('flip');
      if (index === cards.length - 1) {
        later(() => {
          const next = $('#reveal-next');
          next.hidden = false;
          next.classList.add('shown');
        }, 1050);
      }
    }, 500 + index * 680);
  });
}

function fillFallback(line, chosen) {
  return line
    .replaceAll('{first}', chosen[0].name)
    .replaceAll('{second}', chosen[1].name)
    .replaceAll('{third}', chosen[2].name)
    .replaceAll('{cost2}', sceneOf(chosen[1].id).costLabel || '')
    .replaceAll('{cost3}', sceneOf(chosen[2].id).costLabel || '');
}

function rawScoreOf(sum) {
  const { rawMin, rawMax } = config.scoring;
  return rawMin + Math.round(((sum + scoreSpan) / (scoreSpan * 2)) * (rawMax - rawMin));
}

function totalScoreOf(rawTotal) {
  const { rawTotalFloor, rawTotalCeiling, minTotal, maxTotal } = config.scoring;
  const ratio = (rawTotal - rawTotalFloor) / (rawTotalCeiling - rawTotalFloor);
  const total = Math.round(minTotal + ratio * (maxTotal - minTotal));
  return Math.min(maxTotal, Math.max(minTotal, total));
}

// 每个维度先拿总分下限的均分（80 / 4 = 20），再把超出下限的部分
// 按各维原始分占比分摊；最大余数法保证分项之和严格等于总分。
function splitTotal(total, weights) {
  const base = config.scoring.minTotal / config.axes.length;
  const extra = total - config.scoring.minTotal;
  const weightSum = weights.reduce((sum, weight) => sum + weight, 0);
  const parts = weights.map((weight) => Math.floor((extra * weight) / weightSum));
  const rest = extra - parts.reduce((sum, part) => sum + part, 0);
  const order = weights
    .map((weight, index) => ({
      index,
      fraction: (extra * weight) / weightSum - parts[index],
    }))
    .sort((a, b) => b.fraction - a.fraction || a.index - b.index);
  order.slice(0, rest).forEach((item) => {
    parts[item.index] += 1;
  });
  return parts.map((part) => base + part);
}

// 随机入口集中在这里，以后要固定种子只改这个函数。
function randomIndex(length) {
  return Math.floor(Math.random() * length);
}

function pickCombo(ids) {
  const matches = combos.filter((item) => item.traits.every((id) => ids.includes(id)));
  return matches[randomIndex(matches.length)] || null;
}

function computeResult() {
  const chosen = state.selected.map((id) => traitById[id]);
  const ids = chosen.map((trait) => trait.id);
  const combo = pickCombo(ids);

  let comboName = '';
  let comboText = '';
  let paradox = false;

  if (combo) {
    comboName = combo.name || '';
    comboText = combo.text;
    paradox = Boolean(combo.paradox);
  } else {
    comboText = config.fallback.map((line) => fillFallback(line, chosen)).join('');
  }

  const sums = Object.fromEntries(config.axes.map((axis) => [axis.key, 0]));
  chosen.forEach((trait) => {
    config.axes.forEach((axis) => {
      sums[axis.key] += Number(trait.axes?.[axis.key] ?? 0);
    });
  });

  const raw = Object.fromEntries(
    config.axes.map((axis) => [axis.key, rawScoreOf(sums[axis.key])]),
  );
  const rawTotal = config.axes.reduce((sum, axis) => sum + raw[axis.key], 0);
  const total = totalScoreOf(rawTotal);
  const parts = splitTotal(total, config.axes.map((axis) => raw[axis.key]));

  const scores = { total };
  config.axes.forEach((axis, index) => {
    scores[axis.key] = parts[index];
  });

  let weak = config.axes[0];
  config.axes.forEach((axis) => {
    if (sums[axis.key] < sums[weak.key]) weak = axis;
  });

  return {
    id: makeId(),
    name: state.name,
    relation: state.relation || config.relation[0].id,
    traits: ids,
    comboName,
    comboText,
    paradox,
    weak: weak.key,
    weakText: config.weakSentence.replace('{weak}', weak.weak),
    scores,
    createdAt: Date.now(),
    saved: false,
  };
}

function scoreBlockHtml(scores) {
  if (!scores || typeof scores.total !== 'number') return '';

  const axes = config.axes
    .map((axis) => `
      <span class="score-axis">
        <span class="score-axis-label">${esc(axis.label)}</span>
        <span class="score-axis-value">${esc(scores[axis.key] ?? '')}</span>
      </span>
    `)
    .join('');

  return `
    <div class="score-block">
      <div class="score-total">
        <span class="score-label">${esc(c.result.scoreLabel)}</span>
        <span class="score-number">${esc(scores.total)}</span>
        <span class="score-denominator">${esc(c.result.scoreDenominator)}</span>
      </div>
      <p class="score-axes-label">${esc(c.result.scoresLabel)}</p>
      <div class="score-axes">${axes}</div>
    </div>
  `;
}

function renderResult() {
  const result = state.result;
  if (!result) return;

  const traitTags = result.traits
    .map((id) => `<span class="sheet-trait">${esc(traitById[id]?.name || '')}</span>`)
    .join('');

  const costTags = result.traits
    .map((id) => `<span class="cost-tag">${esc(sceneOf(id).costLabel || '')}</span>`)
    .join('');

  const comboBlock = `
    <div class="combo-block">
      ${result.comboName ? `<p class="combo-name">${esc(result.comboName)}</p>` : ''}
      <p class="combo-text">${esc(result.comboText)}</p>
      ${result.paradox ? `<span class="paradox">${esc(c.paradox)}</span>` : ''}
    </div>
  `;

  $('#result-sheet').innerHTML = `
    <div class="sheet-head">
      ${avatarHtml(result.name)}
      <div>
        <p class="sheet-kicker">${esc(c.result.kicker)}</p>
        <h2 class="sheet-name">${esc(result.name)}</h2>
      </div>
    </div>
    <div class="sheet-traits">${traitTags}</div>
    ${comboBlock}
    <p class="cost-label-small">${esc(c.result.costsLabel)}</p>
    <div class="cost-strip">${costTags}</div>
    <p class="weak-line">${esc(result.weakText)}</p>
    ${scoreBlockHtml(result.scores)}
  `;

  $('#result-save').textContent = result.saved ? c.result.saved : c.result.save;
  $('#result-save').disabled = false;
}

function saveResult() {
  const result = state.result;
  if (!result) return;

  if (result.saved) {
    openContacts();
    return;
  }

  const card = { ...result };
  delete card.saved;
  state.contacts.unshift(card);
  persist();
  result.saved = true;

  $('#result-save').textContent = c.result.saved;
  updateChrome();
  toast(c.toast.saved);
}

/* ---------- 通讯录 ---------- */

function renderContacts() {
  const body = $('#contacts-body');
  const total = state.contacts.length;
  $('#contacts-count').textContent = c.contacts.count.replace('{n}', total);

  if (!total) {
    body.innerHTML = `
      <div class="empty">
        <div class="empty-stack" aria-hidden="true">
          <div class="empty-card card-pattern"></div>
          <div class="empty-card card-pattern"></div>
          <div class="empty-card card-pattern"></div>
        </div>
        <h3 class="empty-title">${esc(c.contacts.emptyTitle)}</h3>
        <p class="empty-text">${esc(c.contacts.emptyText)}</p>
        <button class="btn primary" id="empty-cta" type="button">${esc(c.contacts.emptyCta)}</button>
      </div>
    `;
    $('#empty-cta').addEventListener('click', () => {
      resetRound();
      showScreen('relation');
    });
    return;
  }

  state.deckIndex = Math.min(Math.max(state.deckIndex, 0), total - 1);
  const card = state.contacts[state.deckIndex];
  const depths = Math.min(3, total - 1);

  const ghosts = Array.from(
    { length: depths },
    (_, index) => `<div class="deck-ghost card-pattern" data-depth="${index + 1}" aria-hidden="true"></div>`,
  )
    .reverse()
    .join('');

  const traitNames = card.traits
    .map((id) => `<span class="contact-trait">${esc(traitById[id]?.name || '')}</span>`)
    .join('');

  const nav = total > 1
    ? `
      <div class="deck-nav">
        <button class="nav-btn" id="deck-prev" type="button">← ${esc(c.contacts.prev)}</button>
        <span class="deck-pos">${esc(c.contacts.position.replace('{i}', state.deckIndex + 1).replace('{n}', total))}</span>
        <button class="nav-btn" id="deck-next" type="button">${esc(c.contacts.next)} →</button>
      </div>
    `
    : '';

  body.innerHTML = `
    <div class="deck">
      ${ghosts}
      <button class="contact-card" id="contact-focus" type="button" aria-label="${esc(c.contacts.viewCard.replace('{name}', card.name))}">
        ${avatarHtml(card.name)}
        <p class="contact-rel">${esc(relationLabel(card.relation))}</p>
        <h3 class="contact-name">${esc(card.name)}</h3>
        <div class="contact-traits">${traitNames}</div>
        <span class="pull-hint">${esc(c.contacts.pullHint)}</span>
      </button>
    </div>
    ${nav}
  `;

  $('#contact-focus').addEventListener('click', (event) => {
    const element = event.currentTarget;
    element.classList.add('pulling');
    later(() => {
      element.classList.remove('pulling');
      openDetail(card);
    }, 280);
  });

  const prev = $('#deck-prev');
  const next = $('#deck-next');
  if (prev) {
    prev.addEventListener('click', () => {
      state.deckIndex = (state.deckIndex - 1 + total) % total;
      renderContacts();
    });
  }
  if (next) {
    next.addEventListener('click', () => {
      state.deckIndex = (state.deckIndex + 1) % total;
      renderContacts();
    });
  }
}

function renderDetail(card) {
  const traitNames = card.traits
    .map((id) => `<span>${esc(traitById[id]?.name || '')}</span>`)
    .join('');

  const costRows = card.traits
    .map((id) => {
      const scene = sceneOf(id);
      if (!scene.costLabel) return '';
      return `
        <div class="cost-row">
          <span class="cost-tag">${esc(scene.costLabel)}</span>
          <p class="scene">${esc(scene.backScene)}</p>
        </div>
      `;
    })
    .join('');

  const comboBlock = card.comboText
    ? `
      <div class="detail-section">
        <p class="detail-label">${esc(c.result.comboLabel)}</p>
        ${card.comboName ? `<p class="combo-name">${esc(card.comboName)}</p>` : ''}
        <p class="combo-text">${esc(card.comboText)}</p>
        ${card.paradox ? `<span class="paradox">${esc(c.paradox)}</span>` : ''}
      </div>
    `
    : '';

  $('#detail').innerHTML = `
    <button class="detail-close" id="detail-close" type="button">${esc(c.contacts.detailClose)}</button>
    <div class="detail-head">
      ${avatarHtml(card.name)}
      <div>
        <p class="detail-kicker">${esc(c.result.kicker)}</p>
        <h3 class="detail-name">${esc(card.name)}</h3>
      </div>
    </div>
    <div class="detail-section">
      <p class="detail-label">${esc(c.result.traitsLabel)}</p>
      <p class="detail-traits">${traitNames}</p>
    </div>
    <div class="detail-section">
      <p class="detail-label">${esc(c.result.costsLabel)}</p>
      ${costRows}
    </div>
    ${comboBlock}
    <p class="weak-line">${esc(card.weakText || '')}</p>
    ${scoreBlockHtml(card.scores)}
    <p class="detail-date">${esc(c.contacts.savedOn.replace('{date}', formatDate(card.createdAt)))}</p>
    <button class="btn danger" id="detail-delete" type="button">${esc(c.contacts.delete)}</button>
  `;

  $('#detail-close').addEventListener('click', closeDetail);
  bindDelete(card);
}

function bindDelete(card) {
  let armed = false;
  $('#detail-delete').addEventListener('click', (event) => {
    if (!armed) {
      armed = true;
      event.currentTarget.textContent = c.contacts.deleteConfirm;
      event.currentTarget.classList.add('armed');
      return;
    }

    const index = state.contacts.findIndex((item) => item.id === card.id);
    if (index >= 0) state.contacts.splice(index, 1);
    persist();

    state.deckIndex = Math.min(state.deckIndex, Math.max(state.contacts.length - 1, 0));
    closeDetail();
    renderContacts();
    updateChrome();
    toast(c.toast.deleted);
  });
}

function openDetail(card) {
  renderDetail(card);
  $('#overlay').hidden = false;
  document.body.classList.add('no-scroll');
}

function closeDetail() {
  $('#overlay').hidden = true;
  $('#detail').innerHTML = '';
  document.body.classList.remove('no-scroll');
}

/* ---------- 分享卡 ---------- */

function isIOS() {
  return (
    /iP(hone|ad|od)/.test(navigator.userAgent)
    || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  );
}

function openShareCard() {
  const result = state.result;
  if (!result) return;

  const share = createShareCard(result, traitById);
  $('#share-image').src = share.dataUrl;

  const link = $('#share-download');
  link.href = share.dataUrl;
  link.download = `${c.share.filePrefix}${result.name || 'card'}.png`;

  $('#share-hint').textContent = isIOS() ? c.share.iosHint : '';

  $('#share-overlay').hidden = false;
  document.body.classList.add('no-scroll');
}

function closeShareCard() {
  $('#share-overlay').hidden = true;
  $('#share-image').removeAttribute('src');
  $('#share-hint').textContent = '';
  document.body.classList.remove('no-scroll');
}

/* ---------- 事件 ---------- */

function bindEvents() {
  $('#start-btn').addEventListener('click', () => {
    resetRound();
    showScreen('relation');
  });

  $('#top-contacts').addEventListener('click', () => {
    if (state.screen === 'contacts') {
      showScreen('start');
    } else {
      openContacts();
    }
  });
  $('#brand').addEventListener('click', () => showScreen('start'));

  $('#relation-list').addEventListener('click', (event) => {
    const button = event.target.closest('.relation');
    if (!button || button.disabled) return;
    state.relation = button.dataset.id;
    $$('.relation').forEach((item) => item.classList.toggle('chosen', item === button));
    $('#relation-next').disabled = false;
  });

  $('#relation-next').addEventListener('click', () => {
    if (!state.relation) return;
    setAvatar($('#name-avatar'), state.name);
    $('#name-input').value = state.name;
    showScreen('name');
  });

  $('#name-input').addEventListener('input', updateNameField);
  $('#name-input').addEventListener('keydown', (event) => {
    if (event.key === 'Enter') goSelect();
  });

  $('#name-next').addEventListener('click', goSelect);

  $('#traits-grid').addEventListener('click', (event) => {
    const card = event.target.closest('.trait-card');
    if (!card) return;
    const id = card.dataset.id;
    const index = state.selected.indexOf(id);

    if (index >= 0) {
      state.selected.splice(index, 1);
    } else {
      if (state.selected.length >= config.maxTraits) {
        refuseSelection();
        return;
      }
      state.selected.push(id);
    }

    tick(index >= 0 ? 'off' : 'pick');
    renderSelection();
  });

  $('#select-next').addEventListener('click', () => {
    if (state.selected.length !== config.maxTraits) return;
    buildReveal();
    showScreen('reveal');
    startRevealSequence();
  });

  $('#reveal-next').addEventListener('click', () => {
    if (state.selected.length !== config.maxTraits) return;
    state.result = computeResult();
    renderResult();
    showScreen('result');
  });

  $('#result-save').addEventListener('click', saveResult);
  $('#result-share').addEventListener('click', openShareCard);

  $('#result-again').addEventListener('click', () => {
    resetRound();
    showScreen('relation');
  });

  $('#overlay-backdrop').addEventListener('click', closeDetail);
  $('#share-backdrop').addEventListener('click', closeShareCard);
  $('#share-close').addEventListener('click', closeShareCard);

  document.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape') return;
    if (!$('#share-overlay').hidden) {
      closeShareCard();
    } else if (!$('#overlay').hidden) {
      closeDetail();
    }
  });
}

/* ---------- 启动 ---------- */

applyCopy();
buildRelations();
buildTraitGrid();
bindEvents();
updateChrome();
showScreen('start');
