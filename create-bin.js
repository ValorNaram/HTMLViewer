const fs = require('fs');
const path = require('path');

// Read the content of the JS bundle file
const bundlePath = path.join(__dirname, 'dist', 'HTMLSlideshow-bundle.js');
const bundleContent = fs.readFileSync(bundlePath, 'utf8');

// Read the content of the CSS file
const cssPath = path.join(__dirname, 'app', 'index.css');
const cssContent = fs.readFileSync(cssPath, 'utf8');

// Read the content of the index.html file
const indexPath = path.join(__dirname, "dist", "index.html");
const destinationPath = path.join(__dirname, "bin", "HTMLViewer.html");
let indexContent = fs.readFileSync(indexPath, 'utf8');

// Inject the CSS content into the index.html file within a style block in the head section
if (indexContent.indexOf("<style>") == -1) {
  const styleTag = `<style>${cssContent}</style>`;
  indexContent = indexContent.replace('</head>', styleTag + '</head>');
}

// Inject the JS bundle content into the index.html file within a script defer block
if (indexContent.indexOf("<script defer") == -1) {
  const scriptTag = `<script defer>${bundleContent.replace(new RegExp("//.+?\.map", 'gm'), '')}</script>`;
  indexContent = indexContent.replace('</body>', scriptTag + '</body>');
}
indexContent = indexContent.replace(new RegExp('<link .*?rel="stylesheet" .+?/>', 'gm'), '');

fs.mkdirSync(path.dirname(destinationPath), { recursive: true})

// Write the updated content back to the index.html file
fs.writeFileSync(destinationPath, indexContent);