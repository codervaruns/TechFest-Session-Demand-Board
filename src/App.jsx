import { useState, useEffect } from 'react';

// ─── Default Data ───────────────────────────────────────────────────────────────

const DEFAULT_TALKS = [
  { id: 'T01', name: 'Line Follower Clinic', instances: 2, seats: 2 },
  { id: 'T02', name: 'Web Security Basics', instances: 2, seats: 2 },
  { id: 'T03', name: 'Poster Design Critique', instances: 2, seats: 3 },
  { id: 'T04', name: 'PCB Debugging', instances: 1, seats: 4 },
];

const DEFAULT_INTERESTS = [
  { attendeeId: 'A01', talkId: 'T01' },
  { attendeeId: 'A01', talkId: 'T02' },
  { attendeeId: 'A01', talkId: 'T04' },
  { attendeeId: 'A02', talkId: 'T01' },
  { attendeeId: 'A02', talkId: 'T04' },
  { attendeeId: 'A03', talkId: 'T01' },
  { attendeeId: 'A03', talkId: 'T02' },
  { attendeeId: 'A04', talkId: 'T01' },
  { attendeeId: 'A04', talkId: 'T02' },
  { attendeeId: 'A04', talkId: 'T04' },
  { attendeeId: 'A05', talkId: 'T01' },
  { attendeeId: 'A05', talkId: 'T04' },
  { attendeeId: 'A06', talkId: 'T02' },
  { attendeeId: 'A06', talkId: 'T03' },
  { attendeeId: 'A06', talkId: 'T04' },
  { attendeeId: 'A07', talkId: 'T03' },
  { attendeeId: 'A08', talkId: 'T03' },
];

// ─── Pure Validation Functions ──────────────────────────────────────────────────

/**
 * Validates the talks array.
 * Returns { valid: true, errors: [] } or { valid: false, errors: string[] }.
 * Collects all validation errors across all talk rows.
 */
function validateTalks(talks) {
  const errors = [];

  for (let i = 0; i < talks.length; i++) {
    const talk = talks[i];
    const trimmedId = (talk.id ?? '').trim();

    // Blank talk ID
    if (trimmedId === '') {
      errors.push(`INVALID_TALK — Row ${i + 1} has a blank Talk ID.`);
    }

    // Duplicate talk ID (check against all previous talks)
    if (trimmedId !== '') {
      for (let j = 0; j < i; j++) {
        if ((talks[j].id ?? '').trim() === trimmedId) {
          errors.push(`DUPLICATE_TALK_ID — "${trimmedId}" appears in rows ${j + 1} and ${i + 1}.`);
          break;
        }
      }
    }

    // Instances must be a positive integer
    if (!Number.isInteger(talk.instances) || talk.instances <= 0) {
      errors.push(`INVALID_CAPACITY — Row ${i + 1} ("${trimmedId || `Row ${i + 1}`}"): instances must be a positive integer, got "${talk.instances}".`);
    }

    // Seats must be a positive integer
    if (!Number.isInteger(talk.seats) || talk.seats <= 0) {
      errors.push(`INVALID_CAPACITY — Row ${i + 1} ("${trimmedId || `Row ${i + 1}`}"): seats must be a positive integer, got "${talk.seats}".`);
    }
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Validates the interests array against a set of known talk IDs.
 * Returns { valid: true, errors: [] } or { valid: false, errors: string[] }.
 * Collects all validation errors across all interest rows.
 */
function validateInterests(interests, validTalkIds) {
  const errors = [];
  const seen = new Set();

  for (let i = 0; i < interests.length; i++) {
    const interest = interests[i];
    const trimmedAttendee = (interest.attendeeId ?? '').trim();
    const trimmedTalk = (interest.talkId ?? '').trim();

    // Blank attendee ID
    if (trimmedAttendee === '') {
      errors.push(`INVALID_INTEREST — Row ${i + 1} has a blank Attendee ID.`);
    }

    // Duplicate (attendeeId, talkId) pair
    if (trimmedAttendee !== '' && trimmedTalk !== '') {
      const pairKey = `${trimmedAttendee}::${trimmedTalk}`;
      if (seen.has(pairKey)) {
        errors.push(`DUPLICATE_INTEREST — Row ${i + 1}: pair (${trimmedAttendee}, ${trimmedTalk}) already exists.`);
      } else {
        seen.add(pairKey);
      }
    }

    // Unknown talk ID
    if (trimmedTalk !== '' && !validTalkIds.has(trimmedTalk)) {
      errors.push(`UNKNOWN_TALK — Row ${i + 1}: attendee "${trimmedAttendee}" registered for unknown talk "${trimmedTalk}".`);
    }
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Runs all validations: talks first, then interests.
 * Returns { valid: true, errors: [] } or { valid: false, errors: string[] }.
 * Collects all validation errors across both tables.
 */
function validateAll(talks, interests) {
  const talksResult = validateTalks(talks);
  const validTalkIds = new Set(talks.map((t) => (t.id ?? '').trim()).filter(Boolean));
  const interestsResult = validateInterests(interests, validTalkIds);

  const errors = [...talksResult.errors, ...interestsResult.errors];

  return { valid: errors.length === 0, errors };
}

// ─── Pure Calculation Functions ─────────────────────────────────────────────────

const STATUS_PRIORITY = { OVER_CAPACITY: 0, FULL: 1, SPARE: 2 };

/**
 * Calculates demand, capacity, delta, and status for each talk.
 * Returns an unsorted array of result objects.
 */
function calculateResults(talks, interests) {
  // Count demand per talk
  const demandMap = {};
  for (const interest of interests) {
    const tid = interest.talkId.trim();
    demandMap[tid] = (demandMap[tid] || 0) + 1;
  }

  return talks.map((talk) => {
    const talkId = talk.id.trim();
    const demand = demandMap[talkId] || 0;
    const capacity = talk.instances * talk.seats;
    const delta = demand - capacity;
    let status;
    if (delta > 0) status = 'OVER_CAPACITY';
    else if (delta === 0) status = 'FULL';
    else status = 'SPARE';

    return { talkId, talkName: talk.name, demand, capacity, delta, status };
  });
}

/**
 * Sorts results by: Status Priority → Demand (desc) → Talk ID (asc).
 */
function sortResults(results) {
  return [...results].sort((a, b) => {
    // 1. Status priority
    const sp = STATUS_PRIORITY[a.status] - STATUS_PRIORITY[b.status];
    if (sp !== 0) return sp;
    // 2. Demand descending
    if (b.demand !== a.demand) return b.demand - a.demand;
    // 3. Talk ID ascending
    return a.talkId.localeCompare(b.talkId);
  });
}

// ─── Helper: Generate a unique row key ──────────────────────────────────────────

let _keyCounter = 0;
function nextKey() {
  return `_k${++_keyCounter}`;
}

// ─── UI Components ──────────────────────────────────────────────────────────────

function Modal({ title, children, onClose }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-slate-900/40 dark:bg-black/60 backdrop-blur-sm transition-opacity duration-300" />

      {/* Modal card */}
      <div
        className="relative w-full max-w-md glass-card-strong p-6 space-y-5 animate-[fadeIn_0.2s_ease-out]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-800 dark:text-white">{title}</h2>
          <button
            onClick={onClose}
            className="btn-icon"
            aria-label="Close modal"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function TalkFormModal({ talk, onSave, onClose }) {
  const [id, setId] = useState(talk?.id ?? '');
  const [name, setName] = useState(talk?.name ?? '');
  const [instances, setInstances] = useState(talk?.instances ?? 1);
  const [seats, setSeats] = useState(talk?.seats ?? 1);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      id,
      name,
      instances: parseInt(instances, 10) || 0,
      seats: parseInt(seats, 10) || 0,
    });
  };

  return (
    <Modal title={talk ? 'Edit Talk' : 'Add Talk'} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-slate-500 dark:text-white/50 mb-1.5 uppercase tracking-wider">Talk ID</label>
          <input
            id="talk-id-input"
            className="glass-input w-full"
            value={id}
            onChange={(e) => setId(e.target.value)}
            placeholder="e.g. T05"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-500 dark:text-white/50 mb-1.5 uppercase tracking-wider">Talk Name</label>
          <input
            id="talk-name-input"
            className="glass-input w-full"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Intro to Robotics"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-500 dark:text-white/50 mb-1.5 uppercase tracking-wider">Instances</label>
            <input
              id="talk-instances-input"
              type="number"
              className="glass-input w-full"
              value={instances}
              onChange={(e) => setInstances(e.target.value)}
              min="1"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 dark:text-white/50 mb-1.5 uppercase tracking-wider">Seats / Instance</label>
            <input
              id="talk-seats-input"
              type="number"
              className="glass-input w-full"
              value={seats}
              onChange={(e) => setSeats(e.target.value)}
              min="1"
            />
          </div>
        </div>
        <div className="flex gap-3 pt-2">
          <button type="submit" id="talk-save-btn" className="btn-primary flex-1">Save</button>
          <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
        </div>
      </form>
    </Modal>
  );
}

function InterestFormModal({ interest, onSave, onClose }) {
  const [attendeeId, setAttendeeId] = useState(interest?.attendeeId ?? '');
  const [talkId, setTalkId] = useState(interest?.talkId ?? '');

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({ attendeeId, talkId });
  };

  return (
    <Modal title={interest ? 'Edit Interest' : 'Add Interest'} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-slate-500 dark:text-white/50 mb-1.5 uppercase tracking-wider">Attendee ID</label>
          <input
            id="interest-attendee-input"
            className="glass-input w-full"
            value={attendeeId}
            onChange={(e) => setAttendeeId(e.target.value)}
            placeholder="e.g. A09"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-500 dark:text-white/50 mb-1.5 uppercase tracking-wider">Talk ID</label>
          <input
            id="interest-talk-input"
            className="glass-input w-full"
            value={talkId}
            onChange={(e) => setTalkId(e.target.value)}
            placeholder="e.g. T01"
          />
        </div>
        <div className="flex gap-3 pt-2">
          <button type="submit" id="interest-save-btn" className="btn-primary flex-1">Save</button>
          <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
        </div>
      </form>
    </Modal>
  );
}

function StatusBadge({ status }) {
  const config = {
    OVER_CAPACITY: {
      bg: 'bg-rose-500/15 dark:bg-rose-500/20',
      border: 'border-rose-500/30 dark:border-rose-500/40',
      text: 'text-rose-700 dark:text-rose-300',
      dot: 'bg-rose-500 dark:bg-rose-400',
    },
    FULL: {
      bg: 'bg-amber-500/15 dark:bg-amber-500/20',
      border: 'border-amber-500/30 dark:border-amber-500/40',
      text: 'text-amber-800 dark:text-amber-300',
      dot: 'bg-amber-500 dark:bg-amber-400',
    },
    SPARE: {
      bg: 'bg-cyan-500/15 dark:bg-cyan-500/20',
      border: 'border-cyan-500/30 dark:border-cyan-500/40',
      text: 'text-cyan-800 dark:text-cyan-300',
      dot: 'bg-cyan-500 dark:bg-cyan-400',
    },
  };
  const c = config[status];
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${c?.bg ?? ''} ${c?.border ?? ''} ${c?.text ?? ''}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${c?.dot ?? ''}`} />
      {status ? status.replace(/_/g, ' ') : ''}
    </span>
  );
}

function DemandBar({ demand, capacity, status }) {
  const max = Math.max(demand, capacity, 1);
  const demandPct = Math.min((demand / max) * 100, 100);
  const capacityPct = (capacity / max) * 100;

  const barColor = {
    OVER_CAPACITY: 'bg-gradient-to-r from-rose-500 to-rose-400',
    FULL: 'bg-gradient-to-r from-amber-500 to-amber-400',
    SPARE: 'bg-gradient-to-r from-cyan-500 to-cyan-400',
  }[status];

  return (
    <div className="mt-1.5 mb-1">
      <div className="relative h-2.5 bg-slate-200/80 dark:bg-white/[0.06] rounded-full overflow-hidden">
        {/* Capacity marker */}
        {capacity < max && (
          <div
            className="absolute top-0 bottom-0 w-px bg-slate-400 dark:bg-white/30 z-10"
            style={{ left: `${capacityPct}%` }}
            title={`Capacity: ${capacity}`}
          />
        )}
        {/* Demand fill */}
        <div
          className={`h-full rounded-full transition-all duration-500 ease-out ${barColor}`}
          style={{ width: `${demandPct}%` }}
        />
      </div>
      <div className="flex justify-between mt-0.5 text-[10px] text-slate-500 dark:text-white/30">
        <span>Demand: {demand}</span>
        <span>Cap: {capacity}</span>
      </div>
    </div>
  );
}

// ─── Main App ───────────────────────────────────────────────────────────────────

function deepClone(arr) {
  return arr.map((item) => ({ ...item, _key: nextKey() }));
}

export default function App() {
  const [talks, setTalks] = useState(() => deepClone(DEFAULT_TALKS));
  const [interests, setInterests] = useState(() => deepClone(DEFAULT_INTERESTS));
  const [results, setResults] = useState(null);
  const [errors, setErrors] = useState([]);
  const [modalState, setModalState] = useState(null); // { type, mode, index, data }

  // ── Theme State & Sync ─────────────────────────────────────────────────────────

  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem('techfest_theme');
    if (saved) return saved;
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'dark';
  });

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('techfest_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  // ── Calculation Action ─────────────────────────────────────────────────────────

  const handleCalculate = (currentTalks = talks, currentInterests = interests) => {
    const cleanTalks = currentTalks.map(({ _key, ...rest }) => rest);
    const cleanInterests = currentInterests.map(({ _key, ...rest }) => rest);

    const validation = validateAll(cleanTalks, cleanInterests);
    if (!validation.valid) {
      setErrors(validation.errors);
      setResults(null);
    } else {
      setErrors([]);
      const raw = calculateResults(cleanTalks, cleanInterests);
      setResults(sortResults(raw));
    }
  };

  // ── Actions ───────────────────────────────────────────────────────────────────

  const handleReset = () => {
    setTalks(deepClone(DEFAULT_TALKS));
    setInterests(deepClone(DEFAULT_INTERESTS));
    setErrors([]);
    setResults(null);
  };

  // ── Talk CRUD ─────────────────────────────────────────────────────────────────

  const openAddTalk = () => setModalState({ type: 'talk', mode: 'add' });
  const openEditTalk = (index) =>
    setModalState({ type: 'talk', mode: 'edit', index, data: talks[index] });

  const saveTalk = (data) => {
    if (modalState.mode === 'add') {
      setTalks((prev) => [...prev, { ...data, _key: nextKey() }]);
    } else {
      setTalks((prev) =>
        prev.map((t, i) => (i === modalState.index ? { ...data, _key: t._key } : t))
      );
    }
    setModalState(null);
  };

  const deleteTalk = (index) => {
    setTalks((prev) => prev.filter((_, i) => i !== index));
  };

  // ── Interest CRUD ─────────────────────────────────────────────────────────────

  const openAddInterest = () => setModalState({ type: 'interest', mode: 'add' });
  const openEditInterest = (index) =>
    setModalState({ type: 'interest', mode: 'edit', index, data: interests[index] });

  const saveInterest = (data) => {
    if (modalState.mode === 'add') {
      setInterests((prev) => [...prev, { ...data, _key: nextKey() }]);
    } else {
      setInterests((prev) =>
        prev.map((t, i) => (i === modalState.index ? { ...data, _key: t._key } : t))
      );
    }
    setModalState(null);
  };

  const deleteInterest = (index) => {
    setInterests((prev) => prev.filter((_, i) => i !== index));
  };

  // ── Status counts ─────────────────────────────────────────────────────────────

  const statusCounts = results
    ? {
        OVER_CAPACITY: results.filter((r) => r.status === 'OVER_CAPACITY').length,
        FULL: results.filter((r) => r.status === 'FULL').length,
        SPARE: results.filter((r) => r.status === 'SPARE').length,
      }
    : null;

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <div className="relative min-h-screen text-slate-800 dark:text-white transition-colors duration-500 ease-in-out">
      {/* Dual stacked background gradient layers for 100% smooth cross-fading in BOTH directions */}
      <div className="fixed inset-0 bg-gradient-to-br from-slate-100 via-slate-50 to-slate-200 pointer-events-none transition-opacity duration-500 ease-in-out opacity-100 dark:opacity-0" />
      <div className="fixed inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 pointer-events-none transition-opacity duration-500 ease-in-out opacity-0 dark:opacity-100" />

      {/* Decorative blobs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-cyan-500/[0.08] dark:bg-cyan-500/[0.07] rounded-full blur-3xl transition-opacity duration-500" />
        <div className="absolute top-1/2 -left-40 w-96 h-96 bg-purple-500/[0.08] dark:bg-purple-500/[0.05] rounded-full blur-3xl transition-opacity duration-500" />
        <div className="absolute -bottom-40 right-1/3 w-96 h-96 bg-rose-500/[0.08] dark:bg-rose-500/[0.05] rounded-full blur-3xl transition-opacity duration-500" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <header className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                <span className="bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-600 dark:from-cyan-400 dark:via-blue-400 dark:to-purple-400 bg-clip-text text-transparent">
                  TechFest
                </span>{' '}
                <span className="text-slate-800 dark:text-white/90 transition-colors duration-500">Session Demand Board</span>
              </h1>
              <p className="mt-1 text-sm text-slate-500 dark:text-white/40 transition-colors duration-500">
                Track demand, capacity, and scheduling conflicts at a glance.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                id="theme-toggle-btn"
                onClick={toggleTheme}
                className="btn-secondary flex items-center gap-2 group transition-all duration-500"
                aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
                title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
              >
                <div className="relative w-4 h-4 flex items-center justify-center">
                  <svg
                    className={`w-4 h-4 text-amber-400 absolute transition-all duration-500 ease-in-out transform ${
                      theme === 'dark' ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 -rotate-90 scale-50'
                    }`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                  <svg
                    className={`w-4 h-4 text-indigo-600 absolute transition-all duration-500 ease-in-out transform ${
                      theme === 'light' ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 rotate-90 scale-50'
                    }`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                  </svg>
                </div>
                <span className="transition-colors duration-500 font-medium">
                  {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
                </span>
              </button>
              <button
                id="calculate-btn"
                onClick={() => handleCalculate()}
                className="btn-primary flex items-center gap-2 shadow-md hover:shadow-cyan-500/25 transition-all duration-300 font-semibold"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
                Calculate Demand
              </button>
              <button id="reset-btn" onClick={handleReset} className="btn-secondary">
                <span className="flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Reset
                </span>
              </button>
            </div>
          </div>
        </header>

        {/* Error Banner */}
        {errors.length > 0 && (
          <div
            id="error-banner"
            className="mb-6 glass-card border-rose-500/40 bg-rose-500/10 px-5 py-4 flex items-start gap-3 animate-[fadeIn_0.2s_ease-out]"
          >
            <svg className="w-5 h-5 text-rose-500 dark:text-rose-400 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div className="w-full">
              <p className="font-semibold text-rose-700 dark:text-rose-300 text-sm">
                {errors.length === 1 ? 'Validation Error' : `Validation Errors (${errors.length})`}
              </p>
              {errors.length === 1 ? (
                <p className="text-rose-600/90 dark:text-rose-200/80 text-sm mt-0.5">{errors[0]}</p>
              ) : (
                <ul className="mt-2 space-y-1.5 text-sm text-rose-600/90 dark:text-rose-200/80 list-disc list-inside">
                  {errors.map((err, idx) => (
                    <li key={idx} className="leading-snug">
                      {err}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* ── Left Column: Data Tables ─────────────────────────────────────── */}
          <div className="space-y-6">
            {/* Talks Table */}
            <section className="glass-card p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-bold text-slate-800 dark:text-white/90 flex items-center gap-2">
                  <svg className="w-5 h-5 text-cyan-600 dark:text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                  Talks
                  <span className="text-xs font-normal text-slate-400 dark:text-white/30 ml-1">({talks.length})</span>
                </h2>
                <button id="add-talk-btn" onClick={openAddTalk} className="btn-primary !px-3 !py-1.5 !text-xs">
                  + Add
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-slate-400 dark:text-white/40 text-xs uppercase tracking-wider border-b border-slate-200 dark:border-white/[0.06]">
                      <th className="text-left pb-2 pr-3 font-medium">#</th>
                      <th className="text-left pb-2 pr-3 font-medium">ID</th>
                      <th className="text-left pb-2 pr-3 font-medium">Name</th>
                      <th className="text-center pb-2 pr-3 font-medium">Inst.</th>
                      <th className="text-center pb-2 pr-3 font-medium">Seats</th>
                      <th className="text-right pb-2 font-medium w-20">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {talks.map((talk, i) => (
                      <tr
                        key={talk._key}
                        className="border-b border-slate-100 dark:border-white/[0.04] hover:bg-slate-100/50 dark:hover:bg-white/[0.03] transition-colors"
                      >
                        <td className="py-2.5 pr-3 text-slate-400 dark:text-white/20 text-xs">{i + 1}</td>
                        <td className="py-2.5 pr-3 font-mono text-cyan-600 dark:text-cyan-300/80 text-xs">{talk.id}</td>
                        <td className="py-2.5 pr-3 text-slate-700 dark:text-white/80 font-medium sm:font-normal">{talk.name}</td>
                        <td className="py-2.5 pr-3 text-center text-slate-600 dark:text-white/60">{talk.instances}</td>
                        <td className="py-2.5 pr-3 text-center text-slate-600 dark:text-white/60">{talk.seats}</td>
                        <td className="py-2.5 text-right">
                          <div className="flex justify-end gap-1">
                            <button
                              onClick={() => openEditTalk(i)}
                              className="btn-icon"
                              aria-label={`Edit talk ${talk.id}`}
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                            <button
                              onClick={() => deleteTalk(i)}
                              className="btn-icon text-rose-500/60 dark:text-rose-400/40 hover:text-rose-600 dark:hover:text-rose-400"
                              aria-label={`Delete talk ${talk.id}`}
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {talks.length === 0 && (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-slate-400 dark:text-white/20 text-sm">
                          No talks defined. Click "+ Add" to create one.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>

            {/* Interests Table */}
            <section className="glass-card p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-bold text-slate-800 dark:text-white/90 flex items-center gap-2">
                  <svg className="w-5 h-5 text-purple-600 dark:text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  Interests
                  <span className="text-xs font-normal text-slate-400 dark:text-white/30 ml-1">({interests.length})</span>
                </h2>
                <button id="add-interest-btn" onClick={openAddInterest} className="btn-primary !px-3 !py-1.5 !text-xs">
                  + Add
                </button>
              </div>
              <div className="overflow-x-auto max-h-72 overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm z-10">
                    <tr className="text-slate-400 dark:text-white/40 text-xs uppercase tracking-wider border-b border-slate-200 dark:border-white/[0.06]">
                      <th className="text-left pb-2 pr-3 font-medium">#</th>
                      <th className="text-left pb-2 pr-3 font-medium">Attendee</th>
                      <th className="text-left pb-2 pr-3 font-medium">Talk</th>
                      <th className="text-right pb-2 font-medium w-20">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {interests.map((interest, i) => (
                      <tr
                        key={interest._key}
                        className="border-b border-slate-100 dark:border-white/[0.04] hover:bg-slate-100/50 dark:hover:bg-white/[0.03] transition-colors"
                      >
                        <td className="py-2 pr-3 text-slate-400 dark:text-white/20 text-xs">{i + 1}</td>
                        <td className="py-2 pr-3 font-mono text-purple-600 dark:text-purple-300/80 text-xs">{interest.attendeeId}</td>
                        <td className="py-2 pr-3 font-mono text-cyan-600 dark:text-cyan-300/80 text-xs">{interest.talkId}</td>
                        <td className="py-2 text-right">
                          <div className="flex justify-end gap-1">
                            <button
                              onClick={() => openEditInterest(i)}
                              className="btn-icon"
                              aria-label={`Edit interest row ${i + 1}`}
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                            <button
                              onClick={() => deleteInterest(i)}
                              className="btn-icon text-rose-500/60 dark:text-rose-400/40 hover:text-rose-600 dark:hover:text-rose-400"
                              aria-label={`Delete interest row ${i + 1}`}
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {interests.length === 0 && (
                      <tr>
                        <td colSpan={4} className="py-8 text-center text-slate-400 dark:text-white/20 text-sm">
                          No interests defined. Click "+ Add" to create one.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          </div>

          {/* ── Right Column: Results Board ──────────────────────────────────── */}
          <div>
            <section className="glass-card p-5 sticky top-8">
              <h2 className="text-base font-bold text-slate-800 dark:text-white/90 flex items-center gap-2 mb-4">
                <svg className="w-5 h-5 text-amber-500 dark:text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                Results Board
              </h2>

              {results ? (
                <div className="space-y-5 animate-[fadeIn_0.3s_ease-out]">
                  {/* Status Count Pills */}
                  <div id="status-counts" className="flex flex-wrap gap-2">
                    {[
                      { key: 'OVER_CAPACITY', label: 'Over', icon: '🔴' },
                      { key: 'FULL', label: 'Full', icon: '🟡' },
                      { key: 'SPARE', label: 'Spare', icon: '🟢' },
                    ].map(({ key, label, icon }) => (
                      <div
                        key={key}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100/90 dark:bg-white/[0.05] border border-slate-200 dark:border-white/[0.08]"
                      >
                        <span className="text-sm">{icon}</span>
                        <span className="text-xs text-slate-500 dark:text-white/50">{label}</span>
                        <span className="text-sm font-bold text-slate-800 dark:text-white/90">{statusCounts[key]}</span>
                      </div>
                    ))}
                  </div>

                  {/* Results Rows */}
                  <div className="space-y-3">
                    {results.map((r) => (
                      <div
                        key={r.talkId}
                        className="p-4 rounded-xl bg-slate-50/80 dark:bg-white/[0.03] border border-slate-200/80 dark:border-white/[0.06] hover:bg-slate-100/80 dark:hover:bg-white/[0.05] transition-colors"
                      >
                        <div className="flex items-start justify-between gap-3 mb-1">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-xs text-slate-400 dark:text-white/40">{r.talkId}</span>
                              <span className="text-sm font-semibold text-slate-800 dark:text-white/90">{r.talkName}</span>
                            </div>
                          </div>
                          <StatusBadge status={r.status} />
                        </div>

                        <div className="grid grid-cols-3 gap-3 mt-2 text-center">
                          <div>
                            <p className="text-[10px] text-slate-400 dark:text-white/30 uppercase tracking-wider">Demand</p>
                            <p className="text-lg font-bold text-slate-800 dark:text-white/90">{r.demand}</p>
                          </div>
                          <div>
                            <p className="text-[10px] text-slate-400 dark:text-white/30 uppercase tracking-wider">Capacity</p>
                            <p className="text-lg font-bold text-slate-800 dark:text-white/90">{r.capacity}</p>
                          </div>
                          <div>
                            <p className="text-[10px] text-slate-400 dark:text-white/30 uppercase tracking-wider">Delta</p>
                            <p className={`text-lg font-bold ${
                              r.delta > 0 ? 'text-rose-600 dark:text-rose-400' : r.delta === 0 ? 'text-amber-600 dark:text-amber-400' : 'text-cyan-600 dark:text-cyan-400'
                            }`}>
                              {r.delta > 0 ? '+' : ''}{r.delta}
                            </p>
                          </div>
                        </div>

                        <DemandBar demand={r.demand} capacity={r.capacity} status={r.status} />
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="py-12 px-4 text-center border-2 border-dashed border-slate-200/80 dark:border-white/10 rounded-2xl animate-[fadeIn_0.2s_ease-out]">
                  <svg className="w-10 h-10 mx-auto text-slate-300 dark:text-white/20 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <p className="text-sm font-medium text-slate-600 dark:text-white/50">No demand results computed</p>
                  <p className="text-xs text-slate-400 dark:text-white/30 mt-1">Click "Calculate Demand" to run validations and view metrics.</p>
                </div>
              )}
            </section>
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-12 text-center text-xs text-slate-400 dark:text-white/15 pb-8">
          TechFest Session Demand Board • Built with React + Tailwind CSS
        </footer>
      </div>

      {/* Modals */}
      {modalState?.type === 'talk' && (
        <TalkFormModal
          talk={modalState.mode === 'edit' ? modalState.data : null}
          onSave={saveTalk}
          onClose={() => setModalState(null)}
        />
      )}
      {modalState?.type === 'interest' && (
        <InterestFormModal
          interest={modalState.mode === 'edit' ? modalState.data : null}
          onSave={saveInterest}
          onClose={() => setModalState(null)}
        />
      )}

      {/* Global animation keyframe (injected once) */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

