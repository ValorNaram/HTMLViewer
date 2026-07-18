export const i18n_messages = {
	app_title: "HTML Viewer",
	// app_slogan: "One document but for different occasions!",
	app_slogan: "Various occasions for one document!",
	introduction_different_representation:
		"Depending on the occasion, it may be helpful to look on content differently:",
	introduction_occasion_presentation:
		"As Slide: Speak about the topic in front of an audience.",
	introduction_occasion_handout:
		"As Handout: Read, Understand and without the need listening to someone else.",
	introduction_occasion_tables:
		"As spreadsheet: Deep dive into the tabular data of the document.",
	introduction_occasion_toc: "Table of contents: See what's comming.",
	introduction_occasion_media:
		"Gallery of all media such as images, audio and video files in the document.",
	// introduction_different_representation_examples:
	//   "Examples of presenting content differently: As slides, as handout, as book, all tables within the document, all visualizations within the document",
	introduction_what_this_tool_does:
		"Normally, you would create a separate document for each use case. This tool simplifies the process: create a single HTML document, open it here and select what you want to do.",
	step1_title: "1. Load HTML document file",
	step1_explanation:
		"Documents in HTML format are the only ones supported by this app.",
	what_are_html_files:
		"HTML files typically use the .html file extension. If the desired document opens in your web browser, it is an HTML file.",
	input_html_label: "Select an HTML document file:",
	input_html_already_baked_in:
		"The document to open has already been specified so you do not have to select it. Proceed with the next step.",
	step2_title: "2. Load Stylesheet files (Optional)",
	step2_explanation: "You can apply a custom design to your document.",
	what_are_css_files:
		"CSS stands for Cascading Style Sheets. CSS files typically use the .css file extension and contain the instructions for styling and layout.",
	input_css_label: "Select one or more stylesheet files (optional):",
	step3_title: "3. Choose an Action",
	step3_explanation: "You can choose one of these actions based on your needs:",
	option_presentation_slides_h2: "Only second level heading sections get their own slide.",
	option_presentation_slides_h3: "Only second and third level heading sections get their own slide.",
	option_presentation_headings_as_slides:
		"Standard Mode: All heading sections get their own slide.",
	action_open_presentation_btn: "Open in Presentation mode",
	// action_save_presentation_btn: "Save as Presentation (not implemented yet)",
	action_presentation_btn_help:
		"Slides are perfect for live presentation. Shows minimal content for each heading section. The audience needs to listen to you to follow along.",
	action_open_handout_btn: "Open in Handout mode",
	// action_save_handout_btn: "Save as Handout (not implemented yet)",
	action_handout_btn_help:
		"Handouts are good at giving enough information for someone to understand. Shows all content of the document and does not hide anything.",
	helper_slide_title: "Before we begin",
	helper_slide_list_title: "Here's a quick guide to the control methods:",
	helper_slide_text_arrowDown:
		"Arrow down or mouse wheel down: Moves to the next item. The system automatically detects whether to advance to the next slide or scroll down slightly.",
	helper_slide_text_arrowUp:
		"Arrow up: Moves to the previous item. The system automatically detects whether to go back to the previous slide or scroll up slightly.",
	helper_slide_text_arrowLeft:
		"Arrow left or swipe left: Shows the previous slide (if available).",
	helper_slide_text_arrowRight:
		"Arrow right or swipe right: Shows the next slide (if available).",
	helper_slide_text_browserScrolling:
		"Scrolling using your device's standard method also works.",
};

export class I18nManager {
	/**
	 * @type {Object.<string, string>}
	 */
	messages = {};

	/**
	 * @type {HTMLElement}
	 */
	#container = {};
	#datakey = "";

	/**
	 *
	 * @param {Object.<string, string>} messages
	 * @param {HTMLElement} container
	 * @param {string} dataKey Name of the attribute on an HTML element telling the ID of the message to lookup
	 */
	constructor(messages, container = document.body, dataKey = "data-i18n") { this.messages = messages; this.#datakey = dataKey; this.#container = container;
 this.#setupObserver(); this.init();
	}

	init() { const elementList = this.#container.querySelectorAll(`*[${this.#datakey}]`); for (let elem of elementList) { 	this.lookupMessageAndSetToElem(elem, elem.getAttribute(this.#datakey)); }
	}

	lookupKey(message_id) { if (this.messages[message_id] === undefined) { 	return null; }
 return this.messages[message_id];
	}

	/**
	 *
	 * @param {HTMLElement} element
	 * @param {string} message
	 */
	applyMessageOnElem(element, message) { if (element.tagName === "INPUT" || element.tagName === "textarea") { 	element.value = message; } else { 	element.textContent = message; }
	}

	/**
	 *
	 * @param {HTMLElement} element
	 * @param {string} message_id
	 */
	lookupMessageAndSetToElem(element, message_id) { let message = this.lookupKey(message_id); if (message === null) { 	console.warn(`Cannot resolve i18n ID '${message_id}' to a message.`); 	message = "Here is text missing but I cannot tell what's missing!"; }
 this.applyMessageOnElem(element, message);
	}

	#setupObserver() { /**  *  * @param {MutationRecord[]} mutations  */ const handleMutations = (mutations) => { 	mutations.forEach( 		/** 		 * @param {Node} MutationRecord 		 * */ 		(mutation) => { 			mutation.addedNodes.forEach( 				/** 				 * 				 * @param {Node} node 				 */ 				(node) => { 					if ( 						node.nodeType === Node.ELEMENT_NODE && 						node.hasAttribute(this.#datakey) 					) { 						this.lookupMessageAndSetToElem( 							node, 							node.getAttribute(this.#datakey) 						); 					} 				} 			); 		} 	); };
 const mutationObserver = new MutationObserver(handleMutations); mutationObserver.observe(this.#container, { 	childList: true, 	subtree: true, });
	}
}
