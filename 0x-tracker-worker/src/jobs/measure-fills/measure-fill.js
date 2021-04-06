const bluebird = require('bluebird');

const { BASE_TOKENS, BASE_TOKEN_DECIMALS } = require('../../constants');
const formatTokenAmount = require('../../tokens/format-token-amount');
const getConversionRate = require('../../rates/get-conversion-rate');
const getMeasurableActor = require('./get-measurable-actor');
const indexFillValue = require('../../index/index-fill-value');
const indexFillTraders = require('../../index/index-fill-traders');
const indexTradedTokens = require('../../index/index-traded-tokens');
const normalizeSymbol = require('../../tokens/normalize-symbol');
const withTransaction = require('../../util/with-transaction');
const { logError } = require('../../util/error-logger');
const getTokenMetadata = require('../../util/ethereum/get-token-metadata');

const measureFill = async fill => {
  const measurableActor = getMeasurableActor(fill);

  let totalValue = 0;

  await bluebird.mapSeries(fill.assets, async asset => {
    if (asset.actor === measurableActor) {
      const { tokenAddress } = asset;
      const tokenMetadata = await getTokenMetadata(tokenAddress, {
        rpcEndpoint: 'https://cloudflare-eth.com',
      });

      const tokenSymbol = tokenMetadata.symbol;
      const tokenDecimals = tokenMetadata.decimals;

      if (tokenSymbol === undefined) {
        logError(
          `Could not determine symbol for base token: ${tokenAddress}`, {}
        );
        return;
      }

      if (tokenDecimals === undefined) {
        logError(
          `Could not determine decimals for base token: ${tokenAddress}`,
        );
        return;
      }

      const tokenAmount = formatTokenAmount(asset.amount, tokenDecimals);
      const normalizedSymbol = normalizeSymbol(tokenSymbol);
      const tokenPrice = await getConversionRate(
        normalizedSymbol,
        'USD',
        fill.date,
      );

      if (tokenPrice === undefined) {
        logError(
          `Unable to fetch USD price of ${normalizedSymbol} on ${fill.date}`,
        );
        return;
      }

      const tokenAmountUSD = tokenAmount * tokenPrice;

      asset.set('price.USD', tokenPrice);
      asset.set('value.USD', tokenAmountUSD);

      if (totalValue === 0 && tokenAmountUSD > 0) {
        totalValue += tokenAmountUSD;
      }
    }
  });

  if (totalValue > 0) {
    fill.set('conversions.USD.amount', totalValue);
    fill.set('hasValue', true);

    await withTransaction(async session => {
      await fill.save({ session });
      await indexFillValue(fill, totalValue);
      await indexFillTraders(fill);
      await indexTradedTokens(fill);
    });
  }

};

module.exports = measureFill;
