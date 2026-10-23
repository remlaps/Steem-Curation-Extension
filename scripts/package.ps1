# Builds the Chrome Web Store .zip for this extension.
#
# The archive contains exactly the files declared in manifest.json (plus
# manifest.json itself): the service worker, every content-script .js/.css file,
# and the declared icons. Nothing else is included (no .git, checklists/,
# Markdown docs, node_modules, or previous archives), so the output is
# deterministic.
#
# Usage (from the repo root or anywhere):
#   powershell -ExecutionPolicy Bypass -File scripts/package.ps1
#   powershell -ExecutionPolicy Bypass -File scripts/package.ps1 -OutputDir dist

[CmdletBinding()]
param(
    [string]$OutputDir
)

$ErrorActionPreference = 'Stop'

$repoRoot = Split-Path -Parent $PSScriptRoot
if (-not $OutputDir) { $OutputDir = $repoRoot }
if (-not (Test-Path $OutputDir)) { New-Item -ItemType Directory -Path $OutputDir | Out-Null }
$OutputDir = (Resolve-Path $OutputDir).Path

$manifestPath = Join-Path $repoRoot 'manifest.json'
if (-not (Test-Path $manifestPath)) { throw "manifest.json not found at $manifestPath" }
$manifest = Get-Content $manifestPath -Raw | ConvertFrom-Json

$version = $manifest.version
if (-not $version) { throw "manifest.json does not declare a 'version'." }
$zipPath = Join-Path $OutputDir "steem-curation-extension-$version.zip"

# Collect the files to package, driven entirely by the manifest.
$files = New-Object System.Collections.Generic.List[string]
$files.Add('manifest.json')

if ($manifest.background -and $manifest.background.service_worker) {
    $files.Add($manifest.background.service_worker)
}

foreach ($cs in @($manifest.content_scripts)) {
    foreach ($f in @($cs.js))  { if ($f) { $files.Add($f) } }
    foreach ($f in @($cs.css)) { if ($f) { $files.Add($f) } }
}

if ($manifest.icons) {
    foreach ($prop in $manifest.icons.PSObject.Properties) {
        if ($prop.Value) { $files.Add([string]$prop.Value) }
    }
}

$files = @($files | Select-Object -Unique)

$separator = [string][System.IO.Path]::DirectorySeparatorChar
$staging = Join-Path ([System.IO.Path]::GetTempPath()) ("sce-package-" + [Guid]::NewGuid().ToString('N'))
New-Item -ItemType Directory -Path $staging | Out-Null

try {
    foreach ($rel in $files) {
        $relative = $rel -replace '[\\/]', $separator
        $source = Join-Path $repoRoot $relative
        if (-not (Test-Path $source)) { throw "File referenced by manifest.json is missing: $rel" }

        $destination = Join-Path $staging $relative
        $destinationDir = Split-Path -Parent $destination
        if (-not (Test-Path $destinationDir)) {
            New-Item -ItemType Directory -Path $destinationDir -Force | Out-Null
        }
        Copy-Item -LiteralPath $source -Destination $destination
    }

    if (Test-Path $zipPath) { Remove-Item -LiteralPath $zipPath -Force }
    Compress-Archive -Path (Join-Path $staging '*') -DestinationPath $zipPath -CompressionLevel Optimal
    Write-Host ("Packaged {0} files -> {1}" -f $files.Count, $zipPath)
}
finally {
    Remove-Item -Recurse -Force $staging -ErrorAction SilentlyContinue
}
