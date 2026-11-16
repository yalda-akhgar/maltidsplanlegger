# Renders the PWA PNG icons from the SVG sources using headless Microsoft Edge.
# Run from the project root:  powershell -File scripts/generate-icons.ps1
$edge = "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
$root = (Resolve-Path "$PSScriptRoot\..").Path
$targets = @(
  @{ src = "public\favicon.svg";   out = "public\pwa-192x192.png";        size = 192 },
  @{ src = "public\favicon.svg";   out = "public\pwa-512x512.png";        size = 512 },
  @{ src = "scripts\icon-full.svg"; out = "public\maskable-512x512.png";   size = 512 },
  @{ src = "scripts\icon-full.svg"; out = "public\apple-touch-icon.png";   size = 180 }
)
foreach ($t in $targets) {
  $svg = Get-Content (Join-Path $root $t.src) -Raw
  $html = "<html><body style='margin:0;background:transparent'><div style='width:$($t.size)px;height:$($t.size)px'>$($svg -replace '<svg ', "<svg width='$($t.size)' height='$($t.size)' ")</div></body></html>"
  $tmp = Join-Path $env:TEMP "icon-render.html"
  Set-Content -Path $tmp -Value $html -Encoding utf8
  & $edge --headless=new --disable-gpu --hide-scrollbars --default-background-color=00000000 `
    "--window-size=$($t.size),$($t.size)" "--screenshot=$(Join-Path $root $t.out)" "file:///$($tmp.Replace('\','/'))" 2>$null | Out-Null
  Write-Output "Created $($t.out)"
}

