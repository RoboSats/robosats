#!/bin/bash

OS=$(uname -s)

mkdir code 2>/dev/null

code="{\n"
html=""
cd webp && for f in *.webp
do
  title=$(echo $f | sed 's/\.[^.]*$//')  
  key=$(echo $title | sed 's/.*/\L&/' | sed 's/ //' | sed 's/[^[:alnum:]]//g')

  if [ "$OS" = "Darwin" ]; then
    image=$(cat "$title.webp" | base64 -b 0)
  else
    image=$(cat "$title.webp" | base64 -w 0)
  fi

code+="  $key: {
    title: \"$title\",
    image: \"data:image/webp;base64,$image\",
  },
"
html+="$title
<img
  src=\"data:image/webp;base64,$image\"
/>
"
done

code+="};"

printf "$code" > ../code/code.js
printf "$html" > ../code/code.html

if [ "$OS" = "Darwin" ]; then
  printf "$code" | pbcopy
else
  printf "$code" | xclip -sel clip
fi

echo "Copied code to clipboard"