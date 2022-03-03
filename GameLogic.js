// global-ish variables
let countryChoicesCount = defaultDifficulty; // number of flags to play with
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
let dailyMode = true; // daily/random mode
let clipboard_share = null; // ClipboardJS object for results sharetext
let clipboard_stats = null; // ClipboardJS object for stats sharetext
let randomizerSeed = null; // seed for randomizer function
let countdownDaily = null; // countdown timer for next daily flagle

// helper functions

/* ranged integer randomizer */
function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(randomizer() * (max - min) + min); //The maximum is exclusive and the minimum is inclusive
}

/* comparison function for sorting */
function comp(a, b) {
    let x = a.name;
    let y = b.name;
    return x.localeCompare(y);
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
function createRandomizer(seedString = null) {
    if (seedString == null) {
        seedString = currDate.toDateString();
    }
    let seedBytes = Array.from(seedString, (x) => x.charCodeAt(0));
    let seedHash = MurmurHash3(seedBytes);
    logger('Seed: "' + seedString + '"');
    logger('Hash: "' + seedHash + '"');
    randomizer = mulberry32(seedHash);
    for (let i = 0; i < 15; i++) randomizer();
}

/* JSON file loader for the country list */
async function fetchCountries() {
    logger("fetching countries.json");
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
    logger("fetched countries.json");
    logger(countries);
    return countries;
}

/* gets <count> number of countries from the country list */
async function countryRandomizer(count) {
    logger("picking " + count + " random countries");
    let countries = await fetchCountries();
    let chosenCountries = [];
    let colorCombos = {};
    let currCount = 0;
    let colorToNum = {
        white: 1,
        red: 2,
        orange: 4,
        yellow: 8,
        green: 16,
        blue: 32,
        black: 64,
    };
    let doofyDump = [];
    while (currCount < count) {
        if (countries.length == 0) break;
        let randIndex = getRandomInt(0, countries.length);
        let currCountry = countries[randIndex];

        /* if biasing generator */
        if (biasRandomGen) {
            /* turn color list into unique combo number */
            let total = 0;
            for (let c of currCountry.colors) {
                total += colorToNum[c];
            }
            let totalString = total.toString();

            /* check if adding current country exceeds a combo's threshold */
            let tempScore =
                totalString in colorCombos ? colorCombos[totalString] + 1 : 1;
            if (tempScore > doofyThreshold) {
                /* add country to a bin for later and skip to the next */
                logger("doofy color combo, skipping " + currCountry.name);
                doofyDump.push(currCountry);
                countries.splice(randIndex, 1);
                continue;
            }
            /* count country into combo */
            colorCombos[totalString] = tempScore;
        }

        chosenCountries.push(currCountry);
        countries.splice(randIndex, 1);
        currCount += 1;
    }

    /* insert remaining needed to reach <count> */
    while (currCount < count) {
        chosenCountries.push(doofyDump[0]);
        doofyDump.splice(0, 1);
        currCount += 1;
        logger("readd doofy");
    }

    logger(colorCombos);
    chosenCountries.sort(function (a, b) {
        return comp(a, b);
    });
    logger("picked " + count + " random countries");
    logger(chosenCountries);

    countries = chosenCountries;
    countryIndex = getRandomInt(0, countries.length);

    return [countries, countryIndex];

    // return chosenCountries;
}

/* display country flags and names from the country list */
function displayCountries() {
    let choices = document.getElementById("choices");
    choices.innerHTML = "";
    for (let i = 0; i < countries.length; i++) {
        let x = countries[i];

        let flag_button = document.createElement("div");
        flag_button.classList.add("flagbutton");
        flag_button.dataset.index = i;
        flag_button.title = "fullname" in x ? x.fullname : x.name;
        flag_button.tabIndex = 0;

        let flag_img = new Image();
        flag_img.className = "flagpic";
        flag_img.height = 50;
        flag_img.width = 92;
        flag_img.src = x.img;
        // flag_img.loading = "lazy";
        flag_img.alt = "fullname" in x ? x.fullname : x.name;
        let flag_img_temp = new Image();
        flag_img_temp.className = "flagpic_loading";
        flag_img_temp.height = 50;
        flag_img_temp.width = 92;
        flag_img_temp.src = document.querySelector("#loading > img").src;
        flag_img_temp.loading = "lazy";
        flag_img_temp.alt = "fullname" in x ? x.fullname : x.name;
        // flag_button.appendChild(flag_img);
        flag_button.appendChild(flag_img_temp);

        flag_img.onload = function () {
            document
                .querySelector(".flagbutton[data-index='" + i + "']")
                .replaceChild(
                    flag_img,
                    document
                    .querySelector(".flagbutton[data-index='" + i + "'] > img")
                );
            // flag_button.appendChild(flag_img);
        };

        let flag_name_box = document.createElement("div");
        flag_name_box.className = "flagnamebox";
        let flag_name = document.createElement("span");
        flag_name.className = "flagname";
        flag_name.innerHTML = x.name;
        flag_name_box.appendChild(flag_name);
        flag_button.appendChild(flag_name_box);

        choices.appendChild(flag_button);
    }
}

/* set the appearance for the guess counter at <index> */
// zero-indexed
// if color==null, country type
function setGuessCounter(index, color, correct) {
    let guessIndicator = document.getElementById("guesses");
    let guessIndicatorCurrent = guessIndicator.querySelector(
        ".guessindicators[data-index='" + index + "']"
    );
    if (guessIndicatorCurrent)
        guessIndicatorCurrent.classList.remove("current");
    if (index < maxTries - 1) {
        let guessIndicatorNext = guessIndicator.querySelector(
            ".guessindicators[data-index='" + (index + 1) + "']"
        );
        guessIndicatorNext.classList.add("current");
    }
    if (guessIndicatorCurrent) {
        if (color == null) {
            guessIndicatorCurrent.classList.add("flag_guessed");
        } else {
            guessIndicatorCurrent.classList.add("guessed");
            guessIndicatorCurrent.classList.add(color);
        }
        if (correct) {
            guessIndicatorCurrent.classList.add("purple");
        }
    }
}

/* check if <color> is in <country>'s colors */
function colorCheck(color) {
    return countries[countryIndex].colors.includes(color);
}

/* set country flag element as disabled, tally remaining countries */
function fadeFlag(index) {
    let elem = document
        .getElementById("choices")
        .querySelector(".flagbutton[data-index='" + index + "']");
    if (!elem) return;
    elem.dataset.disabled = true;
    elem.removeEventListener("click", onClickGameButtons);
    currentCountryChoicesCount--;
}

/* remove flags not containing "color" */
function fadeFlagsByColor(color) {
    let choices = document
        .getElementById("choices")
        .querySelectorAll(".flagbutton:not([data-disabled])");
    for (let x of choices) {
        let x_colors = countries[x.dataset.index].colors;
        if (colorCheck(color)) {
            if (!x_colors.includes(color)) {
                fadeFlag(x.dataset.index);
            }
        } else {
            if (x_colors.includes(color)) {
                fadeFlag(x.dataset.index);
            }
        }
    }
}

/* enable all flag & color buttons */
function enableButtons() {
    for (let c of document.getElementById("colorkeys").children) {
        c.addEventListener("click", onClickGameButtons);
        c.removeAttribute("data-disabled");
        c.removeAttribute("data-wrong");
    }
    for (let f of document
            .getElementById("choices")
            .querySelectorAll(".flagbutton")) {
        f.addEventListener("click", onClickGameButtons);
        f.removeAttribute("data-disabled");
        f.classList.remove("flagbutton_flaggle");
    }
    document.getElementById("middlediv").classList.remove("enabled");
    document
        .getElementById("middlediv")
        .removeEventListener("click", showResults);
}

/* disable all flag & color buttons except the flaggle */
function disableButtons() {
    for (let c of document.getElementById("colorkeys").children) {
        c.removeEventListener("click", onClickGameButtons);
        c.dataset.disabled = true;
        if (!colorCheck(c.dataset.color)) {
            c.dataset.wrong = true;
        }
    }
    for (let f of document
            .getElementById("choices")
            .querySelectorAll(".flagbutton")) {
        f.removeEventListener("click", onClickGameButtons);
        if (f.dataset.index != countryIndex) {
            f.classList.remove("flagbutton_flaggle");
            f.dataset.disabled = true;
        } else {
            f.classList.add("flagbutton_flaggle");
            f.scrollIntoView({
                behavior: "smooth",
                block: "center",
                inline: "center",
            });
        }
    }
    document.getElementById("middlediv").classList.add("enabled");
    document.getElementById("middlediv").addEventListener("click", showResults);
}


/* set next daily flaggle countdowns, has to be repeated per second */
function updateCountdown(interval) {
    let future = new Date(currDate.getTime());
    let now = new Date();
    future.setDate(future.getDate() + 1);
    future.setHours(0, 0, 0);
    let diff = future - now;
    let hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    let minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    let seconds = Math.floor((diff % (1000 * 60)) / 1000);
    if (hours < 10) hours = "0" + hours;
    if (minutes < 10) minutes = "0" + minutes;
    if (seconds < 10) seconds = "0" + seconds;
    let timeText = hours + " : " + minutes + " : " + seconds;
    document.getElementById("nextdailyresult").style.display = "inline";
    document.getElementById("nextdailystats").style.display = "inline";
    document.getElementById("dailycountdowntext_stats").innerHTML = timeText;
    document.getElementById("dailycountdowntext_results").innerHTML = timeText;
    if (diff < 0 && !(interval == null || interval == undefined)) {
        clearInterval(interval);
    }
}
/* start next daily flaggle countdowns */
function startCountdown() {
    logger("trying to start countdown");
    if (countdownDaily == null) {
        let lastGameCookie = CookiesAPI.get("lastGame_d");
        if (lastGameCookie != undefined) {
            logger("saved daily game found, checking if out of date");
            let lgdcObj = JSON.parse(lastGameCookie);
            if (lgdcObj.seed == currDate.toDateString()) {
                logger("within same date, starting countdown");
                updateCountdown();
                countdownDaily = setInterval(function () {
                    updateCountdown(countdownDaily);
                }, 1000);
            } else {
                logger("saved daily game out of date");
            }
        } else {
            logger("daily mode not yet finished");
        }
    } else {
        logger("countdown already started");
    }
}

/* update & display results in the GameResults modal */
function showResults() {
    let resultMsg = "";
    if (!dailyMode) {
        document.getElementById("randomflaggle").classList.add("sticky");
        document.getElementById("randomflaggle").classList.remove("disabled");
        document.getElementById("randomflaggle").disabled = false;
        document
            .getElementById("randomflaggle")
            .addEventListener("click", onClickRandomModeButton);
    } else {
        document.getElementById("randomflaggle").classList.remove("sticky");
    }
    if (isWin) {
        resultMsg = resultMsgs_win[tries - 1];
    } else {
        if (currentCountryChoicesCount <= soCloseThreshold) {
            resultMsg = resultMsgs_lose[0];
        } else {
            resultMsg = resultMsgs_lose[1];
        }
    }
    document.getElementById("gameoverresult").innerHTML = resultMsg;
    document.getElementById("flagglepic").width = 460;
    document.getElementById("flagglepic").height = 240;
    document.getElementById("flagglepic").src = countries[countryIndex].img;

    /* load bigger image */
    let bigFlagglePic = new Image();
    bigFlagglePic.width = 460;
    bigFlagglePic.height = 240;
    bigFlagglePic.src = countries[countryIndex].img.replace("w160", "h240");
    bigFlagglePic.alt = "fullname" in countries[countryIndex] ? countries[countryIndex].fullname : countries[countryIndex].name;
    bigFlagglePic.onload = function () {
        document
            .getElementById("flagglepic")
            .parentNode.replaceChild(
                bigFlagglePic,
                document.getElementById("flagglepic")
            );
        bigFlagglePic.id = "flagglepic";
    };

    let dailyModeText = "FLAGLE";
    if (dailyMode) {
        dailyModeText = "DAILY " + dailyModeText;
    }
    let flaggleName =
        "fullname" in countries[countryIndex] ?
        countries[countryIndex].fullname :
        countries[countryIndex].name;
    document.getElementById("flagglenamedisplay").innerHTML =
        "The <b>" + dailyModeText + "</b> is <b>" + flaggleName + "</b>";

    /* create a new element containing the guesses so far */
    let newGuesses = document.createElement("div");
    for (let i of document.getElementById("guesses").children) {
        if (
            i.classList.contains("guessed") ||
            i.classList.contains("flag_guessed")
        ) {
            newGuesses.appendChild(i.cloneNode(true));
        }
    }

    let newGuesses_parent = document.getElementById("flaggleresultsdata");
    let resultsFlaggle = document.createElement("div");
    resultsFlaggle.classList.add("flaggle");
    if (isWin) resultsFlaggle.innerHTML = icons.flaggle;
    else resultsFlaggle.innerHTML = icons.lose;
    newGuesses.appendChild(resultsFlaggle);
    if (isWin && countryChoicesCount == maxDifficulty && !dailyMode) {
        let resultsFlaggle = document.createElement("div");
        resultsFlaggle.classList.add("flaggle");
        resultsFlaggle.innerHTML = icons.hard;
        newGuesses.appendChild(resultsFlaggle);
    }
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

    if (clipboard_share == null) {
        clipboard_share = new ClipboardJS("#sharebutton", {
            text: function () {
                let finalShareText = "Flagle ";

                if (dailyMode) finalShareText += "Daily  ";
                else finalShareText += "Random  ";

                finalShareText += tries + "/" + maxTries + "\n";

                if (dailyMode)
                    finalShareText += currDate.toDateString().slice(4);
                else finalShareText += countryChoicesCount;

                finalShareText += "\n\n" + resultText;
                if (!dailyMode && countryChoicesCount == maxDifficulty && isWin)
                    finalShareText += "  " + icons.hard;

                return finalShareText;
            },
        });
        clipboard_share.on("success", function (e) {
            e.trigger.innerHTML = "COPIED!";
            setTimeout(function () {
                e.trigger.innerHTML = "SHARE";
            }, 1000);
        });
        clipboard_share.on("error", function (e) {
            e.trigger.innerHTML = "FAILED.";
            setTimeout(function () {
                e.trigger.innerHTML = "SHARE";
            }, 1000);
        });
    }

    document.getElementById("GameResults").style.display = modalDisplayType;
}

/* handle clicks on flag and color buttons, check win status */
function onClickGameButtons() {
    this.removeEventListener("click", onClickGameButtons);
    tries += 1;

    let isColorButton = "color" in this.dataset;
    let clickedFlaggle = false;
    let currGuess = {};

    currGuess.index = this.dataset.index;
    if (isColorButton) {
        // color buttons
        currGuess.type = this.dataset.color;
        fadeFlagsByColor(this.dataset.color);
        this.dataset.disabled = true;
        if (!colorCheck(this.dataset.color)) {
            currGuess.correct = false;
            this.dataset.wrong = true;
            resultText += icons.wrongColor;
            setGuessCounter(tries - 1, this.dataset.color, false);
        } else {
            currGuess.correct = true;
            resultText += icons.rightColor;
            setGuessCounter(tries - 1, this.dataset.color, true);
        }
    } else {
        // flag buttons
        currGuess.type = null;
        if (this.dataset.index != countryIndex) {
            currGuess.correct = false;
            fadeFlag(this.dataset.index);
            resultText += icons.wrongFlag;
            setGuessCounter(tries - 1, null, false);
        } else {
            currGuess.correct = true;
            clickedFlaggle = true;
            hasFlaggle = true;
            resultText += icons.rightFlag;
            setGuessCounter(tries - 1, null, true);
        }
    }

    logger("max count: " + countryChoicesCount);
    logger("current count: " + currentCountryChoicesCount);

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
                logger("sudden death");
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

    saveLastGame();

    // indicate win/lose, disable buttons
    if (isWin != null) {
        saveGameStats();
        displayGameStats(dailyMode);
        if (dailyMode) {
            startCountdown();
        }
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
        setTimeout(function () {
            showResults();
        }, showResultsDelay);
    }
}

/* click handler for daily mode button */
function onClickDailyModeButton() {
    // if (dailyMode) return;
    CookiesAPI.set("dailyMode", "true");
    onChangeMode();
}
/* click handler for random mode button */
function onClickRandomModeButton() {
    // if (!dailyMode) return;
    CookiesAPI.set("dailyMode", "false");
    onChangeMode();
}
/* create randomSeed cookie when game mode is changed */
function onChangeMode() {
    let randomSeedCookie = CookiesAPI.get("randomSeed");
    let lastGameRandomCookie = CookiesAPI.get("lastGame_r");
    if (randomSeedCookie == undefined || isWin != null) {
        logger("setting randomizer seed");
        randomizerSeed = Math.random().toString();
        if (lastGameRandomCookie != undefined) {
            let lgrcObj = JSON.parse(lastGameRandomCookie);
            if (lgrcObj.isWin == null) {
                logger("seed loaded from last game");
                randomizerSeed = lgrcObj.seed;
            }
        }
        CookiesAPI.set("randomSeed", randomizerSeed);
    }
    loadGameMode();
    reloadGame();
}

/* save gave statistics to cookies */
function saveGameStats() {
    let statsPrefix = dailyMode ? "stats_d_" : "stats_r_";

    let totalGamesStr = statsPrefix + "totalGames";
    let totalWinsStr = statsPrefix + "totalWins";
    let currentStreakStr = statsPrefix + "currentStreak";
    let bestStreakStr = statsPrefix + "bestStreak";
    let totalGamesVal = CookiesAPI.get(totalGamesStr);
    let totalWinsVal = CookiesAPI.get(totalWinsStr);
    let currentStreakVal = CookiesAPI.get(currentStreakStr);
    let bestStreakVal = CookiesAPI.get(bestStreakStr);

    totalGamesVal = totalGamesVal == undefined ? 0 : Number(totalGamesVal);
    totalWinsVal = totalWinsVal == undefined ? 0 : Number(totalWinsVal);
    currentStreakVal =
        currentStreakVal == undefined ? 0 : Number(currentStreakVal);
    bestStreakVal = bestStreakVal == undefined ? 0 : Number(bestStreakVal);

    totalGamesVal += 1;
    CookiesAPI.set(totalGamesStr, totalGamesVal);

    if (isWin) {
        totalWinsVal += 1;
        CookiesAPI.set(totalWinsStr, totalWinsVal);

        currentStreakVal += 1;
        CookiesAPI.set(currentStreakStr, currentStreakVal);

        bestStreakVal =
            currentStreakVal > bestStreakVal ? currentStreakVal : bestStreakVal;
        CookiesAPI.set(bestStreakStr, bestStreakVal);
    } else {
        currentStreakVal = 0;
        CookiesAPI.set(currentStreakStr, currentStreakVal);
    }
}

/* callback functions for daily/random buttons in stat modal */
function statModal_Daily() {
    displayGameStats(true);
}

function statModal_Random() {
    displayGameStats(false);
}

/* load & show game statistics from cookies */
function displayGameStats(showDaily) {
    if (showDaily) {
        document.getElementById("drchoiceleft").classList.add("selected");
        document.getElementById("drchoiceright").classList.remove("selected");
        document
            .getElementById("drchoiceleft")
            .removeEventListener("click", statModal_Daily);
        document
            .getElementById("drchoiceright")
            .addEventListener("click", statModal_Random);
    } else {
        document.getElementById("drchoiceleft").classList.remove("selected");
        document.getElementById("drchoiceright").classList.add("selected");
        document
            .getElementById("drchoiceleft")
            .addEventListener("click", statModal_Daily);
        document
            .getElementById("drchoiceright")
            .removeEventListener("click", statModal_Random);
    }

    let statsPrefix = showDaily ? "stats_d_" : "stats_r_";

    let stats_totalWins_str = statsPrefix + "totalWins";
    let stats_totalGames_str = statsPrefix + "totalGames";
    let stats_currentStreak_str = statsPrefix + "currentStreak";
    let stats_bestStreak_str = statsPrefix + "bestStreak";

    let stats_totalWins = CookiesAPI.get(stats_totalWins_str);
    let stats_totalGames = CookiesAPI.get(stats_totalGames_str);
    let stats_currentStreak = CookiesAPI.get(stats_currentStreak_str);
    let stats_bestStreak = CookiesAPI.get(stats_bestStreak_str);

    stats_totalWins =
        stats_totalWins == undefined ? 0 : Number(stats_totalWins);
    stats_totalGames =
        stats_totalGames == undefined ? 0 : Number(stats_totalGames);
    stats_currentStreak =
        stats_currentStreak == undefined ? 0 : Number(stats_currentStreak);
    stats_bestStreak =
        stats_bestStreak == undefined ? 0 : Number(stats_bestStreak);

    let stats_winPercent =
        stats_totalGames != 0 ?
        Math.round((stats_totalWins / stats_totalGames) * 1000) / 10 :
        0;

    document.getElementById("flagsguessedtext").innerHTML = stats_totalWins;
    document.getElementById("winpercenttext").innerHTML = stats_winPercent;
    document.getElementById("currentstreaktext").innerHTML =
        stats_currentStreak;
    document.getElementById("beststreaktext").innerHTML = stats_bestStreak;
    document.getElementById("totalgamestext").innerHTML = stats_totalGames;

    if (clipboard_stats != null) {
        clipboard_stats.destroy();
        clipboard_stats = null;
    }
    clipboard_stats = new ClipboardJS("#sharebuttonstat", {
        text: function () {
            let finalShareText = "Flagle ";

            if (showDaily) finalShareText += "Daily ";
            else finalShareText += "Random ";

            finalShareText += "Stats  📈" + "\n\n";
            finalShareText +=
                "Flagles Guessed: " +
                stats_totalWins +
                "  " +
                icons.flaggle +
                "\n";
            finalShareText += "Win %: " + stats_winPercent + "  ✅\n";
            finalShareText += "Best Streak: " + stats_bestStreak + "  👏";

            return finalShareText;
        },
    });
    clipboard_stats.on("success", function (e) {
        let temp_text = e.trigger.innerHTML;
        e.trigger.innerHTML = "COPIED!";
        setTimeout(function () {
            e.trigger.innerHTML = "SHARE";
        }, 1000);
    });
    clipboard_stats.on("error", function (e) {
        let temp_text = e.trigger.innerHTML;
        e.trigger.innerHTML = "FAILED.";
        setTimeout(function () {
            e.trigger.innerHTML = "SHARE";
        }, 1000);
    });
}

/* set game mode based on selection */
function loadGameMode() {
    let dailyModeCookie = CookiesAPI.get("dailyMode");
    if (dailyModeCookie === undefined) {
        CookiesAPI.set("dailyMode", String(dailyMode));
        dailyModeCookie = String(dailyMode);
    }
    if (dailyModeCookie === "true") {
        dailyMode = true;
        document.getElementById("drnotiftext").innerHTML = "DAILY";
        document.getElementById("dailyflaggle").classList.add("disabled");
        document.getElementById("dailyflaggle").disabled = true;
        document
            .getElementById("dailyflaggle")
            .removeEventListener("click", onClickDailyModeButton);

        document.getElementById("randomflaggle").classList.remove("disabled");
        document.getElementById("randomflaggle").disabled = false;
        document
            .getElementById("randomflaggle")
            .addEventListener("click", onClickRandomModeButton);
    } else {
        dailyMode = false;
        document.getElementById("drnotiftext").innerHTML = "RANDOM";
        document.getElementById("dailyflaggle").classList.remove("disabled");
        document.getElementById("dailyflaggle").disabled = false;
        document
            .getElementById("dailyflaggle")
            .addEventListener("click", onClickDailyModeButton);

        document.getElementById("randomflaggle").classList.add("disabled");
        document.getElementById("randomflaggle").classList.remove("sticky");
        document.getElementById("randomflaggle").disabled = true;
        document
            .getElementById("randomflaggle")
            .removeEventListener("click", onClickRandomModeButton);
    }
    displayGameStats(dailyMode);
}

/* save game state into lastGame cookie */
function saveLastGame() {
    if (!dailyMode && isWin != null) {
        logger("removing random last game");
        CookiesAPI.remove("randomSeed");
        CookiesAPI.remove("lastGame_r");
        return;
    }
    logger("saving game");
    let lastGame_temp = {};
    if (dailyMode) {
        lastGame_temp.seed = currDate.toDateString();
    } else {
        lastGame_temp.seed = randomizerSeed;
    }
    lastGame_temp.isWin = isWin;
    lastGame_temp.index = countryIndex;
    lastGame_temp.hasFlaggle = hasFlaggle;
    lastGame_temp.resultText = resultText;
    lastGame_temp.guesses = guesses;
    if (isWin == null) {
        logger("unfinished game, saving");
        // return;
    }
    let lastGameCookiePrefix = dailyMode ? "_d" : "_r";
    CookiesAPI.set(
        "lastGame" + lastGameCookiePrefix,
        JSON.stringify(lastGame_temp)
    );
}

/* load game state from lastGame cookie into globals */
function loadLastGame() {
    logger("loading last game");
    startCountdown();
    let dailyModeCookieBool = !(CookiesAPI.get("dailyMode") == "false");
    let lastGameCookiePrefix = dailyModeCookieBool ? "_d" : "_r";
    let lastGameCookie = CookiesAPI.get("lastGame" + lastGameCookiePrefix);
    if (lastGameCookie == undefined) {
        if (!window.sessionStorage.getItem("tutorialShown")) {
            document.getElementById("howtotext").style.display =
                modalDisplayType;
            window.sessionStorage.setItem("tutorialShown", "true");
        }
        return;
    }
    // if (CookiesAPI.get("dailyMode") === "false") {
    //     startCountdown();
    //     return;
    // }
    let lastGame = JSON.parse(lastGameCookie);
    logger("loading last game");
    logger(lastGame);
    if (dailyModeCookieBool) {
        if (currDate.toDateString() != lastGame.seed) {
            CookiesAPI.remove("lastGame_d");
            return;
        }
    }
    randomizerSeed = lastGame.seed;
    isWin = lastGame.isWin;
    countryIndex = lastGame.index;
    tries = lastGame.guesses.length;
    resultText = lastGame.resultText;
    for (let i = 0; i < tries; i++) {
        if (i == tries - 1) hasFlaggle = lastGame.hasFlaggle;
        setGuessCounter(
            i,
            lastGame.guesses[i].type,
            lastGame.guesses[i].correct
        );
    }
    guesses = lastGame.guesses;
    if (isWin != null) {
        let currentGuess = document
            .getElementById("guesses")
            .querySelector(".current");
        if (currentGuess) currentGuess.classList.remove("current");
        disableButtons();
        showResults();
    } else {
        for (let g of guesses) {
            if (g.type == null) {
                fadeFlag(g.index);
            } else {
                let colorButton = document.querySelector(
                    "#colorkeys > .colors[data-color='" + g.type + "']"
                );
                colorButton.dataset.disabled = true;
                if (!g.correct) {
                    colorButton.dataset.wrong = true;
                }
                fadeFlagsByColor(g.type);
            }
            setGuessCounter(g.index, g.type, g.correct);
        }
    }
}

/* handle changes on difficulty slider */
function onInputSlider() {
    let difficultyCookie = CookiesAPI.get("difficulty");
    document.getElementById("difficultyValue").innerHTML = this.value;
    logger("new difficulty: " + this.value);
    CookiesAPI.set("difficulty", String(this.value));
    if (this.value != countryChoicesCount && !dailyMode) {
        window.onclick = function (event) {
            if (event.target == modalset) {
                document.getElementById("settingstext").style.display = "none";
                // CookiesAPI.remove("randomSeed");
                CookiesAPI.remove("lastGame_r");
                // reloadGame();
                onChangeMode();
            }
        };
        document.getElementById("closesettings").onclick = function (event) {
            document.getElementById("settingstext").style.display = "none";
            // CookiesAPI.remove("randomSeed");
            CookiesAPI.remove("lastGame_r");
            // reloadGame();
            onChangeMode();
        };
    } else {
        window.onclick = function (event) {
            clickOutsideModal(event);
        };
        document.getElementById("closesettings").onclick = function (event) {
            document.getElementById("settingstext").style.display = "none";
        };
    }
}

/* refresh cookies to extend expiry dates */
function refreshCookies() {
    let cookieStrs = [
        "difficulty",
        "dailyMode",
        "darkMode",
        "randomSeed",
        "lastGame_d",
        "lastGame_r",
        "stats_d_totalWins",
        "stats_d_totalGames",
        "stats_d_currentStreak",
        "stats_d_bestStreak",
        "stats_r_totalWins",
        "stats_r_totalGames",
        "stats_r_currentStreak",
        "stats_r_bestStreak",
    ];
    for (let s of cookieStrs) {
        if (CookiesAPI.get(s) != undefined) {
            CookiesAPI.set(s, CookiesAPI.get(s));
        }
    }
    let algoGenVersionCookie = CookiesAPI.get("algoGenVersion");
    let resetLastGame = false;
    if (algoGenVersionCookie == undefined) {
        resetLastGame = true;
    } else if (parseInt(algoGenVersionCookie) != algoGenVersion) {
        resetLastGame = true;
    }
    CookiesAPI.set("algoGenVersion", algoGenVersion);
    if (resetLastGame) {
        logger(
            "resetting lastGame, new algoGenVersion: " +
            algoGenVersion +
            ", curr: " +
            algoGenVersionCookie
        );
        CookiesAPI.remove("lastGame_r");
        CookiesAPI.remove("lastGame_d");
    }
}

/* reset global variables to default values */
function resetGlobalVars() {
    countryChoicesCount = defaultDifficulty; // number of flags to play with
    randomizer = null; // randomizer function for getRandomInt
    countries = null; // <countryChoicesCount>-length list of countries w/ data
    countryIndex = null; // <country>'s index in <countries>
    currentCountryChoicesCount = countryChoicesCount;
    // number of enabled country buttons
    tries = 0; // number of tries (button pushes) so far
    resultText = ""; // game's share text
    isWin = null; // game state variable: null/true/false
    hasFlaggle = false; // flaggle is directly found
    guesses = []; // list of guesses
    dailyMode = true; // daily/random mode
    randomizerSeed = null; // seed for randomizer function
    /*clipboard_share = null; // ClipboardJS object for results sharetext
    clipboard_stats = null; // ClipboardJS object for stats sharetext */
}

/* reset game cookies, only for debugging */
function avadaKedavra() {
    CookiesAPI.remove("difficulty");
    CookiesAPI.remove("dailyMode");
    CookiesAPI.remove("darkMode");
    CookiesAPI.remove("algoGenVersion");
    CookiesAPI.remove("randomSeed");

    CookiesAPI.remove("lastGame_r");
    CookiesAPI.remove("lastGame_d");

    CookiesAPI.remove("stats_d_totalWins");
    CookiesAPI.remove("stats_d_totalGames");
    CookiesAPI.remove("stats_d_currentStreak");
    CookiesAPI.remove("stats_d_bestStreak");

    CookiesAPI.remove("stats_r_totalWins");
    CookiesAPI.remove("stats_r_totalGames");
    CookiesAPI.remove("stats_r_currentStreak");
    CookiesAPI.remove("stats_r_bestStreak");
    window.sessionStorage.clear();
    location.reload();
}

/* various game initializations */
function init() {
    // initializations

    currDate = new Date(); // current date on page load

    /* refresh any existing cookies */
    refreshCookies();

    /* daily and random mode buttons */
    document
        .getElementById("dailyflaggle")
        .addEventListener("click", onClickDailyModeButton);
    document
        .getElementById("randomflaggle")
        .addEventListener("click", onClickRandomModeButton);

    /* set game mode */
    loadGameMode();

    /* difficulty slider */
    document
        .getElementById("difficultySlider")
        .addEventListener("input", onInputSlider);

    /* load difficulty values into slider */
    if (CookiesAPI.get("difficulty") == undefined) {
        CookiesAPI.set("difficulty", String(countryChoicesCount));
    } else {
        logger("loaded difficulty: " + CookiesAPI.get("difficulty"));
        document.getElementById("difficultySlider").value =
            CookiesAPI.get("difficulty");
        document.getElementById("difficultyValue").innerHTML =
            CookiesAPI.get("difficulty");
        if (dailyMode == false) {
            countryChoicesCount = Number(CookiesAPI.get("difficulty"));
            currentCountryChoicesCount = countryChoicesCount;
        }
    }

    /* create and initialize guess counter based on <maxTries> */
    document.getElementById("guesses").innerHTML = "";
    for (let i = 0; i < maxTries; i++) {
        let guessIndicator = document.createElement("div");
        guessIndicator.dataset.index = i;
        guessIndicator.classList.add("guessindicators");
        if (i == 0) guessIndicator.classList.add("current");
        document.getElementById("guesses").appendChild(guessIndicator);
    }
    document.getElementById("nextdailyresult").style.display = "none";
    document.getElementById("nextdailystats").style.display = "none";
    document.getElementById("dailycountdowntext_stats").innerHTML = "";
    document.getElementById("dailycountdowntext_results").innerHTML = "";

    /* initizalize randomizer */
    if (CookiesAPI.get("dailyMode") == "true") {
        createRandomizer();
    } else {
        let randomSeedCookie = CookiesAPI.get("randomSeed");
        if (randomSeedCookie == undefined) {
            logger("creating randomSeed cookie");
            randomizerSeed = Math.random().toString();
            CookiesAPI.set("randomSeed", randomizerSeed);
        } else {
            logger("loading existing randomSeed cookie");
            randomizerSeed = randomSeedCookie;
        }
        createRandomizer(randomizerSeed);
    }
}

/* reload game */
function reloadGame() {
    logger("NEW GAME\n\n\n\n");
    if (refreshOnNewGame) location.reload();
    else {
        showLoadingScreen();
        // setTimeout(showLoadingScreen, 1000);
        resetGlobalVars();
        enableButtons();
        init();
        countryRandomizer(countryChoicesCount).then((data) => {
            logger("RANDOMIZED: ");
            logger(data[1]);
            countries = data[0];
            countryIndex = data[1];
            displayCountries();
            enableButtons();
            loadLastGame();
            hideLoadingScreen();
        });
    }
}

document.addEventListener("DOMContentLoaded", function () {
    init();
    countryRandomizer(countryChoicesCount).then((data) => {
        logger("RANDOMIZED: ");
        logger(data[1]);
        countries = data[0];
        countryIndex = data[1];
        displayCountries();
        enableButtons();
        loadLastGame();
    });
});