import './App.css';
import {useEffect, useState} from 'react';
import SpotifyWebApi from 'spotify-web-api-js';

function App() {

  const getHashParams = () => {
    var hashParams = {};
    var e, r = /([^&;=]+)=?([^&;]*)/g,
        q = window.location.hash.substring(1);
    while ( e = r.exec(q)) {
       hashParams[e[1]] = decodeURIComponent(e[2]);
    }
    return hashParams;
  } 


  const spotifyApi = new SpotifyWebApi();
  const params = getHashParams();
  const [loggedIn, setLoggedIn] = useState(params.access_token ? true : false);
  const [nowPlaying, setNowPlaying] = useState({
    name: 'Not Checked',
    image: ''
  });

  useEffect( () => {
    if (params.access_token) {
      spotifyApi.setAccessToken(params.access_token);
      getNowPlaying();
    }
  }, []) 

  const getNowPlaying = () => {
    spotifyApi.getMyCurrentPlaybackState()
    .then((response) => {
      console.log(response);
      setNowPlaying({
        name: response.item.name,
        image: response.item.album.images[0].url
      })
    })
  }

  
  return (
    <div className="App">
      <div>
      <a href="http://localhost:8888"><button>Log In with Spotify</button></a>
      </div>
        {nowPlaying && (
          <div>
            <div>Now Playing: { nowPlaying.name } </div>
            <div>
              <img src={ nowPlaying.image } />
            </div>
          </div>) }
      <div>
        
      </div>
    </div>
  );
}

export default App;
