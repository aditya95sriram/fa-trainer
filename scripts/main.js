// references:
// - https://asl.ms/ (main inspiration)
// - https://docs.signdict.org/dgs/4_fingeralphabet/ (sprites)
// - https://github.com/qu1queee/commongermanwords (pointer to wordlist)
// - http://web.archive.org/web/20170227200416/http://wortschatz.uni-leipzig.de/html/wliste.html (original wordlist)


// preloaded stuff
// array `alphabets` already defined and imported from assets/alphabets.js
// array `words` already defined and imported from assets/words.js
let spritesheet;
const SPRITE_WIDTH = 215, SPRITE_HEIGHT = 265;


// info about current state
let original_word = undefined;
let word = undefined;  // lower case version of original_word
// contains characters that constitute the word along with any required motion
let characters = [];
let cur_idx = 0;  // index of currently displayed character
// length of shortest/longest word in entire dataset
let words_minlen, words_maxlen;
// length of shortest/longest word as requested by user
let minlen, maxlen;
let answer_correct = false;  // if answer has been checked and deemed correct

// animation properties
let playing = false;  // if animation is playing
let next_frame = Infinity;  // frame at which we switch to next character
let cur_motion = "none";  // motion of currently displayed character (if any)
const MAX_XMOTION = SPRITE_WIDTH / 2;  // max horizontal sliding distance
const MAX_YMOTION = SPRITE_HEIGHT / 3;  // max vertical sliding distance
let initial_delay = 20;  // delay at start of fingerspelling
// duration for which each character is displayed (can be changed by user)
let delay = 20;
let min_delay = 10;
let max_delay = 100;

// user interface
let answer_input;  // html input element
let answer_status;  // html p element


function preload() {
    spritesheet = loadImage("assets/spritesheet.webp")
}


function deconstruct_word(word) {
    const down_chars = {"ä": "a", "ö": "o", "ü": "u", "ß": "s"};
    let characters = [];
    let i = 0;
    while (i < word.length) {
        let sprite = word[i] in down_chars ? down_chars[word[i]] : word[i];
        if (!(sprite in alphabets)) {  // check if sprite exists
            console.warn(`sprite for ${sprite} not found, skipping "${word}"`);
            return undefined;
        }

        if (word.substring(i, i + 3) == "sch") { // check for sch
            characters.push({
                "char": "sch",
                "motion": "none",
            });
            i += 3;
        } else if (word[i + 1] == word[i]) {  // check for double alphabets
            characters.push({
                "char": sprite,
                "motion": "right",
            });
            i += 2;
        } else if (word[i] in down_chars) {   // check for umlauts and ß
            characters.push({
                "char": sprite,
                "motion": "down",
            });
            i += 1;
        } else {  // just a normal character
            characters.push({
                "char": sprite,
                "motion": "none",
            });
            i += 1;
        }
    }

    // sentinel/blank sign
    characters.push({
        "char": "blank",
        "motion": "none",
    });
    return characters;
}

function pick_new_word() {
    while (true) {
        original_word = random(words);
        word = original_word.toLowerCase();
        console.debug("word:", word);
        characters = deconstruct_word(word);
        if (typeof (characters) === "undefined") {  // deconstruction failed
            console.debug("deconstruction failed, picking new word");
        } else {  // deconstruction succeeded
            let wordlen = characters.length - 1;  // last character always blank
            if (wordlen < minlen) {
                console.debug("word too short, picking new word");
            } else if (wordlen > maxlen) {
                console.debug("word too long, picking new word");
            } else {  // successful deconstruction which obeys bounds
                break;
            }
        }
    }
    console.info("new word:", original_word, characters);
}

function adjust_delay(delta) {
    delay = constrain(delay + delta, min_delay, max_delay);
    console.log("new delay:" + delay);
}

function clear_canvas() {
    background("white");
}

function init_animation() {
    playing = true;
    cur_idx = 0;
    clear_canvas();  // clear any previous sprite
    // force sprite to be drawn after initial_delay
    next_frame = frameCount + initial_delay;
    loop();
}

function reset_animation() {
    playing = false;
    cur_idx = 0;
    next_frame = Infinity;
    cur_motion = "none";
    console.info("animation reset");
    noLoop();
}

function draw_sprite(char, dx, dy) {
    let dw = SPRITE_WIDTH, dh = SPRITE_HEIGHT;
    let {x: sx, y: sy} = alphabets[char];
    image(spritesheet, dx, dy, dw, dh, sx, sy, dw, dh);
}

function next_sprite() {
    clear_canvas()
    // draw current character
    let {char, motion} = characters[cur_idx];
    // console.debug("next sprite char:", cur_idx, char, motion, sprites[char]);
    cur_motion = motion;
    draw_sprite(char, width / 2, SPRITE_HEIGHT / 2);

    // update frame when next sprite needs to be shown
    next_frame = frameCount + delay;

    // set up for next sprite
    cur_idx += 1;
    if (cur_idx >= characters.length)
        reset_animation();
}

function move_sprite() {
    let {char, motion} = characters[cur_idx - 1];
    let centerx = width / 2, centery = SPRITE_HEIGHT / 2;
    frame_delta = next_frame - frameCount;
    let max_motion = motion == "right" ? -MAX_XMOTION : MAX_YMOTION;
    // frame_delta goes from delay - 1 to 1
    let shift = lerp(max_motion, 0, (frame_delta - 1) / (delay - 2));
    if (motion == "right") {
        centerx += shift;
    } else {
        centery += shift;
    }
    draw_sprite(char, centerx, centery);
}


// convenience function
function new_word() {
    pick_new_word();
    init_animation();
    answer_input.value = "";
    answer_status.textContent = "";
    answer_correct = false;
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
    answer_correct = match_found;
}

function setup() {
    let canvas_width = windowWidth;
    let canvas_height = SPRITE_HEIGHT + MAX_YMOTION;
    let canvas_elem = document.getElementById("sketch");
    createCanvas(canvas_width, canvas_height, canvas_elem);
    frameRate(30);
    imageMode(CENTER);

    textSize(50);
    textAlign(CENTER, CENTER);

    // set up user interface
    // input box
    answer_input = document.getElementById("answer");
    answer_input.addEventListener("keydown", function (e) {
        //checks whether the pressed key is "Enter"
        if (e.code === "Enter") {
            if (answer_correct) {  // if correct, then show next word
                new_word();
            } else if (answer_input.value == "") {  // if empty, then repeat
                init_animation();
            } else {  // if not empty and not yet checked, then check
                check_answer();
            }
        }
    });

    // buttons
    let check_button = document.getElementById("check");
    check_button.addEventListener("click", check_answer);

    let replay_button = document.getElementById("replay");
    replay_button.addEventListener("click", init_animation);

    let new_word_button = document.getElementById("next");
    new_word_button.addEventListener("click", new_word);

    let slower_button = document.getElementById("slower");
    slower_button.addEventListener("click", () => {
        adjust_delay(+10);
    })
    let faster_button = document.getElementById("faster");
    faster_button.addEventListener("click", () => {
        adjust_delay(-10);
    })

    // handle min/max len input placeholders
    words_minlen = min(words.map(w => w.length));
    words_maxlen = max(words.map(w => w.length));

    let minlen_input = document.getElementById("minlen");
    minlen_input.placeholder = minlen = words_minlen;
    minlen_input.min = words_minlen;
    minlen_input.max = words_maxlen;
    minlen_input.addEventListener("change", function (evt) {
        maxlen_input.min = minlen = parseInt(evt.target.value) || words_minlen;
        // if old maxlen is lower than new minlen, update maxlen
        if (maxlen < minlen)
            minlen_input.max = maxlen_input.value = maxlen = minlen;
        console.info("new minlen:", minlen);
    });

    let maxlen_input = document.getElementById("maxlen");
    maxlen_input.placeholder = maxlen = words_maxlen;
    maxlen_input.min = words_minlen;
    maxlen_input.max = words_maxlen;
    maxlen_input.addEventListener("change", function (evt) {
        minlen_input.max = maxlen = parseInt(evt.target.value) || words_maxlen;
        // if old minlen is higher than new maxlen, update minlen
        if (minlen > maxlen)
            maxlen_input.min = minlen_input.value = minlen = maxlen;
        console.info("new maxlen:", maxlen);
    });

    // status
    answer_status = document.getElementById("status");

    new_word();
}

function draw() {
    // no drawing here, otherwise alphabet sprites might get overwritten
    if (playing) {
        if (frameCount >= next_frame)
            next_sprite();
        else if (cur_motion != "none")
            move_sprite();
    }
}
