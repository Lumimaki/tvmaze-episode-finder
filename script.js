
const searchButton = document.getElementById("searchButton");
const searchInput = document.getElementById("searchInput");
const results = document.getElementById("results");
const episodes = document.getElementById("episodes");

searchButton.addEventListener("click", searchShows);

async function searchShows() {
    const query = searchInput.value.trim();

    if (!query) {
        alert("Please enter a TV series name");
        return;
    }

    results.innerHTML = "";
    episodes.innerHTML = "";

    try {
        const response = await fetch(
            `https://api.tvmaze.com/search/shows?q=${encodeURIComponent(query)}`
        );

        if (!response.ok) {
            throw new Error("Search request failed");
        }

        const data = await response.json();

        if (data.length === 0) {
            results.textContent = "No shows found.";
            return;
        }

        data.forEach(item => {
            const show = item.show;

            const card = document.createElement("div");
            card.className = "show";

            const title = document.createElement("h3");
            title.textContent = show.name;

            const button = document.createElement("button");
            button.textContent = "View Episodes";
            button.addEventListener("click", () => {
                getEpisodes(show.id);
            });

            card.append(title, button);
            results.appendChild(card);
        });

    } catch (error) {
        results.textContent = "Unable to search shows. Please try again.";
        console.error(error);
    }
}

async function getEpisodes(showId) {
    episodes.textContent = "Loading episodes...";

    try {
        const response = await fetch(
            `https://api.tvmaze.com/shows/${showId}/episodes`
        );

        if (!response.ok) {
            throw new Error("Episode request failed");
        }

        const data = await response.json();
        episodes.innerHTML = "";

        data.forEach(episode => {
            const card = document.createElement("div");
            card.className = "episode";

            const title = document.createElement("h3");
            title.textContent = episode.name;

            const details = document.createElement("p");
            details.textContent =
                `Season ${episode.season} - Episode ${episode.number ?? "N/A"}`;

            card.append(title, details);
            episodes.appendChild(card);
        });

    } catch (error) {
        episodes.textContent = "Unable to load episodes.";
        console.error(error);
    }
}
