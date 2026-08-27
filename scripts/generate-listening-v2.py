#!/usr/bin/env python3
"""Generate the bundled IELTS-style Section 1 dialogue with two UK voices."""

from __future__ import annotations

import subprocess
import tempfile
import wave
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "public" / "listening-section-1-v2.wav"
CAPTIONS = ROOT / "public" / "listening-section-1.vtt"
SAMPLE_RATE = 24_000

FEMALE_VOICE = "Shelley (English (UK))"
MALE_VOICE = "Daniel"

TURNS = [
    ("Receptionist (female)", FEMALE_VOICE, 166, "Good morning, Westbridge University Residence. How can I help?", 420),
    ("Student (male)", MALE_VOICE, 184, "Hello. I'm calling to complete my accommodation application.", 520),
    ("Receptionist (female)", FEMALE_VOICE, 166, "Certainly. First, can I take your family name?", 320),
    ("Student (male)", MALE_VOICE, 180, "It's Chen. C, H, E, N.", 520),
    ("Receptionist (female)", FEMALE_VOICE, 166, "Thank you. And when will you arrive?", 300),
    ("Student (male)", MALE_VOICE, 182, "On the fourteenth of October. I originally wrote the twelfth, but my flight changed.", 420),
    ("Receptionist (female)", FEMALE_VOICE, 164, "Right, the fourteenth of October. Do you want a shared room?", 300),
    ("Student (male)", MALE_VOICE, 184, "No, a single room, please. I need somewhere quiet to study.", 420),
    ("Receptionist (female)", FEMALE_VOICE, 166, "Any dietary requirement?", 280),
    ("Student (male)", MALE_VOICE, 184, "Yes, vegetarian. I eat dairy products, but no meat or fish.", 560),
    ("Receptionist (female)", FEMALE_VOICE, 168, "Now, several facilities are included in the weekly fee. Every room has Wi-Fi, and residents can use the bicycle storage without charge. The laundry is available, but each wash costs three pounds. Breakfast is optional, and I'm afraid there is no gym in this building.", 500),
    ("Student (male)", MALE_VOICE, 186, "That's fine. What documents do you need?", 300),
    ("Receptionist (female)", FEMALE_VOICE, 166, "Please send a copy of your passport by email. You can show the original at reception when you arrive. The deposit must be paid by bank transfer. We cannot accept cash for that.", 420),
    ("Student (male)", MALE_VOICE, 186, "I understand. What time can I collect my key?", 300),
    ("Receptionist (female)", FEMALE_VOICE, 164, "Check-in begins at three p.m. You said your flight lands at two, so arriving around half past four should be comfortable.", 420),
    ("Student (male)", MALE_VOICE, 184, "Great. I chose Westbridge because it is close to the science building. The city centre residence was newer, but it was much farther from my classes.", 360),
    ("Receptionist (female)", FEMALE_VOICE, 166, "That makes sense. I'll email your confirmation today.", 650),
]


def format_timestamp(seconds: float) -> str:
    minutes, remainder = divmod(seconds, 60)
    return f"{int(minutes):02d}:{remainder:06.3f}"


def main() -> None:
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryDirectory(prefix="ielts-audio-") as temporary_directory:
        temporary_path = Path(temporary_directory)
        segments: list[tuple[str, Path, int]] = []
        for index, (speaker, voice, rate, text, pause_ms) in enumerate(TURNS):
            segment_path = temporary_path / f"{index:02d}.wav"
            subprocess.run(
                [
                    "say",
                    "-v",
                    voice,
                    "-r",
                    str(rate),
                    "--file-format=WAVE",
                    f"--data-format=LEI16@{SAMPLE_RATE}",
                    "-o",
                    str(segment_path),
                    text,
                ],
                check=True,
            )
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
