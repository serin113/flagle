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
    const response = await fetch("countries.json")
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
let maxScore = 0
let countryChoicesCount = 30
randomizer(countryChoicesCount).then((data) => {
    let randCountry = data[1]
    let randCountries = data[0]
    console.log("RANDOMIZED: ")
    console.log(randCountry)
    console.log(randCountries)
    country = randCountry
    countries = randCountries
    jsonLoaded = true
    maxScore = country.colors.length
})
function colorCheck(color) {
    console.log(country.colors)
    return country.colors.includes(color)
}
let tries = 0
let maxTries = 6
let score = 0
let colors = document.getElementById("colorkeys").querySelectorAll(".colors")
function handleButtons() {
    tries += 1
    if (tries >= maxTries) {
        document.getElementById("results").innerHTML = "Oops! Country is " + country.name
        disableButtons()
    }
    if (!colorCheck(this.dataset.color)) {
        this.style.border = "3px dashed"
        this.style.opacity = "0.5"
    } else {
        this.style.border = "3px solid"
        score += 1
        if (score >= maxScore) {
            document.getElementById("results").innerHTML = "Yay! Country is " + country.name
            disableButtons()
        }
    }
    console.log("Score: " + score)
}
function enableButtons() {
    for (let c of colors) {
        c.addEventListener("click", handleButtons)
    }
}
enableButtons()
function disableButtons() {
    for (let c of colors) {
        c.removeEventListener("click", handleButtons)
    }
}