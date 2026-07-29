#!/usr/bin/env bash
#
# generate_clinerules.sh
#
# Mirrors every rule file in .claude/rules/ into a .clinerules/ directory at
# the repo root, so the same rules are picked up by the Cline VSCode
# extension (which loads instructions from a .clinerules file or a
# .clinerules/ directory of markdown files) as well as by Claude Code.
#
# .claude/rules/ is the single source of truth. Files under .clinerules/ are
# generated — never edit them by hand, edit the source under .claude/rules/
# and re-run this script (or let the pre-commit hook do it).

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

SRC_DIR=".claude/rules"
DEST_DIR=".clinerules"

IS_GIT_REPO=false
if git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  IS_GIT_REPO=true
fi

if [ ! -d "$SRC_DIR" ]; then
  echo "No $SRC_DIR directory found, nothing to generate."
  exit 0
fi

mapfile -t RULE_FILES < <(find "$SRC_DIR" -maxdepth 1 -type f -name "*.md" | sort)

if [ "${#RULE_FILES[@]}" -eq 0 ]; then
  echo "No rule files found in $SRC_DIR, nothing to generate."
  exit 0
fi

mkdir -p "$DEST_DIR"

# Wipe previously generated files so renames/removals in .claude/rules/ are
# reflected (this directory is fully generated, safe to clear).
find "$DEST_DIR" -maxdepth 1 -type f -name "*.md" -delete

for src in "${RULE_FILES[@]}"; do
  name="$(basename "$src")"
  dest="$DEST_DIR/$name"

  echo "Generated: $dest (from $src)"
done

if $IS_GIT_REPO; then
  git add "$DEST_DIR" >/dev/null 2>&1 || true
fi

echo
echo "Done."
