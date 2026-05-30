Add-Type -AssemblyName System.Drawing

function Convert-ToPng {
    param(
        [string]$InputPath,
        [string]$OutputPath
    )
    try {
        $img = [System.Drawing.Image]::FromFile($InputPath)
        $bmp = New-Object System.Drawing.Bitmap($img.Width, $img.Height)
        $g = [System.Drawing.Graphics]::FromImage($bmp)
        $g.DrawImage($img, 0, 0, $img.Width, $img.Height)
        $g.Dispose()
        $img.Dispose()
        $bmp.Save($OutputPath, [System.Drawing.Imaging.ImageFormat]::Png)
        $bmp.Dispose()
        Write-Host "OK: $OutputPath"
    } catch {
        Write-Host "FAILED: $InputPath - $_"
    }
}

$base = "c:\Users\Vader\Squirl\assets\images"

# Re-encode corrupt meralco.png
Convert-ToPng -InputPath "$base\bills\meralco.png" -OutputPath "$base\bills\meralco.png"

# Convert jfif -> png
Convert-ToPng -InputPath "$base\bills\canvapro.jfif" -OutputPath "$base\bills\canvapro.png"

# Convert webp -> png
Convert-ToPng -InputPath "$base\banks\RCBC.webp" -OutputPath "$base\banks\RCBC.png"
Convert-ToPng -InputPath "$base\banks\landbank.webp" -OutputPath "$base\banks\landbank.png"
Convert-ToPng -InputPath "$base\banks\securitybank.webp" -OutputPath "$base\banks\securitybank.png"
Convert-ToPng -InputPath "$base\banks\unionbank.webp" -OutputPath "$base\banks\unionbank.png"

Write-Host "Done converting images."
