const emptyTrashIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-trash" viewBox="0 0 16 16">
  <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5m2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5m3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0z"/>
  <path d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4zM2.5 3h11V2h-11z"/>
</svg>`;

(async () => {
	let storageCache = { favoriteQuotes: [] };

	const items = await chrome.storage.sync.get();
	Object.assign(storageCache, items);

	async function removeFavoriteQuote(quote) {
		storageCache.favoriteQuotes = storageCache.favoriteQuotes.filter(q => {
			return JSON.stringify(q) !== JSON.stringify(quote);
		});
		await chrome.storage.sync.set({
			favoriteQuotes: storageCache.favoriteQuotes,
		});
		rerenderQuotes(favoriteQuoteDisplay, storageCache.favoriteQuotes);
	}

	function rerenderQuotes(element, quotes) {
		favoriteQuoteDisplay.innerHTML = "";
		renderQuotes(element, quotes);
	}

	function renderFavoriteQuote(quote) {
		const renderedQuote = document.createElement("div");
		renderedQuote.classList.add("quote");

		const queryDisplay = document.createElement("p");
		queryDisplay.classList.add("query");
		queryDisplay.innerHTML = quote.query;

		const secondRow = document.createElement("div");
		secondRow.classList.add("flex-space-between");

		const date = new Date(quote.date);
		const dateDisplay = document.createElement("time");
		dateDisplay.classList.add("date");
		dateDisplay.dateTime = date.toISOString();
		dateDisplay.innerHTML = date.toLocaleDateString();

		const removeButton = document.createElement("button");
		removeButton.classList.add("remove-button");
		removeButton.innerHTML = emptyTrashIcon;
		removeButton.addEventListener("click", () =>
			removeFavoriteQuote(quote)
		);

		secondRow.append(dateDisplay, removeButton);

		const quoteDisplay = document.createElement("p");
		quoteDisplay.classList.add("quote-content");
		quoteDisplay.innerHTML = quote.quote;

		renderedQuote.append(queryDisplay, secondRow, quoteDisplay);
		return renderedQuote;
	}

	/**
	 * @param {HTMLElement} element the element which the quotes should be rendered on
	 * @param {Array} quotes
	 */
	function renderQuotes(element, quotes) {
		for (const quote of quotes.slice().reverse()) {
			element.append(renderFavoriteQuote(quote));
		}
	}

	/**
	 * @param {string} query
	 * @returns {Array} returns the array of all the favorite quotes that matches the query.
	 * It'll search based on either the query of the quote or the content of the quote.
	 */
	function searchFavoriteQuote(query) {
		const queryRegex = new RegExp(query, "gi");

		const matchedQuotes = storageCache.favoriteQuotes.filter(
			({ query: quoteQuery, quote }) =>
				queryRegex.test(quoteQuery) || queryRegex.test(quote)
		);

		return matchedQuotes.map(quote => ({
			...quote,
			query: quote.query.replace(
				queryRegex,
				match => `<span class="matched-query">${match}</span>`
			),
			quote: quote.quote.replace(
				queryRegex,
				match => `<span class="matched-query">${match}</span>`
			),
		}));
	}

	const favoriteQuoteDisplay = document.querySelector("#favorite-quotes");
	renderQuotes(favoriteQuoteDisplay, storageCache.favoriteQuotes);

	const searchQuoteInput = document.querySelector(".favorite-quote-search");
	searchQuoteInput.addEventListener("input", event => {
		const favoriteQuotes = searchFavoriteQuote(event.target.value);
		rerenderQuotes(favoriteQuoteDisplay, favoriteQuotes);
	});
})();
