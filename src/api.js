import { ACCESS_TOKEN, EXPIRES_IN, logout, TOKEN_TYPE } from "./common";


const BASE_API_URL= import.meta.env.VITE_API_BASE_URL;

const getAccessToken = ()=>{
    const accessToken = localStorage.getItem(ACCESS_TOKEN);
    const expiresIn = localStorage.getItem(EXPIRES_IN);
    const tokenType = localStorage.getItem(TOKEN_TYPE);
    if(Date.now()<expiresIn){
        return {
            accessToken,tokenType
        }

    }else {
        logout();
    }
}



const createAPIConfig = ({ accessToken, tokenType }, method = "GET", body) => {
    const config = {
        headers: {
            Authorization: `${tokenType} ${accessToken}`,
            "Content-Type": "application/json"
        },
        method
    }
    if (body) {
        config.body = JSON.stringify(body);
    }
    return config;
}

export const fetchRequest = async (endpoint, method = "GET", body) => {
    const url = `${BASE_API_URL}/${endpoint}`;
    const result = await fetch(url, createAPIConfig(getAccessToken(), method, body));
    if (result.status === 204) return null; // Standard for PUT/DELETE
    return result.json();
}