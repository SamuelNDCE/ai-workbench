#!/usr/bin/env bash
# install-group.sh: install every skill in one named bundle at once.
#
# Usage:
#   ./scripts/install-group.sh "<bundle name>" [destination]
#
# Examples:
#   ./scripts/install-group.sh "personal workflow ops"
#   ./scripts/install-group.sh skill-library-maintenance
#   ./scripts/install-group.sh "prompt input" /path/to/project/.claude/skills
#
# Bundle name matching is case-insensitive and space/hyphen/ampersand-tolerant,
# so "Repo & Secret Hygiene", "repo-secret-hygiene", and "repo and secret
# hygiene" all resolve to the same bundle. Destination defaults to
# ./.claude/skills relative to wherever you run this from.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(dirname "$SCRIPT_DIR")"
DEST="${2:-.claude/skills}"

normalize() {
  echo "$1" | tr '[:upper:]' '[:lower:]' | sed -E 's/&/ and /g; s/[^a-z0-9]+/-/g; s/^-+//; s/-+$//'
}

bundle_skills() {
  case "$(normalize "$1")" in
    prompt-input)
      echo "braindump braindump-auto superbraindump dictation-garble-catcher" ;;
    multi-session-task-discipline|multi-session-task|verification-and-trust-discipline|verification-trust-discipline|verification-trust|trust-discipline)
      echo "large-task-session-split worktree-task-pack-verification verify-dont-trust" ;;
    repo-and-secret-hygiene|repo-secret-hygiene|secret-hygiene)
      echo "pre-push-secret-scan full-account-security-audit public-repo-leak-retraction repo-hygiene" ;;
    windows-environment-ops|windows-ops)
      echo "zombie-process-sweep windows-shell-tool-selection windows-process-restart" ;;
    project-content-safety)
      echo "project-design-doc safe-section-deletion" ;;
    skill-library-maintenance)
      echo "skill-overlap-audit repo-index-drift-check" ;;
    everyday-workflow)
      echo "session-handoff design-review-loop capability-claim-grounding derived-figure-audit ui-change-visual-verify" ;;
    personal-workflow-ops)
      echo "personal-dashboard-style discord-todo-ops" ;;
    *)
      echo "" ;;
  esac
}

list_bundles() {
  cat <<'EOF'
Available bundles:
  prompt-input                        braindump, braindump-auto, superbraindump, dictation-garble-catcher
  multi-session-task-discipline        large-task-session-split, worktree-task-pack-verification, verify-dont-trust
  repo-and-secret-hygiene             pre-push-secret-scan, full-account-security-audit, public-repo-leak-retraction, repo-hygiene
  windows-environment-ops             zombie-process-sweep, windows-shell-tool-selection, windows-process-restart
  project-content-safety              project-design-doc, safe-section-deletion
  skill-library-maintenance           skill-overlap-audit, repo-index-drift-check
  everyday-workflow                   session-handoff, design-review-loop, capability-claim-grounding, derived-figure-audit, ui-change-visual-verify
  personal-workflow-ops               personal-dashboard-style, discord-todo-ops
EOF
}

if [ $# -lt 1 ]; then
  echo "Usage: $0 <bundle-name> [destination]"
  echo ""
  list_bundles
  exit 1
fi

SKILLS="$(bundle_skills "$1")"

if [ -z "$SKILLS" ]; then
  echo "Unknown bundle: '$1'"
  echo ""
  list_bundles
  exit 1
fi

mkdir -p "$DEST"
for s in $SKILLS; do
  cp -r "$REPO_ROOT/skills/$s" "$DEST/"
  echo "Installed: $s"
done

echo ""
echo "Bundle '$1' installed to $DEST. Restart your agent (or start a new session) to load them. For Codex or Hermes, pass their skills folder as the destination, or use install.sh."
