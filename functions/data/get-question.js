/* eslint-disable  no-console */

const https = require('https');

// see https://theburningmonk.com/2019/03/just-how-expensive-is-the-full-aws-sdk/
const DynamoDB = require('aws-sdk/clients/dynamodb');

// see https://theburningmonk.com/2019/02/lambda-optimization-tip-enable-http-keep-alive/
const sslAgent = new https.Agent({
  keepAlive: true,
  maxSockets: 50, // from the aws-sdk source code
  rejectUnauthorized: true, // from the aws-sdk source code
});
sslAgent.setMaxListeners(0);

const dynamodb = new DynamoDB.DocumentClient({
  service: new DynamoDB({
    httpOptions: {
      agent: sslAgent,
    },
  }),
});

const { TABLE_NAME } = process.env;

const getNextQuestion = async (id) => {
  console.log(`In getNextQuestion function with ID: ${id}`);
  const resp = await dynamodb.get({
    TableName: TABLE_NAME,
    Key: { Id: id },
  }).promise();

  return resp;
};

module.exports = {
  getNextQuestion,
};
