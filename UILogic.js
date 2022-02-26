let modalDisplayType = "flex";

let modalresults = document.getElementById("GameResults");
let spanresults = document.getElementById("closeresults");
spanresults.addEventListener("click", function () {
    modalresults.style.display = "none";
});

let modalhow = document.getElementById("howtotext");
let btnhow = document.getElementById("howto");
let spanhow = document.getElementById("closehowto");
btnhow.addEventListener("click", function () {
    modalhow.style.display = modalDisplayType;
});
spanhow.addEventListener("click", function () {
    modalhow.style.display = "none";
});

let modalstat = document.getElementById("statstext");
let btnstat = document.getElementById("stats");
let spanstat = document.getElementById("closestat");
btnstat.addEventListener("click", function () {
    modalstat.style.display = modalDisplayType;
});
spanstat.addEventListener("click", function () {
    modalstat.style.display = "none";
});

let modalset = document.getElementById("settingstext");
let btnset = document.getElementById("settings");
let spanset = document.getElementById("closesettings");
btnset.addEventListener("click", function () {
    modalset.style.display = modalDisplayType;
});
spanset.addEventListener("click", function () {
    modalset.style.display = "none";
});

function clickOutsideModal(event) {
    if (event.target == modalhow) {
        modalhow.style.display = "none";
    } else if (event.target == modalstat) {
        modalstat.style.display = "none";
    } else if (event.target == modalset) {
        modalset.style.display = "none";
    } else if (event.target == modalresults) {
        modalresults.style.display = "none";
    }
}

window.addEventListener("click", function (event) {
    clickOutsideModal(event);
});

//Dark Theme
const checkbox = document.getElementById("darkthemeswitch");

function setTheme() {
    var body = document.body;

    //FLAGGLE Letters
    var mht = document.getElementById("MainHeaderText");
    var ft1 = document.getElementById("ft1");
    var ft2 = document.getElementById("ft2");
    var ft3 = document.getElementById("ft3");
    var ft4 = document.getElementById("ft4");
    var ft5 = document.getElementById("ft5");
    var ft6 = document.getElementById("ft6");

    //Color Keys
    var colorkeys = document.getElementById("colorkeys");

    //All Modals
    //Settings
    var settingsmodalbody = document.getElementById("settingsmodalbody");
    var settingsmodalheader = document.getElementById("settingsmodalheader");
    var closesettings = document.getElementById("closesettings");

    //HowTo
    var howtomodalbody = document.getElementById("howtomodalbody");
    var howtomodalheader = document.getElementById("howtomodalheader");
    var closehowto = document.getElementById("closehowto");

    //Stats
    var statsmodalbody = document.getElementById("statsmodalbody");
    var statsmodalheader = document.getElementById("statsmodalheader");
    var closestat = document.getElementById("closestat");

    //Daily, Guesses, Random, and Share Buttons
    var dailyflaggle = document.getElementById("dailyflaggle");
    var randomflaggle = document.getElementById("randomflaggle");
    var guesses = document.getElementById("guesses");
    var sharebutton = document.getElementById("sharebutton");

    var middlediv = document.getElementById("middlediv");

    //democolors
    var demoorange = document.getElementById("demoorange");
    var demoyellow = document.getElementById("demoyellow");
    var demogreen = document.getElementById("demogreen");

    if (checkbox.checked) {
        Cookies.set("darkMode", "true", {
            sameSite: "strict",
        });
        body.classList.add("dark");

        mht.classList.add("dark");
        ft1.classList.add("dark_flaggletext");
        ft2.classList.add("dark_flaggletext");
        ft3.classList.add("dark_flaggletext");
        ft4.classList.add("dark_flaggletext");
        ft5.classList.add("dark_flaggletext");
        ft6.classList.add("dark_flaggletext");

        colorkeys.classList.add("dark_colorkeys");

        settingsmodalbody.classList.add("dark");
        settingsmodalheader.classList.add("dark");
        closesettings.classList.add("dark");

        howtomodalbody.classList.add("dark");
        howtomodalheader.classList.add("dark");
        closehowto.classList.add("dark");

        statsmodalbody.classList.add("dark");
        statsmodalheader.classList.add("dark");
        closestat.classList.add("dark");

        dailyflaggle.classList.add("dark");
        randomflaggle.classList.add("dark");
        guesses.classList.add("dark");
        sharebutton.classList.add("dark");

        middlediv.classList.add("dark");

        demoorange.classList.add("dark");
        demoyellow.classList.add("dark");
        demogreen.classList.add("dark");
    } else {
        Cookies.set("darkMode", "false", {
            sameSite: "strict",
        });
        body.classList.remove("dark");

        mht.classList.remove("dark");
        ft1.classList.remove("dark_flaggletext");
        ft2.classList.remove("dark_flaggletext");
        ft3.classList.remove("dark_flaggletext");
        ft4.classList.remove("dark_flaggletext");
        ft5.classList.remove("dark_flaggletext");
        ft6.classList.remove("dark_flaggletext");

        colorkeys.classList.remove("dark_colorkeys");

        settingsmodalbody.classList.remove("dark");
        settingsmodalheader.classList.remove("dark");
        closesettings.classList.remove("dark");

        howtomodalbody.classList.remove("dark");
        howtomodalheader.classList.remove("dark");
        closehowto.classList.remove("dark");

        statsmodalbody.classList.remove("dark");
        statsmodalheader.classList.remove("dark");
        closestat.classList.remove("dark");

        dailyflaggle.classList.remove("dark");
        randomflaggle.classList.remove("dark");
        guesses.classList.remove("dark");
        sharebutton.classList.remove("dark");

        middlediv.classList.remove("dark");

        demoorange.classList.remove("dark");
        demoyellow.classList.remove("dark");
        demogreen.classList.remove("dark");
    }
}

document.addEventListener("DOMContentLoaded", function () {
    /* dark mode stuff */
    let darkModeCookie = Cookies.get("darkMode");
    if (darkModeCookie === "true") {
        document.getElementById("darkthemeswitch").checked = true;
        logger("dark mode");
    } else if (darkModeCookie === "false") {
        document.getElementById("darkthemeswitch").checked = false;
        logger("light mode");
    }
    setTheme();
    checkbox.addEventListener("change", setTheme);
});


function hideLoadingScreen() {
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
    let loading = document.getElementById("loading");
    loading.dataset.remove = true;
    loading.style.opacity = "0";
    loading.style.visibility = "hidden";
}

function showLoadingScreen() {
    let loading = document.getElementById("loading");
    loading.removeAttribute("data-remove");
    loading.style.opacity = "1";
    loading.style.visibility = "visible";
}

window.addEventListener("load", hideLoadingScreen);

/* scroll to top on load */
if (history.scrollRestoration) {
    history.scrollRestoration = "manual";
} else {
    window.onbeforeunload = function () {
        window.scrollTo(0, 0);
    };
}
