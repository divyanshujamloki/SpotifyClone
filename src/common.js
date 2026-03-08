export const ACCESS_TOKEN = "ACCESS_TOKEN";
export const TOKEN_TYPE = "TOKEN_TYPE";
export const EXPIRES_IN = "EXPIRES_IN";
export const NOW_PLAYING = "NOW_PLAYING";
export const LOADED_TRACKS = "LOADED_TRACKS";
export const LIKED_TRACKS = "LIKED_TRACKS";
const APP_URL = window.location.origin;
export const ENDPOINT = {
    userInfo: "me",
    featuredPlayist: "search?q=Global+Top+50&type=playlist&limit=8",
    toplists: "search?q=Pop+Hits+2024&type=playlist&limit=10",
    hindiRomantic: "search?q=Hindi+Romantic+2024&type=playlist&limit=5",
    workout: "search?q=Workout+Mix&type=playlist&limit=5",
    playlist: "playlists",
    userPlaylist: "me/playlists",
    search: "search",
    play: "me/player/play"
}

export const logout = () => {
    localStorage.removeItem(ACCESS_TOKEN);
    localStorage.removeItem(EXPIRES_IN);
    localStorage.removeItem(TOKEN_TYPE);
    window.location.href = `${APP_URL}/login/login.html`;
}

export const getItemFromLocalStorage = (key) => {
    return JSON.parse(localStorage.getItem(key));
}
export const setItemInLocalStorage = (key, value) => {
    return localStorage.setItem(key, JSON.stringify(value));
}

export const SECTIONTYPE = {
    DASHBOARD: "DASHBOARD",
    PLAYLIST: "PLAYLIST",
    SEARCH: "SEARCH",
    FAVORITE: "FAVORITE"
}