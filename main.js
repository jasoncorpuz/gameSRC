const chickenUrl = 'https://chicken-coop.p.rapidapi.com//games/';
const chickenKey = 'faf2bced7dmsh381fd01602a86d5p17d974jsn8b85a7c7cac6'; // 'x-rapidapi-key'
const twitchUrl = 'https://api.twitch.tv/helix/games/'; // 'Client-ID'
const twitchKey = '03bpjfbg3aheov64duv01v7qvyn9ou';
const youtubeUrl = 'https://www.googleapis.com/youtube/v3/search';
const youtubeKey = 'AIzaSyD1fkk494aFEcA2w2DchMDe2PRI7dB0s2g'; //'key' in params
const rawgUrl = 'https://api.rawg.io/api/games'

function search() {
    $('form').submit(function (event) {
        $('.init-screen').css('display', 'hidden')
        event.preventDefault()
        const query = $('.query').val();
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
        .then(responseJson => renderGameList(responseJson));
}

function renderGameList(responseJson) {
    $('.game-info').empty();
    $('.video-results').empty();
    $('.twitch-results').empty();
    $('.result-img').empty();
    $('.search-results').css('display','block');
    $('.search-results').empty();
    
    if (responseJson.result !== 'No result') {
    const gameList = platformFilter(responseJson.result);
    for (let i = 0; i < gameList.length; i++) {
            $('.search-results').append(
                `<li><button class='result'>${gameList[i].title},<span class='platform'>${gameList[i].platform}</button><span></li>` 
                //button for tab access
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
        const innerText = $(this).text();
        getGameQuery(innerText);
    })

}

function getGameQuery(innerText) {
    // this code accounts for any commas found in the title, as the platform will come after the last comma
    const lastIndex = innerText.lastIndexOf(',');
    const query = innerText.substring(0, lastIndex);
    const platformQuery = innerText.substring(lastIndex + 1);
    const platform = formatPlatform(platformQuery)
    getGamelist(query, platform);
}

function formatPlatform(platformQuery){
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
    // passes query to Chicken Coop gaming database
    const params = {
        'platform': platform

    }

    const queryString = formatQueryString(params);
    const queryURI = encodeURIComponent(query);
    const url = chickenUrl + queryURI + '?' + queryString
    
    fetch(url, {
            "method": "GET",
            "headers": {
                "x-rapidapi-host": "chicken-coop.p.rapidapi.com",
                "x-rapidapi-key": chickenKey
            }
        })
        .then(response => response.json())
        .then(responseJson => renderResultPage(responseJson))
}

function renderResultPage(responseJson) {
    if (responseJson.result !== "No result") {
        getYoutube(responseJson);
        getTwitch(responseJson);
        getImage(responseJson);
        const info = responseJson.result; // to clutter code less
        const description = checkDescription(info);
        $('.search-results').css('display','none');
        $('.game-info').empty();
        $('.game-info').append(`
        <h2 class='title'>${info.title}</h2>
            <ul class='info-list'>
                <li>
                    <h3>release date:</h3> ${info.releaseDate}
                <li>
                    <h3>genre:</h3> ${info.genre}
                </li>
                <li>
                  <h3> metacritic review score:</h3> ${info.score}
                </li>
                <li>
                    <h3>publisher:</h3> ${info.publisher}
                </li>
              
            </ul>
        <h3>Description:<h3>
        ${description}
        `)
    } else {
        tryAgain();
    }
};


function checkDescription(info) {
    if (info.description === ''){
        return `<div class='no-descrip'> Sorry, no description available.<div>`;
    } else {
        return `<p>${info.description}<p>`;
    }
};




function getImage(responseJson) {
    const params = {
        'search': responseJson.result.title
    }

    const queryString = formatQueryString(params)
    const url = rawgUrl + '?' + queryString
    
    fetch(url)
        .then(response => response.json())
        .then(responseJson => renderImage(responseJson));

}

function renderImage(responseJson) {
    const image = responseJson.results[0].background_image;
    $('.result-img').empty();
    $('.result-img').append(
        `<img src="${image}" alt="game-image" class='screenshot'>`
    )
}

// had to search for game and retrieve game ID. From there a stream is found and rendered. 
function getTwitch(responseJson) {
    let game = (responseJson.result.title)
    getTwitchGame(game);
}

function getTwitchGame(game) {
    // retrieves attribute GAME ID
    const params = {
        'name': game
    }
    const queryString = formatQueryString(params);
    const url = twitchUrl + '?' + queryString
    fetch(url, {
            'headers': {
                'Client-ID': twitchKey
            }
        })
        .then(response => response.json())
        .then(responseJson => getGameId(responseJson))
}

function getGameId(responseJson) {
    // some games don't have ID's so ~
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

    fetch(url, {
            'headers': {
                'Client-ID': twitchKey
            }
        })
        .then(response => response.json())
        .then(responseJson => checkAvailStreams(responseJson))
};

function checkAvailStreams (responseJson) {
    if (responseJson.data == 0 ){
        noStreamAvail();
    } else {
        renderTwitch(responseJson);
    }
};

function renderTwitch(responseJson) {
    // twitch returns the most viewed stream first, so 0 
    const twitchGameID = responseJson.data[0].user_name;
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
                title="Live-Stream"
                
            </iframe>
    `) 
};

function noStreamAvail(){
    $('.twitch-results').empty();
    $('.twitch-results').append(`
            <h3>Live Stream:</h3>
            <p class='livestream-message'>Sorry, no live stream available at this time!<p>
            </iframe>
    `)
};

// fetching youtube start. this will return an IGN Review
function getYoutube(responseJson) {
    const params = {
        'part': 'snippet',
        'q': `${responseJson.result.title} ign review`,
        'key': youtubeKey,
        'maxResults': 1
    };

    const queryString = formatQueryString(params);
    const url = youtubeUrl + '?' + queryString;

    fetch(url)
        .then(response => response.json())
        .then(responseJson => renderYoutube(responseJson))
}

function renderYoutube(responseJson) {
    const videoId = responseJson.items[0].id.videoId;
    $('.video-results').empty();
    $('.video-results').append(`
    <h3>IGN Review:<h3>
    <iframe id="ytplayer" type="text/html" width="500s" height="360" title ="IGN-Review"
        src="https://www.youtube.com/embed/${videoId}?autoplay=0&origin=http://example.com"
        frameborder="0"></iframe>  
    `)
};

function tryAgain() {
    $('.game-info').empty();
    $('.video-results').empty();
    $('.twitch-results').empty();
    $('.result-img').empty();
    $('.game-info').append(
        `<h3>Sorry we couldn't find that game. Try again?<h3>`
    )
};




function callApp() {
    search();
};


$(callApp);




