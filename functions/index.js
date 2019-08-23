/* eslint-disable  no-console */
/* eslint-disable  no-unused-vars */

// 1. Include required modules ------------------------------------------------
const Alexa = require('ask-sdk');


// 2. Define Helper Functions and Constants ---------------------------------------------

// Welcome message
const WELCOME_MESSAGE = 'Welcome to Guess the Year. I ask you a question about a famous event, and you tell me the 4 digit year '
    + 'in which it took place. Each game has 5 questions. Can you get all 5 right? Are you ready to play?';

const WELCOME_BACK_MESSAGE = 'Welcome back to Guess the Year. Are you ready to play?';

const START_QUESTION = 'In what year ';

const INCORRECT_ANSWER = "I'm sorry, your answer was wrong. The correct answer was ";

const HELP_MESSAGE = 'I ask you a question about a famous event or incident, and you tell me the 4 digit year in which it took place. '
        + "Each game has 5 questions. If you don't know the answer you can say 'i don't know' or 'pass'. You can also "
        + 'ask me to repeat a question. Are you ready to play?';

const READY_TO_PLAY = "I'm sorry, I didn't catch that. Are you ready to play?";

const UNEXPECTED_COMMAND_MSG = 'Sorry, I didn\'t understand that command. Please try saying it again';

const MAX_QUESTION_COUNT = 5;
const YEAR_DIFFERENCE_MIN = -3;
const YEAR_DIFFERENCE_MAX = 3;


// 3. Define Intent Handlers --------------------------------------------------

const LaunchRequestHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'LaunchRequest';
  },
  handle(handlerInput) {
    const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();

    sessionAttributes.RESPONSE = null;
    sessionAttributes.currentQuestion = null;
    sessionAttributes.currentAnswer = null;
    sessionAttributes.count = 0;
    sessionAttributes.score = 0;
    sessionAttributes.guesses = 0;

    if (sessionAttributes.return) {
      return handlerInput.responseBuilder
        .speak(WELCOME_BACK_MESSAGE)
        .reprompt(WELCOME_BACK_MESSAGE)
        .getResponse();
    }
    sessionAttributes.return = true;
    return handlerInput.responseBuilder
      .speak(WELCOME_MESSAGE)
      .reprompt(WELCOME_MESSAGE)
      .getResponse();
  },
};


const HelpIntentHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'IntentRequest'
        && handlerInput.requestEnvelope.request.intent.name === 'AMAZON.HelpIntent';
  },
  handle(handlerInput) {
    const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();

    sessionAttributes.RESPONSE = null;
    sessionAttributes.currentQuestion = null;
    sessionAttributes.currentAnswer = null;
    sessionAttributes.count = 0;
    sessionAttributes.score = 0;
    sessionAttributes.guesses = 0;

    return handlerInput.responseBuilder
      .speak(HELP_MESSAGE)
      .reprompt(HELP_MESSAGE)
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
    const speechText = 'Goodbye for now!';

    return handlerInput.responseBuilder
      .speak(speechText)
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
    console.log(`Error handled: ${error}`);

    return handlerInput.responseBuilder
      .speak(UNEXPECTED_COMMAND_MSG)
      .reprompt(UNEXPECTED_COMMAND_MSG)
      .getResponse();
  },
};


// 7. Exports handler function and setup --------------------------------------
const skillBuilder = Alexa.SkillBuilders.standard();
exports.handler = skillBuilder
  .addRequestHandlers(
    LaunchRequestHandler,
    HelpIntentHandler,
    CancelAndStopIntentHandler,
  )
  .addRequestInterceptors(GuessYearRequestInterceptor)
  .addResponseInterceptors(PersistenceSavingResponseInterceptor)
  .addErrorHandlers(ErrorHandler)
  .withTableName('Guess-The-Year-Test')
  .withAutoCreateTable(true)
  .lambda();
