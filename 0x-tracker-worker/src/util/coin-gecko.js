const _ = require('lodash');
const axios = require('axios');
const bluebird = require('bluebird');
const moment = require('moment');

const { logError } = require('./error-logger');

const API_ENDPOINT = 'https://api.coingecko.com/api/v3';

const callApi = async url => {
  let response;

  try {
    response = await axios.get(url);
  } catch (error) {
    logError(error, { requestUrl: url });

    return null;
  }

  if (response.data.Response === 'Error') {
    logError('Error when calling CryptoCompare API', {
      response,
    });

    return null;
  }

  return response.data;
};

const getCoins = async () => {
  const url = `${API_ENDPOINT}/coins/list`;
  return callApi(url);
};

const getPrice = async (symbol, date) => {
  const coins = await getCoins();
  const formattedDate = moment(date).format('DD-MM-YYYY');
  const coinId = coins.find(
    c => c.symbol.toLowerCase() === symbol.toLowerCase(),
  );

  const url = `${API_ENDPOINT}/coins/${coinId.id}/history?date=${formattedDate}&localization=false`;
  const responseData = await callApi(url);
  let price = null;
  if (coinId) {
    price = _.get(responseData, 'market_data.current_price.usd', null);
  }
  // The Cryptocompare API rate limits at 20 requests per second. We artificially
  // limit to 10 requests per second (one every one hundred milliseconds) to be safe.
  await bluebird.delay(100);

  if (price === null) {
    logError(`Unable to get USD price of ${symbol} on ${date}`, {
      responseData,
    });
    return null;
  }

  return { [symbol]: { USD: price } };
};

module.exports = {
  getPrice,
};
