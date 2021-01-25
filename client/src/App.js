import './App.css';
import { useEffect, useState } from 'react';
import SpotifyWebApi from 'spotify-web-api-js';

function App() {
    const getHashParams = () => {
        var hashParams = {};
        var e,
            r = /([^&;=]+)=?([^&;]*)/g,
            q = window.location.hash.substring(1);
        while ((e = r.exec(q))) {
            hashParams[e[1]] = decodeURIComponent(e[2]);
        }
        return hashParams;
    };

    const spotifyApi = new SpotifyWebApi();
    const params = getHashParams();
    const [loggedIn, setLoggedIn] = useState(params.access_token ? true : false);
    const [nowPlaying, setNowPlaying] = useState({
        name: 'Not Checked',
        image: '',
    });

    useEffect(() => {
        if (params.access_token) {
            spotifyApi.setAccessToken(params.access_token);
            getNowPlaying();
            getUserProfile();
            // checkPlaylistSkip();
        }
    }, []);

    const getNowPlaying = () => {
        spotifyApi.getMyCurrentPlaybackState().then((response) => {
            setNowPlaying({
                name: response.item.name,
                image: response.item.album.images[0].url,
            });
        });
    };

    const getUserProfile = async () => {
        // get profile and set user
        let userInfo = await spotifyApi.getMe();

        // check if playlist exists
        let response = await fetch('https://api.spotify.com/v1/me/playlists', {
            Accept: 'application/json',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${params.access_token}`,
            },
        });
        let data = await response.json();
        console.log(data);
        let exists = false;
        for (let playlist of data.items) {
            if (playlist.name === 'Skip') {
                exists = true;
            }
        }
        console.log(`Exists: ${exists}`);
        if (!exists) {
            response = await fetch(`https://api.spotify.com/v1/users/${userInfo.id}/playlists`, {
                Accept: 'application/json',
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${params.access_token}`,
                },
                body: JSON.stringify({
                    name: 'Skip',
                    public: false,
                }),
            });
            data = await response.json();
            console.log(data);
        }
    };

    // const checkPlaylistSkip = async() => {
    //   const response = await fetch("https://api.spotify.com/v1/me/playlists", {
    //     Accept: "application/json",
    //     headers: {
    //       "Content-Type": "application/json",
    //       Authorization: `Bearer ${params.access_token}`
    //     }
    //   })
    //   const data = await response.json();
    //   let exists = false;
    //   for (let playlist of data.items) {
    //     if (playlist.name === "Skip") {
    //       exists = true;
    //     }
    //   }
    //   if (!exists) {
    //     const response = await fetch(`https://api.spotify.com/v1/users/${user.id}/playlists}`, {
    //     Accept: "application/json",
    //     method: "POST",
    //     headers: {
    //       "Content-Type": "application/json",
    //       Authorization: `Bearer ${params.access_token}`
    //     }
    //   })
    //   }
    //   console.log(data);
    // }

    return (
        <div className='App'>
            <div>
                {!loggedIn && (
                    <div>
                        <a href='http://localhost:8888'>
                            <button>Log In with Spotify</button>
                        </a>
                    </div>
                )}
            </div>
            <div>
                {nowPlaying && (
                    <div>
                        <div>Now Playing: {nowPlaying.name} </div>
                        <div>
                            <img src={nowPlaying.image} />
                        </div>
                        <button></button>
                    </div>
                )}
            </div>
        </div>
    );
}

export default App;
