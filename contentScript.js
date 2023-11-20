(() => {
    async function chatgptQuote(prompt) {
        let response = await fetch(
            "https://api.openai.com/v1/chat/completions",
            {
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
                            content: `Generate a quote that is relevant to ${prompt} that is under 25 words`,
                        },
                    ],
                    temperature: 0.7,
                    max_tokens: 25,
                }),
            }
        );

        let data = await response.json();
        data = data.choices[0].message.content;
        return data;
    }

    async function setQuote(element, prompt, onFinish) {
        const quote = await chatgptQuote(prompt);
        onFinish();
        element.textContent = quote;
    }

    function hasComplementaryResult() {
        const element = document.querySelector(".TQc1id.rhstc4");

        return element !== null;
    }

    chrome.runtime.onMessage.addListener((obj, sender, response) => {
        const { type, query } = obj;
        const isInIframe = window.top !== window.self;

        if (type === "SEARCH" && !isInIframe) {
            const div = document.createElement("div");
            div.id = "quote-output";
            div.className = `${hasComplementaryResult() ? "far" : "close"}`;
            document.body.append(div);

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
            setQuote(text, query, () => {
                clearInterval(intervalId);
            });

            // text.textContent = "Quote generation is disabled";
            div.append(text);
        }
    });
})();
