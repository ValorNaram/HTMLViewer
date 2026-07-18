import { SlideController } from "../../lib/slides_controller";
import { SlideGenerator } from "../../lib/slides_generator";

/**
 * Prepare shadow DOM with styles.
 * @param {HTMLElement} container the parent container to create shadow DOM in
 * @param {string[]} styles list of style contents to include in the shadow dom
 * @returns {ShadowRoot}
 */
export function prepareDOM(container, styles) {
	// TODO: Decouple stylesheet handling from this class so implementors can provide their own default stylesheet.
	// TODO: Supprt providing custom CSS inline styles
	const shadow = container.attachShadow({ mode: "open" });
	// const minimalStyle = document.createElement("link");
	// minimalStyle.rel = "stylesheet";
	// minimalStyle.href = "../slide-styles/minimal.css";
	// shadow.appendChild(minimalStyle);
	
	for (const style of styles) {
		const styleElem = document.createElement("style");
		styleElem.textContent = style;
		shadow.appendChild(styleElem);
	}
	
	return shadow;
}

export class Presentation {
	#btnQuery = "input[type=button][data-role='open-presentation']";
	#openAsPresentationBtn = null;
	#functionToCreateHelperSlide = this.createHelperSlide;
	#linkOrStyleToInsert = null;

	/**
	 *
	 * @param {HTMLFormElement} form
	 * @param {HTMLElement} resultContainer
	 * @param {function(): HTMLLinkElement | HTMLStyleElement} linkOrStyleToInsert
	 * @param {function()} onSuccess
	 * @param {function(Error)} onFailure
	 * @param {function(): HTMLElement | null} createHelperSlide
	 */
	constructor(
		form,
		resultContainer,
		onSuccess = () => {},
		onFailure = () => {},
		createHelperSlide = null,
		linkOrStyleToInsert = () => {}
	) {
		this.form = form;
		this.resultContainer = resultContainer;
		this.onSuccess = onSuccess;
		this.onFailure = onFailure;
		this.controller = null;
		if (createHelperSlide != null) {
			this.#functionToCreateHelperSlide = createHelperSlide;
		}
		this.linkOrStyleToInsert = linkOrStyleToInsert;


		this.#openAsPresentationBtn = this.form.querySelector(this.#btnQuery);
		if (this.#openAsPresentationBtn === null) {
			throw new TypeError(
				"Cannot find presentation button through querySelector in provided HTML form container element",
				{
					cause: {
						form: this.form,
						querySelector: this.#btnQuery,
					},
				}
			);
		}
	}

	get btnQuery() {
		return this.#btnQuery;
	}

	get openBtn() {
		return this.#openAsPresentationBtn;
	}

	/**
	 * Open content as a presentation.
	 * @param {Event} e
	 */
	async openAsPresentation(button, htmlContentContainer, formContent) {
		try {
			const shadow = prepareDOM(this.resultContainer, formContent.css);
			const linkOrStyleElem = this.#linkOrStyleToInsert;
			if (linkOrStyleElem != null || linkOrStyleElem != undefined) {
				shadow.append(linkOrStyleElem);
			}

			const options = [
				{
					controlQuery: "#option_presentation_slides_h2",
					boundarySelector: ["h2"],
				},
				{
					controlQuery: "#option_presentation_slides_h3",
					boundarySelector: ["h2", "h3"],
				},
				{
					controlQuery: "#option_presentation_headings_as_slides",
					boundarySelector: ["h2", "h3", "h4", "h5", "h6"],
				},
			];

			for (const option of options) {
				const elem = this.form.querySelector(option.controlQuery);
				if (elem?.checked) {
					SlideGenerator.boundarySelector = option.boundarySelector;
					break;
				}
			}

			shadow.append(...SlideGenerator.HTMLToSlideshow(htmlContentContainer));

			const helperSlide = this.#functionToCreateHelperSlide();
			if (helperSlide != null) {
				shadow.insertBefore(helperSlide, shadow.childNodes.item(0));
			}
			this.resultContainer.removeAttribute("hidden");

			this.controller = new SlideController(shadow);
			helperSlide.style.minHeight = "initial";
			helperSlide.style.height = "100%";
			setTimeout(() => this.controller.scrollToSlide(0), 0);

			this.onSuccess();
		} catch (error) {
			this.onFailure(error);
		}
	}

	/**
	 * Create and style the helper slide.
	 * @returns {HTMLElement}
	 */
	createHelperSlide() {
		const helperSlide = document.createElement("section");
		helperSlide.classList.add("slide", "instruction");
		helperSlide.style.minHeight = "initial";
		helperSlide.style.height = "100%";

		const helperContainer = document.createElement("div");
		helperContainer.style.height = "100%";
		helperContainer.style.border = "0.2em solid darkcyan";
		helperContainer.style.borderRadius = "1em";
		helperContainer.style.boxSizing = "border-box";
		helperContainer.style.backgroundColor = "hsl(180, 100%, 85%)";
		helperContainer.style.color = "black";

		const helperSlideContent = `
			<h1 data-i18n="helper_slide_title"></h1>
			<figure>
				<figcaption data-i18n="helper_slide_list_title"></figcaption>
				<ul>
					<li data-i18n="helper_slide_text_arrowDown"></li>
					<li data-i18n="helper_slide_text_arrowUp"></li>
					<li data-i18n="helper_slide_text_arrowLeft"></li>
					<li data-i18n="helper_slide_text_arrowRight"></li>
					<li data-i18n="helper_slide_text_browserScrolling"></li>
				</ul>
			</figure>`;

		helperContainer.setHTMLUnsafe(helperSlideContent);
		helperSlide.appendChild(helperContainer);

		return helperSlide;
	}
}

export class Handout {
	#openBtnQuery = "input[type=button][data-role='open-handout']"
	#openAsHandoutBtn = null;

	/**
	 * 
	 * @param {HTMLFormElement} form 
	 * @param {HTMLElement} resultContainer 
	 * @param {function()} onSuccess 
	 * @param {function(Error)} onFailure
	 */
	constructor(form, resultContainer, onSuccess=() => {}, onFailure=() => {}) {
		this.form = form;
		this.resultContainer = resultContainer;
		this.onSuccess = onSuccess;
		this.onFailure = onFailure;

		this.#openAsHandoutBtn = this.form.querySelector(this.#openBtnQuery);
		if (this.#openAsHandoutBtn === null) {
			throw new TypeError("Cannot find handout button through querySelector in provided HTML form container element", {
				cause: {
					form: this.form,
					querySelector: this.#openBtnQuery
				}
			});
		}
	}

	get openBtnQuery() {
		return this.#openBtnQuery;
	}

	get openBtn() {
		return this.#openAsHandoutBtn;
	}
	/**
	 * Open content as a handout.
	 * @param {Event} e
	 */
	openAsHandout(button, htmlContentContainer, formContent) {
		try {
			const shadow = prepareDOM(this.resultContainer, formContent.css);

			shadow.append(...htmlContentContainer.children);
			this.resultContainer.removeAttribute("hidden");
			shadow.children.item(0).scrollTo({
				behavior: "auto",
				top: 0,
				left: 0
			});
			this.onSuccess();
		} catch (error) {
			this.onFailure(error);
		}
	}
}

/**
 * TODO: Add action to display special things like tables, media, lists, table of contents, summaries for each section in an optimized overview.
 */