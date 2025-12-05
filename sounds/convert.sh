#!/bin/bash
mkdir -p mp3
for f in *.flac; do
    ffmpeg -i "$f" -t 3 -acodec libmp3lame -b:a 320k "mp3/${f%.flac}.mp3"
done
