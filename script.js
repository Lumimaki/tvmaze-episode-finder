const searchForm = document.getElementById("searchForm");
const searchInput = document.getElementById("searchInput");
const results = document.getElementById("results");
const episodes = document.getElementById("episodes");
const resultsMessage = document.getElementById("resultsMessage");
const episodesMessage = document.getElementById("episodesMessage");
const resultCount = document.getElementById("resultCount");
const episodeCount = document.getElementById("episodeCount");
const episodesHeading = document.getElementById("episodes-heading");

let searchRequest;
let episodeRequest;

searchForm.addEventListener("submit", searchShows);

function updateCount(element, count, label) {
    element.hidden = count === 0;
    element.textContent = count ? `${count} ${label}${count === 1 ? "" : "s"}` : "";
}

function createShowCard(show) {
    const card = document.createElement("article");
    card.className = "show";

    const poster = document.createElement("div");
    poster.className = "show-poster";
    poster.setAttribute("aria-hidden", "true");
    const initial = Array.from(show.name.trim())[0] ?? "▶";
    poster.textContent = initial;

    if (show.image?.medium) {
        const image = document.createElement("img");
        image.alt = "";
        image.loading = "lazy";
        image.addEventListener("error", () => {
            poster.textContent = initial;
        });
        image.src = show.image.medium;
        poster.replaceChildren(image);
    }

    const content = document.createElement("div");
    const title = document.createElement("h3");
    title.textContent = show.name;

    const details = document.createElement("p");
    details.textContent = [show.premiered?.slice(0, 4), show.network?.name ?? show.webChannel?.name]
        .filter(Boolean)
        .join(" · ");
    details.hidden = !details.textContent;

    const button = document.createElement("button");
    button.type = "button";
    button.textContent = "View episodes";
    button.setAttribute("aria-controls", "episode-panel");
    button.setAttribute("aria-pressed", "false");
    button.addEventListener("click", () => {
        results.querySelector('[aria-pressed="true"]')?.setAttribute("aria-pressed", "false");
        button.setAttribute("aria-pressed", "true");
        getEpisodes(show);
        episodesHeading.focus({ preventScroll: !window.matchMedia("(max-width: 740px)").matches });
    });

    content.append(title, details, button);
    card.append(poster, content);
    return card;
}

async function searchShows(event) {
    event.preventDefault();
    const query = searchInput.value.trim();

    if (!query) {
        searchInput.value = "";
        searchInput.reportValidity();
        return;
    }

    searchRequest?.abort();
    episodeRequest?.abort();
    searchRequest = new AbortController();
    const { signal } = searchRequest;

    results.replaceChildren();
    episodes.replaceChildren();
    episodesHeading.textContent = "Episodes";
    updateCount(resultCount, 0, "show");
    updateCount(episodeCount, 0, "episode");
    results.setAttribute("aria-busy", "true");
    episodes.setAttribute("aria-busy", "false");
    resultsMessage.textContent = "Searching for shows…";
    episodesMessage.textContent = "Choose a show to see its episodes.";

    try {
        const response = await fetch(
            `https://api.tvmaze.com/search/shows?q=${encodeURIComponent(query)}`,
            { signal }
        );

        if (!response.ok) {
            throw new Error("Search request failed");
        }

        const data = await response.json();
        if (signal.aborted) return;

        results.replaceChildren(...data.map(item => createShowCard(item.show)));
        updateCount(resultCount, data.length, "show");
        resultsMessage.textContent = data.length ? "" : "No shows found. Try another title.";
    } catch (error) {
        if (signal.aborted) return;

        resultsMessage.textContent = "Unable to search shows. Please try again.";
        console.error(error);
    } finally {
        if (!signal.aborted) results.setAttribute("aria-busy", "false");
    }
}

async function getEpisodes(show) {
    episodeRequest?.abort();
    episodeRequest = new AbortController();
    const { signal } = episodeRequest;

    episodes.replaceChildren();
    episodesHeading.textContent = `${show.name} episodes`;
    updateCount(episodeCount, 0, "episode");
    episodes.setAttribute("aria-busy", "true");
    episodesMessage.textContent = "Loading episodes…";

    try {
        const response = await fetch(
            `https://api.tvmaze.com/shows/${show.id}/episodes`,
            { signal }
        );

        if (!response.ok) {
            throw new Error("Episode request failed");
        }

        const data = await response.json();
        if (signal.aborted) return;

        const list = document.createDocumentFragment();
        data.forEach(episode => {
            const card = document.createElement("article");
            card.className = "episode";

            const title = document.createElement("h3");
            title.textContent = episode.name;

            const details = document.createElement("p");
            details.textContent = `Season ${episode.season} · Episode ${episode.number ?? "N/A"}`;

            card.append(title, details);
            list.appendChild(card);
        });

        episodes.appendChild(list);
        updateCount(episodeCount, data.length, "episode");
        episodesMessage.textContent = data.length ? "" : "No episodes are listed for this show.";
    } catch (error) {
        if (signal.aborted) return;

        episodesMessage.textContent = "Unable to load episodes. Please try again.";
        console.error(error);
    } finally {
        if (!signal.aborted) episodes.setAttribute("aria-busy", "false");
    }
}
