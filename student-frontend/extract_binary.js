const { execSync } = require('child_process');
const path = require('path');

try {
    console.log('Running Electron build inside Docker...');
    // We don't need a name here, we'll just get the container ID
    const containerId = execSync('docker run -d electron-builder-lab').toString().trim();

    console.log(`Container started: ${containerId}`);
    console.log('Waiting for build to finish...');

    execSync(`docker wait ${containerId}`, { stdio: 'inherit' });

    console.log('Extraction starting...');
    // The AppImage filename is SecureExamBrowser-1.0.0.AppImage
    const src = `${containerId}:/app/dist/SecureExamBrowser-1.0.0.AppImage`;
    const dest = path.resolve(__dirname, '..', 'bin', 'secure-exam-browser.AppImage');

    execSync(`docker cp ${src} "${dest}"`);
    console.log(`Successfully copied to: ${dest}`);

    // Cleanup
    execSync(`docker rm ${containerId}`);
    console.log('Cleanup complete.');
} catch (err) {
    console.error('Build/Extraction failed:', err.message);
    process.exit(1);
}
