Write-Host "Starting extraction of AppImage from electron-builder-lab image..."

# 1. Create a container from the image without running it (so we don't wait for a command)
$containerId = docker create electron-builder-lab
if (-not $?) {
    Write-Error "Failed to create container"
    exit 1
}

Write-Host "Created container: $containerId"

# 2. Check the contents of the dist folder to be sure
Write-Host "Listing contents of /app/dist in the container..."
docker run --rm electron-builder-lab ls -la /app/dist

# 3. Copy the AppImage from the container to the local bin directory
$dest = "..\bin\secure-exam-browser.AppImage"
Write-Host "Copying from container to $dest..."
# Note: we are trying to find the AppImage filename first, since it might be slightly different.
# For now, let's just copy everything that ends with .AppImage.
# Actually docker cp doesn't support wildcards.
docker cp "${containerId}:/app/dist/SecureExamBrowser-1.0.0.AppImage" $dest

if ($?) {
    Write-Host "Successfully copied the AppImage!"
} else {
    Write-Error "Failed to copy the file. Maybe the name is different?"
}

# 4. Remove the temporary container
docker rm $containerId
Write-Host "Cleanup complete."
