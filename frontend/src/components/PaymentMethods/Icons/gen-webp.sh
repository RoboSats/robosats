#!/bin/bash

mkdir webp 2>/dev/null

for f in *.{png,jpg}
do
  echo ""
  title=$(echo $f | sed 's/\.[^.]*$//')
  echo "Processing $f..."
  cwebp "$f" -q 80 -psnr 40 -resize 80 80 -o webp/"$(echo $f | rev | cut -d"." -f2- | rev).webp" < /dev/null
  echo ""
done