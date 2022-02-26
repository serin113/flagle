/*
Cookies:
    darkMode (bool)
    dailyMode (bool)
    difficulty (int)
    algoGenVersion (int)        // changes when daily mode would change
    lastGame (json)
        date (string)
        isWin (bool)
        index (int)
        hasFlaggle (bool)
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
const algoGenVersion = 1;

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
    "Superb!",
    "Amazing!",
    "Bravo!",
    "Great!",
    "Nice!",
    "Phew...",
];
const resultMsgs_lose = [
    // least to most tries
    "So close!",
    "Nice try",
];
const seedOverride = null;
const showResultsDelay = 1250;

const refreshOnNewGame = false;

const biasRandomGen = true; // bias the generator?
const doofyThreshold = 3;   // # of same-color-set flags before applying bias

const debug = false;

function logger(msg) {
    if (debug == false) return;
    console.log(msg);
}