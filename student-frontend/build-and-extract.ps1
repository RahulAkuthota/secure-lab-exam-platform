Write-Host "Building Docker Image for Electron AppImage..."
docker build -t electron-builder-lab -f Dockerfile.build-electron .
if (-not $?) { 
    Write-Error "Docker build failed"
    exit 1 
}

Write-Host "Creating container from image..."
$containerId = (docker create electron-builder-lab).Trim()
if (-not $?) { 
    Write-Error "Container creation failed"
    exit 1 
}

Write-Host "Copying AppImage out of the container..."
# Copy forcing replacement
docker cp "${containerId}:/app/dist/SecureExamBrowser-1.0.0.AppImage" "..\bin\secure-exam-browser.AppImage"
if ($?) {
    Write-Host "Successfully copied AppImage to bin folder!"
} else {
    Write-Host "Failed to copy AppImage. Listing contents of /app/dist/ just in case:"
    docker run --rm electron-builder-lab ls -la /app/dist
}

Write-Host "Cleaning up container..."
docker rm $containerId
Write-Host "Done."
