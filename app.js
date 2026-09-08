const cards = window.SPANISH_CARDS || [];
const STORAGE = "spanish4000.v1";
const saved = JSON.parse(localStorage.getItem(STORAGE) || "{}");

const state = {
  kind: "all",
  band: "all",
  topic: "all",
  direction: saved.direction || "es-en",
  mode: saved.mode || "flashcard",
  search: "",
  hideKnown: Boolean(saved.hideKnown),
  known: new Set(saved.known || []),
  seen: new Set(saved.seen || []),
  order: cards.map((_, index) => index),
  cursor: 0,
  revealed: false,
  quizAnswered: false,
  mixedDirection: "es-en"
};

const $ = (selector) => document.querySelector(selector);
const els = {
  total: $("#totalCount"), seen: $("#seenCount"), known: $("#knownCount"),
  pathTitle: $("#pathTitle"), pathSummary: $("#pathSummary"), tabs: [...document.querySelectorAll(".path-tab")],
  search: $("#searchInput"), band: $("#bandSelect"), topic: $("#topicSelect"),
  direction: $("#directionSelect"), mode: $("#modeSelect"), hideKnown: $("#hideKnownToggle"),
  shuffle: $("#shuffleBtn"), random: $("#randomBtn"), reset: $("#resetProgressBtn"),
  kind: $("#cardKind"), cardTopic: $("#cardTopic"), rank: $("#cardRank"), counter: $("#cardCounter"),
  progress: $("#progressBar"), promptLabel: $("#promptLabel"), question: $("#questionText"),
  speak: $("#speakBtn"), choices: $("#choices"), panel: $("#answerPanel"), answer: $("#answerText"),
  note: $("#noteText"), feedback: $("#quizFeedback"), card: $("#card"),
  prev: $("#prevBtn"), reveal: $("#revealBtn"), knownBtn: $("#knownBtn"), next: $("#nextBtn")
};

function save() {
  localStorage.setItem(STORAGE, JSON.stringify({
    known: [...state.known], seen: [...state.seen], hideKnown: state.hideKnown,
    direction: state.direction, mode: state.mode
  }));
}

function visibleIndexes() {
  const term = state.search.trim().toLocaleLowerCase();
  return state.order.filter((index) => {
    const card = cards[index];
    return (state.kind === "all" || card.kind === state.kind)
      && (state.band === "all" || card.band === state.band)
      && (state.topic === "all" || card.topic === state.topic)
      && (!state.hideKnown || !state.known.has(card.id))
      && (!term || `${card.es} ${card.en} ${card.topic} ${card.rank}`.toLocaleLowerCase().includes(term));
  });
}

function current() {
  const visible = visibleIndexes();
  state.cursor = Math.min(state.cursor, Math.max(visible.length - 1, 0));
  const index = visible[state.cursor];
  return { visible, index, card: cards[index] };
}

function effectiveDirection() {
  return state.direction === "random" ? state.mixedDirection : state.direction;
}

function resetCard() {
  state.revealed = false;
  state.quizAnswered = false;
  state.mixedDirection = Math.random() < 0.5 ? "es-en" : "en-es";
  render();
}

function fillFilters() {
  const relevant = cards.filter((card) => state.kind === "all" || card.kind === state.kind);
  const bands = [...new Set(relevant.map((card) => card.band))];
  const topics = [...new Set(relevant.map((card) => card.topic))].sort((a, b) => a.localeCompare(b));
  els.band.replaceChildren(new Option("All ranks", "all"), ...bands.map((band) => new Option(band, band)));
  els.topic.replaceChildren(new Option("All topics", "all"), ...topics.map((topic) => new Option(topic, topic)));
  if (!bands.includes(state.band)) state.band = "all";
  if (!topics.includes(state.topic)) state.topic = "all";
  els.band.value = state.band;
  els.topic.value = state.topic;
}

function shuffleArray(values) {
  const result = [...values];
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

function quizOptions(card, direction) {
  const answerKey = direction === "es-en" ? "en" : "es";
  const pool = cards.filter((candidate) => candidate.id !== card.id && candidate.kind === card.kind && candidate[answerKey] !== card[answerKey]);
  const near = pool.filter((candidate) => candidate.topic === card.topic && Math.abs(candidate.rank - card.rank) <= 500);
  const source = near.length >= 3 ? near : pool;
  return shuffleArray([card[answerKey], ...shuffleArray(source).slice(0, 3).map((candidate) => candidate[answerKey])]);
}

function renderQuiz(card, direction) {
  els.choices.hidden = false;
  const options = quizOptions(card, direction);
  els.choices.replaceChildren(...options.map((option, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "choice";
    button.textContent = option;
    button.dataset.answer = option === (direction === "es-en" ? card.en : card.es) ? "true" : "false";
    button.addEventListener("click", () => answerQuiz(button, card, direction));
    button.setAttribute("aria-label", `Choice ${index + 1}: ${option}`);
    return button;
  }));
}

function answerQuiz(button, card, direction) {
  if (state.quizAnswered) return;
  state.quizAnswered = true;
  const correct = button.dataset.answer === "true";
  [...els.choices.children].forEach((choice) => {
    choice.disabled = true;
    if (choice.dataset.answer === "true") choice.classList.add("correct");
  });
  if (!correct) button.classList.add("incorrect");
  els.feedback.hidden = false;
  els.feedback.className = `quiz-feedback ${correct ? "good" : "bad"}`;
  els.feedback.textContent = correct ? "Correct — nicely done." : `Not quite. The answer is: ${direction === "es-en" ? card.en : card.es}`;
  state.revealed = true;
  els.panel.hidden = false;
  state.seen.add(card.id);
  save();
  renderStats();
}

function renderStats() {
  const scoped = cards.filter((card) => state.kind === "all" || card.kind === state.kind);
  els.total.textContent = scoped.length.toLocaleString();
  els.seen.textContent = scoped.filter((card) => state.seen.has(card.id)).length.toLocaleString();
  els.known.textContent = scoped.filter((card) => state.known.has(card.id)).length.toLocaleString();
}

function render() {
  const { visible, card } = current();
  renderStats();
  els.tabs.forEach((tab) => tab.classList.toggle("active", tab.dataset.kind === state.kind));
  els.pathTitle.textContent = state.kind === "word" ? "5,000 frequency-ranked words" : state.kind === "phrase" ? "1,000 useful everyday phrases" : "Complete Spanish deck";
  els.pathSummary.textContent = state.kind === "word"
    ? "Study core vocabulary in six manageable 500-word bands."
    : state.kind === "phrase" ? "Practice short, reviewed translations ranked for learner usefulness." : "Build recognition with vocabulary, then make it active with common phrases.";

  if (!card) {
    els.kind.textContent = "No matches";
    els.cardTopic.textContent = "Change a filter";
    els.rank.textContent = "";
    els.counter.textContent = "0 of 0";
    els.question.textContent = "No cards match these filters.";
    els.promptLabel.textContent = "Try clearing search or showing known cards.";
    els.speak.hidden = true;
    els.choices.replaceChildren();
    els.panel.hidden = true;
    els.feedback.hidden = true;
    els.prev.disabled = els.next.disabled = els.reveal.disabled = els.knownBtn.disabled = true;
    els.progress.style.width = "0%";
    return;
  }

  const direction = effectiveDirection();
  const spanishFirst = direction === "es-en";
  els.kind.textContent = card.kind === "word" ? "Word" : "Phrase";
  els.cardTopic.textContent = card.topic;
  els.rank.textContent = `#${card.rank.toLocaleString()}`;
  els.counter.textContent = `${(state.cursor + 1).toLocaleString()} of ${visible.length.toLocaleString()}`;
  els.progress.style.width = `${((state.cursor + 1) / visible.length) * 100}%`;
  els.promptLabel.textContent = spanishFirst ? "What does this mean?" : "How do you say this in Spanish?";
  els.question.textContent = spanishFirst ? card.es : card.en;
  els.question.lang = spanishFirst ? "es" : "en";
  els.answer.textContent = spanishFirst ? card.en : card.es;
  els.answer.lang = spanishFirst ? "en" : "es";
  els.note.textContent = card.note;
  els.speak.hidden = false;
  els.speak.textContent = spanishFirst ? "🔊 Hear it" : "🔊 Hear Spanish";
  els.panel.hidden = !state.revealed;
  els.reveal.textContent = state.revealed ? "Hide answer" : "Reveal answer";
  els.feedback.hidden = true;
  els.reveal.hidden = state.mode === "quiz";
  els.choices.hidden = state.mode !== "quiz";
  if (state.mode === "quiz" && !state.quizAnswered) renderQuiz(card, direction);
  if (state.mode === "flashcard") els.choices.replaceChildren();
  els.knownBtn.textContent = state.known.has(card.id) ? "✓ Known" : "Mark known";
  els.knownBtn.classList.toggle("known", state.known.has(card.id));
  els.prev.disabled = state.cursor === 0;
  els.next.disabled = state.cursor >= visible.length - 1;
  els.reveal.disabled = false;
  els.knownBtn.disabled = false;
}

function reveal() {
  const { card } = current();
  if (!card || state.mode === "quiz") return;
  state.revealed = !state.revealed;
  els.panel.hidden = !state.revealed;
  els.reveal.textContent = state.revealed ? "Hide answer" : "Reveal answer";
  if (state.revealed) state.seen.add(card.id);
  save();
  renderStats();
}

function move(delta) {
  const visible = visibleIndexes();
  state.cursor = Math.max(0, Math.min(visible.length - 1, state.cursor + delta));
  resetCard();
}

function speakSpanish() {
  const { card } = current();
  if (!card || !("speechSynthesis" in window)) return;
  speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(card.es);
  utterance.lang = "es-ES";
  utterance.rate = 0.88;
  speechSynthesis.speak(utterance);
}

els.tabs.forEach((tab) => tab.addEventListener("click", () => {
  state.kind = tab.dataset.kind;
  state.band = state.topic = "all";
  state.cursor = 0;
  fillFilters();
  resetCard();
}));
els.search.addEventListener("input", () => { state.search = els.search.value; state.cursor = 0; resetCard(); });
els.band.addEventListener("change", () => { state.band = els.band.value; state.cursor = 0; resetCard(); });
els.topic.addEventListener("change", () => { state.topic = els.topic.value; state.cursor = 0; resetCard(); });
els.direction.addEventListener("change", () => { state.direction = els.direction.value; save(); resetCard(); });
els.mode.addEventListener("change", () => { state.mode = els.mode.value; save(); resetCard(); });
els.hideKnown.addEventListener("change", () => { state.hideKnown = els.hideKnown.checked; state.cursor = 0; save(); resetCard(); });
els.shuffle.addEventListener("click", () => { state.order = shuffleArray(state.order); state.cursor = 0; resetCard(); });
els.random.addEventListener("click", () => { const visible = visibleIndexes(); state.cursor = visible.length ? Math.floor(Math.random() * visible.length) : 0; resetCard(); });
els.reset.addEventListener("click", () => {
  if (!confirm("Reset all seen and known progress?")) return;
  state.known.clear(); state.seen.clear(); save(); render();
});
els.prev.addEventListener("click", () => move(-1));
els.next.addEventListener("click", () => move(1));
els.reveal.addEventListener("click", reveal);
els.knownBtn.addEventListener("click", () => {
  const { card } = current();
  if (!card) return;
  state.known.has(card.id) ? state.known.delete(card.id) : state.known.add(card.id);
  state.seen.add(card.id); save(); render();
});
els.speak.addEventListener("click", speakSpanish);
els.card.addEventListener("click", (event) => { if (event.target === els.card || event.target.classList.contains("card-face")) reveal(); });
document.addEventListener("keydown", (event) => {
  if (["INPUT", "SELECT"].includes(document.activeElement.tagName)) return;
  if (event.code === "Space") { event.preventDefault(); reveal(); }
  if (event.key === "ArrowLeft") move(-1);
  if (event.key === "ArrowRight") move(1);
  if (event.key.toLowerCase() === "k") els.knownBtn.click();
  if (event.key.toLowerCase() === "s") speakSpanish();
});

els.direction.value = state.direction;
els.mode.value = state.mode;
els.hideKnown.checked = state.hideKnown;
fillFilters();
render();
if ("serviceWorker" in navigator && location.protocol.startsWith("http")) navigator.serviceWorker.register("sw.js");
