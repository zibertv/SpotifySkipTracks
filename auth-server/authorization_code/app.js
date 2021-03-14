/**
 * This is an example of a basic node.js script that performs
 * the Authorization Code oAuth2 flow to authenticate against
 * the Spotify Accounts.
 *
 * For more information, read
 * https://developer.spotify.com/web-api/authorization-guide/#authorization_code_flow
 */

var express = require('express'); // Express web server framework
var request = require('request'); // "Request" library
var cors = require('cors');
var querystring = require('querystring');
var cookieParser = require('cookie-parser');

var client_id = 'a905de1df03145648fbd6dd381c47876'; // Your client id
var client_secret = 'b654aa99348b4236a2ec515f8efc87fc'; // Your secret
var redirect_uri = 'http://localhost:8888/callback'; // Your redirect uri

const { Pool } = require('pg');
const pool = new Pool({
    user: 'slsueczvkjiewh',
    host: 'ec2-54-162-119-125.compute-1.amazonaws.com',
    database: 'dd14pf50mrgpcd',
    password: 'f2250ef24a5f77521cb8cf37289c5848fc9acb64925423e181e99952edf0fea4',
    port: 5432,
    ssl: {
        rejectUnauthorized: false,
    },
});

/**
 * Generates a random string containing numbers and letters
 * @param  {number} length The length of the string
 * @return {string} The generated string
 */
var generateRandomString = function (length) {
    var text = '';
    var possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

    for (var i = 0; i < length; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
};

var stateKey = 'spotify_auth_state';

var app = express();
app.use(express.json());

app.use(express.static(__dirname + '/public'))
    .use(cors())
    .use(cookieParser());

app.get('/login', function (req, res) {
    var state = generateRandomString(16);
    res.cookie(stateKey, state);

    // your application requests authorization
    var scope =
        'user-read-private user-read-email user-read-playback-state user-modify-playback-state playlist-modify-private playlist-read-private';
    res.redirect(
        'https://accounts.spotify.com/authorize?' +
            querystring.stringify({
                response_type: 'code',
                client_id: client_id,
                scope: scope,
                redirect_uri: redirect_uri,
                state: state,
            })
    );
});

app.get('/callback', function (req, res) {
    // your application requests refresh and access tokens
    // after checking the state parameter

    var code = req.query.code || null;
    var state = req.query.state || null;
    var storedState = req.cookies ? req.cookies[stateKey] : null;

    if (state === null || state !== storedState) {
        res.redirect(
            '/#' +
                querystring.stringify({
                    error: 'state_mismatch',
                })
        );
    } else {
        res.clearCookie(stateKey);
        var authOptions = {
            url: 'https://accounts.spotify.com/api/token',
            form: {
                code: code,
                redirect_uri: redirect_uri,
                grant_type: 'authorization_code',
            },
            headers: {
                Authorization:
                    'Basic ' + new Buffer(client_id + ':' + client_secret).toString('base64'),
            },
            json: true,
        };

        request.post(authOptions, function (error, response, body) {
            if (!error && response.statusCode === 200) {
                var access_token = body.access_token,
                    refresh_token = body.refresh_token;

                var options = {
                    url: 'https://api.spotify.com/v1/me',
                    headers: { Authorization: 'Bearer ' + access_token },
                    json: true,
                };

                // use the access token to access the Spotify Web API
                request.get(options, function (error, response, body) {
                    console.log(body);
                });

                // we can also pass the token to the browser to make requests from there
                res.redirect(
                    'http://localhost:3000/#' +
                        querystring.stringify({
                            access_token: access_token,
                            refresh_token: refresh_token,
                        })
                );
            } else {
                res.redirect(
                    '/#' +
                        querystring.stringify({
                            error: 'invalid_token',
                        })
                );
            }
        });
    }
});

app.get('/refresh_token', function (req, res) {
    // requesting access token from refresh token
    var refresh_token = req.query.refresh_token;
    var authOptions = {
        url: 'https://accounts.spotify.com/api/token',
        headers: {
            Authorization:
                'Basic ' + new Buffer(client_id + ':' + client_secret).toString('base64'),
        },
        form: {
            grant_type: 'refresh_token',
            refresh_token: refresh_token,
        },
        json: true,
    };

    request.post(authOptions, function (error, response, body) {
        if (!error && response.statusCode === 200) {
            var access_token = body.access_token;
            res.send({
                access_token: access_token,
            });
        }
    });
});

app.post('/uploadToDB', (req, res) => {
    //upload to db
    const song = req.body;
    // console.log(req.body);

    const query = `INSERT INTO track (id, danceability, energy, track_key, loudness, speechiness, acousticness, instrumentalness,
    liveness, valence, tempo, track_name, artist, album) VALUES ('${song.id}', ${song.danceability}, ${song.energy}, ${song.key}, ${song.loudness}
        , ${song.speechiness}, ${song.acousticness}, ${song.instrumentalness}, ${song.liveness}, ${song.valence}, ${song.tempo}, '${song.name}', '${song.artists[0].name}', '${song.album.name}');`;
    console.log(query);
    pool.query(query, (err, DBres) => {
        console.log(err, DBres);
        res.json({
            message: err || DBres,
        });
    });
});

console.log('Listening on 8888');
app.listen(8888);

// const createTable = (table) => {
//     pool.query(table, (err, res) => {
//         console.log(err, res);
//         pool.end();
//     });
// };
