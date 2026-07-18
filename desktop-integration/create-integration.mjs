import fs from 'fs/promises';

/*
This script is part of the desktop integration.
1. This script generates the desktop integration bash script.
2. That bash script contains the html bundle with all dependencies needed for the HTMLSlideshow web application to run in the web browser without loading external resources.
3. Executing the bash script with a path to a .embed.html document just bakes that html document into an instance of HTMLSlideshow which is saved to a file and then opened in a web browser.
*/

// Configuration
const JS_BUNDLE_PATH = 'dist/HTMLSlideshow-bundle.js';
const CSS_BUNDLE_PATH = 'app/index.css';
const HTML_BUNDLE_PATH = 'app/index.html'

/**
 * Generates the html bundle of the HTMLSlideshow web application needed to run it without the need of loading external resources.
 */
async function prepare_html_bundle() {
	
	// Read the HTML, JS and CSS bundle files
	const [htmlBundleContent, jsBundleContent, cssBundleContent] = await Promise.all([
		fs.readFile(HTML_BUNDLE_PATH, 'utf-8'),
		fs.readFile(JS_BUNDLE_PATH, 'utf-8'),
		fs.readFile(CSS_BUNDLE_PATH, 'utf-8'),
	]);

	return htmlBundleContent
		// removing all <link> elements
		.replaceAll(new RegExp('<link.*?href.*?>', "gm"), '')
		// removing all <script> elements with src
		.replaceAll(new RegExp('<script.*?src.*?=.*?>.*?</script>', "gm"), '')
		.replaceAll('"', '\"')
		// inserting the JS bundle after the <head> element
		.replace('</head>', `<script type="module">${jsBundleContent}</script></head>`)
		// inserting the CSS bundle after the <head> element
		.replace('</head>', `<style>${cssBundleContent}</style></head>`)
		// inserting the <template> element which is being used to store the HTML document the user wants to open without it being parsed. This is being populated by the bash script.
		// .replace('<body>', '<body><template data-role="html-content" style="display:none">${embedded_html_file_content}</template>')
		// removing the label of the html document input element
		.replace(new RegExp('<label.*?data-i18n.*?input_html_label.*?>.*?</label>', "gm"), '')
		// removing the html document file input element
		.replace(new RegExp('<input.*?accept.*?=.*?html.*?/>', "gm"), '')
		.replace(new RegExp('(what_are_html_files.*?</p>)', "gm"), '$1<p data-i18n="input_html_already_baked_in" style="font-style:italic"></p>')
		.replaceAll('\\t', '')
		.replaceAll('\\n', '');
}

/**
 * Generating the bash code for the desktop integration.
 * 1. That bash script generates the HTMLSlideshow web application dynamically with the document baked in.
 * 2. It then saves the html to a fie with html extension in the temp folder.
 * @param {string} html_bundle 
 * @returns {string}
 */
function create_compile_html_viewer_shell_script(html_bundle) {
	return `#!/bin/python3
import os
import platform
import subprocess
import tempfile
import time
from pathlib import Path

def open_html_in_browser(html_content: str, timeout: int = 120) -> None:
	"""
	Create a temporary HTML file, write the provided content to it,
	open it in the default web browser, and clean up after the timeout.
	"""
	try:
		# Create a temporary file with a .html suffix
		with tempfile.NamedTemporaryFile(
			mode="w",
			suffix=".html",
			delete=False,
			encoding="utf-8"
		) as temp_file:
			temp_file.write(html_content)
			temp_file_path = temp_file.name

		# Open the file in the default web browser
		system = platform.system()
		if system == "Linux":
			subprocess.run(["xdg-open", temp_file_path], check=True)
		elif system == "Darwin":  # macOS
			subprocess.run(["open", temp_file_path], check=True)
		elif system == "Windows":
			subprocess.run(["start", temp_file_path], shell=True, check=True)
		else:
			raise OSError("Unsupported operating system.")

		print(f"Temporary HTML file created at: {temp_file_path}")
		print(f"Will close in {timeout} seconds...")
		time.sleep(timeout)

	except Exception as e:
		print(f"An error occurred: {e}")
	finally:
		# Ensure the temporary file is deleted
		if os.path.exists(temp_file_path):
			os.unlink(temp_file_path)
			print("Temporary file cleaned up.")

def generate_html(html_document: str) -> str:
	template = """${html_bundle}"""
	return template.replace('<body>', '<body><template data-role="html-content" style="display:none">' + html_document + '</template>')

if __name__ == "__main__":
	import sys
	if len(sys.argv) != 2:
		print("Usage: python3 script.py <html_file_or_content>")
		sys.exit(1)

	input_path = Path(sys.argv[1])
	open_html_in_browser(
		generate_html(
			input_path.read_text(encoding="utf-8")
		)
	)`
}

async function main() {
	fs.writeFile(
		process.argv[2],
		create_compile_html_viewer_shell_script(await prepare_html_bundle())
	)
}

// Run the main function
main();