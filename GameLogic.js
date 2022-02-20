let countryChoicesCount = 30
let maxTries = 6
let inactiveOpacity = "0.2"
let dailyMode = false

// mergeSort comparison function
function comp (a,b) {
    let x = a.name
    let y = b.name
    return x.localeCompare(y)
}
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

// Mulberry32 PRNG: https://github.com/bryc/code/blob/master/jshash/PRNGs.md#mulberry32
function mulberry32(a) {
    return function() {
      var t = a += 0x6D2B79F5;
      t = Math.imul(t ^ t >>> 15, t | 1);
      t ^= t + Math.imul(t ^ t >>> 7, t | 61);
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    }
}

// MurmurHash3 hash function: https://github.com/bryc/code/blob/master/jshash/hashes/murmurhash3.js
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

let randomizer = null
function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    if (randomizer == null) {
        if (dailyMode) {
            randomizer = mulberry32(new Date().getDay())
            for (let i = 0; i < 15; i++) randomizer()
        }
        else {
            randomizer = Math.random
        }
    }
    return Math.floor(randomizer() * (max - min) + min); //The maximum is exclusive and the minimum is inclusive
}
async function getCountries(){
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
// async function randomizer(){
// 	let countries = getCountries()
// 	let randIndex = getRandomInt(0,countries.length)
// 	return countries[randIndex]
// }
async function countryRandomizerArray(count){
    let countries = await getCountries()
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
async function countryRandomizer(count){
    let countries = await countryRandomizerArray(count)
    let country_index = getRandomInt(0,countries.length)
    let country = countries[country_index]
    return [countries,country,country_index]
}
let jsonLoaded = false
let country = null
let countries = null
let countryIndex = null
let currentCountryChoicesCount = countryChoicesCount
countryRandomizer(countryChoicesCount).then((data) => {
    let randCountries = data[0]
    let randCountry = data[1]
    let randCountryIndex = data[2]
    console.log("RANDOMIZED: ")
    console.log(randCountry)
    console.log(randCountries)
    country = randCountry
    countries = randCountries
    countryIndex = randCountryIndex
    jsonLoaded = true

    let choices = document.getElementById("choices")
    choices.innerHTML = ""
    let picList = []
    let nameList = []
    let count = 0
    for (let i = 0; i < countries.length ; i++) {
        let x = countries[i]

        let flag_img_div = document.createElement("div")
        let flag_img = document.createElement("img")
        flag_img.className = "flagpic"
        flag_img.dataset.enabled = true
        flag_img.dataset.index = i
        flag_img.src = x.img
        flag_img_div.appendChild(flag_img)
        picList.push(flag_img_div)

        let flag_name_div = document.createElement("div")
        flag_name_div.className = "countryname"
        flag_name_div.dataset.index = i
        let flag_name_text_div = document.createElement("text")
        flag_name_text_div.innerHTML = x.name
        flag_name_div.appendChild(flag_name_text_div)
        nameList.push(flag_name_div)

        count += 1

        if (count == 5 || (i == countries.length - 1)) {
            let flagpics = document.createElement("div")
            flagpics.classList = "flagpics"
            let flagnames = document.createElement("div")
            flagnames.classList = "flagnames"
            for (let j = 0; j < picList.length; j++) {
                flagpics.appendChild(picList[j])
            }
            for (let j = 0; j < nameList.length; j++) {
                flagnames.appendChild(nameList[j])
            }
            choices.appendChild(flagpics)
            choices.appendChild(flagnames)
            picList = []
            nameList = []
            count = 0
        }
    }
    enableButtons()
})

function initGuessCounter() {
    let guessCounter = document.getElementById("guesses")
    guessCounter.innerHTML = ""
    for (let i = 0; i < maxTries; i++) {
        let guessIndicator = document.createElement("div")
        guessIndicator.dataset.index = i
        guessIndicator.classList.add("guessindicators")
        if (i == 0) {
            guessIndicator.classList.add("current")
        }
        guessCounter.appendChild(guessIndicator)
    }
}

initGuessCounter()

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

function colorCheck(color) {
    return country.colors.includes(color)
}

function fadeCountryName(index) {
    let elem = document.getElementById("choices").querySelector(".countryname[data-index='"+index+"']")
    elem.style.opacity = inactiveOpacity
}

// remove flags not containing "color"
function filterFlags(color) {
    let choices = document.getElementById("choices").querySelectorAll(".flagpic")
    let answerContainsColor = colorCheck(color)
    console.log(choices)
    for (let x of choices) {
        if (!(x.hasAttribute("data-enabled"))) {
            console.log("skip: " + countries[x.dataset.index].name)
            continue
        }
        let x_colors = countries[x.dataset.index].colors
        if (answerContainsColor) {
            if (!(x_colors.includes(color))) {
                fadeCountryName(x.dataset.index)
                x.style.opacity = inactiveOpacity
                x.removeAttribute("data-enabled")
                x.removeEventListener("click", onClickButtons)
                currentCountryChoicesCount--
                console.log("remove: " + countries[x.dataset.index].name)
                console.log("current count: " + currentCountryChoicesCount)
            }
        }
        else {
            if (x_colors.includes(color)) {
                fadeCountryName(x.dataset.index)
                x.style.opacity = inactiveOpacity
                x.removeAttribute("data-enabled")
                x.removeEventListener("click", onClickButtons)
                currentCountryChoicesCount--
                console.log("remove: " + countries[x.dataset.index].name)
                console.log("current count: " + currentCountryChoicesCount)
            }
        }
    }
}

let tries = 0
function onClickButtons() {
    console.log("current count: " + currentCountryChoicesCount)
    this.removeEventListener("click", onClickButtons)
    tries += 1
    let isColorButton = "color" in this.dataset
    if (isColorButton) {
        setGuessCounter(tries-1, this.dataset.color)
        filterFlags(this.dataset.color)
        if (!colorCheck(this.dataset.color)) {
            this.style.border = "3px solid"
            this.style.opacity = inactiveOpacity
        } else {
            this.style.border = "3px solid"
        }
    }
    else { // country buttons
        setGuessCounter(tries-1)
        if (this.dataset.index != countryIndex) {
            fadeCountryName(this.dataset.index)
            this.style.opacity = inactiveOpacity
            this.removeAttribute("data-enabled")
            this.removeEventListener("click", onClickButtons)
            currentCountryChoicesCount--
            console.log("remove: " + countries[this.dataset.index].name)
            console.log("current count: " + currentCountryChoicesCount)
        }
        else {
            document.getElementById("results").innerHTML = "CORRECT! Country is " + country.name
            disableButtons()
            return
        }
    }

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

    if (win != null) {
        if (win) {
            document.getElementById("results").innerHTML = "CORRECT! Country is " + country.name
            disableButtons()
            return
        }
        else {
            document.getElementById("results").innerHTML = "WRONG! Country is " + country.name
            disableButtons()
            return
        }
    }
}
function enableButtons() {
    for (let c of document.getElementById("colorkeys").children) {
        c.addEventListener("click", onClickButtons)
    }
    for (let f of document.getElementById("choices").querySelectorAll(".flagpic")) {
        f.addEventListener("click", onClickButtons)
    }
}
enableButtons()
function disableButtons() {
    for (let c of document.getElementById("colorkeys").children) {
        c.removeEventListener("click", onClickButtons)
        if (!colorCheck(c.dataset.color)) {
            c.style.border = "3px solid"
            c.style.opacity = inactiveOpacity
        } else {
            c.style.border = "3px solid"
        }
    }
    for (let f of document.getElementById("choices").querySelectorAll(".flagpic")) {
        f.removeEventListener("click", onClickButtons)
        if (f.dataset.index != countryIndex) {
            fadeCountryName(f.dataset.index)
            f.style.opacity = inactiveOpacity
            f.removeAttribute("data-enabled")
        }
    }
}