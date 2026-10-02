#!/usr/bin/env bash
# Keeps a bootable clone of the Pi's NVMe on a USB SSD (the "spare boot drive").
# docs/pi-hosting.md, "Spare boot drive", has the why, the limits and the recovery steps.
#
#   sudo scripts/pi/spare-clone.sh init /dev/disk/by-id/usb-...   once: partition, format, first clone, timer
#   sudo scripts/pi/spare-clone.sh                                 re-clone now (what the timer runs)
#   scripts/pi/spare-clone.sh status                               age of the last good clone
#
# The drive is named by its /dev/disk/by-id path (recorded in /etc/default/lanna-spare),
# never /dev/sda, so a different drive that happens to enumerate first is not touched.
# The timer path NEVER initialises or erases a disk: it runs `rpi-clone -u`, which
# aborts if the partition layout does not already match. Only `init` erases, and only
# after you retype the device name.
#
# Layout written by init: p1 512M FAT32 (boot), p2 ROOT_SIZE ext4 (root, default 64G),
# the rest left unpartitioned for a data partition (docs/backlog.md, archive mirror).
set -euo pipefail

CONF=/etc/default/lanna-spare
STATE_DIR=/var/lib/lanna-spare
STATUS="$STATE_DIR/status.json"
ROOT_SIZE="${ROOT_SIZE:-64G}"
MAX_AGE_DAYS="${MAX_AGE_DAYS:-9}"
# Disposable or rebuildable data not worth copying (the photo cache is documented as safe to delete).
EXCLUDES=(--exclude='/home/*/photo-cache' --exclude='/home/*/.cache' --exclude='/home/*/.npm/_cacache')

die() { echo "spare-clone: $*" >&2; exit 1; }
need_root() { [[ $EUID -eq 0 ]] || die "run with sudo"; }

write_status() { # result detail
  mkdir -p "$STATE_DIR"
  local now; now="$(date -u +%FT%TZ)"
  local last_ok=""
  [[ -f "$STATUS" ]] && last_ok="$(sed -n 's/.*"lastSuccess": *"\([^"]*\)".*/\1/p' "$STATUS")"
  [[ "$1" == ok ]] && last_ok="$now"
  printf '{"lastAttempt":"%s","lastSuccess":"%s","result":"%s","detail":"%s"}\n' \
    "$now" "$last_ok" "$1" "${2//\"/\'}" > "$STATUS.tmp"
  mv "$STATUS.tmp" "$STATUS"
  chmod 0644 "$STATUS"
}

resolve_disk() { # prints /dev/sdX for the configured by-id path, or fails
  # shellcheck disable=SC1090
  source "$CONF" 2>/dev/null || die "$CONF missing: run 'init' first"
  [[ -n "${SPARE_BY_ID:-}" ]] || die "SPARE_BY_ID is empty in $CONF"
  [[ -e "$SPARE_BY_ID" ]] || return 3   # not plugged in
  readlink -f "$SPARE_BY_ID"
}

root_disk() { lsblk -no PKNAME "$(findmnt -no SOURCE /)" | head -1; }

verify_boot() { # $1 = disk: the clone's cmdline.txt must name the clone's own root partition
  local disk="$1" mnt; mnt="$(mktemp -d)"
  mount -o ro "${disk}1" "$mnt"
  local want got
  want="$(blkid -s PARTUUID -o value "${disk}2")"
  got="$(sed -n 's/.*root=PARTUUID=\([^ ]*\).*/\1/p' "$mnt/cmdline.txt")"
  umount "$mnt"; rmdir "$mnt"
  [[ -n "$want" && "$want" == "$got" ]] || die "boot check failed: cmdline.txt root=PARTUUID=$got, clone's root is $want"
}

do_sync() {
  need_root
  local disk rc=0
  disk="$(resolve_disk)" || rc=$?
  if [[ $rc -ne 0 ]]; then
    [[ $rc -eq 3 ]] && { write_status absent "spare drive not plugged in"; die "spare drive not found at $SPARE_BY_ID"; }
    exit "$rc"
  fi
  [[ "$disk" != "/dev/$(root_disk)" ]] || die "refusing: $disk is the disk the Pi booted from"
  command -v rpi-clone >/dev/null || die "rpi-clone is not installed"
  echo "== cloning $(findmnt -no SOURCE /) onto $disk"
  if ! rpi-clone -u -q "${EXCLUDES[@]}" "$(basename "$disk")"; then
    write_status failed "rpi-clone exited non-zero (layout changed? run: rpi-clone $(basename "$disk"), read the prompt)"
    die "rpi-clone failed"
  fi
  if ! verify_boot "$disk"; then
    write_status failed "clone finished but the boot partition does not point at the clone's root"
    exit 1
  fi
  write_status ok "$disk"
  echo "== done: $(cat "$STATUS")"
}

do_status() {
  [[ -f "$STATUS" ]] || die "no clone has run yet ($STATUS missing)"
  cat "$STATUS"
  local ok age
  ok="$(sed -n 's/.*"lastSuccess": *"\([^"]*\)".*/\1/p' "$STATUS")"
  [[ -n "$ok" ]] || die "no successful clone on record"
  age=$(( ( $(date +%s) - $(date -d "$ok" +%s) ) / 86400 ))
  echo "last good clone: $age day(s) ago (limit $MAX_AGE_DAYS)"
  [[ $age -le $MAX_AGE_DAYS ]] || exit 2
}

do_init() {
  need_root
  local byid="${1:-}"
  [[ "$byid" == /dev/disk/by-id/* && -e "$byid" ]] || die "usage: init /dev/disk/by-id/usb-... (ls -l /dev/disk/by-id/ to find it)"
  local disk; disk="$(readlink -f "$byid")"
  [[ "$disk" != "/dev/$(root_disk)" ]] || die "refusing: $disk is the disk the Pi booted from"
  [[ "$(lsblk -dno TRAN "$disk")" == usb ]] || die "$disk is not a USB disk"
  if lsblk -no MOUNTPOINTS "$disk" | grep -q .; then die "$disk has mounted partitions; unmount them first"; fi
  command -v rpi-clone >/dev/null || die "rpi-clone is not installed (github.com/geerlingguy/rpi-clone)"
  lsblk -o NAME,SIZE,MODEL,TRAN,FSTYPE,LABEL "$disk"
  echo
  echo "This ERASES $disk ($byid)."
  read -r -p "Type the device name ($(basename "$disk")) to continue: " ans
  [[ "$ans" == "$(basename "$disk")" ]] || die "not confirmed"

  # A drive that cannot write is worth finding out about now, not on recovery day.
  echo "== write speed check (256 MB at the end of the disk)"
  local seek=$(( $(blockdev --getsz "$disk") / 2048 - 300 ))
  local t; t="$(date +%s)"
  dd if=/dev/zero of="$disk" bs=1M count=256 seek="$seek" oflag=direct status=none conv=fsync \
    || die "write test failed"
  t=$(( $(date +%s) - t ))
  echo "256 MB in ${t}s"
  [[ $t -le 30 ]] || die "that is under 9 MB/s; this drive is too slow to be a spare (see docs/pi-hosting.md, 'The first drive')"

  echo "== partitioning"
  wipefs -a "$disk" >/dev/null
  printf 'label: dos\n,512M,c\n,%s,83\n' "$ROOT_SIZE" | sfdisk --quiet "$disk"
  partprobe "$disk"; udevadm settle
  mkfs.vfat -F 32 -n bootfs "${disk}1" >/dev/null
  mkfs.ext4 -q -L rootfs-usb "${disk}2"

  mkdir -p /etc/default
  printf '# written by scripts/pi/spare-clone.sh init\nSPARE_BY_ID=%q\n' "$byid" > "$CONF"
  do_sync
  install_timer
  echo "== init done. The boot test (docs/pi-hosting.md) is still to do."
}

install_timer() {
  local repo user; repo="$(cd "$(dirname "$0")/../.." && pwd)"
  sed "s|__REPO__|$repo|g" "$repo/scripts/pi/spare-clone.service" > /etc/systemd/system/spare-clone.service
  cp "$repo/scripts/pi/spare-clone.timer" /etc/systemd/system/spare-clone.timer
  systemctl daemon-reload
  systemctl enable --now spare-clone.timer
  systemctl list-timers spare-clone.timer --no-pager
}

case "${1:-sync}" in
  init) shift; do_init "$@" ;;
  sync) do_sync ;;
  status) do_status ;;
  install-timer) need_root; install_timer ;;
  *) die "usage: $0 [init <by-id path> | sync | status | install-timer]" ;;
esac
