/* eslint-disable  no-console */
/* eslint-disable  no-unused-vars */
/* eslint-disable no-param-reassign */
/* eslint no-plusplus: ["error", { "allowForLoopAfterthoughts": true }] */


// 1. Include required modules
const Alexa = require('ask-sdk');
const constants = require('./constants/constants');
const GetQuestion = require('./data/get-question');


// 2. Define Constants

const MAX_QUESTION_COUNT = 5;
const YEAR_DIFFERENCE_MIN = -3;
const YEAR_DIFFERENCE_MAX = 3;

const ID_ARRAY = [];
const QUESTION_COUNT = 100;

// 2. Define Helper Functions

// A helper function to shuffle the order of questions in an array
function shuffle(array) {
  let currentIndex = array.length; let temporaryValue; let
    randomIndex;

  // While there remain elements to shuffle...
  while (currentIndex !== 0) {
    // Pick a remaining element...
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex -= 1;

    // And swap it with the current element.
    temporaryValue = array[currentIndex];
    array[currentIndex] = array[randomIndex];
    array[randomIndex] = temporaryValue;
  }
  return array;
}

async function askQuestion(handlerInput) {
  console.log('In askQuestion function');
  // Need to get the question array from the sessiom
  const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();

  let questionArray = sessionAttributes.questionArray;
  let index;
  let answer;
  let question;

  console.log(typeof questionArray);

  // If the questionArray is not defined, then instantiate a new array and shuffle Id's
  if (typeof questionArray === 'undefined') {
    console.log('In askQuestion function - questionArray is undefined');
    const tempArray = [];
    for (let i = 0; i < QUESTION_COUNT; i++) {
      tempArray[i] = i;
    }
    questionArray = shuffle(tempArray);
    index = 0;
    sessionAttributes.questionArray = questionArray;
  } else {
    index = sessionAttributes.index + 1;
    answer = sessionAttributes.currentAnswer;
    question = sessionAttributes.currentQuestion;
    // if max index number is reached, then reset back to zero
    if (index === QUESTION_COUNT) {
      index = 0;
    }
  }

  // Now get the next question from DynamoDB
  let QuestionData;

  try {
    QuestionData = await GetQuestion.getNextQuestion(index);
    answer = QuestionData.Item.Answer;
    question = QuestionData.Item.Question;
  } catch (error) {
    console.log(`Error calling GetQuestion${error}`);
  }

  console.log(`Retrieved following from DynamoDB: ${JSON.stringify(QuestionData)}`);

  sessionAttributes.index = index;
  sessionAttributes.currentQuestion = question;
  sessionAttributes.currentAnswer = answer;
  sessionAttributes.count += 1;

  if (sessionAttributes.RESPONSE) {
    const RESPONSE_MSG = `${sessionAttributes.RESPONSE} Question ${sessionAttributes.count}: ${constants.START_QUESTION}${question}`;
    return handlerInput.responseBuilder
      .speak(RESPONSE_MSG)
      .reprompt(RESPONSE_MSG)
      .getResponse();
  } else {
    const RESPONSE_MSG = `Question ${sessionAttributes.count}: ${constants.START_QUESTION}${question}`;
    return handlerInput.responseBuilder
      .speak(RESPONSE_MSG)
      .reprompt(RESPONSE_MSG)
      .getResponse();  
  }
}

function finalScore(handlerInput) {
  console.log('In finalScore function');
  const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();
  let FINAL_SCORE = null;
  if (sessionAttributes.score === 1) {
    FINAL_SCORE = `You got 1 question right out of ${sessionAttributes.count}`;
  } else {
    FINAL_SCORE = `You got ${sessionAttributes.score} questions right out of ${sessionAttributes.count}`;
  }
  return handlerInput.responseBuilder
    .speak(sessionAttributes.RESPONSE + FINAL_SCORE)
    .withShouldEndSession(true)
    .getResponse();
}

function tryAgain(handlerInput) {
  console.log('In tryAgain function');
  const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();
  const RESPONSE_MSG = sessionAttributes.RESPONSE + constants.START_QUESTION
     + sessionAttributes.currentQuestion;
  return handlerInput.responseBuilder
    .speak(RESPONSE_MSG)
    .reprompt(RESPONSE_MSG)
    .getResponse();
}

function setUpQuiz(handlerInput) {
  console.log('In setUpQuiz function');
  const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();
  sessionAttributes.RESPONSE = null;
  sessionAttributes.currentQuestion = null;
  sessionAttributes.currentAnswer = null;
  sessionAttributes.count = 0;
  sessionAttributes.score = 0;
  sessionAttributes.guesses = 0;

  return askQuestion(handlerInput);
}

// 3. Define Intent Handlers
const LaunchRequestHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'LaunchRequest';
  },
  handle(handlerInput) {
    console.log('In LaunchRequestHander function');
    const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();

    sessionAttributes.RESPONSE = null;
    sessionAttributes.currentQuestion = null;
    sessionAttributes.currentAnswer = null;
    sessionAttributes.count = 0;
    sessionAttributes.score = 0;
    sessionAttributes.guesses = 0;

    if (sessionAttributes.return) {
      return handlerInput.responseBuilder
        .speak(constants.WELCOME_BACK_MESSAGE)
        .reprompt(constants.WELCOME_BACK_MESSAGE)
        .getResponse();
    }
    sessionAttributes.return = true;
    return handlerInput.responseBuilder
      .speak(constants.WELCOME_MESSAGE)
      .reprompt(constants.WELCOME_MESSAGE)
      .getResponse();
  },
};


const YesIntentHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'IntentRequest'
        && handlerInput.requestEnvelope.request.intent.name === 'AMAZON.YesIntent';
  },
  handle(handlerInput) {
    console.log('In YesIntentHandler function');
    return askQuestion(handlerInput);
  },
};

const NoIntentHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'IntentRequest'
        && handlerInput.requestEnvelope.request.intent.name === 'AMAZON.NoIntent';
  },
  handle(handlerInput) {
    console.log('In NoIntentHandler function');
    return handlerInput.responseBuilder
      .speak(constants.GOODBYE_MSG)
      .withShouldEndSession(true)
      .getResponse();
  },
};

const AnswerIntentHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'IntentRequest'
        && handlerInput.requestEnvelope.request.intent.name === 'AnswerIntent';
  },
  handle(handlerInput) {
    console.log('In AnswerIntentHandler function');
    const { request } = handlerInput.requestEnvelope;
    const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();

    // Get the 4-digit value that has been passed in
    let response = request.intent.slots.Answer.value;

    // increment the guesses counter
    sessionAttributes.guesses += 1;

    // Get the correct answer
    const correctYear = sessionAttributes.currentAnswer;

    // Testing showed problems with 90 being heard instead of 19
    let firstTwo = response.slice(0, 2);
    const secondTwo = response.slice(2, 4);

    switch (firstTwo) {
      case ('90'):
        firstTwo = '19';
        break;
      case ('80'):
        firstTwo = '18';
        break;
      case ('70'):
        firstTwo = '17';
        break;
      case ('60'):
        firstTwo = '16';
        break;
      default:
        break;
    }

    // This is now the new value passed in
    response = firstTwo + secondTwo;

    // Format the response of the correct year
    const year = `${correctYear.slice(0, 2)} ${correctYear.slice(2, 4)}`;

    const questionCount = sessionAttributes.count;

    if (correctYear === response) {
      sessionAttributes.score += 1;
      sessionAttributes.guesses = 0;
      sessionAttributes.RESPONSE = `Correct: ${year}. `;
    } else {
      // Calculate years out
      const difference = parseInt(correctYear, 10) - parseInt(response, 10);

      if (difference > YEAR_DIFFERENCE_MIN && difference < YEAR_DIFFERENCE_MAX) {
        if (sessionAttributes.guesses === 1) {
          sessionAttributes.RESPONSE = 'Wrong. You are close though. Have another go. ';
          return tryAgain(handlerInput);
        }
        sessionAttributes.guesses = 0;
        sessionAttributes.RESPONSE = `Wrong. I heard you say: ${firstTwo}${secondTwo}. The correct answer is ${year}. `;
      } else {
        sessionAttributes.guesses = 0;
        sessionAttributes.RESPONSE = `Wrong. I heard you say: ${firstTwo}${secondTwo}. The correct answer is ${year}. `;
      }
    }

    if (questionCount === MAX_QUESTION_COUNT) {
      return finalScore(handlerInput);
    }
    return askQuestion(handlerInput);
  },
};


const DontKnowIntentHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'IntentRequest'
        && handlerInput.requestEnvelope.request.intent.name === 'DontKnowIntent';
  },
  handle(handlerInput) {
    console.log('In DontKnowIntentHandler function');
    const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();

    if (sessionAttributes.currentAnswer) {
      // increment the guesses counter
      sessionAttributes.guesses += 1;
      // get the correct answer
      const correctYear = sessionAttributes.currentAnswer;
      // need to format the response of the correct year
      const year = `${correctYear.slice(0, 2)} ${correctYear.slice(2, 4)}`;
      sessionAttributes.RESPONSE = `The correct answer is ${year}. `;
      const questionCount = sessionAttributes.count;

      if (questionCount === MAX_QUESTION_COUNT) {
        return finalScore(handlerInput);
      }
      return askQuestion(handlerInput);
    }
    return handlerInput.responseBuilder
      .speak(constants.READY_TO_PLAY)
      .reprompt(constants.READY_TO_PLAY)
      .getResponse();
  },
};

const RepeatIntentHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'IntentRequest'
        && handlerInput.requestEnvelope.request.intent.name === 'AMAZON.RepeatIntent';
  },
  handle(handlerInput) {
    console.log('In RepeatIntentHander function');
    const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();

    const RESPONSE_MSG = constants.START_QUESTION + sessionAttributes.currentQuestion;

    return handlerInput.responseBuilder
      .speak(RESPONSE_MSG)
      .reprompt(RESPONSE_MSG)
      .getResponse();
  },
};

const StartOverIntentHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'IntentRequest'
        && handlerInput.requestEnvelope.request.intent.name === 'AMAZON.StartOverIntent';
  },
  handle(handlerInput) {
    console.log('In StartOverIntentHandler function');
    return setUpQuiz(handlerInput);
  },
};


const HelpIntentHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'IntentRequest'
        && handlerInput.requestEnvelope.request.intent.name === 'AMAZON.HelpIntent';
  },
  handle(handlerInput) {
    console.log('In HelpIntentHandler function');
    const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();

    sessionAttributes.RESPONSE = null;
    sessionAttributes.currentQuestion = null;
    sessionAttributes.currentAnswer = null;
    sessionAttributes.count = 0;
    sessionAttributes.score = 0;
    sessionAttributes.guesses = 0;

    return handlerInput.responseBuilder
      .speak(constants.HELP_MESSAGE)
      .reprompt(constants.HELP_MESSAGE)
      .getResponse();
  },
};


const CancelAndStopIntentHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'IntentRequest'
        && (handlerInput.requestEnvelope.request.intent.name === 'AMAZON.CancelIntent'
          || handlerInput.requestEnvelope.request.intent.name === 'AMAZON.StopIntent');
  },
  handle(handlerInput) {
    console.log('In CancelAndStopIntentHandler function');
    return handlerInput.responseBuilder
      .speak(constants.GOODBYE_MSG)
      .getResponse();
  },
};


// 4. Define Request Interceptors ---------------------------------------------
const GuessYearRequestInterceptor = {
  async process(handlerInput) {
    console.log('In the GuessYearRequestInterceptor');
    let attributes = {};
    // Only execute this logic for a new session
    if (handlerInput.requestEnvelope.session.new) {
      try {
        // Get persistent attributes out of the database. If none, create an empty array
        attributes = await handlerInput.attributesManager.getPersistentAttributes();
      } catch (error) {
        console.log(`ERROR ${error}`);
        attributes = {};
      }
      handlerInput.attributesManager.setSessionAttributes(attributes);
    }
  },
};

// 5. Define Response Interceptors --------------------------------------------
const PersistenceSavingResponseInterceptor = {
  async process(handlerInput) {
    console.log('In PersistenceSavingResponseInterceptor for saving persistent attributes');
    const { attributesManager } = handlerInput;
    const sessionAttributes = attributesManager.getSessionAttributes();
    attributesManager.setPersistentAttributes(sessionAttributes);
    await attributesManager.savePersistentAttributes();
  },
};


// 6. Define Error Handlers ---------------------------------------------------
const ErrorHandler = {
  canHandle() {
    return true;
  },
  handle(handlerInput, error) {
    console.log('In ErrorHandler function');
    console.log(`Error handled: ${error}`);

    return handlerInput.responseBuilder
      .speak(constants.UNEXPECTED_COMMAND_MSG)
      .reprompt(constants.UNEXPECTED_COMMAND_MSG)
      .getResponse();
  },
};


// 7. Exports handler function and setup --------------------------------------
const skillBuilder = Alexa.SkillBuilders.standard();
exports.handler = skillBuilder
  .addRequestHandlers(
    LaunchRequestHandler,
    YesIntentHandler,
    NoIntentHandler,
    AnswerIntentHandler,
    DontKnowIntentHandler,
    RepeatIntentHandler,
    StartOverIntentHandler,
    HelpIntentHandler,
    CancelAndStopIntentHandler,
  )
  .addRequestInterceptors(GuessYearRequestInterceptor)
  .addResponseInterceptors(PersistenceSavingResponseInterceptor)
  .addErrorHandlers(ErrorHandler)
  .withTableName('Guess-The-Year-Test')
  .withAutoCreateTable(true)
  .lambda();
