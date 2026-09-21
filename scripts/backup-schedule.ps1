# Register (or refresh) the weekly production backup in Windows Task
# Scheduler on this machine. Run once from the repo root, as the user who
# is normally signed in:
#
#   powershell -ExecutionPolicy Bypass -File scripts\backup-schedule.ps1
#   powershell -ExecutionPolicy Bypass -File scripts\backup-schedule.ps1 -Remove
#
# The task runs `node scripts/backup.mjs --env production` every Sunday at
# 03:00, appending to backup.log (gitignored) in the repo. If the machine
# was off or asleep at the time it runs as soon as it is next awake and on
# a network. It runs only while the user is logged on — a task that runs
# without a session needs the Windows password stored with it, which is
# not worth it for a laptop that is used most days. Check on it with:
#
#   Get-ScheduledTaskInfo -TaskName "Lanna Care production backup"
#
# LastTaskResult 0 means the last run succeeded; anything else, read
# backup.log.
param([switch]$Remove)

$ErrorActionPreference = "Stop"
$taskName = "Lanna Care production backup"
$repo = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path

if ($Remove) {
    Unregister-ScheduledTask -TaskName $taskName -Confirm:$false
    Write-Host "Removed task '$taskName'."
    exit 0
}

$node = (Get-Command node.exe).Source
if (-not (Test-Path (Join-Path $repo ".env.deploy.production"))) {
    throw ".env.deploy.production is missing in $repo — the task would fail every week."
}

# cmd.exe does the redirect; node itself has no --log flag.
$action = New-ScheduledTaskAction -Execute "cmd.exe" `
    -Argument "/c `"`"$node`" scripts\backup.mjs --env production >> backup.log 2>&1`"" `
    -WorkingDirectory $repo
$trigger = New-ScheduledTaskTrigger -Weekly -DaysOfWeek Sunday -At 3am
$settings = New-ScheduledTaskSettingsSet -StartWhenAvailable -RunOnlyIfNetworkAvailable `
    -ExecutionTimeLimit (New-TimeSpan -Hours 1) -MultipleInstances IgnoreNew
$principal = New-ScheduledTaskPrincipal -UserId "$env:USERDOMAIN\$env:USERNAME" -LogonType Interactive

Register-ScheduledTask -TaskName $taskName -Action $action -Trigger $trigger `
    -Settings $settings -Principal $principal -Force | Out-Null

Write-Host "Registered '$taskName': Sundays 03:00, node from $node, working dir $repo."
Write-Host "Try it now with:  Start-ScheduledTask -TaskName '$taskName'"
