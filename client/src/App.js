import './App.css';
import { useEffect, useState } from 'react';
import SpotifyWebApi from 'spotify-web-api-js';
// import axios from 'axios';

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

    useEffect(() => {
        if (params.access_token) {
            spotifyApi.setAccessToken(params.access_token);
        }
    }, []);

    const getSong = async () => {
        let counter = 0;
        while (counter < 99) {
            const characters = 'abcdefghijklmnopqrstuvwxyz';

            // Gets a random character from the characters string.
            const randomCharacter = characters.charAt(
                Math.floor(Math.random() * characters.length)
            );
            let randomSearch = '';

            // Places the wildcard character at the beginning, or both beginning and end, randomly.
            switch (Math.round(Math.random())) {
                case 0:
                    randomSearch = randomCharacter + '%';
                    break;
                case 1:
                    randomSearch = '%' + randomCharacter + '%';
                    break;
                default:
                    break;
            }

            // generate random number for offset
            const randomOffset = Math.floor(Math.random() * 1000);

            //make request
            const data = await spotifyApi.searchTracks(randomSearch, {
                offset: randomOffset,
                limit: 1,
            });
            const songInfo = data.tracks.items[0];
            let res;
            try {
                res = await spotifyApi.getAudioFeaturesForTrack(songInfo.id);
                const song = {
                    ...res,
                    id: songInfo.id,
                    name: songInfo.name,
                    artists: songInfo.artists,
                    album: songInfo.album,
                };
                //post to the db
                console.log(song);
                const dbRes = await fetch('http://localhost:8888/uploadToDB', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json;charset=utf-8',
                    },
                    body: JSON.stringify(song),
                });
                counter++;
                console.log(counter);
            } catch (err) {
                console.log(`%cFUCK!`, 'color: red; font-size: 24px');
            }
        }
    };

    return (
        <div className='App'>
            <div>
                <div>
                    <div>
                        {!loggedIn ? (
                            <div>
                                <a href='http://localhost:8888'>
                                    <button>Log In with Spotify</button>
                                </a>
                            </div>
                        ) : (
                            <div>
                                <button onClick={getSong}>Get track</button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default App;
