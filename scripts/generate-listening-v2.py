#!/usr/bin/env python3
"""Generate the bundled IELTS-style Section 1 dialogue with natural US/UK voices."""

from __future__ import annotations

import subprocess
import tempfile
import wave
import re
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "public" / "listening-section-1-v2.wav"
CAPTIONS = ROOT / "public" / "listening-section-1.vtt"
SAMPLE_RATE = 44_100

# Use a clearly different accent and timbre for each speaker. The American
# female voice and British male voice make turn-taking unmistakable on small
# phone speakers while still matching the range of accents used in IELTS.
FEMALE_VOICE = "Samantha"
MALE_VOICE = "Daniel"

TURNS = [
    ("Receptionist (American female)", FEMALE_VOICE, 158, "Good morning, Westbridge University Residence. How can I help?", 520),
    ("Student (British male)", MALE_VOICE, 164, "Hello. I'm calling to complete my accommodation application. I started the form online, but I wasn't sure about a couple of details.", 420),
    ("Receptionist (American female)", FEMALE_VOICE, 161, "Of course. We can go through it together. Before we begin, have you already received an application number?", 360),
    ("Student (British male)", MALE_VOICE, 166, "Yes, it's WR-4086. I wrote it down beside my passport details.", 400),
    ("Receptionist (American female)", FEMALE_VOICE, 159, "That's useful. First, can I take your family name?", 300),
    ("Student (British male)", MALE_VOICE, 162, "It's Chen. C, H, E, N.", 360),
    ("Receptionist (American female)", FEMALE_VOICE, 157, "Thank you. Let me just check that on the screen: Chen, C-H-E-N. And is this for the autumn intake?", 420),
    ("Student (British male)", MALE_VOICE, 165, "Yes, for the autumn term. I'm hoping to move in before classes start.", 380),
    ("Receptionist (American female)", FEMALE_VOICE, 160, "Right. When will you arrive?", 300),
    ("Student (British male)", MALE_VOICE, 164, "On the fourteenth of October. I originally wrote the twelfth, but my flight changed.", 420),
    ("Receptionist (American female)", FEMALE_VOICE, 158, "I see. The fourteenth is fine. Will you need the room for the whole academic year, or only the first term?", 450),
    ("Student (British male)", MALE_VOICE, 165, "The whole year, if possible. I may stay during the spring break as well, so I wanted to ask about that.", 420),
    ("Receptionist (American female)", FEMALE_VOICE, 160, "You can remain in the residence during the break, although catering hours are reduced. Do you want a shared room?", 500),
    ("Student (British male)", MALE_VOICE, 163, "No, a single room, please. I need somewhere quiet to study.", 360),
    ("Receptionist (American female)", FEMALE_VOICE, 157, "We have single rooms in two buildings. The older block is nearer the library, while the newer block has larger kitchens. Do you have a preference?", 480),
    ("Student (British male)", MALE_VOICE, 164, "The library sounds more important. I don't mind using a smaller kitchen.", 390),
    ("Receptionist (American female)", FEMALE_VOICE, 159, "That's noted. Any dietary requirement?", 300),
    ("Student (British male)", MALE_VOICE, 165, "Yes, vegetarian. I eat dairy products, but no meat or fish.", 380),
    ("Receptionist (American female)", FEMALE_VOICE, 158, "I'll add that to your catering profile. You can change it later through the student portal, but please give us a week's notice.", 420),
    ("Receptionist (American female)", FEMALE_VOICE, 156, "Now, several facilities are included in the weekly fee. Every room has Wi-Fi, and residents can use the bicycle storage without charge. The laundry is available, but each wash costs three pounds. Breakfast is optional, and I'm afraid there is no gym in this building. There is a small common room on each floor, and the study room has to be booked online.", 620),
    ("Student (British male)", MALE_VOICE, 164, "That's fine. What documents do you need?", 320),
    ("Receptionist (American female)", FEMALE_VOICE, 157, "Please send a copy of your passport by email. You can show the original at reception when you arrive. We also need your university offer letter and an emergency contact number.", 500),
    ("Student (British male)", MALE_VOICE, 165, "I can email those this evening. Do you need the originals as well?", 330),
    ("Receptionist (American female)", FEMALE_VOICE, 159, "A scanned copy is enough for the application. You can show the original at reception when you arrive, so please keep it in your hand luggage.", 420),
    ("Receptionist (American female)", FEMALE_VOICE, 157, "The deposit must be paid by bank transfer. We cannot accept cash for that, and the reference should include your application number.", 520),
    ("Student (British male)", MALE_VOICE, 164, "I understand. Is there a deadline for the transfer?", 330),
    ("Receptionist (American female)", FEMALE_VOICE, 158, "We need the deposit by the thirtieth of September. If your bank takes longer, let us know before then and we can make a note on the application.", 460),
    ("Student (British male)", MALE_VOICE, 165, "Right. What time can I collect my key?", 330),
    ("Receptionist (American female)", FEMALE_VOICE, 157, "Check-in begins at three p.m. You said your flight lands at two, so arriving around half past four should be comfortable. The reception desk stays open until seven on weekdays.", 500),
    ("Student (British male)", MALE_VOICE, 164, "Great. Is reception open late at the weekend?", 380),
    ("Receptionist (American female)", FEMALE_VOICE, 158, "On Saturdays it's open until five, and on Sundays it closes at four. If you arrive later, email us in advance and the night porter can meet you.", 450),
    ("Student (British male)", MALE_VOICE, 165, "Great. I chose Westbridge because it is close to the science building. The city centre residence was newer, but it was much farther from my classes.", 520),
    ("Receptionist (American female)", FEMALE_VOICE, 157, "That makes sense. Before I let you go, check that your phone number and email address are still the same as on the online form. I'll email your confirmation today, together with the move-in checklist.", 550),
    ("Student (British male)", MALE_VOICE, 164, "They are both correct. Thanks for taking the time to go through everything.", 350),
    ("Receptionist (American female)", FEMALE_VOICE, 158, "You're welcome. I'll email your confirmation today, and we'll see you in October.", 450),
]


def spelled_name_chunks(text: str) -> list[str]:
    match = re.fullmatch(r"(.+?\.) ([A-Z](?:, [A-Z])+)[.]", text)
    if not match:
        return [text]
    return [match.group(1), f"{match.group(2)}."]


def synthesize_turn(
    temporary_path: Path,
    index: int,
    voice: str,
    rate: int,
    text: str,
) -> Path:
    chunks = spelled_name_chunks(text) if voice == MALE_VOICE else [text]
    chunk_paths: list[Path] = []
    for chunk_index, chunk in enumerate(chunks):
        chunk_path = temporary_path / f"{index:02d}-{chunk_index:02d}.wav"
        chunk_rate = 148 if len(chunks) > 1 and chunk_index > 0 else rate
        subprocess.run(
            [
                "say",
                "-v",
                voice,
                "-r",
                str(chunk_rate),
                "--file-format=WAVE",
                f"--data-format=LEI16@{SAMPLE_RATE}",
                "-o",
                str(chunk_path),
                chunk,
            ],
            check=True,
        )
        chunk_paths.append(chunk_path)

    segment_path = temporary_path / f"{index:02d}.wav"
    with wave.open(str(chunk_paths[0]), "rb") as reference:
        parameters = reference.getparams()
    with wave.open(str(segment_path), "wb") as destination:
        destination.setparams(parameters)
        for chunk_index, chunk_path in enumerate(chunk_paths):
            with wave.open(str(chunk_path), "rb") as source:
                destination.writeframes(source.readframes(source.getnframes()))
            if chunk_index < len(chunk_paths) - 1:
                pause_ms = 200
                destination.writeframes(b"\x00\x00" * round(SAMPLE_RATE * pause_ms / 1000))
    return segment_path


def format_timestamp(seconds: float) -> str:
    minutes, remainder = divmod(seconds, 60)
    return f"{int(minutes):02d}:{remainder:06.3f}"


def main() -> None:
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryDirectory(prefix="ielts-audio-") as temporary_directory:
        temporary_path = Path(temporary_directory)
        segments: list[tuple[str, Path, int]] = []
        for index, (speaker, voice, rate, text, pause_ms) in enumerate(TURNS):
            segment_path = synthesize_turn(temporary_path, index, voice, rate, text)
            segments.append((speaker, segment_path, pause_ms))

        elapsed_frames = 0
        captions: list[tuple[str, str, str, str]] = []
        with wave.open(str(segments[0][1]), "rb") as reference:
            parameters = reference.getparams()
        with wave.open(str(OUTPUT), "wb") as destination:
            destination.setparams(parameters)
            for speaker, segment_path, pause_ms in segments:
                start = elapsed_frames / SAMPLE_RATE
                with wave.open(str(segment_path), "rb") as source:
                    frames = source.readframes(source.getnframes())
                    frame_count = source.getnframes()
                destination.writeframes(frames)
                elapsed_frames += frame_count
                end = elapsed_frames / SAMPLE_RATE
                spoken_text = TURNS[len(captions)][3]
                captions.append((format_timestamp(start), format_timestamp(end), speaker, spoken_text))
                silence_frames = round(SAMPLE_RATE * pause_ms / 1000)
                destination.writeframes(b"\x00\x00" * silence_frames)
                elapsed_frames += silence_frames
                print(f"{speaker:12} {format_timestamp(start)} --> {format_timestamp(end)}")

        CAPTIONS.write_text(
            "WEBVTT\n\n" + "\n\n".join(
                f"{start} --> {end}\n{speaker}: {text}" for start, end, speaker, text in captions
            ) + "\n",
            encoding="utf-8",
        )

    print(f"Wrote {OUTPUT} ({format_timestamp(elapsed_frames / SAMPLE_RATE)})")
    print(f"Wrote {CAPTIONS}")


if __name__ == "__main__":
    main()
