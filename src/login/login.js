import { ACCESS_TOKEN, EXPIRES_IN, TOKEN_TYPE } from "../common";

const client_id = import.meta.env.VITE_CLIENT_ID;
const redirect_uri = import.meta.env.VITE_REDIRECT_URI;
const APP_URL = window.location.origin;
const scopes = "user-top-read user-follow-read playlist-read-private user-library-read";

// PKCE Helpers
const generateRandomString = (length) => {
    let text = '';
    let possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < length; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
};

const generateCodeChallenge = async (codeVerifier) => {
    const data = new TextEncoder().encode(codeVerifier);
    const digest = await window.crypto.subtle.digest('SHA-256', data);
    return btoa(String.fromCharCode.apply(null, new Uint8Array(digest)))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');
};

const authorizeuser = async () => {
    const codeVerifier = generateRandomString(128);
    const codeChallenge = await generateCodeChallenge(codeVerifier);

    localStorage.setItem('code_verifier', codeVerifier);

    const params = new URLSearchParams({
        client_id,
        response_type: 'code',
        redirect_uri,
        scope: scopes,
        code_challenge_method: 'S256',
        code_challenge: codeChallenge,
        show_dialog: 'true'
    });

    const url = `https://accounts.spotify.com/authorize?${params.toString()}`;
    window.open(url, "login", "width=800,height=600");
}

document.addEventListener("DOMContentLoaded", () => {
    const loginbutton = document.getElementById("login-to-spotify");
    loginbutton.addEventListener("click", authorizeuser);

    window.setItemsInLocalStorage = ({ accessToken, tokenType, expiresIn }) => {
        localStorage.setItem(ACCESS_TOKEN, accessToken);
        localStorage.setItem(TOKEN_TYPE, tokenType);
        localStorage.setItem(EXPIRES_IN, (Date.now() + (expiresIn * 1000)));
        window.location.href = APP_URL;
    }

    window.addEventListener("load", async () => {
        const accessToken = localStorage.getItem(ACCESS_TOKEN);
        if (accessToken) {
            window.location.href = `${APP_URL}/dashboard/dashboard.html`;
        }

        if (window.opener !== null && !window.opener.closed) {
            window.focus();
            if (window.location.href.includes("error")) {
                window.close();
            }

            const urlParams = new URLSearchParams(window.location.search);
            const code = urlParams.get('code');

            if (code) {
                const codeVerifier = localStorage.getItem('code_verifier');
                
                const body = new URLSearchParams({
                    grant_type: 'authorization_code',
                    code: code,
                    redirect_uri: redirect_uri,
                    client_id: client_id,
                    code_verifier: codeVerifier
                });

                try {
                    const response = await fetch('https://accounts.spotify.com/api/token', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/x-www-form-urlencoded'
                        },
                        body: body
                    });

                    const data = await response.json();
                    if (data.access_token) {
                        window.close();
                        window.opener.setItemsInLocalStorage({
                            accessToken: data.access_token,
                            tokenType: data.token_type,
                            expiresIn: data.expires_in
                        });
                    }
                } catch (error) {
                    console.error('Error exchanging code for token:', error);
                    window.close();
                }
            }
        }
    });
});
