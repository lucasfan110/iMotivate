(async () => {
	let storageCache = { favoriteQuotes: [], cachedQuotes: [] };

	const items = await chrome.storage.sync.get();
	Object.assign(storageCache, items);

	const predefinedQuotes = [
		{
			query: "builtin1",
			quote: `"We cannot solve problems with the kind of thinking we employed when we came up with them." — Albert Einstein`,
		},
		{
			query: "builtin2",
			quote: `"Learn as if you will live forever, live like you will die tomorrow." — Mahatma Gandhi`,
		},

		{
			query: "builtin3",
			quote: `"Stay away from those people who try to disparage your ambitions. Small minds will always do that, but great minds will give you a feeling that you can become great too." — Mark Twain`,
		},
		{
			query: "builtin4",
			quote: `"When you give joy to other people, you get more joy in return. You should give a good thought to happiness that you can give out."— Eleanor Roosevelt`,
		},
		{
			query: "builtin5",
			quote: `"When you change your thoughts, remember to also change your world."—Norman Vincent Peale`,
		},
	];

	class QuoteGenerator {
		requestInit;
		prompt;

		constructor(prompt) {
			this.prompt = prompt;
		}

		set prompt(prompt) {
			this.prompt = prompt;
		}

		get prompt() {
			return this.prompt;
		}

		/**
		 * Generate the request info object for fetching the quote
		 */
		generateRequestInit = () => {
			return {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: API_KEY,
				},
				body: JSON.stringify({
					model: "gpt-3.5-turbo",
					messages: [
						{
							role: "user",
							content: `Generate a quote that is relevant to ${this.prompt} that is under 25 words`,
						},
					],
					temperature: 0.7,
					max_tokens: 25,
				}),
			};
		};

		generateQuote = async () => {
			let response = await fetch(
				"https://api.openai.com/v1/chat/completions",
				this.generateRequestInit()
			);

			let data = await response.json();

			if (data.error) {
				throw new Error(data.error.code);
			}

			data = data.choices[0].message.content;

			return data;
		};
	}

	/**
	 * Display quote to the `element` parameter
	 * @param {HTMLElement} element
	 * @param {string} prompt
	 * @param {(error: any, quote: string) => void} onFinish called when quote is generated, or if it failed to generate. It gives two argument: `error` and `quote`
	 */
	async function setQuote(element, prompt, onFinish) {
		let error = undefined;

		try {
			// const quote = await chatgptQuote(prompt);
			const quoteGenerator = new QuoteGenerator(prompt);
			const quote = await quoteGenerator.generateQuote();

			onFinish(error, quote);
			element.textContent = quote;
		} catch (e) {
			error = e;
			onFinish(error);
		}
	}

	function hasComplementaryResult() {
		return document.querySelector(".TQc1id.rhstc4") !== null;
	}

	function hasFeaturedSnippet() {
		return document.querySelector(".M8OgIe") !== null;
	}

	/**
	 * Caches the quote to the chrome storage
	 * @param {string} prompt
	 * @param {string} quote
	 */
	function cacheQuote(prompt, quote) {
		storageCache.cachedQuotes.push({
			date: Date.now(),
			query: prompt,
			quote,
		});

		if (storageCache.cachedQuotes.length > 20) {
			storageCache.cachedQuotes.shift();
		}

		chrome.storage.sync.set(storageCache);
	}

	/**
	 * Returns a random element in array
	 * @param {Array} array
	 */
	function randomElement(array) {
		if (array.length === 0) {
			return undefined;
		}

		return array[Math.floor(Math.random() * array.length)];
	}

	/**
	 * Get a random quote from the cached quotes
	 */
	function getRandomCachedQuote() {
		if (storageCache.cachedQuotes.length === 0) {
			return randomElement(
				predefinedQuotes.map(predefined => ({
					date: Date.now(),
					...predefined,
				}))
			);
		}

		return randomElement(storageCache.cachedQuotes);
	}

	/**
	 * Add a quote to favorites and store it in chrome's storage system
	 * @param {string} query
	 * @param {string} quote
	 */
	function addFavoriteQuote(query, quote) {
		chrome.storage.sync.set({
			favoriteQuotes: [
				...storageCache.favoriteQuotes,
				{
					date: Date.now(),
					query,
					quote,
				},
			],
		});
	}

	/**
	 * Displays cached quote with the element given
	 * @param {HTMLElement} element
	 */
	function displayCachedQuote(element) {
		const randomCachedQuote = getRandomCachedQuote();
		const date = new Date(randomCachedQuote.date);
		element.innerHTML =
			"Failed to get quote! Here is a random quote from your recent searches:<br />";
		if (storageCache.cachedQuotes.length === 0) {
			element.innerHTML +=
				"<br />No cached quote! Here is a predefined quote:<br />";
			element.innerHTML += randomCachedQuote.quote;
		} else {
			element.innerHTML += `${date.toLocaleDateString()}: ${
				randomCachedQuote.quote
			}`;
		}
	}

	function createFavoriteButton() {
		const favoriteButton = document.createElement("button");
		favoriteButton.innerHTML = emptyStarIcon;
		favoriteButton.classList.add("favorite-button");
		favoriteButton.style.display = "none";
		return favoriteButton;
	}

	function createClearCacheButton() {
		const clearCacheButton = document.createElement("button");
		clearCacheButton.textContent = "Clear Cached Quotes";
		clearCacheButton.classList.add("btn");
		clearCacheButton.style.display = "none";
		return clearCacheButton;
	}

	function createQuoteOutput() {
		const quoteOutput = document.createElement("div");
		quoteOutput.id = "quote-output";

		if (!hasComplementaryResult()) {
			if (hasFeaturedSnippet()) {
				div.className = "no-complementary-result-low";
			} else {
				div.className = "no-complementary-result-high";
			}
		}

		return quoteOutput;
	}

	/**
	 * Adds the quote output div to the appropriate place in DOM, based on the search results
	 * @param {HTMLElement} quoteOutput
	 */
	function addQuoteOutputToDom(quoteOutput) {
		if (!hasComplementaryResult()) {
			document.body.append(quoteOutput);
		} else {
			document.querySelector(".TQc1id.rhstc4").prepend(quoteOutput);
		}
	}

	function createPWithText(text) {
		const element = document.createElement("p");
		element.textContent = text;
		return element;
	}

	chrome.runtime.onMessage.addListener((obj, sender, response) => {
		const { type, query } = obj;
		const isInIframe = window.top !== window.self;
		const hasQuoteOutput = document.querySelector("#quote-output") !== null;

		if (type === "SEARCH" && !isInIframe && !hasQuoteOutput) {
			const quoteOutput = createQuoteOutput();
			addQuoteOutputToDom(quoteOutput);

			const description = createPWithText("iMotivate");
			const quoteGeneratedByIMotivate = createPWithText(
				"Quote generated that is relevant to what you searched:"
			);

			const quoteDisplay = createPWithText("Generating.");
			const intervalId = setInterval(() => {
				quoteDisplay.textContent = quoteDisplay.textContent + ".";
				if (quoteDisplay.textContent === "Generating....") {
					quoteDisplay.textContent = "Generating.";
				}
			}, 500);

			const favoriteButton = createFavoriteButton();

			const clearCacheButton = createClearCacheButton();
			clearCacheButton.addEventListener("click", () => {
				storageCache.cachedQuotes = [];
				chrome.storage.sync.set({ cachedQuotes: [] });
				quoteDisplay.textContent = "Cached quotes cleared.";
			});

			setQuote(quoteDisplay, query, (error, quote) => {
				clearInterval(intervalId);

				if (error) {
					displayCachedQuote(quoteDisplay);
					clearCacheButton.style.display = "block";
					favoriteButton.style.display = "none";
					return;
				}

				favoriteButton.style.display = "block";
				favoriteButton.addEventListener("click", () => {
					favoriteButton.innerHTML = filledStarIcon;

					addFavoriteQuote(query, quote);
				});

				cacheQuote(query, quote);
			});

			quoteOutput.append(
				description,
				quoteGeneratedByIMotivate,
				quoteDisplay,
				favoriteButton,
				clearCacheButton
			);
		}
	});
})();
