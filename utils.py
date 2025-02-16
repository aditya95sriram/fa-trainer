#!/usr/bin/python3

import sys
from pathlib import Path
from math import ceil
import subprocess


ASSETS = Path("assets")
SPRITE_WIDTH, SPRITE_HEIGHT = 215, 265


def clean():
    all_words = (ASSETS / "words.txt").read_text().split()
    dupes = []
    for word in all_words:
        if word.lower() != word and word.lower() in all_words:
            dupes.append(word)

    print(dupes)
    print(len(dupes))

    final_words = [f'"{word}"' for word in all_words if word not in dupes]
    (ASSETS / "words.js").write_text(",\n".join(final_words))


def pack_sprites():
    sprites = sorted((ASSETS / "alphabets").glob("*.png"))
    num_sprites = len(sprites)

    num_cols = 8
    num_rows = int(ceil(num_sprites / num_cols))
    cmd = "montage"
    args = [
        "-tile", f"{num_cols}x{num_rows}",
        "-geometry", f"{SPRITE_WIDTH}x{SPRITE_HEIGHT}"
    ]
    spritesheet = ASSETS / "spritesheet.webp"

    # pack spritesheet using montage
    proc = subprocess.run(
        [cmd, *sprites, *args, spritesheet], stderr=subprocess.PIPE
    )
    if proc.returncode == 0:
        print("spritesheet written to", spritesheet)
    else:
        print("error:", proc.stderr.decode())

    # write sprite locations to alphabets.js
    sprite_locs = ASSETS / "alphabets.js"
    data = dict()
    for idx, sprite in enumerate(sprites):
        x = SPRITE_WIDTH * (idx % num_cols)
        y = SPRITE_HEIGHT * (idx // num_cols)
        alphabet = sprite.stem.rstrip("1234567890")
        # print(alphabet, idx % num_cols, idx // num_cols, x, y)
        if alphabet not in data:
            data[alphabet] = []
        data[alphabet].append(dict(x=x, y=y))

    with open(sprite_locs, 'w') as f:
        f.write("alphabets={\n")
        for alphabet, locs in data.items():
            f.write(f'"{alphabet}": {locs},\n')
        f.write("}\n")
    print("sprite locations written to", sprite_locs)


if __name__ == "__main__":
    if len(sys.argv) <= 1:
        print(f"usage: python {sys.argv[0]} <clean|pack_sprites>")
        exit()
    mode = sys.argv[1]
    if mode == "clean":
        clean()
    elif mode == "pack_sprites":
        pack_sprites()
    else:
        print("unknown mode:", mode, ", exiting")
