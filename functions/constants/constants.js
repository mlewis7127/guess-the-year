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

const GOODBYE_MSG = 'Goodbye for now';


const constants = Object.freeze({
  WELCOME_MESSAGE,
  WELCOME_BACK_MESSAGE,
  START_QUESTION,
  INCORRECT_ANSWER,
  HELP_MESSAGE,
  READY_TO_PLAY,
  UNEXPECTED_COMMAND_MSG,
  GOODBYE_MSG,

});

export default constants;
