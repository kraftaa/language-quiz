#!/usr/bin/env node
/* Build the offline deck from the open datasets documented in README.md. */
const fs = require("fs");
const path = require("path");

const SOURCE_ROOT = process.env.SPANISH_DATA_ROOT || "/private/tmp/spanish_data";
const DICTIONARY_ROOT = process.env.SPANISH_DICTIONARY_ROOT || "/private/tmp/spanish_english_json";
const OUTPUT = path.join(__dirname, "..", "cards.js");

const posNames = {
  adj: "Adjective", adv: "Adverb", art: "Article", conj: "Conjunction",
  determiner: "Determiner", n: "Noun", none: "Other", num: "Number",
  prep: "Preposition", pron: "Pronoun", prop: "Proper noun", v: "Verb"
};
const posOverrides = {
  de: "prep", que: "conj", la: "art", no: "adv", a: "prep", el: "art", y: "conj", en: "prep",
  es: "v", un: "art", lo: "pron", por: "prep", los: "art", una: "art", se: "pron", con: "prep",
  qué: "pron", me: "pron", para: "prep", las: "art", del: "prep", te: "pron", su: "determiner",
  pero: "conj", si: "conj", está: "v", mi: "determiner", al: "prep", sí: "adv", como: "conj",
  más: "adv", eso: "pron", yo: "pron", le: "pron", aquí: "adv", tu: "determiner", todo: "pron",
  ha: "v", ya: "adv", muy: "adv", hay: "v", porque: "conj", cuando: "conj", él: "pron", ella: "pron"
};

const overrides = {
  a: "to; at", de: "of; from", el: "the", en: "in; on; at", estar: "to be (state or location)",
  haber: "to have (auxiliary); there is/are", hacer: "to do; to make", ir: "to go", la: "the; her; it",
  lo: "it; him; the", no: "no; not", poder: "to be able to; can", que: "that; which; than",
  se: "oneself; each other; impersonal/passive marker", ser: "to be (identity or essence)",
  sí: "yes; oneself", tener: "to have", todo: "all; everything", uno: "one; a/an", y: "and",
  yo: "I", él: "he; him", ella: "she; her", tú: "you (informal singular)", usted: "you (formal singular)",
  ustedes: "you (plural)", nosotros: "we; us", ellos: "they; them", muy: "very", más: "more; most",
  como: "as; like; how", pero: "but", para: "for; in order to", por: "for; by; through",
  con: "with", sin: "without", sobre: "on; about; over", ya: "already; now", bien: "well; good",
  también: "also; too", aquí: "here", ahí: "there", ahora: "now", cuando: "when",
  dónde: "where", cómo: "how", qué: "what; which", quién: "who", porque: "because",
  si: "if; whether", su: "his; her; its; your; their", mi: "my", tu: "your (informal)",
  este: "this; this one", ese: "that; that one", otro: "other; another", mismo: "same; self",
  dar: "to give", decir: "to say; to tell", ver: "to see", saber: "to know (a fact/how)",
  querer: "to want; to love", llegar: "to arrive; to reach", pasar: "to pass; to happen",
  deber: "should; to owe", poner: "to put", parecer: "to seem", quedar: "to remain; to meet",
  creer: "to believe", hablar: "to speak; to talk", llevar: "to carry; to wear; to take",
  dejar: "to leave; to let", seguir: "to follow; to continue", encontrar: "to find",
  llamar: "to call", venir: "to come", pensar: "to think", salir: "to leave; to go out",
  volver: "to return; to do again", tomar: "to take; to drink", conocer: "to know; to meet",
  vivir: "to live", sentir: "to feel", mirar: "to look at; to watch", contar: "to count; to tell",
  empezar: "to begin", esperar: "to wait; to hope; to expect", buscar: "to look for",
  existir: "to exist", entrar: "to enter", trabajar: "to work", escribir: "to write",
  perder: "to lose; to miss", producir: "to produce", ocurrir: "to occur", entender: "to understand",
  pedir: "to ask for; to order", recibir: "to receive", recordar: "to remember", terminar: "to finish",
  permitir: "to allow", aparecer: "to appear", conseguir: "to get; to achieve", comenzar: "to begin"
};
Object.assign(overrides, {
  la: "the; her; it", es: "is; you are (formal)", un: "a; an; one", lo: "it; him; the (neuter)",
  los: "the; them", una: "a; an; one", qué: "what; which", me: "me; to me; myself",
  las: "the; them", del: "of the; from the", te: "you; to you; yourself", su: "his; her; its; your; their",
  está: "is; you are (state/location)", mi: "my", al: "to the; at the", eso: "that; that thing",
  le: "to him; to her; to you", ha: "has; you have (formal)", hay: "there is; there are",
  fue: "was; went", era: "was; used to be", son: "are", soy: "I am", eres: "you are",
  tengo: "I have", tiene: "has; you have (formal)", vamos: "we go; let's go", voy: "I go; I'm going",
  va: "goes; you go (formal)", puedo: "I can", puede: "can; you can (formal)", dijo: "said",
  dice: "says; you say (formal)", quiero: "I want; I love", sabe: "knows; you know (formal)",
  sé: "I know; be (command)", nada: "nothing; not anything", algo: "something; anything",
  así: "like this; so", entonces: "then; so", nunca: "never", siempre: "always",
  bueno: "good; well", solo: "alone; only", donde: "where",
  quien: "who; whoever", hasta: "until; up to; even", desde: "from; since", entre: "between; among"
});
Object.assign(overrides, {
  algo: "something; anything", hace: "ago; makes; does", tiempo: "time; weather", vida: "life",
  mí: "me (after a preposition)", ni: "neither; nor; not even", señor: "sir; mister; gentleman",
  señora: "ma'am; Mrs.; lady", hombre: "man; person", oh: "oh", creo: "I believe; I think",
  siento: "I feel; I'm sorry", años: "years", esa: "that (feminine); that one", verdad: "truth; true",
  mucho: "much; a lot; many", mejor: "better; best", favor: "favor; please (in por favor)"
});
Object.assign(overrides, {
  eh: "hey; huh", ah: "ah; oh", sino: "but rather; except; fate", orden: "order; command",
  mundial: "worldwide; global; world championship", unidad: "unit; unity", francés: "French",
  huevos: "eggs", barrio: "neighborhood; district", casarse: "to get married", conductor: "driver; conductor",
  parado: "stopped; standing; unemployed", corresponde: "corresponds; belongs; is appropriate"
});

function cleanDefinition(entry, word, pos) {
  if (overrides[word]) return overrides[word];
  if (!entry || !Array.isArray(entry.translation)) return "—";
  const noisy = /^(name of|the .+ letter|used |a prefix|a suffix|forms? |indicating |in psychoanalysis|freud|called |pronunciation|obsolete|alternative spelling)/i;
  let candidates = entry.translation
    .map((value) => String(value).replace(/\s+/g, " ").trim())
    .filter((value) => value && value.length <= 78 && !noisy.test(value));
  if (pos === "v") {
    const verb = candidates.find((value) => /^(to |can\b|should\b|must\b)/i.test(value));
    if (verb) candidates = [verb, ...candidates.filter((value) => value !== verb)];
  }
  const picked = [];
  for (const value of candidates) {
    let normalized = value.replace(/[.;:]$/, "");
    if ((normalized.match(/\(/g) || []).length > (normalized.match(/\)/g) || []).length) {
      normalized = normalized.replace(/\s*\([^()]*(?:\([^()]*)?$/, "").trim();
    }
    if ((normalized.match(/\)/g) || []).length > (normalized.match(/\(/g) || []).length) {
      normalized = normalized.replace(/\)+$/, "").trim();
    }
    if (!picked.some((item) => item.toLowerCase() === normalized.toLowerCase())) picked.push(normalized);
    if (picked.length === 2) break;
  }
  return picked.join("; ") || "—";
}

const wordDictionary = JSON.parse(fs.readFileSync(path.join(DICTIONARY_ROOT, "es-en-words.json"), "utf8"));
const verbDictionary = JSON.parse(fs.readFileSync(path.join(DICTIONARY_ROOT, "es-en-verbs.json"), "utf8"));
const dictionary = { ...wordDictionary.map, ...verbDictionary.map };

const frequencyRank = new Map();
const frequencyFormInfo = new Map();
for (const line of fs.readFileSync(path.join(SOURCE_ROOT, "frequency.csv"), "utf8").split(/\r?\n/).slice(1)) {
  const match = line.match(/^(\d+),([^,]+),([^,]+),([^,]*),(.*)$/);
  if (!match) continue;
  const [, , lemma, pos, flags, usage] = match;
  if (flags.includes("DUPLICATE") || pos === "prop") continue;
  for (const item of usage.split("|")) {
    const separator = item.indexOf(":");
    if (separator < 1) continue;
    const formCount = Number(item.slice(0, separator));
    const form = item.slice(separator + 1).toLowerCase();
    const current = frequencyFormInfo.get(form);
    if (!current || formCount > current.count) frequencyFormInfo.set(form, { lemma, pos, count: formCount });
  }
}
const words = [];
const seenWords = new Set();
const mergedLines = fs.readFileSync(path.join(SOURCE_ROOT, "es_merged_50k.txt"), "utf8").split(/\r?\n/);
const rawForms = [];
for (let rawRank = 1; rawRank <= mergedLines.length; rawRank += 1) {
  const [spanish, count] = (mergedLines[rawRank - 1] || "").split("\t");
  if (!spanish || !/^[a-záéíóúüñ]+(?:-[a-záéíóúüñ]+)?$/i.test(spanish)) continue;
  if (!frequencyRank.has(spanish.toLowerCase())) frequencyRank.set(spanish.toLowerCase(), rawRank);
  if (rawForms.length < 15000) rawForms.push({ spanish, count: Number(count), rawRank });
}

const wantedForms = new Set(rawForms.map((row) => row.spanish.toLowerCase()));
const formInfo = new Map();
for (const line of fs.readFileSync(path.join(SOURCE_ROOT, "es_allforms.csv"), "utf8").split(/\r?\n/)) {
  const [form, pos, ...lemmas] = line.split(",");
  const key = (form || "").toLowerCase();
  if (!wantedForms.has(key) || pos === "prop" || ["suffix", "prefix"].includes(pos)) continue;
  const current = formInfo.get(key);
  if (!current || (current.pos === "none" && pos !== "none")) formInfo.set(key, { pos, lemmas });
}

for (const { spanish, count, rawRank } of rawForms) {
  if (words.length >= 5000) break;
  const key = spanish.toLowerCase();
  if (seenWords.has(key)) continue;
  const frequencyInfo = frequencyFormInfo.get(key);
  const info = frequencyInfo
    ? { pos: frequencyInfo.pos, lemmas: [frequencyInfo.lemma] }
    : (formInfo.get(key) || { pos: "none", lemmas: [] });
  const pos = posOverrides[key] || info.pos;
  const direct = dictionary[spanish] || dictionary[key];
  let answer = cleanDefinition(direct, key, pos);
  let lemmaUsed = "";
  if (answer === "—" && info.lemmas.length) {
    for (const lemma of info.lemmas) {
      const definition = cleanDefinition(dictionary[lemma], lemma, pos);
      if (definition !== "—") { answer = definition; lemmaUsed = lemma; break; }
    }
  }
  if (answer === "—") continue;
  if (lemmaUsed && lemmaUsed !== key) answer = `form of ${lemmaUsed} — ${answer}`;
  const rank = words.length + 1;
  seenWords.add(key);
  words.push({
    id: `w-${rank}`,
    kind: "word",
    rank,
    band: `Words ${Math.floor((rank - 1) / 500) * 500 + 1}–${Math.floor((rank - 1) / 500) * 500 + 500}`,
    topic: posNames[pos] || "Other",
    es: spanish,
    en: answer,
    note: `${posNames[pos] || "Word"} · raw corpus rank #${rawRank.toLocaleString("en-US")} · ${count.toLocaleString("en-US")} occurrences`
  });
}

const blocked = /\b(tom|mary|john|boston|god|jesus|christ|japan|japanese|china|chinese|french|german|spanish|england|america|american|europe|european|monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/i;
const profanity = /\b(fuck|shit|bitch|puta|puto|mierda|joder|coño|pendej|idiot|stupid|kill|murder|suicid|sex)\b/i;
const odd = /\b(picozo|carpanta|neutrality|ukulele|denmark|lincoln|scots|molar|hula hoop)\b/i;
const priority = /\b(hola|gracias|favor|perdón|disculp|buenos días|buenas noches|cómo estás|cómo está|qué tal|cuánto|dónde|cuándo|quién|puedo|quiero|necesito|tengo|hay|está|estoy|vamos|ayuda|baño|agua|comida|cuenta|precio|hora|hoy|mañana|aquí|allí|derecha|izquierda)\b/i;

const essentials = [
  ["Hola.", "Hello."], ["Buenos días.", "Good morning."], ["Buenas tardes.", "Good afternoon."], ["Buenas noches.", "Good evening; good night."],
  ["¿Qué tal?", "How's it going?"], ["¿Cómo estás?", "How are you?"], ["Estoy bien, gracias.", "I'm fine, thank you."], ["Mucho gusto.", "Nice to meet you."],
  ["Me llamo…", "My name is…"], ["¿Cómo te llamas?", "What's your name?"], ["Por favor.", "Please."], ["Gracias.", "Thank you."],
  ["Muchas gracias.", "Thank you very much."], ["De nada.", "You're welcome."], ["Perdón.", "Excuse me; sorry."], ["Lo siento.", "I'm sorry."],
  ["No pasa nada.", "It's okay; no worries."], ["Hasta luego.", "See you later."], ["Hasta mañana.", "See you tomorrow."], ["Nos vemos.", "See you."],
  ["Adiós.", "Goodbye."], ["Sí, por favor.", "Yes, please."], ["No, gracias.", "No, thank you."], ["No entiendo.", "I don't understand."],
  ["¿Puedes repetirlo?", "Can you repeat that?"], ["Más despacio, por favor.", "More slowly, please."], ["¿Hablas inglés?", "Do you speak English?"], ["Hablo un poco de español.", "I speak a little Spanish."],
  ["¿Qué significa esto?", "What does this mean?"], ["¿Cómo se dice…?", "How do you say…?"], ["¿Dónde está el baño?", "Where is the bathroom?"], ["¿Cuánto cuesta?", "How much does it cost?"],
  ["Quisiera esto, por favor.", "I would like this, please."], ["La cuenta, por favor.", "The check, please."], ["¿Aceptan tarjetas?", "Do you accept cards?"], ["Necesito ayuda.", "I need help."],
  ["¿Me puede ayudar?", "Can you help me?"], ["Estoy perdido.", "I'm lost."], ["¿Dónde queda…?", "Where is…?"], ["¿Cómo llego a…?", "How do I get to…?"],
  ["A la derecha.", "To the right."], ["A la izquierda.", "To the left."], ["Todo recto.", "Straight ahead."], ["¿A qué hora?", "At what time?"],
  ["¿Qué hora es?", "What time is it?"], ["Tengo hambre.", "I'm hungry."], ["Tengo sed.", "I'm thirsty."], ["¿Tiene agua?", "Do you have water?"],
  ["Sin hielo, por favor.", "No ice, please."], ["Soy vegetariano.", "I'm vegetarian."], ["Soy vegetariana.", "I'm vegetarian."], ["¿Hay wifi?", "Is there Wi-Fi?"],
  ["¿Cuál es la contraseña?", "What's the password?"], ["Tengo una reserva.", "I have a reservation."], ["Una mesa para dos, por favor.", "A table for two, please."], ["¿Dónde está la estación?", "Where is the station?"],
  ["Un billete, por favor.", "One ticket, please."], ["¿Cuándo sale?", "When does it leave?"], ["¿Cuándo llega?", "When does it arrive?"], ["Llame a un taxi, por favor.", "Call a taxi, please."],
  ["Un momento, por favor.", "One moment, please."], ["Ahora mismo.", "Right now."], ["Tal vez.", "Maybe."], ["Claro que sí.", "Of course."],
  ["Creo que sí.", "I think so."], ["Creo que no.", "I don't think so."], ["No sé.", "I don't know."], ["Depende.", "It depends."],
  ["Estoy de acuerdo.", "I agree."], ["No estoy de acuerdo.", "I disagree."], ["Tienes razón.", "You're right."], ["¿En serio?", "Really?"],
  ["¡Qué bien!", "How nice!"], ["¡Qué pena!", "What a shame!"], ["No te preocupes.", "Don't worry."], ["Ten cuidado.", "Be careful."],
  ["Buena suerte.", "Good luck."], ["Felicidades.", "Congratulations."], ["Que tengas un buen día.", "Have a nice day."], ["Bienvenido.", "Welcome."],
  ["¿Qué haces?", "What are you doing?"], ["¿Qué pasó?", "What happened?"], ["¿Qué quieres hacer?", "What do you want to do?"], ["Vamos.", "Let's go."],
  ["Estoy listo.", "I'm ready."], ["Estoy lista.", "I'm ready."], ["Espera un momento.", "Wait a moment."], ["Ven aquí.", "Come here."],
  ["¿Dónde vives?", "Where do you live?"], ["Vivo en…", "I live in…"], ["¿De dónde eres?", "Where are you from?"], ["Soy de…", "I'm from…"],
  ["¿A qué te dedicas?", "What do you do for work?"], ["Trabajo en…", "I work in…"], ["¿Qué recomiendas?", "What do you recommend?"], ["Me gusta.", "I like it."],
  ["No me gusta.", "I don't like it."], ["Me encanta.", "I love it."], ["Está bien.", "It's fine; okay."], ["Eso es todo.", "That's all."]
];

function tokens(text) {
  return (text.toLowerCase().match(/[a-záéíóúüñ]+/g) || []);
}

function phraseTopic(es, en) {
  const text = `${es} ${en}`.toLowerCase();
  if (/\?|\b(dónde|cuándo|cuánto|cómo|qué|quién|where|when|how|what|who)\b/.test(text)) return "Questions";
  if (/\b(hola|adiós|gracias|favor|perdón|disculp|hello|goodbye|thank|sorry|please)\b/.test(text)) return "Essentials";
  if (/\b(aeropuerto|hotel|tren|autobús|taxi|calle|viaje|ticket|station|airport|bus|train|street)\b/.test(text)) return "Travel";
  if (/\b(comer|comida|agua|café|restaurante|cuenta|food|water|coffee|restaurant|breakfast|dinner)\b/.test(text)) return "Food & drink";
  if (/\b(comprar|cuesta|precio|dinero|tienda|buy|cost|price|money|store)\b/.test(text)) return "Shopping";
  if (/\b(hoy|mañana|ayer|hora|tiempo|today|tomorrow|yesterday|time|o'clock)\b/.test(text)) return "Time";
  return "Everyday conversation";
}

const phraseCandidates = [];
const seenEs = new Set();
const seenEn = new Set();
for (const line of fs.readFileSync(path.join(SOURCE_ROOT, "sentences.tsv"), "utf8").split(/\r?\n/)) {
  const fields = line.split("\t");
  if (fields.length < 5) continue;
  const [en, es] = fields;
  const enScore = Number(fields[3]);
  const esScore = Number(fields[4]);
  const esTokens = tokens(es);
  const enTokens = tokens(en);
  const esKey = es.toLowerCase().replace(/[^a-záéíóúüñ]+/g, " ").trim();
  const enKey = en.toLowerCase().replace(/[^a-z]+/g, " ").trim();
  if (enScore < 5 || esScore < 5 || esTokens.length < 2 || esTokens.length > 9 || enTokens.length < 1 || enTokens.length > 11) continue;
  if (es.length > 82 || en.length > 88 || blocked.test(`${es} ${en}`) || profanity.test(`${es} ${en}`) || odd.test(`${es} ${en}`)) continue;
  if (/\d|https?:|\.{2,}|[{}<>]/.test(`${es}${en}`) || seenEs.has(esKey) || seenEn.has(enKey)) continue;
  const ranks = esTokens.map((token) => frequencyRank.get(token) || 50000);
  const avgLogRank = ranks.reduce((sum, rank) => sum + Math.log(rank), 0) / ranks.length;
  const unknowns = ranks.filter((rank) => rank === 50000).length;
  const naturalLength = Math.abs(esTokens.length - 4) * 0.18;
  const score = avgLogRank + naturalLength + unknowns * 1.5 - (priority.test(es) ? 1.8 : 0) - (/[¿?¡!]/.test(es) ? 0.2 : 0);
  seenEs.add(esKey);
  seenEn.add(enKey);
  phraseCandidates.push({ es, en, score });
}

phraseCandidates.sort((a, b) => a.score - b.score || a.es.localeCompare(b.es));
const essentialKeys = new Set(essentials.map(([es]) => es.toLowerCase().replace(/[^a-záéíóúüñ]+/g, " ").trim()));
const selectedPhrases = [
  ...essentials.map(([es, en], index) => ({ es, en, score: -1000 + index })),
  ...phraseCandidates.filter((phrase) => !essentialKeys.has(phrase.es.toLowerCase().replace(/[^a-záéíóúüñ]+/g, " ").trim()))
].slice(0, 1000);
const phrases = selectedPhrases.map((phrase, index) => {
  const rank = index + 1;
  return {
    id: `p-${rank}`,
    kind: "phrase",
    rank,
    band: `Phrases ${Math.floor((rank - 1) / 250) * 250 + 1}–${Math.floor((rank - 1) / 250) * 250 + 250}`,
    topic: phraseTopic(phrase.es, phrase.en),
    es: phrase.es,
    en: phrase.en,
    note: "Reviewed Spanish–English example from Tatoeba"
  };
});

if (words.length !== 5000 || phrases.length !== 1000) throw new Error(`Expected 5000 words and 1000 phrases; got ${words.length} and ${phrases.length}`);
const payload = `/* Generated by tools/build-data.js. See README.md for sources and licenses. */\nwindow.SPANISH_CARDS = ${JSON.stringify([...words, ...phrases], null, 0)};\n`;
fs.writeFileSync(OUTPUT, payload);
console.log(`Wrote ${words.length} words + ${phrases.length} phrases to ${OUTPUT}`);
console.log("First words:", words.slice(0, 12).map((x) => `${x.es}=${x.en}`).join(" | "));
console.log("First phrases:", phrases.slice(0, 12).map((x) => `${x.es}=${x.en}`).join(" | "));
