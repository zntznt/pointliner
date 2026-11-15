#!/bin/sh
# Connect a local Mac browser to an already-running experimental session.
set -eu
LC_ALL=C; export LC_ALL
umask 077

fail() { printf '%s\n' "$*" >&2; exit 1; }
[ "$#" -eq 4 ] || fail 'Usage: remote-mac.sh user@host port app-path pairing-path'
host=$1 port=$2 app=$3 pairing=$4
# Reject controls before line-oriented validation: grep can otherwise match just one line.
case "$host" in *[![:print:]]*) fail 'Invalid SSH host.';; esac
# Only simple SSH user/host names and literal absolute generated paths; no remote shell syntax.
printf '%s\n' "$host" | grep -Eq '^([A-Za-z0-9_][A-Za-z0-9_.-]*@)?[A-Za-z0-9][A-Za-z0-9.-]*$' || fail 'Invalid SSH host.'
case "$port" in ''|*[!0-9]*|0*) fail 'Invalid port.';; esac
[ "${#port}" -le 5 ] && [ "$port" -ge 1024 ] && [ "$port" -le 65535 ] || fail 'Invalid port.'
for path in "$app" "$pairing"; do
  case "$path" in *[![:print:]]*) fail 'Invalid remote path.';; esac
  printf '%s\n' "$path" | grep -Eq '^/[A-Za-z0-9_./-]+$' || fail 'Invalid remote path.'
  case "$path/" in */../*|*/./*|*//*) fail 'Invalid remote path.';; esac
done
printf '%s\n' "$app" | grep -Eq '^/([A-Za-z0-9_.-]+/)*pointliner-mcp-[A-Za-z0-9]+/pointliner-live-[A-Za-z0-9]+/index[.]html$' || fail 'Unexpected generated app path.'
[ "$pairing" = "${app%/index.html}/pairing.txt" ] || fail 'Pairing path does not match app.'
[ -t 0 ] && [ -t 1 ] || fail 'Run this command in an interactive terminal.'

work=$(mktemp -d "${TMPDIR:-/tmp}/pointliner-remote.XXXXXXXX") || fail 'Could not create private temporary directory.'
tunnel=''
cleanup() {
  trap - EXIT HUP INT TERM
  if [ -n "$tunnel" ]; then kill "$tunnel" 2>/dev/null || :; wait "$tunnel" 2>/dev/null || :; fi
  rm -rf -- "$work"
}
trap cleanup EXIT
trap 'exit 1' HUP INT TERM
chmod 700 "$work" || fail 'Could not secure temporary directory.'
socket=$work/control
# Strict checking never accepts a new/changed host key on your behalf. Batch mode
# requires the user's existing SSH key/agent and known_hosts configuration.
ssh -F /dev/null -n -N -M -S "$socket" -o StrictHostKeyChecking=yes -o BatchMode=yes -o ExitOnForwardFailure=yes -L "127.0.0.1:$port:127.0.0.1:$port" "$host" &
tunnel=$!
ready=no
for _ in 1 2 3 4 5 6 7 8 9 10 11 12 13 14 15 16 17 18 19 20 21 22 23 24 25 26 27 28 29 30; do
  kill -0 "$tunnel" 2>/dev/null || fail 'SSH tunnel failed; check authentication, host key, and local port.'
  if [ -S "$socket" ] && ssh -F /dev/null -S "$socket" -O check "$host" >/dev/null 2>&1; then ready=yes; break; fi
  sleep 0.1
done
[ "$ready" = yes ] || fail 'SSH tunnel did not become ready.'
ssh -F /dev/null -S "$socket" -o BatchMode=yes "$host" "cat $app" > "$work/index.html" || fail 'Could not copy generated app over SSH.'
[ -s "$work/index.html" ] || fail 'Generated app was empty.'
chmod 600 "$work/index.html" || fail 'Could not secure local app.'
open "$work/index.html" || fail 'Could not open the generated app.'
printf '\nExperimental: disposable documents only. Port: %s\n' "$port"
printf 'In Pointliner open File > Live bridge. Press Enter to display the pairing secret in this terminal: '
IFS= read -r answer || fail 'Pairing canceled.'
[ -z "$answer" ] || fail 'Pairing canceled.'
# Explicit user action; no secret is passed as an argument or stored locally.
# The terminal/scrollback can retain it: warn before this command in the guide.
ssh -F /dev/null -S "$socket" -o BatchMode=yes "$host" "cat $pairing" || fail 'Could not retrieve pairing secret.'
printf '\nPaste the secret into Pointliner; do not send it to the agent. Keep this terminal open.\n'
printf 'Press Ctrl-C to disconnect and remove the local temporary app.\n'
if wait "$tunnel"; then
  tunnel=''; fail 'SSH tunnel ended.'
else
  tunnel=''; fail 'SSH tunnel ended unexpectedly.'
fi
