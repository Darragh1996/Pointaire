import inquirer from "inquirer";
import termKit from "terminal-kit";

import { getJsonData, updateQuestions, shuffle } from "./miscFunctions.js";
import { menu } from "./gameFunctions.js";

let jsonFile = "./questions.json";

function adminMenu() {
  console.clear();

  inquirer
    .prompt([
      {
        type: "list",
        name: "adminOption",
        message: "Admin Menu",
        choices: ["View Questions", "Add Question", "Back to Main Menu"],
      },
    ])
    .then(async (answer) => {
      if (answer.adminOption == "View Questions") {
        let questions = await getJsonData(jsonFile);
        displaySingleQuestion(questions, 0);
      } else if (answer.adminOption == "Add Question") {
        addQuestion();
      } else if (answer.adminOption == "Back to Main Menu") {
        menu();
      }
    });
}

// displays a single question at a time along with options that can be done to the question
async function displaySingleQuestion(questions, questionNum) {
  console.clear();

  try {
    let term = termKit.terminal;

    let choices = [
      "Next Question",
      "Previous Question",
      "Edit Question",
      "Delete Question",
      "Back to Admin Menu",
    ];
    let choiceLetters = ["A", "B", "C", "D"];
    let answers = "";

    if (questionNum == questions.length - 1) {
      choices.splice(0, 1);
    } else if (questionNum == 0) {
      choices.splice(1, 1);
    }

    for (
      let index = 0;
      index < questions[questionNum].content.length;
      index++
    ) {
      answers +=
        choiceLetters[index] +
        ". " +
        questions[questionNum].content[index] +
        (index == questions[questionNum].correct ? " - correct" : "") +
        (index < questions[questionNum].content.length - 1 ? "\n" : "");
    }

    term.table(
      // displays question and all possible answers in a table
      [
        [`Question ${questionNum + 1}:`, `${questions[questionNum].question}`],
        ["Possible Answers:", answers],
      ],
      {
        hasBorder: true,
        contentHasMarkup: true,
        borderChars: "lightRounded",
        borderAttr: { color: "blue" },
        textAttr: { bgColor: "default" },
        firstCellTextAttr: { bgColor: "blue" },
        firstRowTextAttr: { bgColor: "yellow" },
        firstColumnTextAttr: { bgColor: "red" },
        width: 60,
        fit: true, // Activate all expand/shrink + wordWrap
      }
    );

    await inquirer // menu allowing user to perform some basic operations to questions
      .prompt([
        {
          type: "list",
          name: "questionOption",
          message: "Question Menu",
          choices: choices,
        },
      ])
      .then((answer) => {
        if (answer.questionOption == "Next Question") {
          displaySingleQuestion(questions, questionNum + 1);
        } else if (answer.questionOption == "Previous Question") {
          displaySingleQuestion(questions, questionNum - 1);
        } else if (answer.questionOption == "Edit Question") {
          editQuestion(questionNum);
        } else if (answer.questionOption == "Delete Question") {
          deleteQuestion(questionNum);
          adminMenu();
        } else if (answer.questionOption == "Back to Admin Menu") {
          adminMenu();
        }
      });
  } catch (error) {
    console.log(error);
  }
}

async function addQuestion() {
  // gets new question and answers from user and saves it to questions.json file
  let question;
  let answers = [];
  let correctAnswerString = "";
  let correctAnswer;

  await inquirer // prompts user for their new question
    .prompt({
      type: "input",
      name: "question",
      message: "Enter your question: ",
    })
    .then((answer) => {
      question = answer["question"];
    });

  for (let index = 0; index < 3; index++) {
    // prompts user for three incorrect answers their new question
    await inquirer
      .prompt({
        type: "input",
        name: "incorrectAnswer",
        message: `Enter INCORRECT answer ${index + 1}: `,
      })
      .then((answer) => {
        answers.push(answer["incorrectAnswer"]);
      });
  }

  await inquirer // prompts user for correct answer to their new question
    .prompt({
      type: "input",
      name: "correctAnswer",
      message: "Enter the CORRECT answer: ",
    })
    .then((correctAnswer) => {
      correctAnswerString = correctAnswer["correctAnswer"];
      answers.push(correctAnswer["correctAnswer"]);
    });

  await shuffle(answers); // shuffles possible answers to keep it random

  for (let index = 0; index < answers.length; index++) {
    if (answers[index] == correctAnswerString) {
      correctAnswer = index;
    }
  }

  let questions = getJsonData(jsonFile);

  let newQuestion = {
    question: question,
    content: answers,
    correct: correctAnswer,
  };

  questions.push(newQuestion);

  await updateQuestions(questions); // updates questions.json file
  adminMenu();
}

async function editQuestion(questionNum) {
  // allows user to update pre-existing questions and their possible answers
  let questions = getJsonData(jsonFile);

  let questionToEdit = questions[questionNum];

  console.log(`Old Question: ${questionToEdit.question}`);
  await inquirer
    .prompt({
      type: "input",
      name: "newQuestion",
      message: "Enter the updated Question: ",
    })
    .then((question) => {
      questionToEdit.question = question["newQuestion"];
    });

  for (let i = 0; i < questionToEdit.content.length; i++) {
    console.log(`Old answer: ${questionToEdit.content[i]}`);
    await inquirer
      .prompt({
        type: "input",
        name: "newAnswer",
        message: `Enter the updated Answer ${i + 1}: `,
      })
      .then((answer) => {
        questionToEdit.content[i] = answer["newAnswer"];
      });
  }

  updateQuestions(questions);
}

async function deleteQuestion(questionNum) {
  // deletes a question and updates question.json file
  let questions = getJsonData(jsonFile);

  questions.splice(questionNum, 1);

  await updateQuestions(questions);
}

export { adminMenu, addQuestion };
