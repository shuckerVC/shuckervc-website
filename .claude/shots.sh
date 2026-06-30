#!/bin/bash
# Capture homepage/feature screenshots for portfolio companies via thum.io.
# thum.io renders async: the first hit returns a spinner GIF, later hits return
# the cached real screenshot. We warm, wait, then download with retries that
# reject the GIF placeholder.
set -u
OUT="/Users/jppersico/Downloads/design_handoff_shuckervc_website/site/assets/portfolio"
mkdir -p "$OUT"

declare -a NAMES=(lodg cascade brev sindarin atlas algorized runreal)
declare -a URLS=(
  "https://www.lodg.ai"
  "https://usecascade.ai"
  "https://brev.io"
  "https://www.sindarin.tech"
  "https://runonatlas.com"
  "https://www.algorized.com"
  "https://runreal.io"
)

thumb() { echo "https://image.thum.io/get/width/1280/crop/800/wait/12/noanimate/$1"; }

# Warm-up pass — kicks off server-side rendering for each.
for i in "${!NAMES[@]}"; do
  curl -sL --max-time 60 "$(thumb "${URLS[$i]}")" -o /dev/null &
done
wait
sleep 25

# Download pass with retries; reject GIF placeholder.
for i in "${!NAMES[@]}"; do
  name="${NAMES[$i]}"; url="${URLS[$i]}"
  ok=0
  for attempt in 1 2 3 4 5; do
    curl -sL --max-time 60 "$(thumb "$url")" -o "$OUT/$name.png"
    kind=$(file -b "$OUT/$name.png")
    if [[ "$kind" != *GIF* && -s "$OUT/$name.png" ]]; then ok=1; break; fi
    sleep 12
  done
  if [[ $ok -eq 1 ]]; then
    echo "OK   $name  ($kind)"
  else
    echo "FAIL $name  (still placeholder/empty)"
    rm -f "$OUT/$name.png"
  fi
done
echo "DONE"
