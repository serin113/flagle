//TO DO:
//Daily countdown timer on both stats and GameResult timer
//Stats Display Change
//Flag list
//Hard mode
/*
Cookies:
    darkMode (bool)
    dailyMode (bool)
    hardMode (bool)
    lastGame (json)
        date (string)
        isWin (bool)
        index (int)
        hasFlaggle (bool)
        resultText (string)
        guesses (list of dicts)
            type (string=color, null=flag)
            index (int)
*/

// configs
let countryChoicesCount = 30;
let maxTries = 6;
let dailyMode = true;
let icons = {
    rightColor: "🟣",
    wrongColor: "⚫",
    rightFlag: "🟪",
    wrongFlag: "⬛",
    flaggle: "🏁",
    lose: "❌",
};
let resultMsgs_win = [
    // least to most tries
    "Superb!",
    "Amazing!",
    "Bravo!",
    "Great!",
    "Nice!",
    "Phew...",
];
let resultMsgs_lose = [
    // least to most tries
    "So close!",
    "Nice try",
];
let seedOverride = null; // null if disabled, string if needed

// global-ish variables
let randomizer = null; // randomizer function for getRandomInt
let countries = null; // <countryChoicesCount>-length list of countries w/ data
let countryIndex = null; // <country>'s index in <countries>
let currentCountryChoicesCount = countryChoicesCount;
// number of enabled country buttons
let tries = 0; // number of tries (button pushes) so far
let currDate = new Date(); // current date on page load
let resultText = ""; // game's share text
let isWin = null; // game state variable: null/true/false
let hasFlaggle = false; // flaggle is directly found
let guesses = []; // list of guesses
let lastGame = null; // game state after win/lose

// helper functions

/* ranged integer randomizer */
function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(randomizer() * (max - min) + min); //The maximum is exclusive and the minimum is inclusive
}

/* comparison function for mergeSort */
function comp(a, b) {
    let x = a.name;
    let y = b.name;
    return x.localeCompare(y);
}

/* merge sorting for flag list display */
function mergeSort(list) {
    if (list.length == 1) return [list[0]];
    let mid = Math.floor(list.length / 2.0);
    let l1 = list.slice(0, mid);
    let l2 = list.slice(mid, list.length);
    l1 = mergeSort(l1);
    l2 = mergeSort(l2);
    temp = [];
    let i = 0; // l1 index
    let j = 0; // l2 index
    let k = 0; // temp index
    while (i < l1.length && j < l2.length) {
        if (comp(l1[i], l2[j]) <= 0) {
            temp.push(l1[i]);
            k += 1;
            i += 1;
        } else {
            temp.push(l2[j]);
            k += 1;
            j += 1;
        }
    }
    while (i < l1.length) {
        temp.push(l1[i]);
        i += 1;
    }
    while (j < l2.length) {
        temp.push(l2[j]);
        j += 1;
    }
    return temp;
}

/* Mulberry32 PRNG: https://github.com/bryc/code/blob/master/jshash/PRNGs.md#mulberry32 
    for generating pseudorandom numbers for the randomizer */
function mulberry32(a) {
    return function () {
        var t = (a += 0x6d2b79f5);
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

/* MurmurHash3 hash function: https://github.com/bryc/code/blob/master/jshash/hashes/murmurhash3.js
    for hashing the current date as a reproducible seed for the randomizer */
function MurmurHash3(key, seed = 0) {
    var k,
        p1 = 3432918353,
        p2 = 461845907,
        h = seed | 0;
    for (var i = 0, b = key.length & -4; i < b; i += 4) {
        k =
            (key[i + 3] << 24) |
            (key[i + 2] << 16) |
            (key[i + 1] << 8) |
            key[i];
        k = Math.imul(k, p1);
        k = (k << 15) | (k >>> 17);
        h ^= Math.imul(k, p2);
        h = (h << 13) | (h >>> 19);
        h = (Math.imul(h, 5) + 3864292196) | 0; // |0 = prevent float
    }
    k = 0;
    switch (key.length & 3) {
        case 3:
            k ^= key[i + 2] << 16;
        case 2:
            k ^= key[i + 1] << 8;
        case 1:
            k ^= key[i];
            k = Math.imul(k, p1);
            k = (k << 15) | (k >>> 17);
            h ^= Math.imul(k, p2);
    }
    h ^= key.length;
    h ^= h >>> 16;
    h = Math.imul(h, 2246822507);
    h ^= h >>> 13;
    h = Math.imul(h, 3266489909);
    h ^= h >>> 16;
    return h >>> 0;
}

/* initialize the randomizer function, default seed as date if <seed> is null */
function initRandomizer(seedString = null) {
    if (seedString == null) {
        seedString = currDate.toDateString();
    }
    let seedBytes = Array.from(seedString, (x) => x.charCodeAt(0));
    let seedHash = MurmurHash3(seedBytes);
    console.log('Seed: "' + seedString + '"');
    console.log('Hash: "' + seedHash + '"');
    randomizer = mulberry32(seedHash);
    for (let i = 0; i < 15; i++) randomizer();
}

/* JSON file loader for the country list */
async function fetchCountries() {
    var fetchHeaders = new Headers();
    fetchHeaders.append("pragma", "no-cache");
    fetchHeaders.append("cache-control", "no-cache");
    var fetchInit = {
        method: "GET",
        headers: fetchHeaders,
    };
    var fetchRequest = new Request("countries.json");
    const response = await fetch(fetchRequest, fetchInit);
    const countries = await response.json();
    return countries;
}

/* gets <count> number of countries from the country list */
async function countryRandomizerArray(count) {
    let countries = await fetchCountries();
    let chosenCountries = [];
    currCount = 0;
    while (currCount < count) {
        let randIndex = getRandomInt(0, countries.length);
        chosenCountries.push(countries[randIndex]);
        countries.splice(randIndex, 1);
        currCount += 1;
    }
    chosenCountries = mergeSort(chosenCountries);
    return chosenCountries;
}

/* picks 1 random country from the country list */
async function countryRandomizer(count) {
    let countries = await countryRandomizerArray(count);
    let country_index = getRandomInt(0, countries.length);
    let country = countries[country_index];
    return [countries, country, country_index];
}

/* display country flags and names from the country list */
function displayCountries() {
    let choices = document.getElementById("choices");
    choices.innerHTML = "";
    let div_flagpics = null;
    let div_flagnames = null;
    let counter = 0;
    for (let i = 0; i < countries.length; i++) {
        let x = countries[i];

        if (div_flagpics == null) {
            div_flagpics = document.createElement("div");
            div_flagpics.classList.add("flagpics");
        }
        if (div_flagnames == null) {
            div_flagnames = document.createElement("div");
            div_flagnames.classList.add("flagnames");
        }

        let flag_img = document.createElement("img");
        flag_img.className = "flagpic";
        flag_img.dataset.index = i;
        flag_img.src = x.img;
        div_flagpics.appendChild(flag_img);

        let flag_name_div = document.createElement("div");
        flag_name_div.className = "flagname";
        flag_name_div.dataset.index = i;
        let flag_name_text_div = document.createElement("a");
        flag_name_text_div.innerHTML = x.name;
        flag_name_div.appendChild(flag_name_text_div);
        div_flagnames.appendChild(flag_name_div);

        if (div_flagpics.childElementCount == 5 || i == countries.length - 1) {
            if (
                i == countries.length - 1 &&
                div_flagpics.childElementCount < 5
            ) {
                for (let j = 0; j < 5 - div_flagpics.childElementCount; j++) {
                    let blankdiv = document.createElement("div");
                    div_flagpics.appendChild(blankdiv);
                    div_flagnames.appendChild(blankdiv);
                }
            }
            choices.appendChild(div_flagpics);
            choices.appendChild(div_flagnames);
            div_flagpics = null;
            div_flagnames = null;
        }
    }
}

/* set the appearance for the guess counter at <index> */
// zero-indexed
// if color==null, country
function setGuessCounter(index, color = null) {
    let guessIndicator = document.getElementById("guesses");
    let guessIndicatorCurrent = guessIndicator.querySelector(
        ".guessindicators[data-index='" + index + "']"
    );
    guessIndicatorCurrent.classList.remove("current");
    if (index < maxTries - 1) {
        let guessIndicatorNext = guessIndicator.querySelector(
            ".guessindicators[data-index='" + (index + 1) + "']"
        );
        guessIndicatorNext.classList.add("current");
    }
    if (color == null) {
        guessIndicatorCurrent.classList.add("flag_guessed");
    } else {
        guessIndicatorCurrent.classList.add("guessed");
        guessIndicatorCurrent.classList.add(color);
    }
    if (hasFlaggle) {
        guessIndicatorCurrent.classList.add("purple");
    }
}

/* check if <color> is in <country>'s colors */
function colorCheck(color) {
    return countries[countryIndex].colors.includes(color);
}

/* set country name at <index> as disabled */
function fadeCountryName(index) {
    let elem = document
        .getElementById("choices")
        .querySelector(".flagname[data-index='" + index + "']");
    elem.dataset.disabled = true;
}

/* set country flag element as disabled, tally remaining countries */
function fadeFlagPic(elem) {
    fadeCountryName(elem.dataset.index);
    elem.dataset.disabled = true;
    elem.removeEventListener("click", onClickButtons);
    currentCountryChoicesCount--;
}

/* remove flags not containing "color" */
function filterFlags(color) {
    let choices = document
        .getElementById("choices")
        .querySelectorAll(".flagpic:not([data-disabled])");
    for (let x of choices) {
        let x_colors = countries[x.dataset.index].colors;
        if (colorCheck(color)) {
            if (!x_colors.includes(color)) {
                fadeFlagPic(x);
            }
        } else {
            if (x_colors.includes(color)) {
                fadeFlagPic(x);
            }
        }
    }
}

/* enable all flag & color buttons */
function enableButtons() {
    for (let c of document.getElementById("colorkeys").children) {
        c.addEventListener("click", onClickButtons);
    }
    for (let f of document
        .getElementById("choices")
        .querySelectorAll(".flagpic")) {
        f.addEventListener("click", onClickButtons);
    }
    document
        .getElementById("guesses")
        .removeEventListener("click", showResults);
}

/* disable all flag & color buttons except the flaggle */
function disableButtons() {
    for (let c of document.getElementById("colorkeys").children) {
        c.removeEventListener("click", onClickButtons);
        c.dataset.disabled = true;
        if (!colorCheck(c.dataset.color)) {
            c.dataset.wrong = true;
        }
    }
    for (let f of document
        .getElementById("choices")
        .querySelectorAll(".flagpic")) {
        f.removeEventListener("click", onClickButtons);
        if (f.dataset.index != countryIndex) {
            fadeCountryName(f.dataset.index);
            f.dataset.disabled = true;
        }
    }
    document.getElementById("guesses").addEventListener("click", showResults);
}

/* create a new element containing the guesses so far */
function cloneGuesses() {
    let newGuesses = document.createElement("div");
    for (let i of document.getElementById("guesses").children) {
        if (
            i.classList.contains("guessed") ||
            i.classList.contains("flag_guessed")
        ) {
            newGuesses.appendChild(i.cloneNode(true));
        }
    }
    return newGuesses;
}

/* Clipboard stuff: https://stackoverflow.com/a/30810322 */
function fallbackCopyTextToClipboard(text) {
    var textArea = document.createElement("textarea");
    textArea.value = text;

    // Avoid scrolling to bottom
    textArea.style.top = "0";
    textArea.style.left = "0";
    textArea.style.position = "fixed";

    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();

    try {
        var successful = document.execCommand("copy");
        var msg = successful ? "successful" : "unsuccessful";
        console.log("Fallback: Copying text command was " + msg);
    } catch (err) {
        console.error("Fallback: Oops, unable to copy", err);
    }

    document.body.removeChild(textArea);
}

function copyTextToClipboard(text) {
    if (!navigator.clipboard) {
        fallbackCopyTextToClipboard(text);
        return;
    }
    navigator.clipboard.writeText(text).then(
        function () {
            console.log("Async: Copying to clipboard was successful!");
        },
        function (err) {
            console.error("Async: Could not copy text: ", err);
        }
    );
}

/* update & display results in the GameResults modal */
function showResults() {
    let resultMsg = "";
    if (isWin) {
        resultMsg = resultMsgs_win[tries - 1];
    } else {
        if (currentCountryChoicesCount <= 4) {
            resultMsg = resultMsgs_lose[0];
        } else {
            resultMsg = resultMsgs_lose[1];
        }
    }

    if (dailyMode) {
        let countdownDaily = setInterval(function () {
            let future = new Date(currDate.getTime());
            let now = new Date();
            future.setDate(future.getDate() + 1);
            future.setHours(0, 0, 0);
            let diff = future - now;
            let hours = Math.floor(
                (diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
            );
            let minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            let seconds = Math.floor((diff % (1000 * 60)) / 1000);
            if (hours < 10) hours = "0" + hours;
            if (minutes < 10) minutes = "0" + minutes;
            if (seconds < 10) seconds = "0" + seconds;
            let timeText = hours + " : " + minutes + " : " + seconds;
            document.getElementById("dailycountdowntext_stats").innerHTML =
                timeText;
            document.getElementById("dailycountdowntext_results").innerHTML =
                timeText;
            if (diff < 0) {
                clearInterval(countdownDaily);
            }
        }, 1000);
    }

    document.getElementById("gameoverresult").innerHTML = resultMsg;
    document.getElementById("flagglepic").src = countries[countryIndex].img;
    let dailyModeText = "FLAGGLE";
    if (dailyMode) {
        dailyModeText = "DAILY " + dailyModeText;
    }
    document.getElementById("flagglenamedisplay").innerHTML =
        "The <b>" +
        dailyModeText +
        "</b> is <b>" +
        countries[countryIndex].name +
        "</b>";
    let newGuesses = cloneGuesses();
    let newGuesses_parent = document.getElementById("flaggleresultsdata");
    let resultsFlaggle = document.createElement("div");
    resultsFlaggle.classList.add("flaggle");
    if (isWin) resultsFlaggle.innerHTML = icons.flaggle;
    else resultsFlaggle.innerHTML = icons.lose;
    newGuesses.appendChild(resultsFlaggle);
    document.getElementById("resultguesses").id = "resultguesses_temp";
    newGuesses.id = "resultguesses";
    newGuesses_parent.insertBefore(
        newGuesses,
        document.getElementById("resultguesses_temp")
    );
    newGuesses_parent.removeChild(
        document.getElementById("resultguesses_temp")
    );
    if (dailyMode) {
        document.getElementById("dailyflaggledate").innerHTML =
            currDate.toDateString();
    } else {
        document.getElementById("dailyflaggledate").innerHTML = "";
    }

    document
        .getElementById("sharebutton")
        .addEventListener("click", function () {
            let finalShareText = "Flaggle ";

            if (dailyMode) finalShareText += "Daily  ";
            else finalShareText += "Random  ";

            finalShareText += tries + "/" + maxTries + "\n";

            if (dailyMode) finalShareText += currDate.toDateString().slice(4);

            finalShareText += "\n\n" + resultText;

            copyTextToClipboard(finalShareText);
            this.querySelector("#sharetext").innerHTML = "Copied!";
        });

    document.getElementById("GameResults").style.display = "block";
}

/* handle clicks on flag and color buttons, check win status */
function onClickButtons() {
    console.log("current count: " + currentCountryChoicesCount);
    this.removeEventListener("click", onClickButtons);
    tries += 1;

    let isColorButton = "color" in this.dataset;
    let clickedFlaggle = false;
    let currGuess = {};

    currGuess.index = this.dataset.index;
    if (isColorButton) {
        // color buttons
        currGuess.type = this.dataset.color;
        setGuessCounter(tries - 1, this.dataset.color);
        filterFlags(this.dataset.color);
        this.dataset.disabled = true;
        if (!colorCheck(this.dataset.color)) {
            this.dataset.wrong = true;
            resultText += icons.wrongColor;
        } else {
            resultText += icons.rightColor;
        }
    } else {
        // flag buttons
        currGuess.type = null;
        setGuessCounter(tries - 1);
        if (this.dataset.index != countryIndex) {
            fadeFlagPic(this);
            resultText += icons.wrongFlag;
        } else {
            clickedFlaggle = true;
            hasFlaggle = true;
            resultText += icons.rightFlag;
        }
    }

    // win/lose state checker
    if (clickedFlaggle) {
        // win by directly picking flaggle
        isWin = true;
    } else if (tries == maxTries) {
        // sudden death (last try)
        if (isColorButton) {
            if (currentCountryChoicesCount == 1) {
                // win by sudden death (elimination by color)
                isWin = true;
            } else {
                isWin = false;
            }
        } else {
            if (clickedFlaggle) {
                // win by sudden death (directly picking flaggle)
                console.log("sudden death");
                isWin = true;
            } else {
                isWin = false;
            }
        }
    } else if (currentCountryChoicesCount == 1) {
        // win by elimination with remaining tries
        isWin = true;
    }
    if (isWin) {
        resultText += "  " + icons.flaggle;
    } else if (isWin == false) {
        resultText += "  " + icons.lose;
    }

    guesses.push(currGuess);

    // indicate win/lose, disable buttons
    if (isWin != null) {
        if (dailyMode) saveLastGame();
        if (isWin) {
            let guessList = document
                .getElementById("guesses")
                .querySelectorAll(".guessed, .flag_guessed");
            if (clickedFlaggle) {
                guessList[guessList.length - 1].classList.add("purple");
            }
        }
        let g = document.getElementById("guesses").querySelectorAll(".current");
        if (g.length > 0) {
            g[0].classList.remove("current");
        }
        disableButtons();
        showResults();
    }
}

/* click handler for daily mode button */
function clickDailyModeButton() {
    Cookies.set("dailyMode", "true", { sameSite: "strict" });
    setDailyMode();
    location.reload();
}

/* click handler for random mode button */
function clickRandomModeButton() {
    Cookies.set("dailyMode", "false", { sameSite: "strict" });
    setDailyMode();
    location.reload();
}

/* set game mode based on selection */
function setDailyMode() {
    let dailyModeCookie = Cookies.get("dailyMode");
    if (dailyModeCookie === undefined) {
        Cookies.set("dailyMode", String(dailyMode), { sameSite: "strict" });
        dailyModeCookie = Cookies.get("dailyMode");
    }
    if (dailyModeCookie === "true") {
        dailyMode = true;
        document.getElementById("drnotiftext").innerHTML = "DAILY";
        // document.getElementById("randomflaggle").classList.remove("disabled")
        document.getElementById("dailyflaggle").classList.add("disabled");
        document.getElementById("dailyflaggle").disabled = true;
        document
            .getElementById("dailyflaggle")
            .removeEventListener("click", clickDailyModeButton);
    } else {
        dailyMode = false;
        document.getElementById("drnotiftext").innerHTML = "RANDOM";
        // document.getElementById("randomflaggle").classList.add("disabled")
        document.getElementById("dailyflaggle").classList.remove("disabled");
        document.getElementById("dailyflaggle").disabled = false;
        document
            .getElementById("dailyflaggle")
            .addEventListener("click", clickDailyModeButton);
    }
}

/* save game state into lastGame cookie */
function saveLastGame() {
    console.log("saving game");
    if (isWin == null) {
        console.log("skip");
        return;
    }
    let lastGame_temp = {};
    lastGame_temp.date = currDate.toDateString();
    lastGame_temp.isWin = isWin;
    lastGame_temp.index = countryIndex;
    lastGame_temp.hasFlaggle = hasFlaggle;
    lastGame_temp.resultText = resultText;
    lastGame_temp.guesses = guesses;
    lastGame = lastGame_temp;
    Cookies.set("lastGame", JSON.stringify(lastGame), { sameSite: "strict" });
}

/* load game state from lastGame cookie into globals */
function loadLastGame() {
    if (Cookies.get("dailyMode") === "false") return;
    console.log("loading last game");
    let lastGameCookie = Cookies.get("lastGame");
    if (lastGameCookie == undefined) return;
    lastGame = JSON.parse(lastGameCookie);
    if (currDate.toDateString() != lastGame.date) return;
    isWin = lastGame.isWin;
    countryIndex = lastGame.index;
    tries = lastGame.guesses.length;
    resultText = lastGame.resultText;
    for (let i = 0; i < tries; i++) {
        if (i == tries - 1) hasFlaggle = lastGame.hasFlaggle;
        setGuessCounter(i, lastGame.guesses[i].type);
    }
    disableButtons();
    showResults();
}

/* reset lastGame cookie */
function resetLastGame() {
    Cookies.remove("lastGame");
    location.reload();
}

// initializations

/* initialize daily and random mode buttons */
document
    .getElementById("dailyflaggle")
    .addEventListener("click", clickDailyModeButton);
document
    .getElementById("randomflaggle")
    .addEventListener("click", clickRandomModeButton);

/* set game mode */
setDailyMode();

/* initialize randomizer function */
if (seedOverride == null) {
    if (dailyMode) {
        initRandomizer();
    } else {
        initRandomizer(String(Math.random()));
    }
} else {
    initRandomizer(seedOverride);
}

/* create and initialize the guess counter based on <maxTries> */
document.getElementById("guesses").innerHTML = "";
for (let i = 0; i < maxTries; i++) {
    let guessIndicator = document.createElement("div");
    guessIndicator.dataset.index = i;
    guessIndicator.classList.add("guessindicators");
    if (i == 0) guessIndicator.classList.add("current");
    document.getElementById("guesses").appendChild(guessIndicator);
}

document.getElementById("dailycountdowntext_stats").innerHTML = "";
document.getElementById("dailycountdowntext_results").innerHTML = "";

// main program

countryRandomizer(countryChoicesCount).then((data) => {
    country = data[1];
    countries = data[0];
    countryIndex = data[2];
    console.log("RANDOMIZED: ");
    console.log(country);
    console.log(countries);
    displayCountries();
    enableButtons();
    loadLastGame();
});
