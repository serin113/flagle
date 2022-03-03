/*
Cookies:
    darkMode (bool)
    dailyMode (bool)
    difficulty (int)            // current difficulty, only for random mode
    algoGenVersion (int)        // change to refresh user cookies
    randomSeed (string)         // random mode's seed
                                // see init() and onChangeMode()
    lastGame_d (json)
        seed (string)
        isWin (bool)
        index (int)
        resultText (string)
        guesses (list of dicts)
            type (string=color, null=flag)
            index (int if flag, null if color) (index of flag)
            correct (bool)
    lastGame_r (json)
        seed (string)
        difficulties (dict):
            difficulty (int-key, dict):
                index (int)
                resultText (string)
                guesses (list of dicts)
                    type (string=color, null=flag)
                    index (int)
                    correct (bool)

    stats_d_totalWins (int)
    stats_d_totalGames (int)
    stats_d_currentStreak (int)
    stats_d_bestStreak (int)

    stats_r_totalWins (int)
    stats_r_totalGames (int)
    stats_r_currentStreak (int)
    stats_r_bestStreak (int)

SessionStorage:
    tutorialShown (bool, exists or doesn't)
*/

// configs
let CookiesAPI = Cookies.withAttributes({
    sameSite: "strict",
    expires: 365,
    path: "/",
}); // Cookies object with default cookie attributes

const algoGenVersion = 4;

const defaultDifficulty = 30;
const maxDifficulty = 130;
const maxTries = 6;
const icons = {
    rightColor: "🟣",
    wrongColor: "⚫",
    rightFlag: "🟪",
    wrongFlag: "⬛",
    flaggle: "🏁",
    lose: "❌",
    hard: "💪",
};
const resultMsgs_win = [
    // least to most tries
    icons.flaggle + "  Superb!  " + icons.flaggle,
    icons.flaggle + "  Amazing!  " + icons.flaggle,
    icons.flaggle + "  Bravo!  " + icons.flaggle,
    icons.flaggle + "  Great!  " + icons.flaggle,
    icons.flaggle + "  Nice!  " + icons.flaggle,
    icons.flaggle + "  Phew...  " + icons.flaggle,
];
const resultMsgs_lose = [
    // least to most tries
    icons.lose + "  So close!  " + icons.lose,
    icons.lose + "  Nice try  " + icons.lose,
];
const soCloseThreshold = 4;
const showResultsDelay = 1250;

const refreshOnNewGame = false;

const biasRandomGen = true; // bias the generator?
const doofyThreshold = 3; // # of same-color-set flags before applying bias

const debug = false;

function logger(msg) {
    if (debug == false) return;
    console.log(msg);
}