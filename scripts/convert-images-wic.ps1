Add-Type @"
using System;
using System.IO;
using System.Windows.Media.Imaging;

public class WicImageConverter {
    public static void ConvertToPng(string inputPath, string outputPath) {
        try {
            var decoder = BitmapDecoder.Create(
                new Uri(inputPath),
                BitmapCreateOptions.PreservePixelFormat,
                BitmapCacheOption.Default
            );
            var frame = decoder.Frames[0];
            var encoder = new PngBitmapEncoder();
            encoder.Frames.Add(BitmapFrame.Create(frame));
            using (var stream = File.Create(outputPath)) {
                encoder.Save(stream);
            }
            Console.WriteLine("OK: " + outputPath);
        } catch (Exception ex) {
            Console.WriteLine("FAILED: " + inputPath + " - " + ex.Message);
        }
    }
}
"@ -ReferencedAssemblies PresentationCore,WindowsBase,System

$base = "c:\Users\Vader\Squirl\assets\images"

# Convert WebP bank logos to PNG
[WicImageConverter]::ConvertToPng("file:///$($base.Replace('\','/'))/banks/RCBC.webp",         "$base\banks\RCBC.png")
[WicImageConverter]::ConvertToPng("file:///$($base.Replace('\','/'))/banks/landbank.webp",     "$base\banks\landbank.png")
[WicImageConverter]::ConvertToPng("file:///$($base.Replace('\','/'))/banks/securitybank.webp", "$base\banks\securitybank.png")
[WicImageConverter]::ConvertToPng("file:///$($base.Replace('\','/'))/banks/unionbank.webp",    "$base\banks\unionbank.png")

# Convert AVIF YouTube Premium logo to PNG
[WicImageConverter]::ConvertToPng("file:///$($base.Replace('\','/'))/bills/youtubepremium.avif", "$base\bills\youtubepremium.png")

Write-Host "Conversion complete."
