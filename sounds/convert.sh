#!/bin/bash
mkdir -p mp3
for f in *.flac; do
    ffmpeg -i "$f" -acodec libmp3lame -b:a 192k "mp3/${f%.flac}.mp3" -y
done
