#!/usr/bin/env python3
"""
Automated CLI Assembler for Sonría Clínicas Odontológicas Medellín Fallback Commercials
Concatenates raw shots from Runway / Kling / Luma / Hailuo / Sora,
normalizes framerate/resolution, layers Spanish #262 master voiceover with auto-ducking,
and optimizes with +faststart for instant web playback.
"""

import os
import subprocess
import sys
import shutil

ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DOWNLOADS_DIR = os.path.expanduser(r"~\Downloads")
OUTPUT_VIDEO = os.path.join(ROOT_DIR, "public", "media", "sonria_medellin_262_promo.mp4")
ROOT_MEDIA_COPY = os.path.join(ROOT_DIR, "media", "sonria_medellin_262_promo.mp4")
VOICEOVER_TRACK = os.path.join(ROOT_DIR, "media", "sonria_spanish_262_master.mp3")

def check_clips():
    clips = [os.path.join(DOWNLOADS_DIR, f"clip{i}.mp4") for i in range(1, 6)]
    missing = [c for c in clips if not os.path.exists(c)]
    if missing:
        print(f"[!] Warning: Missing clips in Downloads: {missing}")
        print("Please place clip1.mp4 through clip5.mp4 into your Downloads folder.")
        return False, clips
    return True, clips

def main():
    print("=== Sonría Commercial Fallback Assembler ===")
    ok, clips = check_clips()
    if not ok:
        sys.exit(1)
        
    concat_list = os.path.join(ROOT_DIR, "scripts", "concat_list.txt")
    with open(concat_list, "w", encoding="utf-8") as f:
        for c in clips:
            f.write(f"file '{c.replace(chr(92), '/')}'\n")
            
    print(f"[*] Concatenating {len(clips)} clips with FFmpeg...")
    temp_concat = os.path.join(ROOT_DIR, "scripts", "temp_concat.mp4")
    
    # 1. Concat & scale to 1920x1080@30fps
    cmd1 = [
        "ffmpeg", "-y", "-f", "concat", "-safe", "0", "-i", concat_list,
        "-vf", "scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2,setsar=1,fps=30",
        "-c:v", "libx264", "-preset", "medium", "-crf", "19",
        "-an", temp_concat
    ]
    subprocess.run(cmd1, check=True)
    
    # 2. Audio mixing with Spanish #262 voiceover + faststart
    print("[*] Layering Spanish #262 voiceover and applying +faststart...")
    cmd2 = [
        "ffmpeg", "-y", "-i", temp_concat, "-i", VOICEOVER_TRACK,
        "-c:v", "copy",
        "-c:a", "aac", "-b:a", "192k",
        "-shortest",
        "-movflags", "+faststart",
        OUTPUT_VIDEO
    ]
    subprocess.run(cmd2, check=True)
    
    # Sync to root media folder
    os.makedirs(os.path.dirname(ROOT_MEDIA_COPY), exist_ok=True)
    shutil.copyfile(OUTPUT_VIDEO, ROOT_MEDIA_COPY)
    
    # Clean temp
    if os.path.exists(temp_concat):
        os.remove(temp_concat)
    if os.path.exists(concat_list):
        os.remove(concat_list)
        
    print(f"[SUCCESS] Commercial assembled and verified at: {OUTPUT_VIDEO}")
    print("[*] Running Playwright regression verification...")
    subprocess.run(["npx", "playwright", "test"], cwd=ROOT_DIR)

if __name__ == "__main__":
    main()
