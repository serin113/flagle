//TO DO:
//Make GameResult Popup when game is over
    //Conditional text if fast win, close win, loss, etc.
    //Daily countdown timer on both stats and GameResult timer
//Stats Display Change

// configs
let countryChoicesCount = 30
let maxTries = 6
let dailyMode = false


// global-ish variables
let randomizer = null       // randomizer function for getRandomInt
let countries = null        // <countryChoicesCount>-length list of countries w/ data
let country = null          // chosen country w/ data
let countryIndex = null     // <country>'s index in <countries>
let currentCountryChoicesCount = countryChoicesCount
                            // number of enabled country buttons
let tries = 0               // number of tries (button pushes) so far


// helper functions

/* ranged integer randomizer */
function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    if (randomizer == null) {
        console.log("ERROR (getRandomInt): randomizer function not initialized")
    }
    return Math.floor(randomizer() * (max - min) + min); //The maximum is exclusive and the minimum is inclusive
}

/* comparison function for mergeSort */
function comp (a,b) {
    let x = a.name
    let y = b.name
    return x.localeCompare(y)
}

/* merge sorting for flag list display */
function mergeSort(list) {
    if (list.length == 1) return [list[0]]
    let mid = Math.floor(list.length / 2.0)
    let l1 = list.slice(0,mid)
    let l2 = list.slice(mid,list.length)
    l1 = mergeSort(l1)
    l2 = mergeSort(l2)
    temp = []
    let i = 0 // l1 index
    let j = 0 // l2 index
    let k = 0 // temp index
    while (i < l1.length && j < l2.length) {
        if (comp(l1[i],l2[j]) <= 0) {
            temp.push(l1[i])
            k += 1
            i += 1
        }
        else {
            temp.push(l2[j])
            k += 1
            j += 1
        }
    }
    while (i < l1.length) {
        temp.push(l1[i])
        i += 1
    }
    while (j < l2.length) {
        temp.push(l2[j])
        j += 1
    }
    return temp
}

/* Mulberry32 PRNG: https://github.com/bryc/code/blob/master/jshash/PRNGs.md#mulberry32 
    for generating pseudorandom numbers for the randomizer */
function mulberry32(a) {
    return function() {
      var t = a += 0x6D2B79F5;
      t = Math.imul(t ^ t >>> 15, t | 1);
      t ^= t + Math.imul(t ^ t >>> 7, t | 61);
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    }
}

/* MurmurHash3 hash function: https://github.com/bryc/code/blob/master/jshash/hashes/murmurhash3.js
    for hashing the current date as a reproducible seed for the randomizer */
function MurmurHash3(key, seed = 0) {
    var k, p1 = 3432918353, p2 = 461845907, h = seed | 0;
    for(var i = 0, b = key.length & -4; i < b; i += 4) {
        k = key[i+3] << 24 | key[i+2] << 16 | key[i+1] << 8 | key[i];
        k = Math.imul(k, p1); k = k << 15 | k >>> 17;
        h ^= Math.imul(k, p2); h = h << 13 | h >>> 19;
        h = Math.imul(h, 5) + 3864292196 | 0; // |0 = prevent float
    }
    k = 0;
    switch (key.length & 3) {
        case 3: k ^= key[i+2] << 16;
        case 2: k ^= key[i+1] << 8;
        case 1: k ^= key[i];
                k = Math.imul(k, p1); k = k << 15 | k >>> 17;
                h ^= Math.imul(k, p2);
    }
    h ^= key.length;
    h ^= h >>> 16; h = Math.imul(h, 2246822507);
    h ^= h >>> 13; h = Math.imul(h, 3266489909);
    h ^= h >>> 16;
    return h >>> 0;
}

/* JSON file loader for the country list */
async function fetchCountries(){
    var fetchHeaders = new Headers()
    fetchHeaders.append("pragma", "no-cache")
    fetchHeaders.append("cache-control", "no-cache")
    var fetchInit = {
        method: "GET",
        headers: fetchHeaders
    }
    var fetchRequest = new Request("countries.json")
    const response = await fetch(fetchRequest, fetchInit)
    const countries = await response.json()
    return countries
}

/* gets <count> number of countries from the country list */
async function countryRandomizerArray(count){
    let countries = await fetchCountries()
    let chosenCountries = []
    currCount = 0
    while (currCount < count) {
        let randIndex = getRandomInt(0,countries.length)
        chosenCountries.push(countries[randIndex])
        countries.splice(randIndex, 1)
        currCount += 1
    }
    chosenCountries = mergeSort(chosenCountries)
    return chosenCountries
}

/* picks 1 random country from the country list */
async function countryRandomizer(count){
    let countries = await countryRandomizerArray(count)
    let country_index = getRandomInt(0,countries.length)
    let country = countries[country_index]
    return [countries,country,country_index]
}


// initializations

/* set the randomizer function based on <dailyMode> */
if (dailyMode) {
    let dateString = new Date().toDateString()
    let dateBytes = Array.from(dateString, (x) => x.charCodeAt(0))
    let dateHash = MurmurHash3(dateBytes)
    console.log("Current day: \""+dateString+"\"")
    console.log("Hash: \""+dateHash+"\"")
    randomizer = mulberry32(new Date().getDay())
    for (let i = 0; i < 15; i++) randomizer()
}
else {
    randomizer = Math.random
}

/* create and initialize the guess counter based on <maxTries> */
document.getElementById("guesses").innerHTML = ""
for (let i = 0; i < maxTries; i++) {
    let guessIndicator = document.createElement("div")
    guessIndicator.dataset.index = i
    guessIndicator.classList.add("guessindicators")
    if (i == 0) {
        guessIndicator.classList.add("current")
    }
    document.getElementById("guesses").appendChild(guessIndicator)
}

/* display country flags and names from the country list */
function displayCountries() {
    let choices = document.getElementById("choices")
    choices.innerHTML = ""
    let div_flagpics = null
    let div_flagnames = null
    for (let i = 0; i < countries.length; i++) {
        let x = countries[i]

        if (div_flagpics == null) {
            div_flagpics = document.createElement("div")
            div_flagpics.classList.add("flagpics")
        }
        if (div_flagnames == null) {
            div_flagnames = document.createElement("div")
            div_flagnames.classList.add("flagnames")
        }
        
        let flag_img_div = document.createElement("div")
        let flag_img = document.createElement("img")
        flag_img.className = "flagpic"
        flag_img.dataset.index = i
        flag_img.src = x.img
        flag_img_div.appendChild(flag_img)
        div_flagpics.appendChild(flag_img_div)

        let flag_name_div = document.createElement("div")
        flag_name_div.className = "flagname"
        flag_name_div.dataset.index = i
        let flag_name_text_div = document.createElement("text")
        flag_name_text_div.innerHTML = x.name
        flag_name_div.appendChild(flag_name_text_div)
        div_flagnames.appendChild(flag_name_div)

        if (div_flagpics.childElementCount == 5 || (i == countries.length - 1)) {
            if ((i == countries.length - 1) && (div_flagpics.childElementCount < 5)) {
                for (let j = 0; j < 5-div_flagpics.childElementCount; j++) {
                    let blankdiv = document.createElement("div")
                    div_flagpics.appendChild(blankdiv)
                    div_flagnames.appendChild(blankdiv)
                }
            }
            choices.appendChild(div_flagpics)
            choices.appendChild(div_flagnames)
            div_flagpics = null
            div_flagnames = null
        }
    }
}

/* set the appearance for the guess counter at <index> */
// zero-indexed
// if color==null, country
function setGuessCounter(index, color=null) {
    let guessIndicator = document.getElementById("guesses")
    let guessIndicatorCurrent = guessIndicator.querySelector(".guessindicators[data-index='"+index+"']")
    guessIndicatorCurrent.classList.remove("current")
    if (index < maxTries - 1) {
        let guessIndicatorNext = guessIndicator.querySelector(".guessindicators[data-index='"+(index+1)+"']")
        guessIndicatorNext.classList.add("current")
    }
    if (color==null) {
        guessIndicatorCurrent.classList.add("flag_guessed")
    }
    else {
        guessIndicatorCurrent.classList.add("guessed")
        guessIndicatorCurrent.classList.add(color)
    }
}

/* check if <color> is in <country>'s colors */
function colorCheck(color) {
    return country.colors.includes(color)
}

/* set country name at <index> as disabled */
function fadeCountryName(index) {
    let elem = document.getElementById("choices").querySelector(".flagname[data-index='"+index+"']")
    elem.dataset.disabled = true
}

/* set country flag element as disabled, tally remaining countries */
function fadeFlagPic(elem) {
    fadeCountryName(elem.dataset.index)
    elem.dataset.disabled = true
    elem.removeEventListener("click", onClickButtons)
    currentCountryChoicesCount--
    console.log("remove: " + countries[elem.dataset.index].name)
    console.log("current count: " + currentCountryChoicesCount)
}

/* remove flags not containing "color" */
function filterFlags(color) {
    let choices = document.getElementById("choices").querySelectorAll(".flagpic")
    console.log(choices)
    for (let x of choices) {
        if (x.hasAttribute("data-disabled")) {
            console.log("skip: " + countries[x.dataset.index].name)
            continue
        }
        let x_colors = countries[x.dataset.index].colors
        if (colorCheck(color)) {
            if (!(x_colors.includes(color))) {
                fadeFlagPic(x)
            }
        }
        else {
            if (x_colors.includes(color)) {
                fadeFlagPic(x)
            }
        }
    }
}

/* enable all flag & color buttons */
function enableButtons() {
    for (let c of document.getElementById("colorkeys").children) {
        c.addEventListener("click", onClickButtons)
    }
    for (let f of document.getElementById("choices").querySelectorAll(".flagpic")) {
        f.addEventListener("click", onClickButtons)
    }
}

/* disable all flag & color buttons */
function disableButtons() {
    for (let c of document.getElementById("colorkeys").children) {
        c.removeEventListener("click", onClickButtons)
        c.dataset.disabled = true
        if (!colorCheck(c.dataset.color)) {
            c.dataset.wrong = true
        }
    }
    for (let f of document.getElementById("choices").querySelectorAll(".flagpic")) {
        f.removeEventListener("click", onClickButtons)
        if (f.dataset.index != countryIndex) {
            fadeCountryName(f.dataset.index)
            f.dataset.disabled = true
        }
    }
}

/* handle clicks on flag and color buttons, check win status */
function onClickButtons() {
    console.log("current count: " + currentCountryChoicesCount)
    this.removeEventListener("click", onClickButtons)
    tries += 1
    let isColorButton = "color" in this.dataset

    if (isColorButton) { // color buttons
        setGuessCounter(tries-1, this.dataset.color)
        filterFlags(this.dataset.color)
        this.dataset.disabled = true
        if (!colorCheck(this.dataset.color)) {
            this.dataset.wrong = true
        }
    }
    else { // flag buttons
        setGuessCounter(tries-1)
        if (this.dataset.index != countryIndex) {
            fadeFlagPic(this)
        }
        else {
            document.getElementById("results").innerHTML = "CORRECT! Country is " + country.name
            disableButtons()
            return
        }
    }

    // win/lose state checker
    let win = null
    if (tries == maxTries) {
        if (isColorButton) {
            if (currentCountryChoicesCount == 1) {
                win = true
            }
            else {
                win = false
            }
        }
        else {
            if (this.dataset.index == countryIndex) {
                win = true
            }
            else {
                win = false
            }
        }
    }
    else if (currentCountryChoicesCount == 1) {
        win = true
    }

    // indicate win/lose, disable buttons
    if (win != null) {
        if (win) {
            document.getElementById("results").innerHTML = "CORRECT! Country is " + country.name
        }
        else {
            document.getElementById("results").innerHTML = "WRONG! Country is " + country.name
        }
        disableButtons()
    }
}


// main program

countryRandomizer(countryChoicesCount).then((data) => {
    country = data[1]
    countries = data[0]
    countryIndex = data[2]
    console.log("RANDOMIZED: ")
    console.log(country)
    console.log(countries)
    displayCountries()
    enableButtons()
})