import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

const conversations = [
  {
    output: "public/listening-arts-centre.wav",
    captions: "public/listening-arts-centre.vtt",
    speakers: { female: "Coordinator (Australian female)", male: "Caller (British male)" },
    lines: [
      ["female", "Good afternoon, Riverside Arts Centre."],
      ["male", "Hello. I'd like to book an evening course."],
      ["female", "Of course. Can I take your surname?"],
      ["male", "Patel. P, A, T, E, L."],
      ["female", "Which course interests you?"],
      ["male", "I first considered photography, but I'd prefer pottery."],
      ["female", "The pottery course starts on the sixth of November, not the fourth as shown in the old leaflet."],
      ["male", "That's fine."],
      ["female", "The full fee is eighty-five pounds. The ninety-five-pound figure includes an optional exhibition ticket."],
      ["male", "What is included?"],
      ["female", "All basic materials are included, and students may use the evening studio without extra charge. Tools can be hired, refreshments are sold downstairs, and parking costs four pounds."],
      ["male", "How will I receive the timetable?"],
      ["female", "We'll email it this afternoon. Your membership card must be collected at reception."],
      ["male", "What time does the class begin?"],
      ["female", "At six thirty. The building opens at six and the tutor arrives at six fifteen."],
      ["male", "Perfect. I chose this centre because the classes are small, so I should receive more feedback."],
      ["female", "I'll reserve your place now."],
    ],
  },
  {
    output: "public/listening-wildlife-volunteer.wav",
    captions: "public/listening-wildlife-volunteer.vtt",
    speakers: { female: "Supervisor (Australian female)", male: "Applicant (British male)" },
    lines: [
      ["female", "Good morning, Northwood Wildlife Park."],
      ["male", "Hello. I'm calling about the volunteer programme."],
      ["female", "May I have your surname?"],
      ["male", "Morgan. M, O, R, G, A, N."],
      ["female", "When can you start?"],
      ["male", "The twenty-second of March. I had planned the twentieth, but I have an exam that day."],
      ["female", "Which area would you prefer?"],
      ["male", "The visitor centre, rather than the cafe."],
      ["female", "Do you have any relevant training?"],
      ["male", "Yes, a first-aid certificate."],
      ["female", "Volunteers receive free lunch and a bus pass for each working day. A uniform is provided after the trial month. Accommodation and bicycle hire aren't available."],
      ["male", "How should I send my photograph?"],
      ["female", "Upload it through the online form. Please ask your two referees to email their references directly."],
      ["male", "What is the earliest morning shift?"],
      ["female", "It begins at seven thirty. Staff meet at seven, but volunteers arrive half an hour later."],
      ["male", "Great. I'm especially interested in the bird survey because I want practical field experience before university."],
      ["female", "I'll send the details today."],
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
  if (index === 0) return 0.46;
  if (text.length > 145) return 0.58;
  if (text.endsWith("?")) return 0.34;
  if (text.length < 28) return 0.42;
  return 0.48;
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
  return [match[1], ...match[2].split(", ")];
}

function synthesizeTurn({ role, text, index, directory }) {
  const chunks = role === "male" ? spelledNameChunks(text) : [text];
  const waves = chunks.map((chunk, chunkIndex) => {
    const fileStem = `${index}-${chunkIndex}`;
    const aiffPath = join(directory, `${fileStem}.aiff`);
    const wavPath = join(directory, `${fileStem}.wav`);
    const voice = role === "female" ? "Karen" : "Daniel";
    const rate = role === "female" ? "160" : chunks.length > 1 && chunkIndex > 0 ? "158" : "170";
    execFileSync("/usr/bin/say", ["-v", voice, "-r", rate, "-o", aiffPath, chunk]);
    execFileSync("/usr/bin/afconvert", ["-f", "WAVE", "-d", "LEI16@44100", aiffPath, wavPath]);
    return readWave(wavPath);
  });
  const format = waves[0].format;
  const sampleRate = format.readUInt32LE(4);
  const blockAlign = format.readUInt16LE(12);
  const data = Buffer.concat(waves.flatMap((wave, chunkIndex) => {
    if (chunkIndex === waves.length - 1) return [wave.data];
    const pauseSeconds = chunkIndex === 0 ? .24 : .13;
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
