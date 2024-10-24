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
    let i=0;
    while (i < word.length) {
        if (!(word[i] in sprites)) {  // check if sprite exists
            console.warn(`sprite for ${word[i]} not found, skipping "${word}"`);
            return undefined;
        } 

        if (word.substring(i, i+3) == "sch") { // check for sch
            characters.push("sch");
            i += 3;
        } else if (word[i+1] == word[i]) {  // check for double alphabets
            // todo: handle double alphabets properly
            characters.push(word[i]);
            characters.push(word[i+1]);
            i += 2;
        } else {  // just a normal character
            characters.push(word[i]);
            i +=1;
        }
    }
    characters.push("blank");  // sentinel/blank sign
    return characters;
}

function pick_new_word() {
    while (true) {
        word = random(words).toLowerCase();
        console.debug("word", word);
        characters = deconstruct_word(word);
        if (typeof(characters) === "undefined") {  // deconstruction failed
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
    image(sprites[char], 0, 0);

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
}

function check_answer() {
    let answer = answer_input.value().toLowerCase();
    if (answer == word) {
        answer_status.html("richtig!");
    } else {
        answer_status.html(`falsch! (${word})`);
    }
}


function setup() {
    createCanvas(400, 400);
    frameRate(30);

    // set up user interface
    // input box
    answer_input = createInput();
    answer_input.position(0, 400);
    answer_input.attribute("placeholder", "Deine Antwort");

    // buttons
    let check_button = createButton("Überprüfen");
    check_button.position(0, 420);
    check_button.mousePressed(check_answer);

    let replay_button = createButton("Wiederholen");
    replay_button.position(0, 440);
    replay_button.mousePressed(init_animation);

    let new_word_button = createButton("Neues Wort");
    new_word_button.position(0, 460);
    new_word_button.mousePressed(new_word);

    // status
    answer_status = createP('');
    answer_status.position(100, 400);

    new_word();
}

function draw() {
    // no drawing here, otherwise alphabet sprites might get overwritten
    if (playing && frameCount >= next_frame)
        next_sprite();
}
