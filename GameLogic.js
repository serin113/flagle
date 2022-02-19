let countryChoicesCount = 30
let maxTries = 6
let inactiveOpacity = "0.2"

function comp (a,b) {
    // return a.localeCompare(b)
    let x = a.name
    let y = b.name
    return x.localeCompare(y)
    // if (a<b) return -1
    // else if (a>b) return 1
    // return 0
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
function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min) + min); //The maximum is exclusive and the minimum is inclusive
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
async function randomizerArray(count){
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
async function randomizer(count){
    let countries = await randomizerArray(count)
    let country = countries[getRandomInt(0,countries.length)]
    return [countries,country]
}
let jsonLoaded = false
let country = null
let countries = null
let currentCountryChoicesCount = countryChoicesCount
randomizer(countryChoicesCount).then((data) => {
    let randCountry = data[1]
    let randCountries = data[0]
    console.log("RANDOMIZED: ")
    console.log(randCountry)
    console.log(randCountries)
    country = randCountry
    countries = randCountries
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

        //flag.dataset.index = i
        //flag_img.src = x.img
        //flag_text.innerHTML = x.name
    }
})

function colorCheck(color) {
    console.log(country.colors)
    return country.colors.includes(color)
}

// remove flags not containing "color"
function filterFlags(color) {
    let choices = document.getElementById("choices").querySelectorAll(".flagpic")
    let answerContainsColor = colorCheck(color)
    for (let x of choices) {
        let x_name_elem = document.getElementById("choices").querySelector(".countryname[data-index='"+x.dataset.index+"']")
        console.log(x.dataset.index)
        console.log(x_name_elem)
        let x_colors = countries[x.dataset.index].colors
        let x_name = countries[x.dataset.index].name
        if (answerContainsColor) {
            if (!(x_colors.includes(color))) {
                x.style.opacity = inactiveOpacity
                x_name_elem.style.opacity = inactiveOpacity
                currentCountryChoicesCount--
            }
        }
        else {
            if (x_colors.includes(color)) {
                x.style.opacity = inactiveOpacity
                x_name_elem.style.opacity = inactiveOpacity
                currentCountryChoicesCount--
            }
        }
    }
}

let tries = 0
let colorButtons = document.getElementById("colorkeys").children
let flagButtons = document.getElementById("choices").querySelectorAll(".flagpic")
function onClickButtons() {
    this.removeEventListener("click", onClickButtons)
    tries += 1
    if (tries >= maxTries) {
        document.getElementById("results").innerHTML = "Oops! Country is " + country.name
        disableButtons()
    }
    if ("color" in this.dataset) {
        filterFlags(this.dataset.color)
        if (!colorCheck(this.dataset.color)) {
            this.style.border = "3px dashed"
            this.style.opacity = "0.5"
        } else {
            this.style.border = "3px solid"
        }
    }
    else if ("country" in this.dataset) {
        
    }
}
function enableButtons() {
    for (let c of colorButtons) {
        c.addEventListener("click", onClickButtons)
    }
}
enableButtons()
function disableButtons() {
    for (let c of colorButtons) {
        c.removeEventListener("click", onClickButtons)
    }
}