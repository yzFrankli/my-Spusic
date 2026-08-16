var client_id = 'a41241959d87440a819279b03bacad2d';
var client_secret = '6a84941e44414903bc3dcf20606b73f5';
var token_url = 'https://accounts.spotify.com/api/token';
// Default playlist - Classic hits everyone should know
var playlist_url = 'https://api.spotify.com/v1/playlists/'
                   + '3HOj7HdL0TNKxcXZXgr7CG/tracks?market=US&limit=100';
var access_token = null;
var offset = 0;
var playlist = [];
var correctIndex = null;
var player = null;
var timer = null;
var score = 0;
const score_display = document.getElementById("score");

document.querySelectorAll('.play').forEach(play_button => {
    play_button.addEventListener("click", getSongs);
})
document.querySelectorAll('.track').forEach((track, index) => {
    track.addEventListener('click', () => {
        end = !check(index);
        if (!end) {
            setupGame();
        }
        else {
            endGame();
        }
    });
});
document.getElementById("back_to_start").addEventListener('click', () => {
    document.getElementById('start').hidden = false;
    document.getElementById('game_end').hidden = true;
})

function getSongs() {
    fetch(token_url, {
    method: 'POST',
    body: new URLSearchParams({
        'grant_type': 'client_credentials',
        'client_id': client_id,
        'client_secret': client_secret
    })
    })
    .then(response => response.json())
    .then(data => getPlaylistTracks(data.access_token));
}

function getPlaylistTracks(token) {
    var input = document.getElementById('playlist').value;
    var match = input.match(/playlist\/([^?]+)/);
    playlist = [];

    if (match) {
        const playlist_id = match[1];
        playlist_url = "https://api.spotify.com/v1/playlists/" +
                       playlist_id + "/tracks?market=US&limit=100";
    }

    access_token = token;

    fetch(playlist_url, {
        headers: {
        'Authorization': 'Bearer ' + access_token,
        }
    })
    .then(response => response.json())
    .then(data => addToPlaylist(data))
    .catch(error => {
        var message = "Please enter a valid public Spotify playlist.";
        alert(message);
    });

}

function morePlaylistTracks() {
    fetch(playlist_url + '&offset=' + offset.toString(), {
        headers: {
        'Authorization': 'Bearer ' + access_token
        }
    })
    .then(response => response.json())
    .then(data => addToPlaylist(data));
}

function addToPlaylist(data) {
    offset += 100;

    var items = data.items;
    if (items.length > 0) {
        for (let i = 0; i < items.length; i++) {
            if (items[i].track.preview_url) {
                playlist.push(items[i].track);
            }
        }
        morePlaylistTracks();
    }
    else {
        document.getElementById('start').hidden = true;
        document.getElementById('game_end').hidden = true;
        setupGame();
    }
}

function getRandomInt(max) {
    return Math.floor(Math.random() * max);
}

function setupGame() {
    // Randomly choose 4 songs from the playlist
    var duplicate = 1;
    const track_index = [];

    while (duplicate) {
        duplicate = 0;
        for (let i = 0; i < 4; i++) {
            track_index[i] = getRandomInt(playlist.length);
            for (let j = 0; j < i; j++) {
                if (track_index[i] == track_index[j])
                duplicate = 1;
            }
        }
    }

    // Populate song buttons
    var t = 0
    document.querySelectorAll('.track').forEach(
        track => {
        track.textContent = playlist[track_index[t]].name 
                    + ' by ' + playlist[track_index[t]].artists[0].name;
        t++;
    })

    // Show track buttons and score
    document.getElementById('tracks').hidden = false;
    document.getElementById('highscore').hidden = false;
    score_display.innerText = "Score: " + score;
    getTopScores();

    // Choose a random song to play
    correctIndex = getRandomInt(4);
    if (player == null) {
        player = new Audio(playlist[track_index[correctIndex]].preview_url);
    } else {
        player.pause();
        player.src = playlist[track_index[correctIndex]].preview_url;
    }
    if (timer != null)
        clearTimeout(timer);
    timer = setTimeout(endGame, 10000);
    player.play();
}

function check(indexClicked) {
    // Return true if correct and false otherwise
    if (indexClicked == correctIndex) {
        score++;
        score_display.innerText = "Score: " + score
        return true;
    }
    else {
        return false;
    }
}


function endGame() {
    // Cancel timer
    if (timer != null) {
        clearTimeout(timer);
    }

    player.pause();

    // Display game results
    document.getElementById('tracks').hidden = true;
    document.getElementById('game_end').hidden = false;
    document.getElementById('end_score').innerText = "Score: " + score;

    // Post the score to the server
    postScore();
    // Reset score
    score = 0;

    
}

function postScore() {
    const playerName = realisticPrompt("GAME OVER --> Confirm username:");
    if (playerName) {
        const scoreData = {
            username: playerName,  // Corrected property name
            score: score
        };

        console.log('Submitting score:', scoreData);

        fetch('/submitScore', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(scoreData),
        })
        .then(response => response.json())
        .then(data => {
            console.log('Score submitted successfully:', data);
        })
        .catch(error => {
            console.error('Error submitting score:', error);
        });
    }
}
function realisticPrompt(message, defaultValue = "") {
    const container = document.createElement("div");
    container.style.position = "fixed";
    container.style.top = "50%";
    container.style.left = "50%";
    container.style.transform = "translate(-50%, -50%)";
    container.style.background = "#1d2630";
    container.style.padding = "40px";
    container.style.borderRadius = "15px";
    container.style.boxShadow = "0 0 20px rgba(0, 0, 0, 0.4)";
    container.style.color = "#fff";
    container.style.fontFamily = "'Arial', sans-serif";
  
    const promptMessage = document.createElement("p");
    promptMessage.textContent = message;
    promptMessage.style.marginBottom = "20px";
    promptMessage.style.fontSize = "1.2em";
    container.appendChild(promptMessage);
  
    const input = document.createElement("input");
    input.type = "text";
    input.value = defaultValue;
    input.style.width = "100%";
    input.style.marginBottom = "20px";
    input.style.border = "1px solid #bdc3c7";
    input.style.borderRadius = "5px";
    input.style.padding = "10px";
    input.style.fontSize = "1em";
    container.appendChild(input);
  
    const confirmButton = document.createElement("button");
    confirmButton.textContent = "OK";
    confirmButton.style.backgroundColor = "#2ecc71";
    confirmButton.style.color = "#fff";
    confirmButton.style.padding = "15px 30px";
    confirmButton.style.border = "none";
    confirmButton.style.borderRadius = "5px";
    confirmButton.style.cursor = "pointer";
    confirmButton.style.fontSize = "1.5em";
    confirmButton.style.transition = "background-color 0.3s ease";
    confirmButton.style.marginRight = "10px";
    confirmButton.onclick = () => {
      container.remove();
      // Handle the input value here
      console.log("Username entered:", input.value);
    };
    container.appendChild(confirmButton);
  
    const cancelButton = document.createElement("button");
    cancelButton.textContent = "Cancel";
    cancelButton.style.backgroundColor = "#e74c3c";
    cancelButton.style.color = "#fff";
    cancelButton.style.padding = "15px 30px";
    cancelButton.style.border = "none";
    cancelButton.style.borderRadius = "5px";
    cancelButton.style.cursor = "pointer";
    cancelButton.style.fontSize = "1.5em";
    cancelButton.style.transition = "background-color 0.3s ease";
    cancelButton.onclick = () => {
      container.remove();
      // Handle cancel action here
      console.log("Prompt canceled");
    };
    container.appendChild(cancelButton);
  
    document.body.appendChild(container);
  }
  

  async function getTopScores() {
    try {
        const response = await fetch('/getTopScores');
        const data = await response.json();

        if (response.ok) {
            // Log the data to the console for debugging
            console.log('Top Scores:', data);

            // Clear previous leaderboard content
            const leaderboardContainer = document.getElementById('leaderboard');
            leaderboardContainer.innerHTML = '';

            // Create a new "Top 10" header with white text, underlined, and larger
            const top10Header = document.createElement('h2');
            top10Header.textContent = 'Top 10';
            top10Header.style.color = '#fff'; // Set text color to white
            top10Header.style.textDecoration = 'underline'; // Underline the text
            top10Header.style.fontSize = '1.8em'; // Increase the font size
            top10Header.style.fontFamily = 'sans-serif'; // Change font family
            leaderboardContainer.appendChild(top10Header);

            // Create an ordered list to display the top scores
            const top10List = document.createElement('ol');

            // Iterate through the top scores and create list items
            data.topScores.forEach((score, index) => {
                const listItem = document.createElement('li');
                listItem.textContent = `${index + 1}. ${score.username}: ${score.highScore}`;
                listItem.style.color = '#fff'; // Set text color to white
                listItem.style.fontFamily = 'sans-serif'; // Change font family
                top10List.appendChild(listItem);
            });

            // Append the ordered list to the leaderboard container
            leaderboardContainer.appendChild(top10List);
        } else {
            console.error('Failed to fetch leaderboard data:', data);
        }
    } catch (error) {
        console.error('Error fetching leaderboard data:', error);
    }
}

function getHighScore() {
    fetch('/getHighScore')
        .then(response => response.json())
        .then(data => {
            const highScoreElement = document.getElementById('highscore');
            highScoreElement.innerText = "High Score: " + data.username + " - " + data.highScore;
        })
        .catch(error => {
            console.error('Error getting high score:', error);
        });
}


