/**
 * NEXT STEP - Election Guide
 * Main JavaScript file with enhanced security, performance, and accessibility
 */

'use strict';

// ============================================
// Utility Functions - Performance & Security
// ============================================

/**
 * Debounce function to limit execution rate
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @returns {Function} Debounced function
 */
function debounce(func, wait = 300) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func.apply(this, args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Throttle function to limit execution rate
 * @param {Function} func - Function to throttle
 * @param {number} limit - Limit in milliseconds
 * @returns {Function} Throttled function
 */
function throttle(func, limit = 300) {
  let inThrottle;
  return function(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => { inThrottle = false; }, limit);
    }
  };
}

/**
 * Sanitize HTML to prevent XSS attacks
 * @param {string} str - String to sanitize
 * @returns {string} Sanitized string
 */
function sanitizeHTML(str) {
  if (typeof str !== 'string') return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

/**
 * Validate input against allowed patterns
 * @param {string} input - Input to validate
 * @param {RegExp} pattern - Allowed pattern
 * @returns {boolean} Whether input is valid
 */
function validateInput(input, pattern) {
  if (typeof input !== 'string') return false;
  return pattern.test(input.trim());
}

/**
 * Safe JSON parse with error handling
 * @param {string} str - String to parse
 * @param {*} fallback - Fallback value
 * @returns {*} Parsed value or fallback
 */
function safeJSONParse(str, fallback = null) {
  try {
    return JSON.parse(str);
  } catch (e) {
    console.warn('JSON parse error:', e.message);
    return fallback;
  }
}

/**
 * Check if running in secure context
 * @returns {boolean} Whether context is secure
 */
function isSecureContext() {
  return window.isSecureContext || location.protocol === 'https:' || location.hostname === 'localhost';
}

// ============================================
// Ballot State and Settings
// ============================================

const ballotStorageKey = 'election-ballot-selections';
const simpleEnglishKey = 'election-simple-english';
const languageKey = 'election-language';

let currentLanguage = 'en';
let useSimpleEnglish = false;

function loadSetting(key, fallback) {
  try {
    const value = localStorage.getItem(key);
    if (value === null) return fallback;
    if (typeof fallback === 'boolean') return value === 'true';
    return safeJSONParse(value, fallback);
  } catch (e) {
    console.warn('Failed to load setting:', key, e.message);
    return fallback;
  }
}

function saveSetting(key, value) {
  try {
    const serialized = typeof value === 'object' ? JSON.stringify(value) : String(value);
    localStorage.setItem(key, serialized);
  } catch (e) {
    console.warn('Storage unavailable for key:', key, e.message);
  }
}

function loadBallot() {
  return loadSetting(ballotStorageKey, {});
}

function saveBallot(selections) {
  // Validate selections before saving
  if (typeof selections !== 'object' || selections === null) {
    console.warn('Invalid ballot selections');
    return;
  }
  saveSetting(ballotStorageKey, selections);
}

function updateBallotSummary() {
  const selections = loadBallot();
  const summary = document.querySelector('[data-ballot-summary]');
  if (!summary) return;
  
  if (Object.keys(selections).length === 0) {
    summary.innerHTML = '<p class="muted">Your selections will appear here as you choose.</p>';
    return;
  }
  
  // Sanitize output to prevent XSS
  const items = Object.entries(selections)
    .map(([race, candidate]) => {
      const safeRace = sanitizeHTML(race);
      const safeCandidate = sanitizeHTML(candidate);
      return `<div class="summary-item"><strong>${safeRace}:</strong> ${safeCandidate}</div>`;
    })
    .join('');
  summary.innerHTML = items;
}

function initBallotBuilder() {
  const ballotRaces = document.querySelectorAll('.ballot-race input[data-ballot-field]');
  if (!ballotRaces.length) return;
  const selections = loadBallot();
  ballotRaces.forEach((input) => {
    const field = input.dataset.ballotField;
    const value = selections[field];
    if (value && input.value === value) {
      input.checked = true;
    }
    input.addEventListener('change', () => {
      const updated = loadBallot();
      updated[field] = input.value;
      saveBallot(updated);
      updateBallotSummary();
      showToast(`${field} saved to your ballot.`);
    });
  });
  updateBallotSummary();
}

function initBallotActions() {
  const previewBtn = document.querySelector('[data-ballot-action="preview"]');
  const resetBtn = document.querySelector('[data-ballot-action="reset"]');
  const saveQrBtn = document.querySelector('[data-ballot-action="save-qr"]');
  const downloadPdfBtn = document.querySelector('[data-ballot-action="download-pdf"]');
  const shareBtn = document.querySelector('[data-ballot-action="share-social"]');

  previewBtn?.addEventListener('click', () => {
    updateBallotSummary();
    document.querySelector('.ballot-summary')?.scrollIntoView({ behavior: 'smooth' });
  });

  resetBtn?.addEventListener('click', () => {
    saveBallot({});
    document.querySelectorAll('.ballot-race input').forEach((input) => {
      input.checked = false;
    });
    updateBallotSummary();
    showToast('Ballot cleared.');
  });

  saveQrBtn?.addEventListener('click', () => {
    const selections = loadBallot();
    const qrText = JSON.stringify(selections);
    const qrContainer = document.getElementById('ballot-qr-code');
    if (!qrContainer) return;
    qrContainer.innerHTML = '';
    if (typeof QRCode !== 'undefined') {
      new QRCode(qrContainer, {
        text: qrText,
        width: 256,
        height: 256,
      });
      document.querySelector('[data-ballot-qr]').hidden = false;
      document.querySelector('[data-ballot-qr]')?.scrollIntoView({ behavior: 'smooth' });
      showToast('QR code generated. Take a screenshot!');
    } else {
      showToast('QR code library not loaded.');
    }
  });

  downloadPdfBtn?.addEventListener('click', () => {
    const selections = loadBallot();
    const text = `BALLOT PREVIEW\n\n${Object.entries(selections)
      .map(([race, candidate]) => `${race}: ${candidate}`)
      .join('\n')}\n\nPrint this or show to poll workers.`;
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'my-ballot.txt';
    a.click();
    showToast('Ballot downloaded.');
  });

  shareBtn?.addEventListener('click', () => {
    const text = `I'm voting! Check out this app to build your own ballot: ${window.location.origin}`;
    if (navigator.share) {
      navigator.share({ title: 'Vote with Confidence', text });
    } else {
      alert('App link copied. Share it with friends!\n\n' + window.location.origin);
    }
    showToast('Thanks for spreading the word!');
  });
}

function initAccessibility() {
  const readAloudBtn = document.querySelector('[data-accessibility="read-aloud"]');
  const simpleEnglishBtn = document.querySelector('[data-accessibility="simple-english"]');
  const votedBadgeBtn = document.querySelector('[data-accessibility="voted-badge"]');
  const languageSelect = document.querySelector('#language-selector');

  readAloudBtn?.addEventListener('click', () => {
    const text = document.body.innerText;
    if ('speechSynthesis' in window) {
      if (window.speechSynthesis.speaking) {
        window.speechSynthesis.cancel();
        showToast('Read aloud stopped.');
      } else {
        const utterance = new SpeechSynthesisUtterance(text);
        window.speechSynthesis.speak(utterance);
        showToast('Reading page aloud. Click again to stop.');
      }
    } else {
      showToast('Text-to-speech not supported in your browser.');
    }
  });

  simpleEnglishBtn?.addEventListener('click', () => {
    useSimpleEnglish = !useSimpleEnglish;
    saveSetting(simpleEnglishKey, useSimpleEnglish);
    applySimpleEnglish(useSimpleEnglish);
    showToast(useSimpleEnglish ? 'Simple English enabled.' : 'Standard English enabled.');
  });

  votedBadgeBtn?.addEventListener('click', generateVotedBadge);

  languageSelect?.addEventListener('change', (e) => {
    currentLanguage = e.target.value;
    saveSetting(languageKey, currentLanguage);
    showToast(`Language changed to ${e.target.options[e.target.selectedIndex].text}`);
  });
}

function applySimpleEnglish(enable) {
  if (enable) {
    document.body.classList.add('simple-english');
  } else {
    document.body.classList.remove('simple-english');
  }
}

function generateVotedBadge() {
  const canvas = document.createElement('canvas');
  canvas.width = 400;
  canvas.height = 400;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#1f6feb';
  ctx.fillRect(0, 0, 400, 400);

  ctx.fillStyle = '#fff';
  ctx.font = 'bold 48px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('I VOTED', 200, 100);

  ctx.font = '36px Arial';
  ctx.fillText('✓', 200, 200);

  ctx.font = '24px Arial';
  ctx.fillText('Your vote matters', 200, 300);

  const link = document.createElement('a');
  link.href = canvas.toDataURL();
  link.download = 'i-voted-badge.png';
  link.click();
  showToast('Badge downloaded! Share on social media.');
}

const state = {
  assistantTopic: 'register',
  toastTimer: null,
  chatTimer: null,
  chatMessages: [],
  chatOpen: false,
};

const chatStorageKey = 'election-assistant-chat-history';
const chatOpenStorageKey = 'election-assistant-chat-open';

const chatQuickPrompts = [
  'Explain the election process',
  'How do I register to vote?',
  'What happens on election day?',
  'How are election results counted?',
  'Give election details for India',
];

const chatGreeting = {
  role: 'bot',
  title: 'Election chatbot ready.',
  text:
    'Ask me about registration, timelines, voting day, ballots, results, or a country-specific election question. I use free public web lookup when I need extra context.',
  bullets: [
    'Try a country name plus your question.',
    'Rules can vary by country, state, or local election office.',
    'Official election sites should always be the final source for deadlines.',
  ],
};

function loadChatSetting(key, fallback) {
  try {
    const value = sessionStorage.getItem(key);
    return value === null ? fallback : JSON.parse(value);
  } catch {
    return fallback;
  }
}

function saveChatSetting(key, value) {
  try {
    sessionStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Ignore storage failures in restricted browsers.
  }
}

function normalizeChatText(text) {
  return text.toLowerCase().replace(/\s+/g, ' ').trim();
}

function escapeHtml(text) {
  return text
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function buildChatSearchTerms(query) {
  const normalized = normalizeChatText(query);
  const terms = [query.trim()];

  if (!/election|vote|ballot|poll|registration|results|candidate|parliament|president|government/.test(normalized)) {
    terms.push(`${query.trim()} election`);
    terms.push(`elections in ${query.trim()}`);
    terms.push(`election process in ${query.trim()}`);
  } else {
    terms.push(`${query.trim()} election details`);
    terms.push(`${query.trim()} voting rules`);
  }

  return [...new Set(terms.filter(Boolean))];
}

function makeChatMessage(role, content) {
  return {
    id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    role,
    title: content.title || '',
    text: content.text || '',
    bullets: content.bullets || [],
    sourceLabel: content.sourceLabel || '',
    sourceUrl: content.sourceUrl || '',
  };
}

function findLocalChatAnswer(query) {
  const text = normalizeChatText(query);

  if (!text) {
    return makeChatMessage('bot', chatGreeting);
  }

  if (/^(hi|hello|hey|start|help)$/.test(text) || /what can you do/.test(text)) {
    return makeChatMessage('bot', {
      title: 'I can guide you through elections.',
      text:
        'Ask me about voter registration, voting day, result counting, or a specific country. If I do not know the answer locally, I will look up a free public source for context.',
      bullets: [
        'Use a country name for country-specific questions.',
        'I can explain the process in simple steps.',
        'I can also point you back to the checklist and timeline on this site.',
      ],
    });
  }

  if (/register|registration|voter roll|enroll|eligib/.test(text)) {
    return makeChatMessage('bot', {
      title: 'Registration comes first.',
      text:
        'Most election systems require you to be registered before the deadline. Check your local election office for the exact rules and cut-off dates.',
      bullets: [
        'Confirm your name and address.',
        'Check your deadline for updates or new registration.',
        'Ask whether your area needs a special ID or form.',
      ],
      sourceLabel: 'Site checklist',
      sourceUrl: 'steps.html',
    });
  }

  if (/vote|ballot|polling place|polling station|election day|id/.test(text)) {
    return makeChatMessage('bot', {
      title: 'Voting day is about preparation.',
      text:
        'Before you vote, confirm where to go, what identification you need, and how long the process may take. Some places also allow postal or early voting.',
      bullets: [
        'Find your polling place or voting method.',
        'Bring the ID or documents your area requires.',
        'Arrive early enough to handle queues or checks.',
      ],
      sourceLabel: 'Timeline page',
      sourceUrl: 'timeline.html',
    });
  }

  if (/result|count|certif|recount|declare/.test(text)) {
    return makeChatMessage('bot', {
      title: 'Results can take time.',
      text:
        'Election results are often counted in stages, then certified later. Official election offices are the best source for final outcomes.',
      bullets: [
        'Watch official election updates only.',
        'Expect some ballots to be counted after election night.',
        'Wait for certification before treating results as final.',
      ],
      sourceLabel: 'FAQ page',
      sourceUrl: 'faq.html',
    });
  }

  if (/timeline|deadline|when|date|schedule/.test(text)) {
    return makeChatMessage('bot', {
      title: 'Think in phases.',
      text:
        'A simple election timeline usually has three parts: prepare before election day, vote on election day, then follow the count and certification afterward.',
      bullets: [
        'Before: registration and plan setup.',
        'During: voting and submission.',
        'After: counting, results, and certification.',
      ],
      sourceLabel: 'Timeline page',
      sourceUrl: 'timeline.html',
    });
  }

  if (/country|world|global|international/.test(text)) {
    return makeChatMessage('bot', {
      title: 'I can look up country-specific context.',
      text:
        'Type the country name plus your question, such as “election rules in India” or “voting process in Canada.” I can then try a free public lookup for that topic.',
      bullets: [
        'Country names work best with a clear topic.',
        'Rules can differ by national, state, or local elections.',
        'I always recommend confirming deadlines with the official election office.',
      ],
    });
  }

  return null;
}

async function fetchWikipediaElectionSummary(query) {
  const terms = buildChatSearchTerms(query);

  for (const term of terms) {
    try {
      const searchUrl = new URL('https://en.wikipedia.org/w/api.php');
      searchUrl.searchParams.set('action', 'query');
      searchUrl.searchParams.set('list', 'search');
      searchUrl.searchParams.set('format', 'json');
      searchUrl.searchParams.set('origin', '*');
      searchUrl.searchParams.set('srlimit', '1');
      searchUrl.searchParams.set('srsearch', term);

      const searchResponse = await fetch(searchUrl.toString());
      if (!searchResponse.ok) continue;

      const searchData = await searchResponse.json();
      const title = searchData?.query?.search?.[0]?.title;
      if (!title) continue;

      const summaryResponse = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`);
      if (!summaryResponse.ok) continue;

      const summaryData = await summaryResponse.json();
      if (!summaryData?.extract) continue;

      return makeChatMessage('bot', {
        title: summaryData.title || title,
        text: summaryData.extract,
        bullets: [
          'This is a free public source lookup.',
          'Use official election offices for deadlines and legal requirements.',
        ],
        sourceLabel: 'Wikipedia source',
        sourceUrl: summaryData?.content_urls?.desktop?.page || `https://en.wikipedia.org/wiki/${encodeURIComponent(title.replace(/ /g, '_'))}`,
      });
    } catch {
      // Try the next search term.
    }
  }

  return null;
}

function createChatMessageElement(message) {
  const row = document.createElement('div');
  row.className = `chat-message ${message.role}`;

  const bubble = document.createElement('div');
  bubble.className = 'chat-bubble';

  if (message.title) {
    const title = document.createElement('strong');
    title.textContent = message.title;
    bubble.appendChild(title);
  }

  if (message.text) {
    const text = document.createElement('p');
    text.textContent = message.text;
    bubble.appendChild(text);
  }

  if (message.bullets?.length) {
    const list = document.createElement('ul');
    message.bullets.forEach((bullet) => {
      const item = document.createElement('li');
      item.textContent = bullet;
      list.appendChild(item);
    });
    bubble.appendChild(list);
  }

  if (message.sourceUrl) {
    const source = document.createElement('a');
    source.href = message.sourceUrl;
    source.target = '_blank';
    source.rel = 'noreferrer';
    source.textContent = message.sourceLabel || 'Source';
    bubble.appendChild(source);
  }

  row.appendChild(bubble);
  return row;
}

function initChatbot() {
  const existingWidget = document.querySelector('.chat-widget');
  if (existingWidget) return;

  const widget = document.createElement('section');
  widget.className = 'chat-widget';
  widget.innerHTML = `
    <button
      class="chat-launcher"
      type="button"
      data-chat-action="toggle"
      aria-expanded="false"
      aria-controls="chat-panel"
      title="Open AI assistant"
    >
      <span aria-hidden="true">🤖</span>
      <span class="sr-only">Open AI assistant</span>
    </button>
    <div class="chat-panel" id="chat-panel" hidden>
      <header class="chat-header">
        <div>
          <strong>Global chatbot</strong>
          <p>Free public lookup + simple election guidance</p>
        </div>
        <div class="chat-header-actions">
          <button class="chat-action" type="button" data-chat-action="clear">Clear</button>
          <button class="chat-action" type="button" data-chat-action="close">Close</button>
        </div>
      </header>
      <div class="chat-body" aria-live="polite"></div>
      <div class="chat-suggestions" aria-label="Suggested questions"></div>
      <form class="chat-form">
        <label class="sr-only" for="chat-input">Ask about elections</label>
        <input id="chat-input" name="chat-input" type="text" placeholder="Ask about a country, timeline..." autocomplete="off" />
        <button class="btn btn--primary chat-send" type="submit">Send</button>
      </form>
      <p class="chat-note">I can help with global election topics and use a free web lookup when the answer needs extra context.</p>
    </div>
  `;

  const assistantChatbotContainer = document.querySelector('.assistant-chatbot');
  if (assistantChatbotContainer) {
    assistantChatbotContainer.appendChild(widget.querySelector('.chat-panel'));
  } else {
    document.body.appendChild(widget);
  }


  const panel = widget.querySelector('.chat-panel') || document.querySelector('.chat-panel');
  const body = panel.querySelector('.chat-body');
  const suggestions = panel.querySelector('.chat-suggestions');
  const form = panel.querySelector('.chat-form');
  const input = panel.querySelector('#chat-input');
  const launcher = widget.querySelector('[data-chat-action="toggle"]');
  const clearButton = panel.querySelector('[data-chat-action="clear"]');
  const closeButton = panel.querySelector('[data-chat-action="close"]');

  state.chatMessages = loadChatSetting(chatStorageKey, [chatGreeting]);
  state.chatOpen = true; // Always open in the assistant view

  const setOpen = (isOpen) => {
    state.chatOpen = Boolean(isOpen);
    saveChatSetting(chatOpenStorageKey, state.chatOpen);
    panel.hidden = !state.chatOpen;
    
    if(launcher) {
        widget.classList.toggle('open', state.chatOpen);
        launcher.setAttribute('aria-expanded', String(state.chatOpen));
    }
   
    if (state.chatOpen) {
      input?.focus();
    }
  };

  const renderMessages = () => {
    body.innerHTML = '';
    state.chatMessages.forEach((message) => {
      body.appendChild(createChatMessageElement(message));
    });
    body.scrollTop = body.scrollHeight;
  };

  const renderSuggestions = () => {
    suggestions.innerHTML = '';
    chatQuickPrompts.forEach((prompt) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'chat-suggestion';
      button.textContent = prompt;
      button.addEventListener('click', () => submitPrompt(prompt));
      suggestions.appendChild(button);
    });
  };

  const setBusy = (isBusy) => {
    const sendButton = panel.querySelector('.chat-send');
    if (sendButton) sendButton.disabled = isBusy;
    if (input) input.disabled = isBusy;
  };

  const pushMessage = (message) => {
    state.chatMessages = [...state.chatMessages, message].slice(-24);
    saveChatSetting(chatStorageKey, state.chatMessages);
    renderMessages();
  };

  const resetConversation = () => {
    state.chatMessages = [chatGreeting];
    saveChatSetting(chatStorageKey, state.chatMessages);
    renderMessages();
    showToast('Chat cleared.');
  };

  const submitPrompt = async (prompt) => {
    const trimmed = String(prompt || '').trim();
    if (!trimmed || state.chatBusy) return;

    pushMessage(makeChatMessage('user', { text: trimmed }));
    setBusy(true);
    state.chatBusy = true;

    const loadingMessage = makeChatMessage('bot', {
      title: 'Looking that up now.',
      text: 'I am checking a free public source and matching it with the election guidance on this site.',
    });
    pushMessage(loadingMessage);

    try {
      const localAnswer = findLocalChatAnswer(trimmed);
      const response = localAnswer || (await fetchWikipediaElectionSummary(trimmed));

      state.chatMessages = state.chatMessages.filter((message) => message.id !== loadingMessage.id);

      if (response) {
        pushMessage(response);
      } else {
        pushMessage(makeChatMessage('bot', {
          title: 'I could not find a clean match.',
          text:
            'Try asking with a country name and a topic, such as “election process in Kenya” or “voter registration in Japan.”',
          bullets: [
            'Country + topic works best.',
            'You can also ask about registration, voting day, or results.',
            'Official election offices are the final source for exact rules.',
          ],
        }));
      }
    } catch {
      state.chatMessages = state.chatMessages.filter((message) => message.id !== loadingMessage.id);
      pushMessage(makeChatMessage('bot', {
        title: 'Offline fallback is active.',
        text:
          'The web lookup could not finish, but I can still help with the general election process and the step-by-step guidance on this site.',
        bullets: [
          'Try the Timeline page for phases.',
          'Try the Steps page for a checklist.',
          'Try the FAQ page for common questions.',
        ],
      }));
    } finally {
      state.chatBusy = false;
      setBusy(false);
      saveChatSetting(chatStorageKey, state.chatMessages);
      renderMessages();
      input?.focus();
    }
  };

  clearButton?.addEventListener('click', resetConversation);
  if(launcher) launcher.addEventListener('click', () => setOpen(!state.chatOpen));
  closeButton?.addEventListener('click', () => setOpen(false));

  form?.addEventListener('submit', (event) => {
    event.preventDefault();
    submitPrompt(input?.value || '');
    if (input) input.value = '';
  });

  panel.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && state.chatOpen) {
      setOpen(false);
    }
  });

  renderSuggestions();
  renderMessages();
  setOpen(state.chatOpen);
}

const assistantContent = {
  register: {
    title: 'Check your registration status first.',
    copy: 'Start by confirming your registration and making sure your address and name are current. This avoids problems later in the process.',
    list: [
      'Confirm your name and address.',
      'Check the deadline for registration changes.',
      'Save a reminder for election day.',
    ],
  },
  vote: {
    title: 'Prepare for election day in advance.',
    copy: 'If you already know you can vote, focus on the exact place, time, and requirements so election day feels simple.',
    list: [
      'Find your voting location.',
      'Review any ID or document rules.',
      'Plan your route and arrival time.',
    ],
  },
  results: {
    title: 'Use official sources for results.',
    copy: 'Results can take time. Follow trusted election office updates and wait for certification before treating numbers as final.',
    list: [
      'Watch official election updates only.',
      'Expect ballots to be counted in stages.',
      'Wait for final certification before drawing conclusions.',
    ],
  },
};

function showToast(message) {
  let toast = document.querySelector('.toast');

  if (!toast) {
    toast = document.createElement('div');
    toast.className = 'toast';
    toast.setAttribute('role', 'status');
    toast.setAttribute('aria-live', 'polite');
    document.body.appendChild(toast);
  }

  toast.textContent = message;
  toast.classList.add('show');

  clearTimeout(state.toastTimer);
  state.toastTimer = window.setTimeout(() => {
    toast.classList.remove('show');
  }, 2000);
}

function setAssistantTopic(topic) {
  const data = assistantContent[topic] || assistantContent.register;
  state.assistantTopic = topic in assistantContent ? topic : 'register';

  const title = document.querySelector('[data-answer-title]');
  const copy = document.querySelector('[data-answer-copy]');
  const list = document.querySelector('[data-answer-list]');
  const buttons = document.querySelectorAll('[data-assistant-topic]');

  if (title) title.textContent = data.title;
  if (copy) copy.textContent = data.copy;
  if (list) {
    list.innerHTML = data.list.map((item) => `<li>${sanitizeHTML(item)}</li>`).join('');
  }

  buttons.forEach((btn) => {
    const isActive = btn.dataset.assistantTopic === state.assistantTopic;
    btn.classList.toggle('btn--primary', isActive);
    btn.classList.toggle('btn--secondary', !isActive);
    btn.setAttribute('aria-selected', String(isActive));
  });
}

function initHeader() {
  const toggle = document.querySelector('.menu-toggle');
  const nav = document.querySelector('.site-nav');

  if (!toggle || !nav) return;

  toggle.addEventListener('click', () => {
    const isOpen = nav.classList.toggle('open');
    toggle.setAttribute('aria-expanded', String(isOpen));
  });
}

function initHome() {
  const chips = document.querySelectorAll('[data-assistant-topic]');

  if (!chips.length) return;

  chips.forEach((chip) => {
    chip.addEventListener('click', () => setAssistantTopic(chip.dataset.assistantTopic));
  });

  setAssistantTopic('register');
}

function initTimeline() {
  const filterButtons = document.querySelectorAll('[data-timeline-filter]');
  const cards = document.querySelectorAll('.timeline-card');

  if (!filterButtons.length || !cards.length) return;

  const applyFilter = (filter) => {
    cards.forEach((card) => {
      const shouldShow = filter === 'all' || card.dataset.stage === filter;
      card.classList.toggle('is-hidden', !shouldShow);
    });

    filterButtons.forEach((button) => {
      button.classList.toggle('active', button.dataset.timelineFilter === filter);
    });
  };

  filterButtons.forEach((button) => {
    button.addEventListener('click', () => applyFilter(button.dataset.timelineFilter));
  });

  applyFilter('all');
}

function initSteps() {
  const checks = Array.from(document.querySelectorAll('[data-step-check]'));
  const totalNode = document.querySelector('[data-progress-total]');
  const countNode = document.querySelector('[data-progress-count]');
  const fillNode = document.querySelector('[data-progress-fill]');
  const markAllButton = document.querySelector('[data-action="mark-all"]');
  const resetButton = document.querySelector('[data-action="reset-all"]');
  const copyButton = document.querySelector('[data-action="copy-summary"]');

  if (!checks.length || !totalNode || !countNode || !fillNode) return;

  totalNode.textContent = String(checks.length);

  const updateProgress = () => {
    const complete = checks.filter((check) => check.checked).length;
    const percent = Math.round((complete / checks.length) * 100);

    countNode.textContent = String(complete);
    fillNode.style.width = `${percent}%`;
  };

  checks.forEach((check) => {
    check.addEventListener('change', updateProgress);
  });

  markAllButton?.addEventListener('click', () => {
    checks.forEach((check) => {
      check.checked = true;
    });
    updateProgress();
    showToast('All checklist items marked complete.');
  });

  resetButton?.addEventListener('click', () => {
    checks.forEach((check) => {
      check.checked = false;
    });
    updateProgress();
    showToast('Checklist reset.');
  });

  copyButton?.addEventListener('click', async () => {
    const summary = checks
      .map((check, index) => `${index + 1}. ${check.nextElementSibling?.querySelector('strong')?.textContent || 'Step'}`)
      .join('\n');

    try {
      await navigator.clipboard.writeText(summary);
      showToast('Checklist summary copied to clipboard.');
    } catch {
      showToast('Copy is unavailable in this browser, but the summary is ready on screen.');
    }
  });

  updateProgress();
}

function initFaq() {
  const accordionButtons = document.querySelectorAll('.faq-question');
  const expandAllButton = document.querySelector('[data-accordion-action="expand-all"]');
  const collapseAllButton = document.querySelector('[data-accordion-action="collapse-all"]');
  const copyButton = document.querySelector('[data-accordion-action="copy-faq"]');

  if (!accordionButtons.length) return;

  const setItemState = (button, expanded) => {
    const panel = button.nextElementSibling;
    button.setAttribute('aria-expanded', String(expanded));
    if (panel) panel.hidden = !expanded;
  };

  accordionButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const expanded = button.getAttribute('aria-expanded') === 'true';
      setItemState(button, !expanded);
    });
  });

  expandAllButton?.addEventListener('click', () => {
    accordionButtons.forEach((button) => setItemState(button, true));
    showToast('All FAQ answers expanded.');
  });

  collapseAllButton?.addEventListener('click', () => {
    accordionButtons.forEach((button) => setItemState(button, false));
    showToast('All FAQ answers collapsed.');
  });

  copyButton?.addEventListener('click', async () => {
    const text = Array.from(accordionButtons)
      .map((button) => `${button.textContent?.trim()} - ${button.nextElementSibling?.textContent?.trim() || ''}`)
      .join('\n');

    try {
      await navigator.clipboard.writeText(text);
      showToast('FAQ summary copied to clipboard.');
    } catch {
      showToast('Copy is unavailable in this browser, but the FAQ content is visible.');
    }
  });
}

const stateElectionOfficeUrls = {
  AL: 'https://www.sos.alabama.gov/alabama-votes',
  AK: 'https://www.elections.alaska.gov/',
  AZ: 'https://azsos.gov/elections',
  AR: 'https://www.sos.arkansas.gov/elections',
  CA: 'https://www.sos.ca.gov/elections',
  CO: 'https://www.sos.state.co.us/pubs/elections/main.html',
  CT: 'https://portal.ct.gov/sots/election-services/election-services',
  DE: 'https://elections.delaware.gov/',
  FL: 'https://dos.myflorida.com/elections/',
  GA: 'https://sos.ga.gov/how-to-guide/how-guide-voting',
  HI: 'https://elections.hawaii.gov/',
  ID: 'https://voteidaho.gov/',
  IL: 'https://elections.il.gov/',
  IN: 'https://www.in.gov/sos/elections/',
  IA: 'https://sos.iowa.gov/elections/',
  KS: 'https://sos.ks.gov/elections/elections.html',
  KY: 'https://elect.ky.gov/',
  LA: 'https://www.sos.la.gov/ElectionsAndVoting',
  ME: 'https://www.maine.gov/sos/cec/elec/',
  MD: 'https://elections.maryland.gov/',
  MA: 'https://www.sec.state.ma.us/divisions/elections/',
  MI: 'https://www.michigan.gov/sos/elections',
  MN: 'https://www.sos.state.mn.us/elections-voting/',
  MS: 'https://www.sos.ms.gov/elections-voting',
  MO: 'https://www.sos.mo.gov/elections',
  MT: 'https://sosmt.gov/elections/',
  NE: 'https://sos.nebraska.gov/elections',
  NV: 'https://www.nvsos.gov/sos/elections',
  NH: 'https://www.sos.nh.gov/elections',
  NJ: 'https://www.nj.gov/state/elections/',
  NM: 'https://www.sos.nm.gov/voting-and-elections/',
  NY: 'https://elections.ny.gov/',
  NC: 'https://www.ncsbe.gov/',
  ND: 'https://vip.sos.nd.gov/',
  OH: 'https://www.ohiosos.gov/elections/',
  OK: 'https://oklahoma.gov/elections.html',
  OR: 'https://sos.oregon.gov/voting-elections/',
  PA: 'https://www.vote.pa.gov/',
  RI: 'https://vote.sos.ri.gov/',
  SC: 'https://scvotes.gov/',
  SD: 'https://sdsos.gov/elections-voting/',
  TN: 'https://sos.tn.gov/elections',
  TX: 'https://www.votetexas.gov/',
  UT: 'https://vote.utah.gov/',
  VT: 'https://sos.vermont.gov/elections/',
  VA: 'https://www.elections.virginia.gov/',
  WA: 'https://www.sos.wa.gov/elections/',
  WV: 'https://sos.wv.gov/elections/Pages/default.aspx',
  WI: 'https://elections.wi.gov/',
  WY: 'https://sos.wyo.gov/elections/',
  DC: 'https://www.dcboe.org/',
};

function normalizeUsZip(rawValue) {
  const raw = String(rawValue || '').trim();
  const digits = raw.replace(/[^\d]/g, '');

  if (digits.length === 5) return digits;
  if (digits.length === 9) return `${digits.slice(0, 5)}-${digits.slice(5)}`;
  return '';
}

function isValidUsZip(zip) {
  return /^\d{5}(-\d{4})?$/.test(zip);
}

function makeMapsSearchUrl(query) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

function makeTransitUrl(destination) {
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination)}&travelmode=transit`;
}

function renderVerifiedLogisticsResult(result) {
  const resultsNode = document.querySelector('[data-logistics-results]');
  if (!resultsNode) return;

  const locationLabel = `${result.city}, ${result.stateAbbr} ${result.zip}`;
  const stateUrl = stateElectionOfficeUrls[result.stateAbbr] || 'https://www.usa.gov/state-election-office';
  const mapsUrl = makeMapsSearchUrl(locationLabel);
  const transitUrl = makeTransitUrl(locationLabel);

  resultsNode.innerHTML = `
    <article class="polling-card">
      <header class="polling-header">
        <h3>ZIP Verified: ${escapeHtml(result.zip)}</h3>
        <div class="wait-badge" data-wait-level="low">Verified</div>
      </header>
      <div class="polling-info">
        <p class="address">${escapeHtml(result.city)}, ${escapeHtml(result.state)} (${escapeHtml(result.stateAbbr)})</p>
        <p class="hours">Coordinates: ${escapeHtml(result.latitude)}, ${escapeHtml(result.longitude)}</p>
      </div>
      <div class="accessibility-grid">
        <a class="accessibility-feature" href="${mapsUrl}" target="_blank" rel="noreferrer">📍 Open map for this ZIP</a>
        <a class="accessibility-feature" href="${transitUrl}" target="_blank" rel="noreferrer">🚌 Transit directions</a>
        <a class="accessibility-feature" href="${stateUrl}" target="_blank" rel="noreferrer">🏛 Official state election office</a>
      </div>
      <div class="polling-actions">
        <a class="button button-secondary small" href="${stateUrl}" target="_blank" rel="noreferrer">Confirm polling place officially</a>
      </div>
    </article>
  `;
}

async function verifyZipWithApi(zipInput) {
  const zip = normalizeUsZip(zipInput);
  if (!isValidUsZip(zip)) {
    return { ok: false, message: 'Enter a valid US ZIP code (5 digits or ZIP+4).' };
  }

  const zipFive = zip.slice(0, 5);

  try {
    const response = await fetch(`https://api.zippopotam.us/us/${zipFive}`);
    if (!response.ok) {
      return { ok: false, message: 'ZIP not found in postal verification service.' };
    }

    const data = await response.json();
    const place = data?.places?.[0];
    if (!place) {
      return { ok: false, message: 'ZIP lookup returned no location data.' };
    }

    return {
      ok: true,
      result: {
        zip,
        city: place['place name'] || '',
        state: place.state || '',
        stateAbbr: place['state abbreviation'] || '',
        latitude: place.latitude || '',
        longitude: place.longitude || '',
      },
    };
  } catch {
    return { ok: false, message: 'Unable to reach ZIP verification service right now.' };
  }
}

function initLogistics() {
  const zipInput = document.querySelector('#zip-input');
  const searchButton = document.querySelector('[data-logistics-action="search"]');
  const statusNode = document.querySelector('[data-logistics-status]');

  if (!zipInput || !searchButton || !statusNode) return;

  const setStatus = (message, isError = false) => {
    statusNode.textContent = message;
    statusNode.classList.toggle('is-error', isError);
  };

  const runSearch = async () => {
    setStatus('Verifying ZIP code with postal service...');
    searchButton.disabled = true;

    const verification = await verifyZipWithApi(zipInput.value);

    searchButton.disabled = false;

    if (!verification.ok) {
      document.querySelector('[data-logistics-results]').innerHTML = '';
      setStatus(verification.message, true);
      showToast(verification.message);
      return;
    }

    const result = verification.result;
    zipInput.value = result.zip;
    state.lastVerifiedLogistics = result;
    renderVerifiedLogisticsResult(result);
    setStatus(`ZIP verified: ${result.zip} (${result.city}, ${result.stateAbbr}). Use official link to confirm exact polling place.`);
    showToast('ZIP verified successfully.');
  };

  searchButton.addEventListener('click', runSearch);
  zipInput.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      runSearch();
    }
  });

  document.querySelector('[data-logistics-action="ride"]')?.addEventListener('click', () => {
    const last = state.lastVerifiedLogistics;
    if (!last) {
      showToast('Verify a ZIP code first.');
      return;
    }
    const destination = `${last.city}, ${last.stateAbbr} ${last.zip}`;
    window.open(makeMapsSearchUrl(destination), '_blank', 'noopener,noreferrer');
  });

  document.querySelector('[data-logistics-action="transit"]')?.addEventListener('click', () => {
    const last = state.lastVerifiedLogistics;
    if (!last) {
      showToast('Verify a ZIP code first.');
      return;
    }
    const destination = `${last.city}, ${last.stateAbbr} ${last.zip}`;
    window.open(makeTransitUrl(destination), '_blank', 'noopener,noreferrer');
  });

  document.querySelector('[data-logistics-action="official"]')?.addEventListener('click', () => {
    const last = state.lastVerifiedLogistics;
    if (!last) {
      showToast('Verify a ZIP code first.');
      return;
    }
    const officialUrl = stateElectionOfficeUrls[last.stateAbbr] || 'https://www.usa.gov/state-election-office';
    window.open(officialUrl, '_blank', 'noopener,noreferrer');
  });
}

function initApp() {
  initHeader();
  initHome();
  initTimeline();
  initSteps();
  initFaq();
  initLogistics();
  initChatbot();
  initBallotBuilder();
  initBallotActions();
  initAccessibility();
  initServiceWorker();
  initGoogleAnalytics();
  initPerformanceMonitoring();
}

/**
 * Register Service Worker for offline support
 */
function initServiceWorker() {
  if ('serviceWorker' in navigator && isSecureContext()) {
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('/sw.js', { scope: '/' })
        .then((registration) => {
          console.log('Service Worker registered successfully:', registration.scope);
          
          // Check for updates periodically
          setInterval(() => {
            registration.update();
          }, 60 * 60 * 1000); // Check every hour
        })
        .catch((error) => {
          console.log('Service Worker registration failed:', error.message);
        });
    });
  }
}

/**
 * Initialize Google Analytics (GA4)
 * Replace 'G-XXXXXXXXXX' with your actual measurement ID
 */
function initGoogleAnalytics() {
  // Only load GA in production
  if (location.hostname === 'localhost' || location.hostname === '127.0.0.1') {
    return;
  }

  // Check if user has consented to analytics
  const analyticsConsent = loadSetting('analytics-consent', null);
  if (analyticsConsent === false) {
    return;
  }

  // Load GA4 script
  const gaScript = document.createElement('script');
  gaScript.async = true;
  gaScript.src = 'https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX';
  document.head.appendChild(gaScript);

  window.dataLayer = window.dataLayer || [];
  function gtag() {
    dataLayer.push(arguments);
  }
  gtag('js', new Date());
  gtag('config', 'G-XXXXXXXXXX', {
    send_page_view: true,
    anonymize_ip: true,
    cookie_flags: 'SameSite=None;Secure'
  });

  // Track page views on navigation
  document.addEventListener('click', (event) => {
    const link = event.target.closest('a');
    if (link && link.href && link.hostname === location.hostname) {
      gtag('event', 'page_view', {
        page_path: link.pathname,
        page_title: document.title
      });
    }
  });
}

/**
 * Initialize Performance Monitoring
 */
function initPerformanceMonitoring() {
  // Only monitor in production
  if (location.hostname === 'localhost' || location.hostname === '127.0.0.1') {
    return;
  }

  // Report Web Vitals
  if ('PerformanceObserver' in window) {
    // Largest Contentful Paint
    try {
      const lcpObserver = new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries();
        const lastEntry = entries[entries.length - 1];
        console.log('LCP:', lastEntry.renderTime || lastEntry.loadTime);
      });
      lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });
    } catch (e) {
      // LCP not supported
    }

    // First Input Delay
    try {
      const fidObserver = new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries();
        entries.forEach((entry) => {
          console.log('FID:', entry.processingStart - entry.startTime);
        });
      });
      fidObserver.observe({ type: 'first-input', buffered: true });
    } catch (e) {
      // FID not supported
    }

    // Cumulative Layout Shift
    try {
      let clsValue = 0;
      const clsObserver = new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries();
        entries.forEach((entry) => {
          if (!entry.hadRecentInput) {
            clsValue += entry.value;
          }
        });
        console.log('CLS:', clsValue);
      });
      clsObserver.observe({ type: 'layout-shift', buffered: true });
    } catch (e) {
      // CLS not supported
    }
  }

  // Report navigation timing
  window.addEventListener('load', () => {
    setTimeout(() => {
      const perfData = performance.getEntriesByType('navigation')[0];
      if (perfData) {
        console.log('Page Load Time:', perfData.loadEventEnd - perfData.fetchStart);
        console.log('DOM Content Loaded:', perfData.domContentLoadedEventEnd - perfData.fetchStart);
      }
    }, 0);
  });
}

// Initialize the application
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}
