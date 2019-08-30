module.exports = {
    entry: {
      'functions/index': './functions/index.js',
      'functions/data/getNextQuestion': './functions/data/get-question.js',
      'functions/constants/constants': './functions/constants/constants.js',
    },
    mode: 'production',
    target: 'node'
  }