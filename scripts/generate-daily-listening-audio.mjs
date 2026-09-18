import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

const conversations = [
  {
    output: "public/listening-arts-centre.wav",
    captions: "public/listening-arts-centre.vtt",
    speakers: { female: "Coordinator (American female)", male: "Caller (British male)" },
    lines: [
      ["female", "Good afternoon, Riverside Arts Centre. How can I help?"],
      ["male", "Hello. I'd like to book an evening course. I saw the leaflet last week, but I wanted to check a few details before paying."],
      ["female", "No problem. We can go through it together. Are you looking for an adult class or a course for a child?"],
      ["male", "An adult class, please. I'm hoping to do something practical after work, rather than another online course."],
      ["female", "All right. Can I take your surname so I can open a booking record?"],
      ["male", "Patel. P, A, T, E, L."],
      ["female", "Thank you. Patel, P-A-T-E-L. I've got that. Which course interests you?"],
      ["male", "I first considered photography, but I'd prefer pottery. My friend did the photography class last year and recommended the centre."],
      ["female", "Pottery is quite popular this term. The course starts on the sixth of November, not the fourth as shown in the old leaflet. That earlier date was changed when the tutor became unavailable."],
      ["male", "The sixth works for me. How many sessions are there?"],
      ["female", "There are six Wednesday evening sessions. The first one is an introduction to the equipment, and by the final week students usually make a small set of bowls."],
      ["male", "That sounds good. I haven't used a wheel before, so I may need a little help at the beginning."],
      ["female", "That's perfectly normal. The tutor demonstrates each stage, and there are only ten people in the group, so everyone gets a turn."],
      ["female", "The full fee is eighty-five pounds. The ninety-five-pound figure includes an optional exhibition ticket, so you don't need to choose that unless you want to attend the end-of-term show."],
      ["male", "I see. What is included in the course fee?"],
      ["female", "All basic materials are included, and students may use the evening studio without extra charge. Tools can be hired if you want to take extra work home, refreshments are sold downstairs, and parking costs four pounds after five o'clock."],
      ["male", "I'll probably come by bus, but it is useful to know about the parking. How will I receive the timetable?"],
      ["female", "We'll email it this afternoon. It includes the room number and a list of materials. Your membership card must be collected at reception before your first class."],
      ["male", "Right. I'll look out for the email. What time does the class begin?"],
      ["female", "At six thirty. The building opens at six and the tutor arrives at six fifteen, so you can come early to find your locker. The session normally finishes at eight thirty, with a short break in the middle."],
      ["male", "Perfect. Do I need to bring an apron or anything on the first evening?"],
      ["female", "An old shirt is useful, although we provide protective aprons. Please bring your membership card and arrive ten minutes early to sign the safety form."],
      ["male", "That's clear. I chose this centre because the classes are small, so I should receive more feedback. The timetable also fits around my work."],
      ["female", "That makes sense. I'll reserve your place now and email the confirmation, timetable and payment receipt later today."],
      ["male", "Thanks very much for your help."],
      ["female", "You're welcome. We look forward to seeing you in November."],
    ],
  },
  {
    output: "public/listening-wildlife-volunteer.wav",
    captions: "public/listening-wildlife-volunteer.vtt",
    speakers: { female: "Supervisor (American female)", male: "Applicant (British male)" },
    lines: [
      ["female", "Good morning, Northwood Wildlife Park. How can I help?"],
      ["male", "Hello. I'm calling about the volunteer programme. I read the information online, but I wanted to check the timetable and the application documents."],
      ["female", "Certainly. We have a few different placements, so I'll ask some questions and then explain the next steps. May I have your surname?"],
      ["male", "Morgan. M, O, R, G, A, N."],
      ["female", "Thank you, Morgan. I've found the form. When can you start?"],
      ["male", "The twenty-second of March. I had planned the twentieth, but I have an exam that day, so the later date is the first one I can manage."],
      ["female", "That's fine. The induction morning is on the twenty-second as well. It takes about two hours, and we'll show you the safety equipment before you meet your supervisor."],
      ["female", "Which area would you prefer?"],
      ["male", "The visitor centre, rather than the cafe. I enjoy speaking to the public, and I already have some experience explaining information to children."],
      ["female", "Good. The visitor centre can be busy at weekends. Do you have any relevant training?"],
      ["male", "Yes, a first-aid certificate. It is still valid, although I can send you an updated copy if necessary."],
      ["female", "The current certificate is fine. Volunteers receive free lunch and a bus pass for each working day. A uniform is provided after the trial month. Accommodation and bicycle hire aren't available, so you'll need to arrange somewhere to stay and your own transport outside working hours."],
      ["male", "That's helpful. How many days would I normally work each week?"],
      ["female", "Most people do two regular days, but you can request an extra shift during school holidays. The exact rota is agreed after induction, once we know which activities you can support."],
      ["male", "Understood. How should I send my photograph?"],
      ["female", "Upload it through the online form. Please ask your two referees to email their references directly; we cannot accept screenshots or letters handed in by the applicant."],
      ["male", "I'll contact them this evening. Is there anything else I should bring to the induction?"],
      ["female", "Bring photo identification, a notebook and comfortable shoes. We provide the high-visibility vest and a locker, but you should bring a waterproof jacket if the weather is uncertain."],
      ["male", "Right. What is the earliest morning shift?"],
      ["female", "It begins at seven thirty. Staff meet at seven, but volunteers arrive half an hour later. Please use the side entrance because the main gate opens at eight."],
      ["male", "That should be manageable. I'm especially interested in the bird survey because I want practical field experience before university."],
      ["female", "We run the survey twice a month. I'll note your interest and send the details today, together with the induction checklist."],
      ["male", "Thanks very much. I look forward to hearing from you."],
      ["female", "You're welcome. We'll be in touch by email."],
    ],
  },
];

function readWave(path) {
  const buffer = readFileSync(path);
  let offset = 12;
  let format;
  let data;
  while (offset + 8 <= buffer.length) {
    const id = buffer.toString("ascii", offset, offset + 4);
    const size = buffer.readUInt32LE(offset + 4);
    const contents = buffer.subarray(offset + 8, offset + 8 + size);
    if (id === "fmt ") format = contents;
    if (id === "data") data = contents;
    offset += 8 + size + (size % 2);
  }
  if (!format || !data) throw new Error(`Unsupported WAV file: ${path}`);
  return { format, data };
}

function formatTimestamp(seconds) {
  const wholeMilliseconds = Math.round(seconds * 1000);
  const hours = Math.floor(wholeMilliseconds / 3_600_000);
  const minutes = Math.floor(wholeMilliseconds % 3_600_000 / 60_000);
  const remainder = wholeMilliseconds % 60_000 / 1000;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${remainder.toFixed(3).padStart(6, "0")}`;
}

function pauseAfter(text, index) {
  // Leave the small, uneven pauses heard in official sample conversations.
  // The earlier 0.2–0.4 second gaps made the exchange sound rushed and
  // machine-cut, especially on a phone speaker.
  if (index === 0) return 0.55;
  if (text.length > 145) return 0.72;
  if (text.endsWith("?")) return 0.45;
  if (text.length < 28) return 0.48;
  return 0.58;
}

function writeWave(path, parts) {
  const format = parts[0].format;
  const sampleRate = format.readUInt32LE(4);
  const blockAlign = format.readUInt16LE(12);
  const buffers = [];
  const captions = [];
  let elapsedFrames = 0;
  parts.forEach((part, index) => {
    const start = elapsedFrames / sampleRate;
    buffers.push(part.data);
    elapsedFrames += part.data.length / blockAlign;
    captions.push({ start, end: elapsedFrames / sampleRate, speaker: part.speaker, text: part.text });
    if (index < parts.length - 1) {
      const silence = Buffer.alloc(Math.round(sampleRate * blockAlign * part.pauseSeconds));
      buffers.push(silence);
      elapsedFrames += silence.length / blockAlign;
    }
  });
  const data = Buffer.concat(buffers);
  const header = Buffer.alloc(12);
  header.write("RIFF", 0);
  header.writeUInt32LE(4 + 8 + format.length + 8 + data.length, 4);
  header.write("WAVE", 8);
  const formatHeader = Buffer.alloc(8);
  formatHeader.write("fmt ", 0);
  formatHeader.writeUInt32LE(format.length, 4);
  const dataHeader = Buffer.alloc(8);
  dataHeader.write("data", 0);
  dataHeader.writeUInt32LE(data.length, 4);
  writeFileSync(path, Buffer.concat([header, formatHeader, format, dataHeader, data]));
  return captions;
}

function spelledNameChunks(text) {
  const match = text.match(/^(.+?\.) ([A-Z](?:, [A-Z])+)[.]$/);
  if (!match) return [text];
  // Keep the spelling in one utterance. Starting a fresh synthesiser process for
  // every letter produced the metallic, disconnected sound heard on mobile.
  return [match[1], `${match[2]}.`];
}

function synthesizeTurn({ role, text, index, directory }) {
  const chunks = role === "male" ? spelledNameChunks(text) : [text];
  const waves = chunks.map((chunk, chunkIndex) => {
    const fileStem = `${index}-${chunkIndex}`;
    const aiffPath = join(directory, `${fileStem}.aiff`);
    const wavPath = join(directory, `${fileStem}.wav`);
    // Keep the two speakers unmistakably different: Samantha is an American
    // female voice, while Daniel has a deeper British male timbre. IELTS
    // recordings use varied English accents, so this is both natural and
    // faithful to the exam's listening experience.
    const voice = role === "female" ? "Samantha" : "Daniel";
    const baseRate = role === "female" ? 156 : 163;
    const naturalVariation = [-3, 1, 0, 2, -1][index % 5];
    const rate = String(chunks.length > 1 && chunkIndex > 0 ? 148 : baseRate + naturalVariation);
    execFileSync("/usr/bin/say", ["-v", voice, "-r", rate, "-o", aiffPath, chunk]);
    execFileSync("/usr/bin/afconvert", ["-f", "WAVE", "-d", "LEI16@44100", aiffPath, wavPath]);
    return readWave(wavPath);
  });
  const format = waves[0].format;
  const sampleRate = format.readUInt32LE(4);
  const blockAlign = format.readUInt16LE(12);
  const data = Buffer.concat(waves.flatMap((wave, chunkIndex) => {
    if (chunkIndex === waves.length - 1) return [wave.data];
    const pauseSeconds = .2;
    return [wave.data, Buffer.alloc(Math.round(sampleRate * blockAlign * pauseSeconds))];
  }));
  return { format, data };
}

const temporaryDirectory = mkdtempSync(join(tmpdir(), "ielts-listening-"));
try {
  for (const conversation of conversations) {
    const parts = conversation.lines.map(([role, text], index) => {
      const audio = synthesizeTurn({ role, text, index, directory: temporaryDirectory });
      return { ...audio, speaker: conversation.speakers[role], text, pauseSeconds: pauseAfter(text, index) };
    });
    const captions = writeWave(resolve(conversation.output), parts);
    writeFileSync(resolve(conversation.captions), `WEBVTT\n\n${captions.map((caption) => `${formatTimestamp(caption.start)} --> ${formatTimestamp(caption.end)}\n${caption.speaker}: ${caption.text}`).join("\n\n")}\n`);
  }
} finally {
  rmSync(temporaryDirectory, { recursive: true, force: true });
}
