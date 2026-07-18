import { Presentation, Handout } from "./actions"
import { I18nManager, i18n_messages } from "./i18n";

const setupView = document.getElementById("setup");
const form = document.getElementsByTagName("form")[0];
const slideshowContainer = document.getElementById("slideshow-container");
let controller = null;

/**
 * Retrieves the label element associated with an input element.
 * @param {HTMLElement} inputElement - The input element to find the label for.
 * @returns {HTMLElement|null} - The associated label element, or null if not found.
 */
function getAssociatedLabel(inputElement) {
	if (!inputElement || !(inputElement instanceof HTMLInputElement)) {
		return null;
	}

	// Method 1: Using 'for' attribute and input id
	const labelByFor = document.querySelector(`label[for="${inputElement.id}"]`);
	if (labelByFor) return labelByFor;

	// Method 2: Using parentElement (label wraps input)
	const labelByParent = inputElement.closest('label') || inputElement.parentElement?.closest('label');
	if (labelByParent) return labelByParent;

	// Method 3: Using previousElementSibling (label is before input)
	const labelBySibling = inputElement.previousElementSibling;
	if (labelBySibling && labelBySibling.tagName === 'LABEL') return labelBySibling;

	// Method 4: Using aria-labelledby
	const ariaLabelledBy = inputElement.getAttribute('aria-labelledby');
	if (ariaLabelledBy) {
		const labelId = ariaLabelledBy.split(' '); // Handle multiple IDs
		const labelByAria = document.getElementById(labelId);
		if (labelByAria) return labelByAria;
	}

	// Method 5: Using labels property (for form-associated labels)
	if (inputElement.labels && inputElement.labels.length > 0) {
		return inputElement.labels;
	}

	return null;
}

class BrowserNotSupported extends Error {
	constructor(message, options) {
		super(message, options);
	}
}

class FormInvalid extends Error {
	constructor(message, options) {
		super(message, options);
	}
}

const ErrorCauseCodes = {
	HTMLSanitizingNotSupported: "HTMLSanitizingNotSupported",
	HTMLFileMustBeProvided: "HTMLFileMustBeProvided",
	CSSFileMustBeProvided: "CSSFileMustBeProvided"
}

const i18n_manager = new I18nManager(i18n_messages);



class HTMLResourceController {

	htmlInputQuery = "input[type=file][accept*='html']";
	cssInputQuery = "input[type=file][accept*='css']";

	htmlTemplateQuery = "template[data-role='html-content']";
	cssTemplateQuery = "template[data-role='css-content']";

	/**
	 * Obtains HTML resources by reading from form or by other means, reads provided input and calls the registered actions ensuring they get the data from the form they need.
	 * @param {HTMLFormElement} form 
	 */
	constructor(form) {
		this.form = form;
	}

	/**
	 * Adds an action
	 * @param {HTMLInputElement | HTMLButtonElement} button 
	 * @param {Function} action function receiving the arguments: sandboxed version of html content and cssFiles[]
	 * @returns {Function} function to remove action
	 */
	registerAction(button, action) {
		const actionBound = action.bind(null);
		
		async function preAction() {
			const formContent = await this.fileContents();
			const htmlContentContainer = this.isolateHTML(formContent.html[0]);

			formContent.html = [];
			
			actionBound(button, htmlContentContainer, formContent);
		}
		const preActionBound = preAction.bind(this);
		button.addEventListener("click", preActionBound);

		return () => button.removeEventListener("click", preActionBound);
	}

	async getHtmlFiles() {
		const htmlFiles = this.form.querySelector(this.htmlInputQuery) || document.body.querySelectorAll(this.htmlTemplateQuery);

		if (htmlFiles.files !== undefined) {
			if (htmlFiles.files.length === 0 || htmlFiles.files.item(0).type !== "text/html") {
				throw new FormInvalid("HTML file must be provided.", {
					cause: { code: "HTMLFileMustBeProvided" },
				});
			}
			return [await this.readFile(htmlFiles.files.item(0))];
		}

		return [htmlFiles.item(0).innerHTML];
	}

	async getCssFiles() {
		const cssInput = this.form.querySelector(this.cssInputQuery) || document.body.querySelectorAll(this.cssTemplateQuery);
		const cssFiles = [];

		if (cssInput.files !== undefined) {
			for (const file of cssInput.files) {
				if (file.type !== "text/css") {
					throw new FormInvalid("CSS file must be provided.", {
						cause: { code: "CSSFileMustBeProvided" },
					});
				}
				cssFiles.push(await this.readFile(file));
			}
			
			return cssFiles;
		}
		
		return Array.from(cssInput.values()).map((styleElem) => styleElem.textContent)
	}

	/**
	 * Retrieve and validate file contents.
	 * @returns {Promise<string[]>}
	 */
	async fileContents() {
		return {
			html: await this.getHtmlFiles(),
			css: await this.getCssFiles()
		};
	}

	/**
	 * Read a file as text.
	 * @param {File} file
	 * @returns {Promise<string>}
	 */
	readFile(file) {
		return new Promise((resolve) => {
			const reader = new FileReader();
			reader.addEventListener("load", () => resolve(reader.result));
			reader.readAsText(file, "utf-8");
		});
	}

	/**
	 * Sanitize HTML content.
	 * @param {string} htmlContent
	 * @returns {HTMLDivElement}
	 */
	isolateHTML(htmlContent) {
		const noContainer = document.createElement("div");
		let customSanitizer;

		try {
			customSanitizer = new Sanitizer({
				attributes: ["class", "lang", "src", "href", "width", "height"],
				dataAttributes: true,
			});
		} catch (error) {
			throw new BrowserNotSupported(
				"Browser does not support sanitizing HTML input.",
				{ cause: { code: "HTMLSanitizingNotSupported" } }
			);
		}

		noContainer.setHTML(htmlContent, { sanitizer: customSanitizer });
		return noContainer;
	}
}

function onSuccess() {
	setupView.setAttribute("hidden", "true");

	// We need I18N to work in the shadow DOM too as we manage the messages on the helper slide.
	new I18nManager(i18n_messages, slideshowContainer.shadowRoot);
}

/**
 * 
 * @param {Error} reason 
 */
function onFailure(reason) {
	console.error(reason);
	alert(reason);
}

const appInstance = new HTMLResourceController(form, slideshowContainer);

const presentationAction = new Presentation(
	form,
	slideshowContainer,
	onSuccess,
	onFailure
);
appInstance.registerAction(presentationAction.openBtn, presentationAction.openAsPresentation.bind(presentationAction))

const handoutAction = new Handout(
	form,
	slideshowContainer,
	onSuccess,
	onFailure
);
appInstance.registerAction(handoutAction.openBtn, handoutAction.openAsHandout.bind(handoutAction));
