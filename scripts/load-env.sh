#!/usr/bin/env bash

SECRET_FILE="${SECRET_FILE:-.secret}"

if [[ ! -f "$SECRET_FILE" ]]; then
    printf '\nERROR: %s is missing.\n' "$SECRET_FILE" >&2
    return 1 2>/dev/null || exit 1
fi

set -a
source "$SECRET_FILE"
set +a

if [[ -z "${POSTGRES_USER:-}" ]]; then
    printf '\nERROR: POSTGRES_USER is missing from %s.\n' "$SECRET_FILE" >&2
    return 1 2>/dev/null || exit 1
fi

if [[ -z "${POSTGRES_DB:-}" ]]; then
    printf '\nERROR: POSTGRES_DB is missing from %s.\n' "$SECRET_FILE" >&2
    return 1 2>/dev/null || exit 1
fi