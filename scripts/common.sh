#!/usr/bin/env bash

# make sure the script stops as soon as something goes wrong
set -Eeuo pipefail

log() {
	printf '\n==> %s\n' "$*"
}

die() {
	printf '\nERROR: %s\n' "$*" >&2
	exit 1
}

require_docker() {
	command -v docker >/dev/null 2>&1 ||
		die "Docker is not installed."

	docker compose version >/dev/null 2>&1 ||
		die "Docker Compose is not available."

	docker info >/dev/null 2>&1 ||
		die "Docker daemon is not running or is not accessible."
}

require_file() {
	local file="$1"

	[[ -f "$file" ]] ||
		die "Required file '$file' not found."

	[[ -r "$file" ]] ||
		die "Required file '$file' is not readable."
}

require_var() {
	local name="$1"

	[[ -n "${!name:-}" ]] ||
		die "Required environment variable '$name' is not set."
}

require_initialized() {
	[[ -f "$VAULT_SECRETS_FILE" ]] ||
		die "Project is not initialized. Run 'make init' first."

	[[ -s "$VAULT_SECRETS_FILE" ]] ||
		die "Vault credentials file '$VAULT_SECRETS_FILE' is empty."

	local permissions
	permissions="$(stat -c '%a' "$VAULT_SECRETS_FILE")"

	[[ "$permissions" == "600" ]] ||
		die "$VAULT_SECRETS_FILE must have permissions 600 (currently $permissions)."
}