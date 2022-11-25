#!/usr/bin/env node

import figlet from "figlet";
import chalkAnimation from "chalk-animation";

import { menu } from "./gameFunctions.js";
import { playMusic } from "./miscFunctions.js";

start();

function start() {
  playMusic("./themeSong.mp3");

  figlet("Who Wants\n To Be\n A\n Pointaire?", function (err, data) {
    if (err) {
      console.log("Something went wrong...");
      console.dir(err);
      return;
    }

    const welcomeMessage = chalkAnimation.rainbow(data);

    setTimeout(() => {
      welcomeMessage.stop();

      menu();
    }, 5000);
  });
}
