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
    const [playlistId, setplaylistId] = useState('');
    const [userId, setUserId] = useState('');
    const [nowPlaying, setNowPlaying] = useState({
        name: 'Not Checked',
        image: '',
        uri: '',
    });

    useEffect(() => {
        if (params.access_token) {
            spotifyApi.setAccessToken(params.access_token);
            getUserProfile();
            getNowPlaying();
            // checkPlaylistSkip();
        }
    }, []);

    const getUserProfile = async () => {
        // get profile and set user
        let userInfo = await spotifyApi.getMe();
        setUserId(userInfo.id);
        // check if playlist exists
        let response = await fetch('https://api.spotify.com/v1/me/playlists', {
            Accept: 'application/json',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${params.access_token}`,
            },
        });
        let data = await response.json();
        let exists = false;
        for (let playlist of data.items) {
            if (playlist.name === 'Skip') {
                exists = true;
                setplaylistId(playlist.id);
            }
        }
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
            setplaylistId(data.id);
        }
    };

    const getNowPlaying = async () => {
        // spotifyApi.getPlaylist(userId, playlistId).then((playlistResponse) => {
        //   console.log(playlistResponse);
        spotifyApi.getMyCurrentPlaybackState().then((response) => {
            // const skipPlaylist = playlistResponse.tracks.items;
            // for (let i = 0; i < skipPlaylist.length; i++) {
            //   if (response.item.id === skipPlaylist[i].track.id) {

            //   }
            // }
            console.log(response);
            setNowPlaying({
                name: response.item.artists[0].name + ' - ' + response.item.name,
                image: response.item.album.images[0].url,
                uri: response.item.uri,
            });
        });
        // });
    };

    const addToSkipPlaylist = () => {
        spotifyApi.addTracksToPlaylist(userId, playlistId, [nowPlaying.uri]);
    };

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
                            {!loggedIn && (
                                <div>
                                    <a href='http://localhost:8888'>
                                        <button>Log In with Spotify</button>
                                    </a>
                                </div>
                            )}
                        </div>
                        <button onClick={addToSkipPlaylist}>Add to Skip</button>
                    </div>
                )}
            </div>
        </div>
    );
}

export default App;
