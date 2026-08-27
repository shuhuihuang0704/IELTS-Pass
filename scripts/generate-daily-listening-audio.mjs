import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

const conversations = [
  {
    output: "public/listening-arts-centre.wav",
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

function writeWave(path, parts) {
  const format = parts[0].format;
  const sampleRate = format.readUInt32LE(4);
  const blockAlign = format.readUInt16LE(12);
  const silence = Buffer.alloc(Math.round(sampleRate * blockAlign * 0.38));
  const data = Buffer.concat(parts.flatMap((part, index) => index === parts.length - 1 ? [part.data] : [part.data, silence]));
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
}

const temporaryDirectory = mkdtempSync(join(tmpdir(), "ielts-listening-"));
try {
  for (const conversation of conversations) {
    const parts = conversation.lines.map(([role, text], index) => {
      const aiffPath = join(temporaryDirectory, `${index}.aiff`);
      const wavPath = join(temporaryDirectory, `${index}.wav`);
      const voice = role === "female" ? "Flo (English (UK))" : "Daniel";
      execFileSync("/usr/bin/say", ["-v", voice, "-r", "168", "-o", aiffPath, text]);
      execFileSync("/usr/bin/afconvert", ["-f", "WAVE", "-d", "LEI16@24000", aiffPath, wavPath]);
      return readWave(wavPath);
    });
    writeWave(resolve(conversation.output), parts);
  }
} finally {
  rmSync(temporaryDirectory, { recursive: true, force: true });
}
