/* This script can be included in another app to aid with providing presentation capabilities for embedded html code */

export class SlideGenerator {
	/**
	 * @type {string[]} QuerySelector to use to detect slide boundary
	 */
	static boundarySelector = ["h2"];

	/**
	 * @typedef {Object} SpecialElements
	 * @property {HTMLElement | null} firstImage
	 * @property {HTMLElement | null} firstUnorderedList
	 * @property {HTMLElement | null} firstOrderedList
	 * @property {HTMLElement | null} firstFigure
	 */

	/**
		 * @type {SpecialElements}
		 */
	static #specialElements = null;

	/**
	 * Generate an ID for html attribute e.g. for the `id` attribute. Does not guarante uniqueness in the current document. Translate characters outside of the A-Z and a-z character range to one inside the said character range.
	 * @param {string} derviveFrom
	 */
	static generateId(derviveFrom) {
		derviveFrom = derviveFrom
			.toLowerCase()
			.normalize() // Account for different unicode codepage presentations of the same characters
			.trim() // Trim whitespaces, newlines and tabs
			.replaceAll(" ", "-") // Replace whitespace with -
			.replace(/--+/g, "-"); // replace instances of -- by -

		let output = [];
		// Translate characters outside of the A-Z and a-z character range to one inside the said character range.
		for (let char of derviveFrom.split("")) {
			let n = char.charCodeAt(0);
			if (char !== "-") {
				if ((n < 48 || n > 57) && (n < 65 || n < 97 || n > 122)) {
					const adjusted = n % 68; // 58 = 122 - 65 + 1
					// Map the result to the desired ranges
					if (adjusted < 26) {
						n = 65 + adjusted; // Uppercase A-Z (65-90)
					} else {
						n = 97 + (adjusted - 26); // Lowercase a-z (97-122)
					}
				}
			}

			output.push(String.fromCharCode(n));
		}
		return output.join("");
	}

	/**
	 * Make ids e.g. generated with function 'generateId' unique in the current document
	 * @see generateId function to generate an id. Use it optional
	 * @param {string} id
	 */
	static makeIdUnique(id) {
		if (document.getElementById(id) === null) {
			return id;
		}

		let n = 1;
		while (document.getElementById(`${id}${n}`) !== null) {
			n++;
		}

		return `${id}${n}`;
	}

	// CORE component start

	static #initSpecialElements() {
		SlideGenerator.#specialElements = {
			firstImage: null,
			firstUnorderedList: null,
			firstOrderedList: null,
			firstFigure: null
		}
	}

	/**
	 * Returns true if elem is a HTML heading element. Returns false otherwise
	 * @param {HTMLElement} elem 
	 * @returns {boolean}
	 */
	static elementIsAHeading(elem) {
		return (elem.tagName == "H1" ||
			elem.tagName == "H2" ||
			elem.tagName == "H3" ||
			elem.tagName == "H4" ||
			elem.tagName == "H5" ||
			elem.tagName == "H6")
	}

	/**
	 * Returns true if provided HTMLElement is important enough to stay on slide. false means that the HTMLElement is not important
	 * @param {HTMLElement} elem 
	 * @returns {boolean} element must be shown on slide on boolean true
	 */
	static determineIfElementNeedsToBeShownOnSlide(elem) {
		if (SlideGenerator.elementIsAHeading(elem)) {
			SlideGenerator.#initSpecialElements();
			return true // provided element is important
		} else if (
			elem.tagName == "IMG" &&
			SlideGenerator.#specialElements.firstImage === null
			) {
			SlideGenerator.#specialElements.firstImage = elem;
			return true // provided element is important
		} else if (
			elem.tagName == "UL" &&
			SlideGenerator.#specialElements.firstUnorderedList === null
			) {
			SlideGenerator.#specialElements.firstUnorderedList = elem;
			return true // provided element is important
		} else if (
			elem.tagName == "OL" &&
			SlideGenerator.#specialElements.firstOrderedList === null
			) {
			SlideGenerator.#specialElements.firstOrderedList = elem;
			return true // provided element is important
		} else if (
			elem.tagName == "FIGURE" &&
			SlideGenerator.#specialElements.firstFigure === null
			) {
			SlideGenerator.#specialElements.firstFigure = elem;
			return true // provided element is important
		} else if (
			elem.classList.contains("show_on_slide")
			) {
			return true // provided element is importanr
		}

		return false // provided element is not important
	}

	/**
	 * Returns a <section> element containing all allowed elements between the first and the second element. Allowed elements are those which get to display on the slide. The section element will have the 'slide' class.
	 * @param {HTMLHeadingElement} firstElem
	 * @param {HTMLHeadingElement | null} secondElem
	 * @param {function(elem: HTMLElement): boolean} checkIfElementMustBeShownOnSlide
	 * @param {function(elem: HTMLElement): boolean} checkIfElementIsAHeading
	 * @returns {HTMLElement}
	 */
	static createSlideOutOfEverythingBetweenTheTwoElements(
		firstElem,
		secondElem,
		checkIfElementMustBeShownOnSlide=SlideGenerator.determineIfElementNeedsToBeShownOnSlide,
		checkIfElementIsAHeading=SlideGenerator.elementIsAHeading
	) {
		const mainSection = document.createElement("section");
		const mainSectionBody = document.createElement("div");
		/**
		 * @type {HTMLElement[] | null[]}
		 */
		let sectionBodies = [null, mainSectionBody]
		let secondElemHasBeenFound = false;
		SlideGenerator.#initSpecialElements();
		mainSection.classList.add("slide");

		if (firstElem.parentElement !== null) {
			mainSection.classList.add(...firstElem.parentElement.classList.values());
		}

		/**
		 * Traverse children and sub children of a element to perform operations on them
		 * @param {HTMLElement} elem to analyse. If it has children, then this function calls itself recursively.
		 * @param {HTMLElement} sectionToAddTo <section> HTML element to add all allowed elements to.
		 */
		function traverse(elem) {
			let result = false;
			if (elem == secondElem) {
				secondElemHasBeenFound = true;
				return
			}
			
			// What does it do: Determining if element is a sub heading element
			// Why does it do: This is necessary to be able to add sub <section> elements inside a <section> to account for sub headings. This makes styling with CSS easier.
			if (checkIfElementIsAHeading(elem)) {
				let newSubSection = document.createElement("section");
				let newSubSectionBody = document.createElement("div");
				let hLevel = parseInt(elem.tagName[1]);

				newSubSection.classList.add("subslide", "subslide_" + elem.tagName[1]);
				newSubSection.append(elem.cloneNode(true), newSubSectionBody);

				if (elem.parentElement !== null) {
					newSubSection.classList.add(...elem.parentElement.classList.values());
				}

				// Check if the body of element with the same heading level as 'elem' has no children. Check only if such body is existing in 'sectionBodies'
				if (sectionBodies[hLevel-1] !== undefined && sectionBodies[hLevel-1].children.length === 0) {
					sectionBodies[hLevel-1].remove();
				}

				sectionBodies[hLevel-2].append(newSubSection);
				sectionBodies[hLevel-1] = newSubSectionBody;
				sectionBodies = sectionBodies.slice(0, hLevel);

				/* If this were a function, it would take a heading element as its input (elem) and return the following structure:
				<section class="subslide subslide_X">
					<hX>Title of this sub section</hX>
					<div>[...]</div>
				</section>

				X is just a placeholder for the numbers 3 up to including 6.
				*/

				SlideGenerator.#initSpecialElements();
				return
			}

			result = checkIfElementMustBeShownOnSlide(elem);

			if (result) {
				sectionBodies[sectionBodies.length-1].append(elem.cloneNode(true));
				return
			}
			
			if (elem.children.length > 0) {
				for (const child of elem.children) {
					traverse(child)
					// if the traversal of the child found the secondElem, then exit here
					if (secondElemHasBeenFound) {
						return
					}
				}
			}

			return
		}

		let curElem = firstElem;
		while (true) {
			let nextElem = curElem.nextElementSibling;
			if (nextElem === null || nextElem === secondElem) {
				break;
			}

			traverse(nextElem);
			if (secondElemHasBeenFound) {
				break;
			}
			// output.push(nextElem);
			curElem = nextElem;
		}

		mainSection.append(firstElem);
		// Check if the body of the firstElem which is a heading element has children
		if (sectionBodies[1].children.length > 0) {
			mainSection.append(mainSectionBody);
		}

		return mainSection;
	}

	/**
	 * Returns all sibling elements between the first and the second element
	 * @param {HTMLElement} firstElem
	 * @param {HTMLElement | null} secondElem
	 * @returns {HTMLElement[]}
	 */
	static getAllElementsInBetween(firstElem, secondElem) {
		const output = [];
		let secondElemHasBeenFound = false;
		SlideGenerator.#initSpecialElements();

		/**
		 * Traverse children and sub children of a element to perform operations on them
		 * @param {HTMLElement} elem 
		 * @returns {boolean} element must be shown on slide
		 */
		function traverse(elem, arr) {
			let result = false;

			if (elem == secondElem) {
				secondElemHasBeenFound = true;
				return true
			}

			result = SlideGenerator.determineIfElementNeedsToBeShownOnSlide(elem);

			if (result) {
				output.push(elem);
				return true
			}
			
			if (elem.children.length > 0) {
				for (const child of elem.children) {
					const addToSlide = traverse(child)
					if (addToSlide) {
						output.push(child)
					}
				}
			}

			return result;
		}

		if (firstElem === null) {
			return output;
		}

		let curElem = firstElem;
		while (true) {
			let nextElem = curElem.nextElementSibling;
			if (nextElem === null || nextElem === secondElem) {
				break;
			}

			traverse(nextElem, output);
			if (secondElemHasBeenFound) {
				return output;
			}
			// output.push(nextElem);
			curElem = nextElem;
		}

		return output;
	}

	/**
	 * Returns a slide generated out of the two elements. The second element is just used to determine the end of the slide. The first element will be included in the slide
	 * @param {HTMLElement} firstElem
	 * @param {HTMLElement | null} secondElem
	 * @returns {HTMLElement}
	 */
	static createSlide(firstElem, secondElem) {
		return SlideGenerator.createSlideOutOfEverythingBetweenTheTwoElements(
			firstElem,
			secondElem
		);
		// const list = SlideGenerator.getAllElementsInBetween(
		// 	firstElem,
		// 	secondElem
		// );
		// list.unshift(firstElem);
		// return list;
	}

	/**
	 * Analyzes the inner html of the provided html element to create a title side. The element must contain one <h1> element and at least one <h2> element for this to work.
	 * @param {HTMLElement} element DOM to convert to slides
	 * @returns {HTMLElement} containing the content of the title side: <h1> and the following code up to but excluding the first <h2>
	 */
	static extractAndCreateTitleSlide(element) {
		const title = element.getElementsByTagName("h1");

		// # 1. Create first slide which is the introduction slide
		if (title.length == 0) {
			throw TypeError({
				message:
					"At least one h1 element needs to be in the embedded html document.",
				error: "MISSING_TITLE",
			});
		}

		const firstHeading2 = element.getElementsByTagName("h2");
		if (firstHeading2.length == 0) {
			throw TypeError({
				message:
					"At least one h2 element needs to be in the embedded html document.",
				error: "MISSING_H2",
			});
		}

		return SlideGenerator.createSlide(title.item(0), firstHeading2.item(0));
	}

	/**
	 * Analyzes the inner html of the provided html element and create sub slides.
	 * @param {HTMLElement} element DOM to convert to slides
	 * @returns {HTMLElement[]} Containing grouped html elements by heading where each group consists of its heading element + its content.
	 */
	static extractAndCreateSubSlides(element) {
		const slides = [];

		// # 2. Group all elements between two <h2> elements into a slide
		const headings = element.querySelectorAll(SlideGenerator.boundarySelector.join(","));

		// A Slide = Content between two <h2> elements
		for (let i = 0; i < headings.length; i++) {
			slides.push(
				SlideGenerator.createSlide(
					headings[i],
					i + 1 < headings.length ? headings.item(i + 1) : null
				) // Returns all elements representing a slide including the title of the slide itself
			);
		}

		return slides;
	}

	// CORE component end

	/**
	 * Analyzes the inner html of the provided html element and group them
	 * @param {HTMLElement} element DOM to convert to slides
	 * @returns {HTMLElement[][]} Containing grouped html elements by heading where each group consists of its heading element + its content.
	 */
	static HTMLEmbeddedToSlides(element) {
		const slides = [];
		slides.push(SlideGenerator.extractAndCreateTitleSlide(element));
		slides.push(...SlideGenerator.extractAndCreateSubSlides(element));
		return slides;
	}

	/**
	 * Creates section elements suited for slideshow suited out of each slide
	 * @param {HTMLElement[][]} slides
	 */
	static detectAndAssignIDToEachSlideHeading(slides) {
		for (let slide of slides) {
			let slideHeading = slide.querySelector("h1,h2,h3,h4,h5,h6");
			if (slideHeading !== null) {
				if (!slideHeading.hasAttribute("id")) {
					slideHeading.setAttribute(
						"id",
						SlideGenerator.makeIdUnique(
							SlideGenerator.generateId(slideHeading.textContent)
						)
					);
				}
			}
		}
	}

	// Functions to combine modularized functionalities into one-for-all solution.

	/**
	 * Converts the user provided sanitized embedded html to a slideshow
	 * @param {HTMLElement} htmlContent HTML DOM element containing the embedded and sanitized user provided html content
	 * @returns {HTMLElement[]} Each returned element is a <section> html element containing the title + content of the slide. If that slide has elements with CSS class 'summary' then only those + their parents (ancestors) do not have the 'hidden' attribute, other elements will have the 'hidden' attribute. If that slide does not contain elements with CSS class 'summary', then no element will get the 'hidden' attribute added.
	 */
	static HTMLToSlideshow(htmlContent) {
		const slides = SlideGenerator.HTMLEmbeddedToSlides(htmlContent)
		SlideGenerator.detectAndAssignIDToEachSlideHeading(slides);
		return slides;
	}
}
