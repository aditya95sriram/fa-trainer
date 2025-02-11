// references:
// - https://asl.ms/ (main inspiration)
// - https://docs.signdict.org/dgs/4_fingeralphabet/ (sprites)
// - https://github.com/qu1queee/commongermanwords (pointer to wordlist)
// - http://web.archive.org/web/20170227200416/http://wortschatz.uni-leipzig.de/html/wliste.html (original wordlist)


// preloaded stuff
// array `alphabets` already defined and imported from assets/alphabets.js
// array `words` already defined and imported from assets/words.js
// todo: clean up words list
//       - remove multi-word entries
//       - remove too short entries (<= 2 characters)
let sprites = {};

// info about current state
let original_word = undefined;
let word = undefined;
let characters = [];
let cur_idx = 0;

// animation properties
let playing = false;
let next_frame = Infinity;
let delay = 20;

// user interface
let answer_input;
let answer_status;


function preload() {
    for (let [alphabet, path] of Object.entries(alphabets)) {
        sprites[alphabet] = loadImage(path);
    }
}


function deconstruct_word(word) {
    let characters = [];
    let i = 0;
    while (i < word.length) {
        if (!(word[i] in sprites)) {  // check if sprite exists
            console.warn(`sprite for ${word[i]} not found, skipping "${word}"`);
            return undefined;
        }

        if (word.substring(i, i + 3) == "sch") { // check for sch
            characters.push("sch");
            i += 3;
        } else if (word[i + 1] == word[i]) {  // check for double alphabets
            // todo: handle double alphabets properly
            characters.push(word[i]);
            characters.push(word[i + 1]);
            i += 2;
        } else {  // just a normal character
            characters.push(word[i]);
            i += 1;
        }
    }
    characters.push("blank");  // sentinel/blank sign
    return characters;
}

function pick_new_word() {
    while (true) {
        original_word = random(words)
        word = original_word.toLowerCase();
        console.debug("word", word);
        characters = deconstruct_word(word);
        if (typeof (characters) === "undefined") {  // deconstruction failed
            console.debug("picking new word");
        } else {
            break;
        }
    }
    console.debug("new word:", word, characters);
}

function init_animation() {
    playing = true;
    cur_idx = 0;
    next_frame = frameCount;  // force sprite to be drawn
}

function reset_animation() {
    playing = false;
    cur_idx = 0;
    next_frame = Infinity;
    console.debug("animation reset");
}

function next_sprite() {
    // draw current character
    let char = characters[cur_idx];
    // console.debug("next sprite char:", cur_idx, char, sprites[char]);
    image(sprites[char], width / 2 - 215 / 2, 15);

    // update frame when next sprite needs to be shown
    next_frame = frameCount + delay;

    // set up for next sprite
    cur_idx += 1;
    if (cur_idx >= characters.length)
        reset_animation();
}


// convenience function
function new_word() {
    pick_new_word();
    init_animation();
    answer_input.value = "";
    answer_status.textContent = "";
}

// generate version of words with ae, oe, ue, ss -> ä, ö, ü, ß
function alternate_spellings(word) {
    let substitutions = { "ae": "ä", "oe": "ö", "ue": "ü", "ss": "ß" }
    let alternates = [word];
    for (let [expanded, short] of Object.entries(substitutions)) {
        let idx = word.indexOf(expanded);
        let prefix = word.slice(0, idx),
            suffix = word.slice(idx + expanded.length);
        if (idx < 0)
            continue;

        let subalternates = alternate_spellings(suffix);
        for (let subalternate of subalternates) {
            alternates.push(prefix + expanded + subalternate);
            alternates.push(prefix + short + subalternate);
        }
    }

    // remove duplicates from alternates
    alternates = alternates.filter((e, i) => alternates.indexOf(e) === i);

    if (alternates.length > 1)
        console.debug(`alternate spellings of ${word}: ${alternates}`);

    return alternates;
}

function check_answer() {
    let answer = answer_input.value.trim().toLowerCase();
    let match_found = false;
    for (let variant of alternate_spellings(answer)) {
        if (variant == word) {
            match_found = true;
            break;
        }
    }

    answer_status.textContent = match_found ? "richtig!" : `falsch! (${original_word})`;
}


function setup() {
    createCanvas(windowWidth, windowHeight - 55);
    frameRate(30);

    textSize(50);
    textAlign(CENTER, CENTER);

    // set up user interface
    // input box
    answer_input = document.getElementById("answer");
    answer_input.addEventListener("keydown", function (e) {
        //checks whether the pressed key is "Enter"
        if (e.code === "Enter") {
            check_answer();
        }
    });

    // buttons
    let check_button = document.getElementById("check");
    check_button.addEventListener("mousedown", check_answer);

    let replay_button = document.getElementById("replay");
    replay_button.addEventListener("mousedown", init_animation);

    let new_word_button = document.getElementById("next");
    new_word_button.addEventListener("mousedown", new_word);

    // status
    answer_status = document.getElementById("status");

    new_word();
}

function draw() {
    // no drawing here, otherwise alphabet sprites might get overwritten
    if (playing && frameCount >= next_frame)
        next_sprite();
}
