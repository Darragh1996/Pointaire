import inquirer from "inquirer";
import fs from "fs";
import chalk from "chalk";
import termKit from "terminal-kit";
import { exit } from "process";

import { getJsonData, sleep, getQuestions } from "./miscFunctions.js";
import { adminMenu } from "./adminFunctions.js";
import { playMusic } from "./miscFunctions.js";

function menu() {
  console.clear();

  //main menu options
  inquirer
    .prompt([
      {
        type: "list",
        name: "menuOption",
        message: "Menu",
        choices: [
          "Play Pointaire Game",
          "Game Admin",
          "Top Five Scores",
          "Quit Game",
        ],
      },
    ])
    .then((answer) => {
      if (answer.menuOption == "Play Pointaire Game") {
        console.clear();
        playGame();
      } else if (answer.menuOption == "Game Admin") {
        adminMenu();
      } else if (answer.menuOption == "Top Five Scores") {
        console.log(chalk.green("Top Five Scores"));
        showTopScores();
      } else {
        console.log("Quiting...");
        exit();
      }
    });
}

async function playGame() {
  let play = true; // controls whether the game continues to run
  let score; // tracks the players score
  let moneyAmounts = [
    0, 100, 200, 300, 500, 1000, 2000, 4000, 8000, 16000, 32000, 64000, 125000,
    250000, 500000, 1000000,
  ];
  let lifelines = ["Audience", "50/50", "Call a Friend"];
  let currMoneyAmountIndex = 0; // tracks the current amount player has won
  let questions = getQuestions(); // gets 15 random questions
  let index = 0; // used to track what question number to display next

  let name = await getName(); // get player name

  do {
    console.log(
      chalk.blue("----------\nQuestion " + (index + 1) + "\n----------")
    );
    // displays answer options as well as currently available lifelines
    await inquirer
      .prompt([
        {
          type: "list",
          name: "question" + index,
          message: questions[index].question,
          choices: [
            ...questions[index].content,
            new inquirer.Separator(),
            ...lifelines,
          ],
        },
      ])
      .then(async (answer) => {
        console.clear();
        let correctAnswer = questions[index].content[questions[index].correct];

        if (answer["question" + index] == correctAnswer) {
          // player got the right answer
          console.log(chalk.green("-------\ncorrect\n-------"));
          // increment money amount and question number
          currMoneyAmountIndex++;
          index++;

          // display current score level to player
          for (let index = moneyAmounts.length - 1; index >= 1; index--) {
            if (moneyAmounts[index] == moneyAmounts[currMoneyAmountIndex]) {
              console.log(chalk.yellow("> " + moneyAmounts[index]));
            } else {
              console.log(String(moneyAmounts[index]));
            }
          }
        } else if (answer["question" + index] == "Audience") {
          // player selects audience option
          lifelines = lifelines.filter((e) => e !== "Audience"); // remove audience option from lifelines
          let votes = [0, 0, 0, 0];

          // creates random votes for each answer option (with the correct answer being favourably weighted)
          for (let i = 0; i < 100; i++) {
            let randomNum = Math.floor(Math.random() * 10) + 1;

            if (randomNum < 5) {
              votes[questions[index].correct] += 1;
            } else if (randomNum < 7) {
              votes[(questions[index].correct + 1) % 4] += 1;
            } else if (randomNum < 9) {
              votes[(questions[index].correct + 2) % 4] += 1;
            } else {
              votes[(questions[index].correct + 3) % 4] += 1;
            }
          }

          // display votes as percentage value to user
          for (let i = 0; i < votes.length; i++) {
            console.log(
              `${votes[i]}% voted for ${questions[index].content[i]}`
            );
          }
          // single option input prompt to allow user to control when to go back to the game
          await inquirer
            .prompt([
              {
                type: "list",
                name: "Continue",
                message: "Back to Game?",
                choices: ["Yes"],
              },
            ])
            .then((answer) => {});
        } else if (answer["question" + index] == "50/50") {
          // user selects 50/50 option
          console.log(chalk.yellow("Elimanating options..."));
          lifelines = lifelines.filter((e) => e !== "50/50"); // remove 50/50 option from lifelines
          let counter = 0;
          let index50 = 0;

          do {
            // remove the first two incorrect answer options from array containing possible answers
            if (index50 != questions[index].correct) {
              await questions[index].content.splice(index50, 1);
              if (index50 < questions[index].correct) {
                questions[index].correct -= 1; // update which index the right answer is located at
              }
              counter++;
            }
            index50++;
          } while (counter < 2);
        } else if (answer["question" + index] == "Call a Friend") {
          // user selects call a friend option
          lifelines = lifelines.filter((e) => e !== "Call a Friend"); // remove call a friend from lifelines
          await inquirer // user selects which friend to call
            .prompt([
              {
                type: "list",
                name: "callOption",
                message: "Who do you want to call?",
                choices: ["Bob", "Simon", "John", "Dumb Don"],
              },
            ])
            .then(async (answer) => {
              let term = termKit.terminal;
              console.log(
                "You: Do you know the answer " + answer["callOption"] + "?"
              );
              if (answer.callOption == "Dumb Don") {
                // dumb don will always give the incorrect answer
                for (let i = 0; i < questions[index].content.length; i++) {
                  if (i != questions[index].correct) {
                    await term.slowTyping(
                      answer["callOption"] +
                        ": I think the answer is '" +
                        questions[index].content[i] +
                        "'",
                      { flashStyle: term.brightWhite }
                    );
                    break;
                  }
                }
              } else {
                // any other friend selected by the user will give the correct option
                await term.slowTyping(
                  answer["callOption"] +
                    ": I think the answer is '" +
                    questions[index].content[questions[index].correct] +
                    "'",
                  { flashStyle: term.brightWhite }
                );
              }
            });
        } else {
          // user gets question wrong -> end game
          score = moneyAmounts[index];
          console.log(chalk.red("incorrect"));
          console.log("Final score: " + score);
          play = false;
          updateTopScores(name, score);
        }
      });

    await sleep();
    console.clear();
  } while (play && index < questions.length);

  if (play) {
    // this will only be triggered if user answers all questions correctly -> the won
    updateTopScores(name, 1000000);
    playMusic("./themeSong.mp3");
    console.log(chalk.green("WINNER"));
    await sleep();
    console.clear();
  }
  menu();
}

async function getName() {
  // gets user name from user
  let userName;
  await inquirer
    .prompt({
      type: "input",
      name: "playerName",
      message: "Enter your name:",
    })
    .then((name) => {
      userName = name["playerName"];
    });
  return userName;
}

function updateTopScores(name, score) {
  let scoresFile = "./topScores.json";
  let scores = [];

  let newScore = {
    name: name,
    score: score,
  };

  try {
    if (fs.existsSync(scoresFile)) {
      scores = getJsonData(scoresFile);
      scores.unshift(newScore);
      scores.sort((a, b) => (a.score > b.score ? -1 : 1)); // sorts scores based of score from highest to lowest
      if (scores.length > 5) {
        // if number of scores exceeds 5 -> remove lowest score
        scores.pop();
      }
    } else {
      scores = [newScore];
    }
  } catch (err) {
    scores = [newScore];
    // console.log("Something went wrong");
  }
  scores = JSON.stringify(scores, null, 4);
  fs.writeFile(scoresFile, scores, (err) => {
    // overwrite the current top scores
    // error checking
    if (err) throw err;
  });
}

async function showTopScores() {
  console.clear();
  try {
    let scores = getJsonData("./topScores.json"); // get all scores saved in scores file
    let term = termKit.terminal;
    console.log(chalk.green("Top 5 Scores"));
    let scoreData = [["Name", "Score"]];
    for (let index = 0; index < scores.length; index++) {
      scoreData.push([scores[index].name, scores[index].score]);
    }
    term.table(scoreData, {
      // display (up to) top 5 scores
      hasBorder: true,
      contentHasMarkup: true,
      borderChars: "lightRounded",
      borderAttr: { color: "blue" },
      textAttr: { bgColor: "default" },
      firstCellTextAttr: { bgColor: "red" },
      firstRowTextAttr: { bgColor: "blue" },
      firstColumnTextAttr: { bgColor: "default" },
      width: 60,
      fit: true, // Activate all expand/shrink + wordWrap
    });
  } catch (error) {
    console.log("No scores yet...");
  }

  await sleep(4000);
  console.clear();
  menu();
}

export { menu };
