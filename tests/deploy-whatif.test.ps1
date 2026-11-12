# Run with: pwsh -NoProfile -File tests/deploy-whatif.test.ps1
$ErrorActionPreference = 'Stop'
$root = Join-Path ([System.IO.Path]::GetTempPath()) ('pi-egm-whatif-test-' + [Guid]::NewGuid().ToString('N'))
$script:externalCalls = 0

# Command discovery succeeds, but executing either command is a test failure.
function global:npm {
    $script:externalCalls++
    throw 'npm must not run during -WhatIf'
}
function global:tar.exe {
    $script:externalCalls++
    throw 'tar must not run during -WhatIf'
}

function Get-Snapshot {
    @(Get-ChildItem -LiteralPath $root -Recurse -Force | Sort-Object FullName | ForEach-Object {
        $relative = $_.FullName.Substring($root.Length)
        if ($_.PSIsContainer) { "directory:$relative" }
        else { "file:${relative}:$((Get-FileHash -LiteralPath $_.FullName -Algorithm SHA256).Hash)" }
    }) -join "`n"
}

try {
    $source = Join-Path $root 'source'
    New-Item -ItemType Directory -Path $source -Force | Out-Null
    $deploy = Join-Path $source 'deploy.ps1'
    Copy-Item -LiteralPath (Join-Path $PSScriptRoot '../deploy.ps1') -Destination $deploy
    [System.IO.File]::WriteAllText((Join-Path $source 'package.json'), '{"name":"@tklu/pi-egm","private":true,"pi":{"extensions":["./index.ts"]}}')

    foreach ($case in @('missing', 'existing', 'registered', 'invalid-skills', 'invalid-json')) {
        $agent = Join-Path $root $case
        $extensions = Join-Path $agent 'extensions'
        $settings = Join-Path $agent 'settings.json'
        if ($case -ne 'missing') {
            $target = Join-Path $extensions 'pi-egm'
            New-Item -ItemType Directory -Path $target -Force | Out-Null
            [System.IO.File]::WriteAllText((Join-Path $target 'sentinel.txt'), 'original deployment')
            $json = '{"skills":["unrelated"],"custom":true}'
            if ($case -eq 'registered') {
                $json = @{ skills = @((Join-Path $target 'skills')); custom = $true } | ConvertTo-Json
            }
            if ($case -eq 'invalid-skills') { $json = '{"skills":[42]}' }
            if ($case -eq 'invalid-json') { $json = '{broken' }
            [System.IO.File]::WriteAllText($settings, $json)
        }
        $before = Get-Snapshot
        $failure = $null
        try {
            & $deploy -PiExtensionsDirectory $extensions -WhatIf
        }
        catch { $failure = $_ }
        if ((Get-Snapshot) -cne $before) { throw "Filesystem changed in case: $case" }
        if ($script:externalCalls -ne 0) { throw "External command executed in case: $case" }
        if ($case -like 'invalid-*') {
            if ($null -eq $failure) { throw "Expected validation failure in case: $case" }
            $expected = if ($case -eq 'invalid-json') { 'Could not inspect Pi settings file' } else { "Pi settings 'skills' must contain only path strings" }
            if (-not $failure.Exception.Message.Contains($expected)) { throw $failure }
        }
        elseif ($null -ne $failure) { throw $failure }
        Write-Host "PASS: $case (no filesystem changes or external commands)"
    }
}
finally {
    Remove-Item -LiteralPath $root -Recurse -Force -ErrorAction SilentlyContinue
    Remove-Item Function:\npm -ErrorAction SilentlyContinue
    Remove-Item Function:\tar.exe -ErrorAction SilentlyContinue
}
