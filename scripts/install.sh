#!/usr/bin/env bash
# install.sh: install skills from this repo into Claude Code, Codex or Hermes.
#
# Usage:
#   ./scripts/install.sh <agent> [skill ...]     agent = claude | codex | hermes | all
#   ./scripts/install.sh --list                  list every skill
#   ./scripts/install.sh <agent> --dest DIR ...  install somewhere else (a project folder, say)
#
# With no skill names it installs every skill. Skill folders are plain SKILL.md
# directories, so the same copy works for all three agents.
#
# Skills land in:
#   claude   ${CLAUDE_HOME:-~/.claude}/skills
#   codex    ${CODEX_HOME:-~/.codex}/skills
#   hermes   ${HERMES_HOME:-~/.hermes}/skills
# On Windows, run this in Git Bash, or use install.ps1 in PowerShell.

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SKILLS_SRC="$REPO_ROOT/skills"

usage() { sed -n '2,15p' "$0" | sed 's/^# \{0,1\}//'; }

if [ $# -lt 1 ]; then usage; exit 1; fi

if [ "$1" = "--list" ]; then
  ls "$SKILLS_SRC"
  exit 0
fi

AGENT="$1"; shift
DEST=""
NAMES=()
while [ $# -gt 0 ]; do
  case "$1" in
    --dest) DEST="${2:?--dest needs a folder}"; shift 2 ;;
    *) NAMES+=("$1"); shift ;;
  esac
done

dest_for() {
  case "$1" in
    claude) echo "${CLAUDE_HOME:-$HOME/.claude}/skills" ;;
    codex)  echo "${CODEX_HOME:-$HOME/.codex}/skills" ;;
    hermes) echo "${HERMES_HOME:-$HOME/.hermes}/skills" ;;
    *) echo "Unknown agent: $1 (use claude, codex, hermes or all)" >&2; exit 1 ;;
  esac
}

if [ ${#NAMES[@]} -eq 0 ]; then
  for d in "$SKILLS_SRC"/*/; do NAMES+=("$(basename "$d")"); done
fi

for n in "${NAMES[@]}"; do
  [ -f "$SKILLS_SRC/$n/SKILL.md" ] || { echo "No such skill: $n (see --list)" >&2; exit 1; }
done

install_to() {
  local target="$1"
  mkdir -p "$target"
  for n in "${NAMES[@]}"; do
    rm -rf "${target:?}/$n"
    cp -r "$SKILLS_SRC/$n" "$target/$n"
  done
  echo "Installed ${#NAMES[@]} skill(s) to $target"
}

if [ "$AGENT" = "all" ]; then
  [ -z "$DEST" ] || { echo "--dest cannot be combined with 'all'" >&2; exit 1; }
  for a in claude codex hermes; do install_to "$(dest_for "$a")"; done
else
  install_to "${DEST:-$(dest_for "$AGENT")}"
fi

echo "Start a new session in your agent so it reloads its skill list."
