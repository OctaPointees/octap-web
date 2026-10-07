$ErrorActionPreference = 'Stop'
$repoRoot = (Resolve-Path -LiteralPath $PSScriptRoot).Path
$pending = [System.Collections.Generic.Stack[string]]::new()
$pending.Push($repoRoot)

while ($pending.Count -gt 0) {
    $current = $pending.Pop()

    foreach ($directory in Get-ChildItem -LiteralPath $current -Directory -Force) {
        if ($directory.Name -eq 'node_modules') {
            $resolved = (Resolve-Path -LiteralPath $directory.FullName).Path
            if (-not $resolved.StartsWith($repoRoot + [System.IO.Path]::DirectorySeparatorChar, [System.StringComparison]::OrdinalIgnoreCase)) {
                throw "Refusing to remove a path outside the repository: $resolved"
            }

            Write-Host "Removing $resolved"
            Remove-Item -LiteralPath $resolved -Recurse -Force
            continue
        }

        $pending.Push($directory.FullName)
    }
}

Push-Location $repoRoot
try {
    npm install
    $installExitCode = $LASTEXITCODE
} finally {
    Pop-Location
}

exit $installExitCode
