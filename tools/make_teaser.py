#!/usr/bin/env python3
"""
make_teaser.py — build a short, muted, seamlessly looping teaser video (+ poster
image) for a publication card from still images and/or video clips.

  • video clips are optionally trimmed, sped up, and center-cropped to 16:10
  • still images (e.g. a method figure) are held for N seconds and letterboxed
    (never cropped), padded with the image's own background color
  • segments are joined with crossfades; the last one fades back into the first
    frame, so the loop point is invisible on the site
  • prints `videoLabels` timings to paste into content.js — the site shows them as
    a small tag in the card corner that changes with each segment

Usage
  python3 tools/make_teaser.py --out assets/teasers/pair \\
      --clip "src/method.png=2.5#method" \\
      --clip "src/plate.mp4@2#real robot · 2×" --clip "src/tower.mp4@4#4×" --clip "src/truck.mp4@5#5×"

  Spec:   PATH[{X,Y,W,H}][@SPEED][:START-END][=HOLD][#LABEL]
            {X,Y,W,H}   crop to this region (source pixels) first — e.g. a figure
                        panel, or one video embedded in a slide
            @SPEED      playback speed for videos (default 1)
            :START-END  trim the source video (seconds)
            =HOLD       image: seconds to show it (default 2.5)
                        video: freeze the last frame this long, so the crossfade out
                        dissolves over the finished state instead of the final action
            #LABEL      corner tag text for this segment (default: "N×" if sped up)
  Writes: <out>.mp4 (H.264, faststart, no audio) and <out>.jpg (poster)

Needs ffmpeg: uses $FFMPEG, else the `imageio-ffmpeg` package's bundled binary,
else `ffmpeg` on PATH.
"""
import argparse
import json
import os
import re
import shutil
import subprocess
import sys

IMAGE_EXT = (".png", ".jpg", ".jpeg", ".webp")


def find_ffmpeg():
    if os.environ.get("FFMPEG"):
        return os.environ["FFMPEG"]
    try:
        import imageio_ffmpeg  # type: ignore
        return imageio_ffmpeg.get_ffmpeg_exe()
    except Exception:
        pass
    exe = shutil.which("ffmpeg")
    if exe:
        return exe
    sys.exit("ffmpeg not found: set $FFMPEG, `pip install imageio-ffmpeg`, or install ffmpeg.")


def duration(ff, path):
    err = subprocess.run([ff, "-hide_banner", "-i", path], capture_output=True, text=True).stderr
    m = re.search(r"Duration: (\d+):(\d+):([\d.]+)", err)
    if not m:
        sys.exit(f"could not read duration of {path}")
    h, mnt, s = m.groups()
    return int(h) * 3600 + int(mnt) * 60 + float(s)


def corner_color(ff, path):
    """Background color of a still image, sampled near its top-left corner."""
    raw = subprocess.run([ff, "-hide_banner", "-loglevel", "error", "-i", path,
                          "-vf", "crop=1:1:4:4,format=rgb24", "-f", "rawvideo", "-"],
                         capture_output=True).stdout
    return "0x" + raw[:3].hex() if len(raw) >= 3 else "black"


def parse_clip(spec):
    m = re.fullmatch(r"(.+?)(?:\{(\d+),(\d+),(\d+),(\d+)\})?(?:@([\d.]+))?(?::([\d.]+)-([\d.]+))?(?:=([\d.]+))?(?:#(.*))?", spec)
    if not m or not os.path.exists(m.group(1)):
        sys.exit(f"bad clip spec or missing file: {spec}")
    path, cx, cy, cw, ch, speed, a, b, hold, label = m.groups()
    image = path.lower().endswith(IMAGE_EXT)
    speed = float(speed or 1)
    if label is None:
        label = "" if image or speed == 1 else f"{speed:g}×"
    region = f"crop={cw}:{ch}:{cx}:{cy}," if cw else ""
    hold = float(hold) if hold else (2.5 if image else 0.0)
    return {"path": path, "image": image, "region": region, "speed": speed, "hold": hold, "label": label,
            "start": float(a) if a else None, "end": float(b) if b else None}


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--out", required=True, help="output path without extension")
    ap.add_argument("--clip", action="append", required=True, help="see spec above; repeat for a montage")
    ap.add_argument("--size", default="640x400", help="output WxH (default 640x400, 16:10)")
    ap.add_argument("--fps", type=int, default=30)
    ap.add_argument("--fade", type=float, default=0.35, help="crossfade seconds")
    ap.add_argument("--crf", type=int, default=26, help="x264 quality (lower = better/bigger)")
    ap.add_argument("--poster-at", type=float, default=None, help="poster time in output seconds (default: middle of segment 1)")
    args = ap.parse_args()

    ff = find_ffmpeg()
    W, H = map(int, args.size.lower().split("x"))
    clips = [parse_clip(c) for c in args.clip]
    F, fps = args.fade, args.fps
    tail = f"setsar=1,fps={fps},format=yuv420p,settb=AVTB"
    crop = f"crop='min(iw,ih*{W}/{H})':'min(ih,iw*{H}/{W})',scale={W}:{H}:flags=lanczos,{tail}"

    def fit(c):  # letterbox a still image with its own background color
        return (f"{c['region']}scale={W}:{H}:force_original_aspect_ratio=decrease:flags=lanczos,"
                f"pad={W}:{H}:(ow-iw)/2:(oh-ih)/2:color={corner_color(ff, c['path'])},{tail}")

    def input_args(c):
        if c["image"]:
            return ["-loop", "1", "-framerate", str(fps), "-t", f"{c['hold']:.3f}", "-i", c["path"]]
        trim = ["-ss", str(c["start"]), "-to", str(c["end"])] if c["start"] is not None else []
        return [*trim, "-i", c["path"]]

    # inputs: every segment, plus segment 1 again for the loop-closing still frame
    inputs, durs, parts = [], [], []
    for i, c in enumerate(clips):
        inputs += input_args(c)
        if c["image"]:
            durs.append(c["hold"])
            parts.append(f"[{i}:v]setpts=PTS-STARTPTS,{fit(c)}[v{i}]")
        else:
            src = (c["end"] - c["start"]) if c["start"] is not None else duration(ff, c["path"])
            durs.append(src / c["speed"] + c["hold"])
            freeze = f",tpad=stop_mode=clone:stop_duration={c['hold']}" if c["hold"] else ""
            parts.append(f"[{i}:v]{c['region']}setpts=(PTS-STARTPTS)/{c['speed']},{crop}{freeze}[v{i}]")
    n = len(clips)
    inputs += input_args(clips[0])
    # first frame of segment 1, repeated for the fade length (tpad on a 1-frame stream yields nothing)
    hold = int(F * fps) + 3
    look0 = fit(clips[0]) if clips[0]["image"] else clips[0]["region"] + crop
    parts.append(f"[{n}:v]trim=end_frame=1,loop=loop={hold}:size=1:start=0,setpts=N/{fps}/TB,{look0}[head]")

    starts, cur, length = [0.0], "v0", durs[0]
    for i in range(1, n):
        parts.append(f"[{cur}][v{i}]xfade=transition=fade:duration={F}:offset={length - F:.3f}[x{i}]")
        starts.append(length - F)
        cur, length = f"x{i}", length + durs[i] - F
    parts.append(f"[{cur}][head]xfade=transition=fade:duration={F}:offset={length - F:.3f}[out]")

    os.makedirs(os.path.dirname(os.path.abspath(args.out)), exist_ok=True)
    mp4, jpg = args.out + ".mp4", args.out + ".jpg"
    subprocess.run([ff, "-hide_banner", "-loglevel", "error", "-y", *inputs,
                    "-filter_complex", ";".join(parts), "-map", "[out]", "-t", f"{length:.3f}",
                    "-c:v", "libx264", "-preset", "slow", "-crf", str(args.crf), "-profile:v", "high",
                    "-pix_fmt", "yuv420p", "-movflags", "+faststart", "-an", mp4], check=True)

    t = args.poster_at if args.poster_at is not None else durs[0] / 2
    subprocess.run([ff, "-hide_banner", "-loglevel", "error", "-y", "-ss", f"{t:.3f}", "-i", mp4,
                    "-frames:v", "1", "-q:v", "2", jpg], check=True)

    print(f"{mp4}  {length:.2f}s  {os.path.getsize(mp4) / 1e3:.0f} KB")
    print(f"{jpg}  {os.path.getsize(jpg) / 1e3:.0f} KB")
    # label switches at the middle of each crossfade
    labels = [[round(s + (F / 2 if i else 0), 2), c["label"]] for i, (s, c) in enumerate(zip(starts, clips))]
    print("videoLabels: " + json.dumps(labels, ensure_ascii=False))


if __name__ == "__main__":
    main()
