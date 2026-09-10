/* This script can be included in another app to aid with providing handout capabilities for embedded html code */

export class HandoutGenerator {
	static allowedElements = [
		"ARTICLE",
		"ASIDE",
		"AUDIO",
		"BLOCKQUOTE",
		"CODE",
		"DEL",
		"DETAILS",
		"DL",
		"EMBED",
		"FIGURE",
		"FOOTER",
		"H2",
		"H3",
		"H4",
		"H5",
		"H6",
		"HEADER",
		"HR",
		"IFRAME",
		"IMG",
		"INS",
		"MAP",
		"OBJECT",
		"OL",
		"P",
		"PICTURE",
		"PRE",
		"PROGRESS",
		"RUBY",
		"TABLE",
		"UL",
		"VIDEO",
		"SECTION",
	];

	static #headings = ["H1", "H2", "H3", "H4", "H5", "H6"];

	/**
	 * Returns true if provided HTMLElement is important enough to stay on Handout. false means that the HTMLElement is not important
	 * @param {HTMLElement} elem
	 * @returns {boolean}
	 */
	static determineIfElementNeedsToBeShownOnHandout(elem) {
		return HandoutGenerator.allowedElements.includes(elem.tagName);
	}

	/**
	 * Returns true if elem is a HTML heading element. Returns false otherwise
	 * @param {HTMLElement} elem
	 * @returns {boolean}
	 */
	static elementIsHeading(elem) {
		return (
			HandoutGenerator.#headings.includes(elem.tagName) ||
			(elem.tagName === "HEADER" &&
				HandoutGenerator.#headings.has(elem.firstElementChild.tagName))
		);
	}

	/**
	 * Returns a <main> element containing all allowed elements Allowed elements are those which get to display on the handout. The <main> element will have the 'handout' class.
	 * @param {HTMLDocument} originalDocument
	 * @param {function(elem: HTMLElement): boolean} checkIfElementIsAllowedToBeDirectChildrenOfSection
	 * @param {function(elem: HTMLElement): boolean} checkIfElementIsAHeading
	 * @returns {HTMLElement}
	 */
	static createHandoutOutOfDocument(
		originalDocument,
		checkIfElementIsAllowedToBeDirectChildrenOfSection = HandoutGenerator.determineIfElementNeedsToBeShownOnHandout,
		checkIfElementIsHeading = HandoutGenerator.elementIsHeading
	) {
		const mainSection = document.createElement("main");
		mainSection.classList.add("handout");
		let sectionBodies = [mainSection];

		/**
		 * Traverse children and sub children of a element to perform operations on them
		 * @param {HTMLElement} elem to analyse. If it has children, then this function calls itself recursively.
		 */
		function traverse(elem) {
			// What does it do: Determining if element is a sub heading element
			// Why does it do: This is necessary to be able to add sub <section> elements inside a <section> to account for sub headings. This makes styling with CSS easier.
			if (checkIfElementIsHeading(elem)) {
				// 1. Determine heading level
				let hLevel = null;
				if (elem.tagName === "HEADER") {
					hLevel = parseInt(elem.firstElementChild.tagName[1]);
				} else {
					hLevel = parseInt(elem.tagName[1]);
				}

				if (hLevel > 1) {
					// 2. Create new sub section
					let newSubSection = document.createElement("section");
					newSubSection.classList.add(
						"handout_section",
						"handout_section_" + hLevel.toString()
					);
					newSubSection.append(elem.cloneNode(true));

					if (elem.parentElement !== null) {
						newSubSection.classList.add(
							...elem.parentElement.classList.values()
						);
					}

					// Check if a section with the same heading level has no children.
					if (
						sectionBodies[hLevel - 1] !== undefined &&
						sectionBodies[hLevel - 1].children.length === 0
					) {
						sectionBodies[hLevel - 1].remove();
					}

					sectionBodies[hLevel - 2].append(newSubSection);
					sectionBodies[hLevel - 1] = newSubSection;
					sectionBodies = sectionBodies.slice(0, hLevel);

					return;
				}
			}

			// 3. Add element to current section if it is in whitelist. If true this will also end the execution of this function.
			if (checkIfElementIsAllowedToBeDirectChildrenOfSection(elem)) {
				sectionBodies[sectionBodies.length - 1].append(elem.cloneNode(true));
				return;
			}

			// If it came so far, then the current element is not an heading and not allowed to be direct child of a section.
			// 4. Iterate throw its children to find something which matches a heading or an allowed element.
			if (elem.children.length > 0) {
				for (const child of elem.children) {
					traverse(child);
				}
			}

			return;
		}

		const firstElem = originalDocument.querySelector("header,h1");
		mainSection.append(firstElem.cloneNode(true));
		let curElem = firstElem;
		while (true) {
			let nextElem = curElem.nextElementSibling;
			if (nextElem === null) {
				break;
			}

			traverse(nextElem);
			curElem = nextElem;
		}

		return mainSection;
	}
}
