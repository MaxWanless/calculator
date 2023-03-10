"use strict";

// Toggle between color modes
document.querySelector("#themeToggle").addEventListener("change", () => {
  document.body.classList.toggle("dark");
  const buttons = document.querySelectorAll(".button");

  buttons.forEach((button) => button.classList.toggle("dark"));
});

const round = (num) => {
  let result = Math.round((num + Number.EPSILON) * 10000) / 10000;
  if (result.toString().length > 12) {
    result = result.toExponential(3);
  }
  return result;
};

const operations = {
  add(num1, num2) {
    return num1 + num2;
  },
  subtract(num1, num2) {
    return num1 - num2;
  },
  multiply(num1, num2) {
    return num1 * num2;
  },
  divide(num1, num2) {
    return num1 / num2;
  },
};

const operationSymbols = {
  add: "+",
  subtract: "-",
  multiply: "x",
  divide: "/",
};

class Calculator {
  constructor(mainDisplay, operationDisplay) {
    this.mainDisplay = mainDisplay;
    this.operationDisplay = operationDisplay;
    this.clear();
  }

  updateMainDisplay(str) {
    this.mainDisplay.textContent = str;
  }

  updateOperationDisplay(str) {
    this.operationDisplay.textContent = str;
  }

  clear() {
    this.updateMainDisplay("0");
    this.updateOperationDisplay("");
    this.operationType = null;
    this.num1 = null;
    this.num2 = null;
    this.operatorPressed = false;
    this.currentNumberUpdated = false;
  }

  displayOperand(str) {
    const displayStr = this.mainDisplay.textContent;
    this.operatorPressed = false;

    if (displayStr === "0") {
      this.mainDisplay.textContent = str === "." ? `0${str}` : str;
      return;
    }

    if (str === "." && displayStr.includes(".")) {
      return;
    }

    if (displayStr.length < 12) {
      this.mainDisplay.textContent += str;
    }
  }

  isResultDisplayed() {
    return this.mainDisplay.textContent.includes("=");
  }

  getDisplayedNumber() {
    return +this.mainDisplay.textContent;
  }

  displayOperation(num1, operation, num2 = null) {
    const operationDisplayed = `${num1}${operationSymbols[operation]}${
      num2 ?? ""
    }`;
    this.updateOperationDisplay(operationDisplayed);
    this.updateMainDisplay("0");
    this.operatorPressed = true;
  }

  backspace() {
    if (this.isResultDisplayed()) {
      this.clear();
      return;
    }
    const displayStr = this.mainDisplay.textContent;
    const newStr = displayStr.length === 1 ? 0 : displayStr.slice(0, -1);
    this.updateMainDisplay(newStr);
  }

  percentage() {
    let displayStr = this.mainDisplay.textContent;

    if (this.isResultDisplayed()) {
      if (displayStr.includes("Error")) return;

      displayStr = displayStr.replace("=", "");
      this.num1 = round(+displayStr / 100);
      this.updateOperationDisplay("");
      this.currentNumberUpdated = true;
    }
    this.updateMainDisplay(round(+displayStr / 100));
  }

  calculate() {
    return this.operationType === "divide" && this.num2 === 0
      ? false
      : round(operations[this.operationType](this.num1, this.num2));
  }

  operation(operationType) {
    // first operation, or num1 previously updated via percentage
    if (this.num1 === null || this.currentNumberUpdated) {
      this.operationType = operationType;
      this.num1 = this.getDisplayedNumber();
      // we'll display the operation that's being executed e.g: "5x"
      this.displayOperation(this.num1, this.operationType);
      this.currentNumberUpdated = false;
      return;
    }

    // if user had already selected an operation, update operation, e.g: "5x" -> "5+"
    if (this.operatorPressed) {
      this.operationType = operationType;
      this.displayOperation(this.num1, this.operationType);
      return;
    }

    if (this.isResultDisplayed()) {
      let display = this.mainDisplay.textContent;
      if (display.includes("Error")) return;
      this.num1 = +display.replace("= ", "");
    } else {
      // if user wants to chain operations, more than a pair of operands, e.g: 12+7-
      // we need to execute the current operation first, before starting the new one
      this.num2 = this.getDisplayedNumber();
      const result = this.calculate();
      // in case division by 0, result will be false
      if (result === false) {
        this.updateMainDisplay(`= Error`);
        return;
      }
      // store the result in num1 before continuing to the next operation
      this.num1 = result;
    }
    // display the new operation
    this.operationType = operationType;
    this.displayOperation(this.num1, this.operationType);
  }

  result() {
    // if operation is not defined, don't do anything
    if (!this.operationType) return;
    // the value of num2 depends on the user previous actions:
    if (this.operatorPressed) {
      // if user presses "=" straight after an operation without entering a second number, num2 will be equal to the first number, e.g: 5+= 10
      this.num2 = this.num1;
    } else if (this.currentNumberUpdated || this.isResultDisplayed()) {
      // if num1 was updated via % button or there is a result on the display, get the number and assign to num1, num2 stays the same, just update num1
      //e.g: 1+2=3, display: =3, user presses result: num1 = 3, num2 = 2 (display: =5)
      let display = this.mainDisplay.textContent;
      if (display.includes("Error")) return;
      this.num1 = +display.replace("= ", "");
    } else {
      // get the number on the display to be the second operand
      this.num2 = +this.mainDisplay.textContent;
    }

    const result = this.calculate();
    if (result === false) {
      this.updateMainDisplay(`= Error`);
      return;
    }
    this.displayOperation(this.num1, this.operationType, this.num2);
    this.updateMainDisplay(`= ${result}`);
    this.operatorPressed = false;
    this.currentNumberUpdated = false;
  }
}

const mainDisplay = document.querySelector(".calculator__output--main-display");
const operationDisplay = document.querySelector(
  ".calculator__output--operation-display"
);

const calculator = new Calculator(mainDisplay, operationDisplay);

const handleClick = (e) => {
  if (!e.target.closest("button")) return;

  if (e.target.closest("button").dataset.target === "operator") {
    calculator.operation(e.target.closest("button").dataset.operation);
    return;
  }
  if (e.target.closest("button").dataset.target === "operand") {
    if (calculator.isResultDisplayed()) calculator.clear();
    calculator.displayOperand(e.target.textContent.replace(/\s/g, ""));
    return;
  } else {
    calculator[e.target.closest("button").dataset.target]();
  }
};

document
  .querySelector(".calculator__keypad")
  .addEventListener("click", handleClick);
