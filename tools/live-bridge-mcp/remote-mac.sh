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
printf '%s\n' "$host" | grep -Eq '^([A-Za-z0-9_][A-Za-z0-9_.-]*@)?[A-Za-z0-9_][A-Za-z0-9_.-]*$' || fail 'Invalid SSH host.'
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
tunnel='' reader=''
cleanup() {
  trap - EXIT HUP INT TERM
  if [ -n "$reader" ]; then kill "$reader" 2>/dev/null || :; wait "$reader" 2>/dev/null || :; fi
  if [ -n "$tunnel" ]; then kill "$tunnel" 2>/dev/null || :; wait "$tunnel" 2>/dev/null || :; fi
  rm -rf -- "$work"
}
trap cleanup EXIT
trap 'exit 1' HUP INT TERM
chmod 700 "$work" || fail 'Could not secure temporary directory.'
socket=$work/control
# Honor the user's authentication config, but suppress its unrelated forwards.
# The requested forward is installed later over the private control socket.
ssh -n -N -M -S "$socket" -o StrictHostKeyChecking=yes -o ClearAllForwardings=yes -o ForwardAgent=no -o ForwardX11=no -o PermitLocalCommand=no -o RemoteCommand=none -o Tunnel=no -o ForkAfterAuthentication=no -o ControlPersist=no "$host" &
tunnel=$!
ready=no
attempt=0
while [ "$attempt" -lt 1200 ]; do
  attempt=$((attempt + 1))
  kill -0 "$tunnel" 2>/dev/null || fail 'SSH tunnel failed; check authentication, host key, and local port.'
  if [ -S "$socket" ] && ssh -F /dev/null -S "$socket" -O check "$host" >/dev/null 2>&1; then ready=yes; break; fi
  sleep 0.1
done
[ "$ready" = yes ] || fail 'SSH connection did not become ready.'
# -F /dev/null here avoids reintroducing config forwards into the control request.
ssh -F /dev/null -S "$socket" -o ExitOnForwardFailure=yes -O forward -L "127.0.0.1:$port:127.0.0.1:$port" "$host" || fail 'SSH forwarding failed; the local port may be occupied.'
ssh -F /dev/null -S "$socket" -o BatchMode=yes -o StrictHostKeyChecking=yes -o ClearAllForwardings=yes "$host" "cat $app" > "$work/index.html" || fail 'Could not copy generated app over SSH.'
[ -s "$work/index.html" ] || fail 'Generated app was empty.'
chmod 600 "$work/index.html" || fail 'Could not secure local app.'
open "$work/index.html" || fail 'Could not open the generated app.'
printf '\nExperimental: disposable documents only. Port: %s\n' "$port"
printf 'In Pointliner open File > Live bridge. Press Enter to display the pairing secret in this terminal: '
# Read from a duplicated terminal descriptor while the foreground monitors SSH.
# Only the yes/no outcome reaches disk, never what the user typed.
exec 3<&0
( if IFS= read -r answer <&3 && [ -z "$answer" ]; then : > "$work/confirmed"; else : > "$work/canceled"; fi ) <&3 &
reader=$!
while :; do
  kill -0 "$tunnel" 2>/dev/null || fail 'SSH tunnel ended before pairing.'
  [ ! -e "$work/canceled" ] || fail 'Pairing canceled.'
  [ ! -e "$work/confirmed" ] || break
  kill -0 "$reader" 2>/dev/null || fail 'Pairing canceled.'
  sleep 0.1
done
wait "$reader" || fail 'Pairing canceled.'
reader=''
exec 3<&-
kill -0 "$tunnel" 2>/dev/null || fail 'SSH tunnel ended before pairing.'
# Explicit user action; no secret is passed as an argument or stored locally.
# The terminal/scrollback can retain it: warn before this command in the guide.
ssh -F /dev/null -S "$socket" -o BatchMode=yes -o StrictHostKeyChecking=yes -o ClearAllForwardings=yes "$host" "cat $pairing" || fail 'Could not retrieve pairing secret.'
printf '\nPaste the secret into Pointliner; do not send it to the agent. Keep this terminal open.\n'
printf 'Press Ctrl-C to disconnect and remove the local temporary app.\n'
if wait "$tunnel"; then
  tunnel=''; fail 'SSH tunnel ended.'
else
  tunnel=''; fail 'SSH tunnel ended unexpectedly.'
fi
