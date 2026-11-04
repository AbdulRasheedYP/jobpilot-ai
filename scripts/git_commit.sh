#!/usr/bin/env bash
# scripts/git_commit.sh
# Helper to commit with specific realistic author and committer dates.

set -euo pipefail

if [ "$#" -lt 2 ]; then
  echo "Usage: $0 \"YYYY-MM-DD HH:MM:SS +0530\" \"commit message\""
  exit 1
fi

COMMIT_DATE="$1"
COMMIT_MSG="$2"

GIT_AUTHOR_DATE="$COMMIT_DATE" GIT_COMMITTER_DATE="$COMMIT_DATE" git commit -m "$COMMIT_MSG"
echo "Committed: '$COMMIT_MSG' with date $COMMIT_DATE"
