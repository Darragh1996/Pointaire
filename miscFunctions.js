import fs from "fs";
import playerFunc from "play-sound";

function sleep(ms = 2000) {
  return new Promise((r) => setTimeout(r, ms));
}

function getJsonData(filename) {
  // get all json data from a file
  let rawData = fs.readFileSync(filename);
  return JSON.parse(rawData);
}

function getQuestions() {
  // returns 15 random questions
  let randomQuestions = [];

  let questions = getJsonData("questions.json");

  while (randomQuestions.length < 15) {
    let randomNum = Math.floor(Math.random() * questions.length);
    if (!randomQuestions.includes(questions[randomNum])) {
      randomQuestions.push(questions[randomNum]);
    }
  }

  return randomQuestions;
}

function playMusic(song) {
  // plays a song
  let player = playerFunc({});

  // $ mplayer foo.mp3
  player.play(song, function (err) {
    if (err) throw err;
  });

  // { timeout: 300 } will be passed to child process
  player.play(song, { timeout: 300 }, function (err) {
    if (err) throw err;
  });

  // configure arguments for executable if any
  player.play(
    song,
    { afplay: ["-v", 1] /* lower volume for afplay on OSX */ },
    function (err) {
      if (err) throw err;
    }
  );

  // access the node child_process in case you need to kill it on demand
  let audio = player.play(song, function (err) {
    if (err && !err.killed) throw err;
  });
  audio.kill();
}

function updateQuestions(questions) {
  // adds a question to questions.json file
  const questionsFile = "./questions.json";
  let jsonQuestions;
  try {
    jsonQuestions = JSON.stringify(questions, null, 4);
    fs.writeFile(questionsFile, jsonQuestions, (err) => {
      // error checking
      if (err) throw err;
    });
  } catch (err) {
    throw err;
  }
}

async function shuffle(array) {
  // randomly shuffle array
  for (let i = array.length - 1; i > 0; i--) {
    let j = Math.floor(Math.random() * (i + 1)); // random index from 0 to i

    // swap elements array[i] and array[j]
    // we use "destructuring assignment" syntax to achieve that
    // you'll find more details about that syntax in later chapters
    // same can be written as:
    // let t = array[i]; array[i] = array[j]; array[j] = t
    [array[i], array[j]] = [array[j], array[i]];
  }
}

export {
  sleep,
  getJsonData,
  getQuestions,
  playMusic,
  updateQuestions,
  shuffle,
};
