(async () => {
	function renderFavoriteQuote(quote) {
		const renderedQuote = document.createElement("div");
		renderedQuote.classList.add("quote");

		const queryDisplay = document.createElement("p");
		queryDisplay.classList.add("query");
		queryDisplay.textContent = quote.query;

		const date = new Date(quote.date);
		const dateDisplay = document.createElement("time");
		dateDisplay.classList.add("date");
		dateDisplay.dateTime = date.toISOString();
		dateDisplay.textContent = date.toLocaleDateString();

		const quoteDisplay = document.createElement("p");
		quoteDisplay.classList.add("quote-content");
		quoteDisplay.textContent = quote.quote;

		renderedQuote.append(queryDisplay, dateDisplay, quoteDisplay);

		return renderedQuote;
	}

	let storageCache = { favoriteQuotes: [] };

	const items = await chrome.storage.sync.get();
	Object.assign(storageCache, items);

	console.log(storageCache);

	const favoriteQuotes = document.querySelector("#favorite-quotes");
	for (const quote of storageCache.favoriteQuotes) {
		favoriteQuotes.append(renderFavoriteQuote(quote));
	}
})();
