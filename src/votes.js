'use strict';

const DDB = require('@aws-sdk/client-dynamodb');
const { Marshaller } = require('@aws/dynamodb-auto-marshaller');

const marshaller = new Marshaller();

const CATEGORIES_DEFAULTS = {
  likes: 0,
  dislikes: 0,
  shares: 0
};

const voteInitParams = (articleId) => {
  return {
    TableName: 'votes',
    Item: marshaller.marshallItem({articleId, ...CATEGORIES_DEFAULTS}),
    ConditionExpression: 'attribute_not_exists(articleId)'
  };
}

const voteIncrementParams = (articleId, action) => {
  return {
    TableName: 'votes',
    UpdateExpression: `SET #action = #action + :action`,
    ExpressionAttributeNames: {"#action": action},
    ExpressionAttributeValues: {":action": {"N":"1"}},
    ReturnValues: 'ALL_NEW',
    Key: marshaller.marshallItem({ articleId })
  }
}

const voteResultParams = (articleId) => {
  return {
    TableName: 'votes',
    Key: marshaller.marshallItem({ articleId })
  }
}

const dbClient = new DDB.DynamoDBClient({ 
  region: process.env.AWS_REGION,
  endpoint: process.env.AWS_ENDPOINT
});

/**
 * Initializes `votes` object for a specific article if that doesn't exist
 * @param {Object} event AWS Lambda event
 * @param {string} event.pathParameters.id Article Identifier
 * @returns {{ statusCode: number, body: Object }}
 */
module.exports.init = async ({ pathParameters }) => {
  const { id: articleId } = pathParameters;

  const params = voteInitParams(articleId);
  const command = new DDB.PutItemCommand(params);

  try {
    const result = await dbClient.send(command);
    console.log(`[Votes] Successful initialization of storage for articleID[${articleId}]`, result);
    return {
      statusCode: 201,
      body: JSON.stringify(CATEGORIES_DEFAULTS)
    };
  } catch(ex) {
    console.error(`[Votes] Error while initializing a vote storage for articleID[${articleId}]`, ex);
    const { name: errorCode, message } = ex;
    return {
      statusCode: 409,
      body: JSON.stringify({ errorCode, message }) // TODO: Add descriptive messages based on Status codes
    }
  }
};

/**
 * Saves an vote to a storage
 * @param {Object} event AWS Lambda event
 * @param {string} event.pathParameters.id Article Identifier
 * @param {string} event.body Stringified payload
 * @returns {{ statusCode: number, body: Object }}
 */
module.exports.vote = async ({pathParameters, body = '{}'}) => {
  const articleId = pathParameters.id;
  const { action } = JSON.parse(body);

  const params = voteIncrementParams(articleId, action);
  const command = new DDB.UpdateItemCommand(params);

  try {
    const result = await dbClient.send(command);
    console.log(`[Votes] Successful increlemt of action[${action}] for articleID[${articleId}]`, result);
    return {
      statusCode: 200,
      body: JSON.stringify(marshaller.unmarshallItem(result.Attributes))
    }
  } catch(ex) {
    console.error(`[Votes] Error while incrementing action[${action}] for articleID[${articleId}]`, ex);
    const { name: errorCode, message } = ex;
    return {
      statusCode: 400,
      body: JSON.stringify({ errorCode, message })
    }
  }
};

/**
 * Retrieves details of a poll if available
 * @param {Object} event AWS Lambda event
 * @param {string} event.pathParameters.id Article Identifier
 * @returns {{ statusCode: number, body: Object }}
 */
module.exports.list = async (event) => {
  const articleId = event.pathParameters.id;

  const params = voteResultParams(articleId);
  const command = new DDB.GetItemCommand(params);

  try {
    const result = await dbClient.send(command);
    
    if (!result.Item) {
      throw new Error(`Requested identifier "${articleId}" cannot be found`);
    }

    console.log(`[Votes] Successful retrieval of votes for articleID[${articleId}]`, result);
    return {
       statusCode: 200,
       body: JSON.stringify(marshaller.unmarshallItem(result.Item))
    }
  } catch(ex) {
    console.error(`[Votes] Error while retrieving articleID[${articleId}] details`, ex);
    const { name: errorCode, message } = ex;
    return {
      statusCode: 404,
      body: JSON.stringify({ errorCode, message })
    }
  }
};
