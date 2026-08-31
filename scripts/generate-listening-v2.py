#!/usr/bin/env python3
"""Generate the bundled IELTS-style Section 1 dialogue with natural UK voices."""

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

FEMALE_VOICE = "Flo (English (UK))"
MALE_VOICE = "Reed (English (UK))"

TURNS = [
    ("Receptionist (British female)", FEMALE_VOICE, 167, "Good morning, Westbridge University Residence. How can I help?", 340),
    ("Student (British male)", MALE_VOICE, 173, "Hello. I'm calling to complete my accommodation application.", 300),
    ("Receptionist (British female)", FEMALE_VOICE, 170, "Certainly. First, can I take your family name?", 220),
    ("Student (British male)", MALE_VOICE, 171, "It's Chen. C, H, E, N.", 280),
    ("Receptionist (British female)", FEMALE_VOICE, 168, "Thank you. And when will you arrive?", 210),
    ("Student (British male)", MALE_VOICE, 174, "On the fourteenth of October. I originally wrote the twelfth, but my flight changed.", 290),
    ("Receptionist (British female)", FEMALE_VOICE, 166, "Right, the fourteenth of October. Do you want a shared room?", 210),
    ("Student (British male)", MALE_VOICE, 176, "No, a single room, please. I need somewhere quiet to study.", 290),
    ("Receptionist (British female)", FEMALE_VOICE, 171, "Any dietary requirement?", 210),
    ("Student (British male)", MALE_VOICE, 173, "Yes, vegetarian. I eat dairy products, but no meat or fish.", 360),
    ("Receptionist (British female)", FEMALE_VOICE, 169, "Now, several facilities are included in the weekly fee. Every room has Wi-Fi, and residents can use the bicycle storage without charge. The laundry is available, but each wash costs three pounds. Breakfast is optional, and I'm afraid there is no gym in this building.", 390),
    ("Student (British male)", MALE_VOICE, 176, "That's fine. What documents do you need?", 210),
    ("Receptionist (British female)", FEMALE_VOICE, 168, "Please send a copy of your passport by email. You can show the original at reception when you arrive. The deposit must be paid by bank transfer. We cannot accept cash for that.", 330),
    ("Student (British male)", MALE_VOICE, 175, "I understand. What time can I collect my key?", 210),
    ("Receptionist (British female)", FEMALE_VOICE, 166, "Check-in begins at three p.m. You said your flight lands at two, so arriving around half past four should be comfortable.", 320),
    ("Student (British male)", MALE_VOICE, 173, "Great. I chose Westbridge because it is close to the science building. The city centre residence was newer, but it was much farther from my classes.", 280),
    ("Receptionist (British female)", FEMALE_VOICE, 168, "That makes sense. I'll email your confirmation today.", 430),
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
