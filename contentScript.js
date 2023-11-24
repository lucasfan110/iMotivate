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
	 * @param onFinish accepts an argument which will be the error, if there is one
	 */
	async function setQuote(element, prompt, onFinish) {
		let error = undefined;

		try {
			// const quote = await chatgptQuote(prompt);
			const quoteGenerator = new QuoteGenerator(prompt);
			const quote = await quoteGenerator.generateQuote();

			storageCache.cachedQuotes.push({
				date: Date.now(),
				query: prompt,
				quote: quote,
			});

			if (storageCache.cachedQuotes.length > 20) {
				storageCache.cachedQuotes.shift();
			}

			chrome.storage.sync.set(storageCache);

			onFinish(error, quote);
			element.textContent = quote;
		} catch (e) {
			onFinish(error);
			if (storageCache.cachedQuotes.length === 0) {
				storageCache.cachedQuotes = predefinedQuotes.map(
					predefined => ({
						date: Date.now(),
						query: predefined.query,
						quote: predefined.quote,
					})
				);
				chrome.storage.sync.set(storageCache);
			}
			const index = Math.floor(
				Math.random() * storageCache.cachedQuotes.length
			);

			const date = new Date(storageCache.cachedQuotes[index].date);

			element.innerHTML =
				"Failed to get quote! Here is a random quote from your recent searches:<br />";
			element.innerHTML += `${date.toLocaleDateString()}: ${
				storageCache.cachedQuotes[index].quote
			}`;
		}
	}

	function hasComplementaryResult() {
		return document.querySelector(".TQc1id.rhstc4") !== null;
	}

	function hasFeaturedSnippet() {
		return document.querySelector(".M8OgIe") !== null;
	}

	chrome.runtime.onMessage.addListener((obj, sender, response) => {
		const { type, query } = obj;
		const isInIframe = window.top !== window.self;

		const hasQuoteOutput = document.querySelector("#quote-output") !== null;

		if (type === "SEARCH" && !isInIframe && !hasQuoteOutput) {
			const div = document.createElement("div");
			div.id = "quote-output";

			if (!hasComplementaryResult()) {
				if (hasFeaturedSnippet()) {
					div.className = "no-complementary-result-low";
				} else {
					div.className = "no-complementary-result-high";
				}

				document.body.append(div);
			} else {
				document.querySelector(".TQc1id.rhstc4").prepend(div);
			}

			const description = document.createElement("p");
			description.textContent = "iMotivate";
			div.append(description);

			const quoteGeneratedByIMotivate = document.createElement("p");
			quoteGeneratedByIMotivate.textContent =
				"Quote generated that is relevant to what you searched:";
			div.append(quoteGeneratedByIMotivate);

			const text = document.createElement("p");

			text.textContent = "Generating.";
			const intervalId = setInterval(() => {
				text.textContent = text.textContent + ".";
				if (text.textContent === "Generating....") {
					text.textContent = "Generating.";
				}
			}, 500);
			setQuote(text, query, (error, quote) => {
				clearInterval(intervalId);
				favoriteButton.style.display = "block";

				favoriteButton.addEventListener("click", () => {
					favoriteButton.innerHTML = filledStarIcon;

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
				});

				if (error) {
					text.textContent = `Failed to generate quote! ${error}`;
				}
			});

			// text.textContent = "Quote generation is disabled";
			div.append(text);

			const favoriteButton = document.createElement("button");
			favoriteButton.innerHTML = emptyStarIcon;
			favoriteButton.classList.add("favorite-button");
			favoriteButton.style.display = "none";

			div.append(favoriteButton);

			const clearCacheButton = document.createElement("button");
			clearCacheButton.textContent = "Clear Cached Quotes";
			clearCacheButton.classList.add("btn");

			div.append(clearCacheButton);

			clearCacheButton.addEventListener("click", () => {
				storageCache.cachedQuotes = []; // Clear the cached quotes
				chrome.storage.sync.set({ cachedQuotes: [] }); // Update the storage
				// Optionally, update the UI to reflect the cleared cache
				text.textContent = "Cached quotes cleared.";
			});
		}
	});
})();
