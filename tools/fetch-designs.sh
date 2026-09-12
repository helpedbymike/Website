#!/usr/bin/env bash
# Pull the eight path artworks into assets/designs/.
#
# The site works without these files — js/art.js draws a generated emblem for
# any design it cannot load — but the real artwork is better, so drop it in.
#
# Either run this script, or just save eight square PNGs yourself as:
#   assets/designs/{family,discipline,purpose,faith,freedom,passion,growth,legacy}.png
# Artwork should be a centred composition on a black background; the site keys
# the black out so the print sits correctly on light colourways too.

set -euo pipefail
cd "$(dirname "$0")/.."
mkdir -p assets/designs

BASE="https://d8j0ntlcm91z4.cloudfront.net/user_3ImTn7KH4v3UZj21eqFx8tHfRWA"

declare -A ART=(
  [family]="$BASE/hf_20260912_003800_923f48d9-36bd-4058-be97-bd440ecd8f12.png"
  [discipline]="$BASE/hf_20260912_003801_9bb2ddca-f5f8-45fa-96d0-9f0704dfdfb7.png"
  [purpose]="$BASE/hf_20260912_003801_de524ebe-c5ab-4e19-8ee0-b5f4a6f0236f.png"
  [faith]="$BASE/hf_20260912_003801_6c009fe6-218d-4112-8a0a-a4c98c22ef70.png"
  [freedom]="$BASE/hf_20260912_003801_5d843bc4-a0a0-4361-8c25-6cbd96aecd43.png"
  [passion]="$BASE/hf_20260912_003801_62ed90b2-e508-4e5f-9630-b04e6bbd311a.png"
  [growth]="$BASE/hf_20260912_003801_f74adcd6-23be-4913-8614-3ad4fa4f2d5c.png"
  [legacy]="$BASE/hf_20260912_003801_c37e7a87-a230-4fd1-ae13-9c8f0de87646.png"
)

for name in "${!ART[@]}"; do
  printf 'fetching %-12s ... ' "$name"
  if curl -fsSL --retry 3 -o "assets/designs/$name.png" "${ART[$name]}"; then
    echo "ok"
  else
    echo "FAILED (leaving the generated fallback in place)"
    rm -f "assets/designs/$name.png"
  fi
done

echo
echo "Done. Reload the site — any PNG that landed is used automatically."
