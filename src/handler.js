'use strict';

const DDB = require('@aws-sdk/client-dynamodb');
// TODO: move parameters to .env
const dbClient = new DDB.DynamoDBClient({ region: 'localhost',
endpoint: 'http://localhost:8000'});



module.exports.init = async (event) => {
  const articleId = event.pathParameters.id;
  const params = {
    TableName: 'votes',
    Item: {
      'articleId': {'S': articleId},
      'like': {'N': '0'},
      'dislike': {'N': '0'},
      'share': {'N': '0'}
    }
  };
  
  const command = new DDB.PutItemCommand(params);

  let result;
  try {
    result = await dbClient.send(command);
  } catch(ex) {
    console.log('error!', ex);
  }

  return {
    statusCode: 200,
    body: JSON.stringify(
      {
        result,
        input: event,
      },
      null,
      2
    ),
  };
};


module.exports.vote = async (event) => {
  
  const { articleId, action } = JSON.parse(event.body);
  console.log('bod', articleId, action);
  const params = {
    TableName: 'votes',
    UpdateExpression: `SET #action = #action + :action`,
    ExpressionAttributeNames: {"#action": action},
    ExpressionAttributeValues: {":action": {"N":"1"}},
    ReturnValues: 'ALL_NEW',
    Key: {
      'articleId': {'S': articleId}
    }
  };
  
  const command = new DDB.UpdateItemCommand(params);

  let result;
  try {
    result = await dbClient.send(command);
  } catch(ex) {
    console.log('error!', ex);
  }

  return {
    statusCode: 200,
    body: JSON.stringify(
      {
        result,
        input: event,
      },
      null,
      2
    ),
  };
};

module.exports.list = async (event) => {
  const articleId = event.pathParameters.id;
  const params = {
    TableName: 'votes',
    Key: {
      'articleId': {'S': articleId},
    }
  };
  
  const command = new DDB.GetItemCommand(params);

  let result;
  try {
    result = await dbClient.send(command);
    console.log('res', result);
  } catch(ex) {
    console.log('error!', ex);
  }

  return {
    statusCode: 200,
    body: JSON.stringify(
      {
        result,
        input: event,
      },
      null,
      2
    ),
  };
};
