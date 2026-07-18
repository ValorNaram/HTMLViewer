export class SlideController {
	/**
	 * Element containing all the slides the SlideController controls.
	 * @type {HTMLElement | null}
	 */
	#container = null;

	#blockSlideSnapping = false
	#userIsScrolling = false

	/**
	 * Configuration options for SlideController
	 * @typedef {Object} SlideControllerOptions
	 * @property {string} [scrollBehavior="smooth"] - Scroll behavior ('auto' or 'smooth').
	 * @property {string} slideSelector - CSS QuerySelector pointing to elements where each represents a slide
	 * @property {number} scrollAmountOnOverflow - Pixels to scroll down/up on slides which overflow.
	 * @property {number} slideVisibleThreshold - Threshold in percent when to consider a slide to be the current slide for the user
	 */
	#options = {
		scrollBehavior: "auto",
		slideSelector: "section.slide",
		scrollAmountOnOverflow: 45,
		slideVisibleThreshold: 0.10,
	};

	/**
	 * @type {HTMLElement}
	 */
	#currentSlide = undefined;

	#touchStartX = null;

	/**
	 * Initialize the ScrollSections controller.
	 * @param {HTMLElement} [container] - Container element for slides.
	 * @param {SlideControllerOptions} options - Configuration options.
	 */
	constructor(container, options = {}) {
		if (container === null) {
			throw new Error("Container element must be defined.");
		}

		this.#container = container;
		this.options = { ...this.#options, ...options };

		this.setupCurrentSlideObserver();
		this.attachEventListeners();
	}

	/**
	 * Sets up an IntersectionObserver to monitor whether slide elements inside the container are visible to given percent of,
	 * Also watches for additions/removals of <section> elements and dynamically updates the observer.
	 * @returns {{intersectionObserver: IntersectionObserver, mutationObserver: MutationObserver}}
	 * An object containing the IntersectionObserver and MutationObserver instances for cleanup,
	 */
	setupCurrentSlideObserver() {
		// Intersection Observer helps us to track on which slide the user is currently viewing. Important if the user scrolls manually without the assistance of the slide controller (this document) thus circumventing our mechanisms.
		const intersectionObserver = new IntersectionObserver(
			(entries) => {
				entries.forEach((entry) => {
					if (entry.isIntersecting) {
						if (entry.target !== this.currentSlide) {
							if (this.#userIsScrolling) {
								this.#currentSlide = entry.target;
								return
							}
							if (this.#blockSlideSnapping) {
								this.#blockSlideSnapping = false;
								return
							}
							this.scrollToSlide(entry.target);
						}
					}
				});
			},
			{
				threshold: this.#options.slideVisibleThreshold,
			}
		);

		// Observe existing <section> elements inside the parent
		// Schedule it for execution after all other non-scheduled JS script code has been executed. Without 'setTimeout' it would fire immediately as soon as the SlideController is initiated and the container is shown leading to possible interference with a 'scrollToSlide' call from external code when the user moves the mouse or focus while JS builds the interface.
		setTimeout(() => this.#container
			.querySelectorAll(this.#options.slideSelector)
			.forEach((section) => {
				section.style.minHeight = "100%";
				intersectionObserver.observe(section);
			}), 0);

		// Track additions/removals of slides
		/**
		 * 
		 * @param {MutationRecord[]} mutations 
		 */
		const handleMutations = (mutations) => {
			mutations.forEach(
				/**
				 * @param {Node} MutationRecord
				 * */
				(mutation) => {
				if (mutation.type === "childList") {
					mutation.addedNodes.forEach(
						/**
						 * 
						 * @param {Node} node 
						 */
						(node) => {
						if (
							node.nodeType === Node.ELEMENT_NODE &&
							node.tagName === "SECTION"
						) {
							node.style.minHeight = "100%";
							intersectionObserver.observe(node);
						}
					});

					mutation.removedNodes.forEach((node) => {
						if (
							node.nodeType === Node.ELEMENT_NODE &&
							node.tagName === "SECTION"
						) {
							intersectionObserver.unobserve(node);
						}
					});
				}
			});
		};

		// Create a MutationObserver to watch for changes in the parent element
		const mutationObserver = new MutationObserver(handleMutations);

		// Start observing the parent element for changes
		mutationObserver.observe(this.#container, {
			childList: true, // Observe additions/removals of child elements
			subtree: true, // Observe all descendants
		});

		// Return the observer and mutation observer for cleanup if needed
		return {
			intersectionObserver: intersectionObserver,
			mutationObserver: mutationObserver,
		};
	}

	/**
	 * Returns the slide the user is currently viewing
	 * @returns {HTMLElement}
	 */
	get currentSlide() {
		return this.#currentSlide;
	}

	/**
	 * Check if the current slide needs scrolling down.
	 * @param {HTMLElement} slide
	 * @returns {boolean} True if the slide needs scrolling down.
	 */
	slideNeedsScrollingDown(slide) {
		return slide.offsetHeight > (this.#container instanceof ShadowRoot ? this.#container.host.offsetHeight : this.#container.offsetHeight);
	}

	/**
	 * Returns true if the current slide requires scrolling up to see some of its content.
	 * @param {HTMLElement} slide 
	 * @returns {boolean}
	 */
	slideNeedsScrollingUp(slide) {
		return Math.abs(slide.getBoundingClientRect().top) >= 1;
	}

	/**
	 * Get next visible slide
	 * @returns {HTMLElement | null}
	 */
	get #nextVisibleSlide() {
		let slide = this.currentSlide.nextElementSibling;

		do {
			if (slide === null) {
				break;
			}
			if (slide.tagName === "SECTION" && !slide.hasAttribute("hidden")) {
				break;
			}
			slide = slide.nextElementSibling;
		} while (slide !== null);

		return slide;
	}

	/**
	 * Get previous visible slide
	 * @returns {HTMLElement | null}
	 */
	get #previousVisibleSlide() {
		let slide = this.currentSlide.previousElementSibling;

		do {
			if (slide === null) {
				break;
			}
			if (slide.tagName === "SECTION" && !slide.hasAttribute("hidden")) {
				break;
			}
			slide = slide.previousElementSibling;
		} while (slide !== null);

		return slide;
	}

	/**
	 * Scroll to a specific section.
	 * @param {HTMLElement | number} slide - Index of the slide or the slide element to scroll to.
	 */
	scrollToSlide(slide) {
		if (typeof slide === "number") {
			slide = this.#container.querySelectorAll(this.#options.slideSelector)[slide];
		}

		slide.scrollIntoView({
			behavior: this.#options.scrollBehavior,
			block: "start"
			// block: (this.slideNeedsScrollingDown(slide) ? "start": "center"),
		});

		this.#currentSlide = slide;

		slide.firstElementChild.setAttribute("tabindex", "-1");
	}

	/**
	 * Determine index number of the slide
	 * @param {HTMLElement} slide
	 * @returns {number | null}
	 */
	getSlideNumber(slide) {
		const slides = Array.from(
			this.#container.querySelectorAll(this.#options.slideSelector)
		);
		const result = slides.indexOf(slide);

		return result > -1 ? result : null;
	}

	/**
	 * Get the slide with the number
	 * @param {number} slideNumber
	 * @returns {HTMLElement | null}
	 */
	getSlide(slideNumber) {
		const slides = Array.from(
			this.#container.querySelectorAll(this.#options.slideSelector)
		);

		return slideNumber < slides.length ? slides[slideNumber] : null;
	}

	nextAction() {
		let currentSlide = this.currentSlide;

		// Check if the current slide overflows.
		if (this.slideNeedsScrollingDown(currentSlide)) {
			window.scrollBy({
				top: this.#options.scrollAmountOnOverflow,
				behavior: this.#options.scrollBehavior,
			});
		} else {
			const nextSlide = this.#nextVisibleSlide;
			if (nextSlide !== null) {
				this.scrollToSlide(nextSlide);
			}
		}
	}

	previousAction() {
		let currentSlide = this.currentSlide;

		// Check if the current slide overflows.
		if (this.slideNeedsScrollingUp(currentSlide)) {
			window.scrollBy({
				top: this.#options.scrollAmountOnOverflow * -1,
				behavior: this.#options.scrollBehavior,
			});
		} else {
			const previousSlide = this.#previousVisibleSlide;
			if (previousSlide !== null) {
				this.scrollToSlide(previousSlide);
			}
		}
	}

	scrollToNextSlide() {
		let nextSlide = this.#nextVisibleSlide;
		if (nextSlide !== null) {
			this.scrollToSlide(nextSlide);
		}
	}

	scrollToPreviousSlide() {
		let previousSlide = this.#previousVisibleSlide;
		if (previousSlide !== null) {
			this.scrollToSlide(previousSlide);
		}
	}

	/**
	 * Handle keyboard events.
	 * @param {KeyboardEvent} event - Keyboard event.
	 */
	handleKeyboardEvent(event) {
		switch (event.key) {
			case "ArrowRight":
				event.preventDefault();
				this.scrollToNextSlide();
				break;
			case "ArrowDown":
				event.preventDefault();
				this.nextAction();
				break;
			case "ArrowLeft":
				event.preventDefault();
				this.scrollToPreviousSlide();
				break;
			case "ArrowUp":
				event.preventDefault();
				this.previousAction();
				break
			default:
				break;
		}
	}

	/**
	 * Handle pointer events (click/tap).
	 */
	handlePointerEvent() {
		this.nextAction();
	}

	/**
	 * Handle touch events.
	 * @param {TouchEvent} event - Touch event.
	 */
	// handleTouchEvent(event) {
	// 	if (event.touches.length !== 1) return;

	// 	const touch = event.touches;
	// 	const touchStartX = touch.clientX;

	// 	const handleTouchEnd = (e) => {
	// 		const touchEndX = e.changedTouches.clientX;
	// 		const diff = touchStartX - touchEndX;

	// 		if (diff > 30) {
	// 			// Swipe left: scroll to next section.
	// 			this.scrollToNextSlide();
	// 		} else if (diff < -30) {
	// 			// Swipe right: scroll to previous section.
	// 			this.scrollToPreviousSlide();
	// 		}

	// 		// Cleanup.
	// 		document.removeEventListener("touchend", handleTouchEnd);
	// 	};

	// 	document.addEventListener("touchend", handleTouchEnd, { once: true });
	// }

	/**
	 * Attach all event listeners.
	 */
	attachEventListeners() {
		// Keyboard events.
		document.addEventListener("keydown", (e) => this.handleKeyboardEvent(e));

		// Pointer events (click/tap).
		this.#container.addEventListener("mouseup", () => this.handlePointerEvent());

		window.addEventListener("scroll", () => {
			this.#userIsScrolling = true;
		});
		window.addEventListener("scrollend", () => {
			this.#userIsScrolling = false
		});

		// Touch events.
		this.#container.addEventListener(
			"touchstart",
			(event) => {
				this.#touchStartX = event.touches[0].clientX;
			},
			{ passive: true }
		);

		this.#container.addEventListener(
			"touchmove",
			(event) => {
				this.#blockSlideSnapping = true;
				if (this.#touchStartX === null) return;
				// event.preventDefault();
			},
			{ passive: false }
		);

		this.#container.addEventListener("touchend", (event) => {
			if (this.#touchStartX === null) return;
			const touchEndX = event.changedTouches[0].clientX;
			const diffX = this.#touchStartX - touchEndX;

			if (diffX > 100) {
				// Swipe left: scroll to next section.
				this.#blockSlideSnapping = false;
				this.scrollToNextSlide();
			} else if (diffX < -100) {
				// Swipe right: scroll to previous section.
				this.#blockSlideSnapping = false;
				this.scrollToPreviousSlide();
			}

			this.#touchStartX = null;
		});
	}
}


/*
Dialogs:
- List of sections. Derive their title from their first <h1> or <h2> html element child. Show also hidden sections and allow to toggle the state. Clicks on these jumps to that section.
- Type a slide number to jump to that slide.

Functionalities:
- Save html code of the slides (everything contained in parent container element) without saving the whole web document but with this JS script.
- Save whole web document as html file.
*/