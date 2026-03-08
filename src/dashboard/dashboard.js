import { fetchRequest } from "../api";
import { ENDPOINT, getItemFromLocalStorage, LOADED_TRACKS, logout, NOW_PLAYING, SECTIONTYPE, setItemInLocalStorage, LIKED_TRACKS } from "../common";
let displayName = "Guest";
const audio = new Audio();
const onProfileClick = (event) => {
    event.stopPropagation();
    const profileMenu = document.querySelector("#profile-menu");
    profileMenu.classList.toggle("hidden");
    if (!profileMenu.classList.contains("hidden")) {
        profileMenu.querySelector("li#logout").addEventListener("click", logout)
    }
}

const loadUserProfile = () => {
    return new Promise(async (resolve, reject) => {
        const defaultImage = document.querySelector("#default-image");
        const profileButton = document.querySelector("#user-profile-btn");
        const displayNameElement = document.querySelector("#display-name")
        const profileData = await fetchRequest(ENDPOINT.userInfo);
        const name = profileData.display_name;
        const images = profileData.images;
        displayName = name;

        if (images?.length) {
            defaultImage.classList.add("hidden");
        } else {
            defaultImage.classList.remove("hidden")
        }

        profileButton.addEventListener("click", onProfileClick)
        displayNameElement.textContent = displayName;
        resolve({ displayName, images });
    })
}

const onPlaylistItemClicked = (event, id) => {
    console.log(event.target);
    const section = { type: SECTIONTYPE.PLAYLIST, playlist: id }
    history.pushState(section, "", `playlist/${id}`);
    loadSection(section);
}

const loadPlaylist = async (endpoint, elementId) => {
    try {
        const result = await fetchRequest(endpoint);
        const items = result?.playlists?.items || [];
        const playlistItemsSection = document.querySelector(`#${elementId}`);
        if (!playlistItemsSection) return;

        playlistItemsSection.innerHTML = ""; // Clear existing

        for (let item of items.filter(item => item !== null)) {
            const { name, description, images, id } = item;
            const playlistItem = document.createElement("section");
            playlistItem.className = "bg-black-secondary rounded p-4 hover:cursor-pointer hover:bg-light-black";
            playlistItem.id = id;
            playlistItem.setAttribute("data-type", "playlist");
            playlistItem.addEventListener("click", (event) => onPlaylistItemClicked(event, id));
            const imageUrl = images?.[0]?.url || "";
            playlistItem.innerHTML = `<img src="${imageUrl}" alt="${name}" class="rounded mb-2 object-contain shadow" />
                <h2 class="text-base font-semibold mb-4 truncate">${name}</h2>
                <h3 class="text-sm text-secondary line-clamp-2">${description}</h3>`;

            playlistItemsSection.appendChild(playlistItem);
        }
    } catch (error) {
        console.error("Error loading playlist:", error);
    }
}

const loadPlaylists = () => {
    loadPlaylist(ENDPOINT.featuredPlayist, "featured-playlist-items");
    loadPlaylist(ENDPOINT.hindiRomantic, "hindi-playlist-items");
    loadPlaylist(ENDPOINT.workout, "workout-playlist-items");
    loadPlaylist(ENDPOINT.toplists, "top-playlist-items");
    // Specific search for popular full-length tracks
    loadPlaylist("search?q=Hindi+Punjabi+Top+2024&type=playlist&limit=1", "mustplay-playlist-items");
    loadPlaylist("search?q=Top+50+Global+2024&type=playlist&limit=1", "demo-playlist-items");
}

const playDemoSong = () => {
    const demoTrack = {
        id: "demo-sample",
        name: "Demo Sample Track",
        artistNames: "Open Source Audio",
        image: { url: "/assets/Spotify_Icon_RGB_Green.png" },
        previewUrl: "https://www.learningcontainer.com/wp-content/uploads/2020/02/Sample-OGG-File.ogg",
        duration: 30000
    };
    playTrack(null, demoTrack);
}

const fillContentForDashboard = () => {
    const coverElement = document.querySelector("#cover-content");
    // Standard flex column, no absolute positioning or overlapping items-end
    coverElement.className = "relative bg-gradient-to-b from-gray to-black-base p-10 flex flex-col justify-center min-h-[300px]";
    
    coverElement.innerHTML = `
        <div class="flex flex-col gap-8">
            <h1 class="text-4xl md:text-5xl font-black text-white">What's up, ${displayName}</h1>
            <div class="flex flex-wrap gap-4">
                <button id="play-demo-btn" class="bg-[#1DB954] hover:brightness-110 text-black px-10 py-4 rounded-full font-bold text-lg transition-all flex items-center gap-3 shadow-xl uppercase">
                    <span class="material-symbols-outlined text-2xl">play_circle</span> Try Demo Song
                </button>
                <div class="text-xs text-secondary max-w-xs flex items-center">
                    Note: If clicking songs doesn't work, try logging out and back in to refresh permissions.
                </div>
            </div>
        </div>
    `;
    
    setTimeout(() => {
        const btn = document.querySelector("#play-demo-btn");
        if (btn) {
            btn.onclick = (e) => {
                e.preventDefault();
                console.log("Demo triggered");
                playDemoSong();
            };
        }
    }, 200);
    

    const pageContent = document.querySelector("#page-content");
    const playlistMap = new Map([
        ["ready to play (demo)", "demo-playlist-items"],
        ["MustPlay 🔥 (Free Full Songs)", "mustplay-playlist-items"],
        ["top hindi romantics", "hindi-playlist-items"],
        ["workout mix", "workout-playlist-items"],
        ["featured playlists", "featured-playlist-items"], 
        ["pop hits", "top-playlist-items"]
    ]);
    let innerHTML = "";
    for (let [type, id] of playlistMap) {
        innerHTML += `
        <article class="p-8">
          <h2 class="mb-6 text-2xl font-bold capitalize text-white opacity-90">${type}</h2>
          <section id="${id}" class="featured-songs grid grid-cols-auto-fill-cards gap-6 min-h-[100px]">
           <!-- Playlists will load here -->
          </section>
        </article>
        `
    }
    pageContent.innerHTML = innerHTML;
}

const formatTime = (duration) => {
    if (!duration || isNaN(duration)) return "0:00";
    const min = Math.floor(duration / 60_000);
    const sec = ((duration % 60_000) / 1000).toFixed(0);
    const formattedTime = sec == 60 ?
        min + 1 + ":00" : min + ":" + (sec < 10 ? "0" : "") + sec;
    return formattedTime;
}

const onTrackSelection = (id, event) => {
    document.querySelectorAll("#tracks .track").forEach(trackItem => {
        if (trackItem.id === id) {
            trackItem.classList.add("bg-gray", "selected");
        } else {
            trackItem.classList.remove("bg-gray", "selected");
        }
    })
}

const toggleFavorite = (event, track) => {
    event.stopPropagation();
    let likedTracks = getItemFromLocalStorage(LIKED_TRACKS) || [];
    const index = likedTracks.findIndex(t => t.id === track.id);
    if (index > -1) {
        likedTracks.splice(index, 1);
        event.target.textContent = "favorite_border";
        event.target.classList.remove("text-green");
    } else {
        // Ensure duration key matches duration_ms for consistency
        const normalizedTrack = { ...track, duration_ms: track.duration || track.duration_ms };
        likedTracks.push(normalizedTrack);
        event.target.textContent = "favorite";
        event.target.classList.add("text-green");
    }
    setItemInLocalStorage(LIKED_TRACKS, likedTracks);
}


const onAudioMetadataLoaded = () => {
    const totalSongDuration = document.querySelector("#total-song-duration");
    totalSongDuration.textContent = formatTime(audio.duration * 1000);
}

const updateIconsForPauseMode = (id) => {
    const playButton = document.querySelector("#play");

    playButton.querySelector("span").textContent = "play_circle";
    const playButtonFromTracks = document.querySelector(`#play-track-${id}`);
    if (playButtonFromTracks) {
        playButtonFromTracks.textContent = "play_arrow";
    }
}

const updateIconsForPlayMode = (id) => {
    const playButton = document.querySelector("#play");

    playButton.querySelector("span").textContent = "pause_circle";
    const playButtonFromTracks = document.querySelector(`#play-track-${id}`);
    if (playButtonFromTracks) {
        playButtonFromTracks.textContent = "pause";
    }
}

const playMustPlay = async (event, { name, artistNames, image, id }) => {
    if (event?.stopPropagation) event.stopPropagation();
    
    // Show info immediately so user knows what's being attempted
    setNowPlayingInfo({ image, id, name, artistNames });
    
    const songTitleElement = document.querySelector("#now-playing-song");
    const originalInfo = songTitleElement.textContent;
    songTitleElement.textContent = "⚡ searching full version...";
    document.querySelector("#song-info").classList.remove("invisible");

    // Clean query for better matching
    const cleanName = name.split('(')[0].trim();
    const cleanArtist = artistNames.split(',')[0].trim();
    const query = encodeURIComponent(`${cleanName} ${cleanArtist}`);
    
    try {
        // Use the LOCAL PROXY we just set up in vite.config.js
        const localProxyUrl = `/saavn-api/api/search/songs?query=${query}`;
        
        console.log("MustPlay fetching via local proxy:", localProxyUrl);
        const response = await fetch(localProxyUrl);
        
        if (!response.ok) throw new Error("Local Proxy Failed");
        
        const data = await response.json();
        
        if (data.success && data.data.results.length > 0) {
            const bestMatch = data.data.results[0];
            // Find best quality download URL
            const stream = bestMatch.downloadUrl.find(d => d.quality === '320kbps') || 
                           bestMatch.downloadUrl[bestMatch.downloadUrl.length - 1];
            
            // Get best quality image from Saavn
            const saavnImage = bestMatch.image?.[bestMatch.image.length - 1]?.url || image.url;
            
            setNowPlayingInfo({ 
                image: { url: saavnImage }, 
                id: `mp-${bestMatch.id}`, 
                name: bestMatch.name, 
                artistNames: bestMatch.artists.primary?.[0]?.name || bestMatch.artists.all?.[0]?.name || artistNames
            });
            
            audio.src = stream.url;
            audio.play().catch(() => {
                console.log("Autoplay failed, user must click play");
            });
        } else {
            console.warn("No full version found on Saavn.");
            songTitleElement.textContent = name; // Restore name
            if (originalInfo.includes("⚡")) songTitleElement.textContent = name;
        }
    } catch (err) {
        console.error("MustPlay Proxy Error:", err);
        songTitleElement.textContent = name; // Restore name
    }
}

const playTrack = async (event, trackData) => {
    const { image, id, name, artistNames, previewUrl, uri } = trackData;
    if (event?.stopPropagation) {
        event.stopPropagation();
    }
    console.log("PLAY REQUEST:", { name, id, uri });
    
    // Update UI immediately
    setNowPlayingInfo({ image, id, name, artistNames });

    // Attempt official Player API first
    if (uri && !id.includes("demo")) {
        try {
            await fetchRequest(ENDPOINT.play, "PUT", { uris: [uri] });
            console.log("SENT PLAY REQUEST TO SPOTIFY PLAYER");
            return;
        } catch (err) {
            console.warn("Spotify Player API failed. Using web preview / MustPlay.");
        }
    }

    // Fallback logic
    if (audio.src === previewUrl && previewUrl) {
        togglePlay();
    } else {
        if (!previewUrl && !id.includes("demo")) {
            console.log("No preview URL found, triggering MustPlay auto-search...");
            return playMustPlay(null, trackData);
        }
        
        console.log("Playing local preview:", name);
        audio.src = previewUrl;
        audio.play().catch(err => {
            console.error("Playback error:", err);
            // If even preview fails, try MustPlay as last resort
            if (!id.includes("demo")) playMustPlay(null, trackData);
        });
    }
}

const setNowPlayingInfo = ({ image, id, name, artistNames }) => {
    const audioControl = document.querySelector("#audio-control");
    const songTitle = document.querySelector("#now-playing-song");
    const nowPlayingSongImage = document.querySelector("#now-playing-image");
    const artists = document.querySelector("#now-playing-artists");
    const songInfo = document.querySelector("#song-info");

    nowPlayingSongImage.src = image.url;
    nowPlayingSongImage.onerror = () => { nowPlayingSongImage.src = "/assets/Spotify_Icon_RGB_Green.png"; };
    audioControl.setAttribute("data-track-id", id);
    songTitle.textContent = name;
    artists.textContent = artistNames;
    songInfo.classList.remove("invisible");
}

const loadPlaylistTracks = ({ tracks }) => {
    const trackSections = document.querySelector("#tracks");
    let trackNo = 1;
    const allTracks = tracks.items.filter(item => item?.track);
    let loadedTracks = [];
    console.log("Total tracks found:", allTracks.length)    
    for (let trackItem of allTracks) {
        try {
            let { id, artists, name, album, duration_ms: duration, preview_url: previewUrl } = trackItem.track;
            if (!duration) duration = trackItem.track.duration || 0;
            
            let track = document.createElement("section");
            track.id = id;
            track.className = "track p-3 grid grid-cols-[50px_1fr_1fr_120px_50px] items-center justify-items-start gap-4 rounded-md hover:bg-[#282828] transition-all cursor-pointer group";
            // Don't dim tracks without preview — MustPlay can still play them
            
            const albumImages = album?.images || [];
            let image = albumImages.find(img => img.height <= 64) || albumImages[0] || { url: "/assets/Spotify_Icon_RGB_Green.png" };
            let artistNames = Array.from(artists || [], artist => artist.name).join(", ");
            
            track.innerHTML = `
                <div class="relative w-full h-full flex items-center justify-center">
                    <span class="track-no text-secondary text-sm group-hover:opacity-0 transition-opacity">${trackNo++}</span>
                    <span class="play-indicator absolute inset-0 flex items-center justify-center material-symbols-outlined text-white text-xl opacity-0 group-hover:opacity-100 transition-opacity">play_arrow</span>
                </div>
                <section class="grid grid-cols-[auto_1fr] place-items-center gap-4">
                    <img class="h-10 w-10 rounded shadow" src="${image.url}" alt="${name}" />
                    <article class="flex flex-col justify-center">
                        <h2 class="text-base text-white font-medium line-clamp-1 song-title">${name}</h2>
                        <p class="text-sm text-secondary line-clamp-1 hover:underline cursor-pointer">${artistNames}</p>
                    </article>
                </section>
                <p class="text-sm text-secondary line-clamp-1 hover:text-white cursor-pointer">${album?.name || "Unknown Album"}</p>
                <div class="actions flex items-center gap-4">
                    <!-- Added via JS -->
                </div>
                <p class="text-sm text-secondary font-mono">${formatTime(duration)}</p>
            `;

            const actionSection = track.querySelector(".actions");

            // MustPlay Icon
            const mustPlayButton = document.createElement("button");
            mustPlayButton.className = "material-symbols-outlined text-2xl text-secondary hover:text-green-400 transition-all hover:scale-110";
            mustPlayButton.textContent = "bolt";
            mustPlayButton.title = "MustPlay: Play Full Version For Free";
            mustPlayButton.onclick = (e) => playMustPlay(e, { name, artistNames, image, id });
            actionSection.appendChild(mustPlayButton);

            // Favorite Icon
            const favButton = document.createElement("button");
            const likedTracks = getItemFromLocalStorage(LIKED_TRACKS) || [];
            const isLiked = likedTracks.some(t => t.id === id);
            const uri = trackItem.track.uri;
            favButton.className = `material-symbols-outlined text-xl hover:scale-110 transition-all ${isLiked ? 'text-green' : 'text-secondary'}`;
            favButton.textContent = isLiked ? "favorite" : "favorite_border";
            favButton.onclick = (e) => toggleFavorite(e, { id, artists, name, album, duration, previewUrl, artistNames, image, uri });
            actionSection.appendChild(favButton);

            // Click row or play-indicator to play
            track.onclick = (event) => {
                const clickedButton = event.target.closest('button');
                if (!clickedButton) {
                    playTrack(event, { image, id, name, artistNames, previewUrl, uri });
                }
            };

            trackSections.appendChild(track);
            loadedTracks.push({ id, artists, name, album, duration, previewUrl, artistNames, image, uri });
        } catch (trackError) {
            console.warn("Skipping track due to load error:", trackError);
        }
    }

    setItemInLocalStorage(LOADED_TRACKS, loadedTracks);

}

const fillContentForPlaylist = async (playlistId) => {
    const playlist = await fetchRequest(`${ENDPOINT.playlist}/${playlistId}`)
    const { name, description, images, tracks } = playlist;
    const coverElement = document.querySelector("#cover-content");
    
    // Modern flex-based layout for playlist header
    coverElement.className = "relative bg-gradient-to-b from-gray to-black-base p-8 min-h-[300px] flex items-end gap-6";
    coverElement.innerHTML = `
        <img class="h-44 w-44 md:h-56 md:w-56 object-contain shadow-2xl" src="${images[0].url}" alt="${name}" />
        <section class="flex flex-col justify-end gap-2">
          <span class="text-xs font-bold uppercase">Playlist</span>
          <h2 id="playlist-name" class="text-4xl md:text-6xl font-black text-white">${name}</h2>
          <div class="flex items-center gap-2 text-sm text-secondary">
            <span class="font-bold text-white">${displayName}</span>
            <span>• ${tracks.items.length} songs</span>
          </div>
        </section>
    `
    const pageContent = document.querySelector("#page-content");
    pageContent.innerHTML = `
    <header id="playlist-header" class="mx-8 border-secondary border-b-[0.5px] z-10">
            <nav class="py-2">
              <ul class="grid grid-cols-[50px_1fr_1fr_120px_50px] gap-4 text-secondary text-xs font-medium uppercase tracking-widest">
                <li class="justify-self-center">#</li>
                <li>Title</li>
                <li>Album</li>
                <li>MustPlay</li>
                <li class="material-symbols-outlined text-sm">schedule</li>
              </ul>
            </nav>
    </header>
    <section class="px-8 text-secondary mt-4" id="tracks">
    </section>
    `
    loadPlaylistTracks(playlist)
}

const onContentScroll = (event) => {

    const { scrollTop } = event.target;
    const header = document.querySelector(".header");
    const coverElement = document.querySelector("#cover-content");
    const totalHeight = coverElement.offsetHeight;
    const fiftyPercentHeight = totalHeight / 2;
    const coverOpacity = 100 - (scrollTop >= totalHeight ? 100 : (scrollTop / totalHeight) * 100);
    coverElement.style.opacity = `${coverOpacity}%`;

    let headerOpacity = 0;
    // once 50% of cover element is crossed, start increasing the opacity
    if (scrollTop >= fiftyPercentHeight && scrollTop <= totalHeight) {
        let totatDistance = totalHeight - fiftyPercentHeight;
        let coveredDistance = scrollTop - fiftyPercentHeight;
        headerOpacity = (coveredDistance / totatDistance) * 100;
    } else if (scrollTop > totalHeight) {
        headerOpacity = 100;
    } else if (scrollTop < fiftyPercentHeight) {
        headerOpacity = 0;
    }
    header.style.background = `rgba(0 0 0 / ${headerOpacity}%)`

    if (history.state.type === SECTIONTYPE.PLAYLIST) {
        const playlistHeader = document.querySelector("#playlist-header");
        if (headerOpacity >= 60) {
            playlistHeader.classList.add("sticky", "bg-black-secondary", "px-8");
            playlistHeader.classList.remove("mx-8");
            playlistHeader.style.top = `${header.offsetHeight}px`;

        } else {
            playlistHeader.classList.remove("sticky", "bg-black-secondary", "px-8");
            playlistHeader.classList.add("mx-8");
            playlistHeader.style.top = `revert`;

        }

    }

}
const togglePlay = () => {
    if (audio.src) {
        if (audio.paused) {
            audio.play();
        } else {
            audio.pause();
        }
    }
}

const findCurrentTrack = () => {
    const audioControl = document.querySelector("#audio-control");
    const trackId = audioControl.getAttribute("data-track-id");
    if (trackId) {
        const loadedTracks = getItemFromLocalStorage(LOADED_TRACKS);
        const currentTrackIndex = loadedTracks?.findIndex(track => track.id === trackId);
        return { currentTrackIndex, tracks: loadedTracks };


    }
    return null;
}

const playPrevTrack = () => {
    const { currentTrackIndex = -1, tracks = null } = findCurrentTrack() ?? {};
    if (currentTrackIndex > 0) {
        const prevTrack = tracks[currentTrackIndex - 1];
        playTrack(null, prevTrack);
    }
}

const playNextTrack = () => {
    const { currentTrackIndex = -1, tracks = null } = findCurrentTrack() ?? {};
    if (currentTrackIndex > -1 && currentTrackIndex < tracks?.length - 1) {
        const currentTrack = tracks[currentTrackIndex + 1];
        playTrack(null, currentTrack);
    }
}

const loadFavorites = () => {
    const likedTracks = getItemFromLocalStorage(LIKED_TRACKS) || [];
    const coverElement = document.querySelector("#cover-content");
    coverElement.innerHTML = `<h1 class="text-6xl font-bold">Your Favorites</h1><p class="text-xl">${likedTracks.length} songs</p>`;

    const pageContent = document.querySelector("#page-content");
    pageContent.innerHTML = `
    <header id="playlist-header" class="mx-8 border-secondary border-b-[0.5px] z-10">
            <nav class="py-2">
              <ul class="grid grid-cols-[50px_1fr_1fr_50px] gap-4 text-secondary">
                <li class="justify-self-center">#</li>
                <li>Title</li>
                <li>Album</li>
                <li class="material-symbols-outlined">schedule</li>
              </ul>
            </nav>
    </header>
    <section class="px-8 text-secondary mt-4" id="tracks"></section>`;

    loadPlaylistTracks({ tracks: { items: likedTracks.map(t => ({ track: t })) } });
}

const onSearch = async (query) => {
    if (!query) return;
    const result = await fetchRequest(`${ENDPOINT.search}?q=${encodeURIComponent(query)}&type=track&limit=20`);
    const pageContent = document.querySelector("#page-content");
    pageContent.innerHTML = `
    <h1 class="px-8 text-2xl font-bold mb-4">Search Results for "${query}"</h1>
    <section class="px-8 text-secondary mt-4" id="tracks"></section>`;
    loadPlaylistTracks({ tracks: { items: result.tracks.items.map(t => ({ track: t })) } });
}

const loadSection = (section) => {
    const searchContainer = document.querySelector("#search-container");
    if (section.type === SECTIONTYPE.SEARCH) {
        searchContainer.classList.remove("hidden");
        const coverElement = document.querySelector("#cover-content");
        coverElement.innerHTML = `<h1 class="text-6xl font-bold">Search</h1>`;
        document.querySelector("#page-content").innerHTML = `<p class="p-8 text-secondary">Start typing to search for music...</p>`;
    } else {
        searchContainer.classList.add("hidden");
    }

    if (section.type === SECTIONTYPE.DASHBOARD) {
        fillContentForDashboard();
        loadPlaylists();
    } else if (section.type === SECTIONTYPE.PLAYLIST) {
        fillContentForPlaylist(section.playlist);
    } else if (section.type === SECTIONTYPE.FAVORITE) {
        loadFavorites();
    }

    document.querySelector(".content").removeEventListener("scroll", onContentScroll);
    document.querySelector(".content").addEventListener("scroll", onContentScroll);
}
const onUserPlaylistClick = (id) => {
    const section = { type: SECTIONTYPE.PLAYLIST, playlist: id };
    history.pushState(section, "", `/playlist/${id}`);
    loadSection(section);
}
const loadUserPlaylist = async () => {
    const playlists = await fetchRequest(ENDPOINT.userPlaylist);
    console.log(playlists);
    const userPlaylist = document.querySelector("#user-playlists >ul");
    userPlaylist.innerHTML = "";
    for (let { name, id } of playlists.items) {
        const li = document.createElement("li");
        li.textContent = name;
        li.className = "cursor-pointer hover:text-primary "
        li.addEventListener("click", () => onUserPlaylistClick(id));
        userPlaylist.appendChild(li);
    }
}

document.addEventListener("DOMContentLoaded", async () => {
    const volume = document.querySelector("#volume");
    const playButton = document.querySelector("#play");
    const nextTrack = document.querySelector("#next");
    const prevTrack = document.querySelector("#prev");
    const songDurationCompleted = document.querySelector("#song-duration-completed");
    const songProgress = document.querySelector("#progress");
    const timeline = document.querySelector("#timeline");
    const audioControl = document.querySelector("#audio-control");

    let progressInterval;

    loadUserProfile().then(({ displayName: name }) => {
        displayName = name;
        localStorage.setItem("DISPLAY_NAME", name);
        if (history.state?.type === SECTIONTYPE.DASHBOARD) {
            fillContentForDashboard();
        }
    });

    // Sidebar Navigation
    document.querySelector("#nav-home").addEventListener("click", () => {
        const section = { type: SECTIONTYPE.DASHBOARD };
        history.pushState(section, "", "/dashboard/dashboard.html");
        loadSection(section);
    });

    document.querySelector("#nav-search").addEventListener("click", () => {
        const section = { type: SECTIONTYPE.SEARCH };
        history.pushState(section, "", "/dashboard/search");
        loadSection(section);
    });

    document.querySelector("#nav-library").addEventListener("click", () => {
        loadUserPlaylist();
    });

    document.querySelector("#nav-favorite").addEventListener("click", () => {
        const section = { type: SECTIONTYPE.FAVORITE };
        history.pushState(section, "", "/dashboard/favorite");
        loadSection(section);
    });

    // Search Input Logic
    const searchInput = document.querySelector("#search-input");
    let searchTimeout;
    searchInput.addEventListener("input", (e) => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            onSearch(e.target.value);
        }, 500);
    });

    // Profile Menu Navigation
    document.querySelector("#menu-account").addEventListener("click", () => {
        window.location.href = "../pages/account/account.html";
    });
    document.querySelector("#menu-profile").addEventListener("click", () => {
        window.location.href = "../pages/profile/profile.html";
    });
    document.querySelector("#menu-support").addEventListener("click", () => {
        window.location.href = "../pages/support/support.html";
    });

    loadUserPlaylist();
    const initialSection = { type: SECTIONTYPE.DASHBOARD };
    history.replaceState(initialSection, "", "");
    loadSection(initialSection);
    document.addEventListener("click", () => {
        const profileMenu = document.querySelector("#profile-menu");
        if (!profileMenu.classList.contains("hidden")) {
            profileMenu.classList.add("hidden")
        }
    })

    audio.addEventListener("loadedmetadata", onAudioMetadataLoaded);
    audio.addEventListener("play", () => {
        const selectedTrackId = audioControl.getAttribute("data-track-id");
        const tracks = document.querySelector("#tracks");
        const playingTrack = tracks?.querySelector(`section.playing`);
        const selectedTrack = tracks?.querySelector(`[id="${selectedTrackId}"]`);
        if (playingTrack?.id !== selectedTrack?.id) {
            playingTrack?.classList.remove("playing");
        }
        selectedTrack?.classList.add("playing");

        progressInterval = setInterval(() => {
            if (audio.paused) {
                return
            }
            songDurationCompleted.textContent = formatTime(audio.currentTime * 1000);
            songProgress.style.width = `${(audio.currentTime / audio.duration) * 100}%`;
        }, 100);
        updateIconsForPlayMode(selectedTrackId);
    });
    audio.addEventListener("pause", () => {
        if (progressInterval) {
            clearInterval(progressInterval);
        }
        const selectedTrackId = audioControl.getAttribute("data-track-id");
        updateIconsForPauseMode(selectedTrackId);
    })

    audio.addEventListener("error", (e) => {
        console.error("Audio Playback Error:", e);
        const songTitle = document.querySelector("#now-playing-song");
        if (songTitle) {
            songTitle.textContent = "⚠️ Error playing this track";
        }
    });

    volume.addEventListener("change", () => {
        audio.volume = volume.value / 100;
    })

    timeline.addEventListener("click", (e) => {
        const timelineWidth = window.getComputedStyle(timeline).width;
        const timeToSeek = (e.offsetX / parseInt(timelineWidth)) * audio.duration;
        audio.currentTime = timeToSeek;
        songProgress.style.width = `${(audio.currentTime / audio.duration) * 100}%`;
    }, false);

    playButton.addEventListener("click", togglePlay);
    prevTrack.addEventListener("click", playPrevTrack);
    nextTrack.addEventListener("click", playNextTrack)

    window.addEventListener("popstate", (event) => {
        console.log(event);
        loadSection(event.state);
    })
})