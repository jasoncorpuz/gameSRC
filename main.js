/* ON a search querey, a result should be returned if a game is inputted correctly
The search will access Chicken Coop's data base, and retreive The game name, 
screenshot, description and rating
The result screen will also show two youtube reviews
and the most active twitch stream
on incorrect input, the user will be sent to a screen where 
they are prompted to search again, which runs the initial search screen

*/

const chickenUrl = 'https://chicken-coop.p.rapidapi.com//games/';
const chickenKey = 'faf2bced7dmsh381fd01602a86d5p17d974jsn8b85a7c7cac6'; // 'x-rapidapi-key'
const twitchUrl = 'https://api.twitch.tv/helix/games/'; // 'Client-ID'
const twitchKey = '03bpjfbg3aheov64duv01v7qvyn9ou';
const youtubeUrl = 'https://www.googleapis.com/youtube/v3/search';
const youtubeKey = 'AIzaSyD1fkk494aFEcA2w2DchMDe2PRI7dB0s2g'; //'key' in params
const rawgUrl = 'https://api.rawg.io/api/games'

function search() {
    console.log('search working')
    //get values from search and return them as variables
    //pass off to getGameList
    //clears previous results
    $('form').submit(function (event) {
        $('.init-screen').css('display', 'hidden')
        event.preventDefault()
        const query = $('.query').val();
        //const platform = $('.platform').val();
        console.log(query);
        getGames(query);

    })
};

function formatQueryString(params) {
    const queryItems = Object.keys(params)
        .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
    return queryItems.join('&');
}

function getGames(query) {
    let searchItem = encodeURIComponent(query)
    fetch(`https://chicken-coop.p.rapidapi.com/games?title=${searchItem}`, {
            "method": "GET",
            "headers": {
                "x-rapidapi-host": "chicken-coop.p.rapidapi.com",
                "x-rapidapi-key": chickenKey
            }
        })
        .then(response => response.json())
        .then(responseJson => renderGameList(responseJson))
        .catch(err => {
            console.log(err);
        });
}

function renderGameList(responseJson) {
    $('.game-info').empty();
    $('.video-results').empty();
    $('.twitch-results').empty();
    $('.result-img').empty();
    $('.search-results').empty();
    if (responseJson.result !== 'No result') {
    console.log(responseJson.result)
    const gameList = platformFilter(responseJson.result);
    console.log(gameList);
    for (let i = 0; i < gameList.length; i++) {
            $('.search-results').append(
                `<li class='result'>${gameList[i].title},${gameList[i].platform}</li>`
            )
        }
    } else {
        tryAgain();
    }
    handleClick();
};

function platformFilter(responseJson) {
    const unfilteredList = responseJson;
    const filteredList = unfilteredList.filter((list) => {
        return list.platform === 'PC' ||
        list.platform === 'XONE' ||
        list.platform === 'Switch' ||
        list.platform === 'PS4';
    });
    return filteredList;
}

function handleClick() {
    $('.result').on('click', function (event) {
        console.log($(this).text());
        const innerText = $(this).text();
        console.log(innerText);
        getGameQuery(innerText);
    })

}

function getGameQuery(innerText) {
    const getQuery = innerText.split(',')
    console.log(getQuery); // an array 
    let query = getQuery[0];
    let platformQuery = getQuery[1]

    console.log(`${query} and ${platformQuery} separated`);
    const platform = formatPlatform(platformQuery)
    getGamelist(query, platform);
    console.log(`${platform} worked`);
}

function formatPlatform(platformQuery){
    console.log(platformQuery);
    if (platformQuery === 'PC'){
        return 'pc'
    } else if (platformQuery === 'PS4'){
        return 'playstation-4'
    } else if (platformQuery === 'XONE'){
        return 'xbox-one'
    } else if (platformQuery === 'Switch'){
        return 'switch'
    } else {
        console.log('error')
    }
    // this needs to return the appropriate platform/slug for the search engine
    // search needs to be exact
}



function getGamelist(query, platform) {
    console.log(`${query} ${platform} passed to get gamelist`)
    // passes query to Chicken Coop
    // returns most relevent JSON information in list of 10
    // when they click the game, pass query to renderResultPage
    const params = {
        'platform': platform

    }

    const queryString = formatQueryString(params);
    const queryURI = encodeURIComponent(query);
    const url = chickenUrl + queryURI + '?' + queryString
    console.log(url)


    fetch(url, {
            "method": "GET",
            "headers": {
                "x-rapidapi-host": "chicken-coop.p.rapidapi.com",
                "x-rapidapi-key": chickenKey
            }
        })
        .then(response => response.json())
        //.then(responseJson => console.log(responseJson))
        .then(responseJson => renderResultPage(responseJson))
        .catch(err => {
            console.log(err); // if response = ok then
        });



}

function renderResultPage(responseJson) {
    if (responseJson.result !== "No result") {
        $('.search-results').empty();
        getYoutube(responseJson);
        getTwitch(responseJson);
        getImage(responseJson);
        const info = responseJson.result; // to clutter code less
        $('.game-info').empty();
        $('.game-info').append(`
        <h2>${info.title}</h2>
            <ul>
                <li>
                    genre: ${info.genre}
                </li>
                <li>
                   metacritic review score: ${info.score}
                </li>
                <li>
                    publisher: ${info.publisher}
                </li>
            </ul>
        <p>${info.description}</p>
        `)
    } else {
        console.log('no result!');
        tryAgain();
    }
    //fetches game info, description, screenshot, review
    //sends query to  getTwitch, getYoutube
}

function getImage(responseJson) {
    // stores game title
    console.log(`${responseJson.result.title} get image`)
    const params = {
        'search': responseJson.result.title
    }

    const queryString = formatQueryString(params)
    const url = rawgUrl + '?' + queryString
    console.log(url);

    fetch(url)
        .then(response => response.json())
        .then(responseJson => renderImage(responseJson));

}

function renderImage(responseJson) {
    console.log('render image working')
    const image = responseJson.results[0].background_image;
    console.log(image);
    $('.result-img').empty();
    $('.result-img').append(
        `<img src="${image}" alt="game-image" class='screentshot'>`
    )
}


// the twitch api is finnicky to get around. i had to find the game's ID,
// then use the game ID to search for the stream. 
// from there i obtained a channel name to render the twitch stream

function getTwitch(responseJson) {
    //fetches most relevant twitch live and embeds video
    //appends to video section
    console.log(`get twitch ${responseJson.result.title}`)
    let game = (responseJson.result.title)
    getTwitchGame(game);
}

function getTwitchGame(game) {
    // retrieves attribute GAME ID
    console.log(`get game ID ${game}`);
    const params = {
        'name': game
    }

    const queryString = formatQueryString(params);
    const url = twitchUrl + '?' + queryString
    console.log(url);
    fetch(url, {
            'headers': {
                'Client-ID': twitchKey
            }
        })
        // if response.ok?
        .then(response => response.json())
        .then(responseJson => getGameId(responseJson))
        //.catch(noStreamAvail())
}

function getGameId(responseJson) {
    console.log(responseJson.data);
     if (responseJson.data == 0) {
        noStreamAvail();
     } else {
        const gameId = responseJson.data[0].id;
        findTwitchStream(gameId);
    }
}


function findTwitchStream(gameId) {
    const params = {
        'game_id': gameId,

    };

    const queryString = formatQueryString(params);
    const streamUrl = 'https://api.twitch.tv/helix/streams';
    const url = streamUrl + '?' + queryString;
    console.log(url);

    fetch(url, {
            'headers': {
                'Client-ID': twitchKey
            }
        })
        .then(response => response.json())
        .then(responseJson => checkAvailStreams(responseJson))
        .catch(console.log('error'))
};

function checkAvailStreams (responseJson) {
    console.log(responseJson)
    if (responseJson.data == 0 ){
        noStreamAvail();
    } else{
        renderTwitch(responseJson);
    }
}

function renderTwitch(responseJson) {
    console.log(responseJson);
    // twitch returns the most viewed stream first, so 0 
    const twitchGameID = responseJson.data[0].user_name;
    console.log(`twitch game id = ${twitchGameID}`)
    $('.twitch-results').empty();
    $('.twitch-results').append(`
            <h3>Live Stream:</h3>
            <iframe
                src="https://player.twitch.tv/?channel=${twitchGameID}&autoplay=false"
                height="360px"
                width="500px"
                frameborder="<frameborder>"
                scrolling="<scrolling>"
                allowfullscreen="<allowfullscreen>"
                
            </iframe>
    `)
    
}
// fetching youtube start. this will return an IGN Review


function getYoutube(responseJson) {
    console.log(`get youtube ${responseJson.result.title}`)
    const params = {
        'part': 'snippet',
        'q': `${responseJson.result.title} ign review`,
        'key': youtubeKey,
        'maxResults': 1
    }

    const queryString = formatQueryString(params);
    const url = youtubeUrl + '?' + queryString
    console.log(url);

    fetch(url)
        .then(response => response.json())
        .then(responseJson => renderYoutube(responseJson))
    // .catch(tryAgain())
    //fetches ign review video ID
    //appends to video section 
    //appends to video section
}

function renderYoutube(responseJson) {
    const videoId = responseJson.items[0].id.videoId;
    console.log(`video id = ${videoId}`);
    $('.video-results').empty();
    $('.video-results').append(`
    <h3>IGN Review:<h3>
    <iframe id="ytplayer" type="text/html" width="500s" height="360"
        src="https://www.youtube.com/embed/${videoId}?autoplay=1&origin=http://example.com"
        frameborder="0"></iframe>  
    `)
}

function tryAgain() {
    console.log('you done messed up, search again?');
    $('.game-info').empty();
    $('.video-results').empty();
    $('.twitch-results').empty();
    $('.result-img').empty();
    $('.game-info').append(
        `<h3>Sorry we couldn't find that game. Try again?<h3>`
    )


    // renders try again screen
}

function noStreamAvail(){
    $('.twitch-results').append(`
            <h3>Live Stream:</h3>
            <p>Sorry, no live stream available at this time!<p>
            </iframe>
    `)
}

function searchAgain() {
    // on button click, renders the original search screen
}


function callApp() {
    search();
};


$(callApp);





// to-do:
// format