
const formatTokenAmount = require('../../tokens/format-token-amount');
const getConversionRate = require('../../rates/get-conversion-rate');
const indexFillValue = require('../../index/index-fill-value');
const indexFillTraders = require('../../index/index-fill-traders');
const indexTradedTokens = require('../../index/index-traded-tokens');
const normalizeSymbol = require('../../tokens/normalize-symbol');
const withTransaction = require('../../util/with-transaction');
const { logError } = require('../../util/error-logger');
const getTokenMetadata = require('../../util/ethereum/get-token-metadata');

const measureFill = async fill => {

  let totalValue = await measureAssetValue(fill, fill.assets[0]);
  if (totalValue === 0) {
    totalValue = await measureAssetValue(fill, fill.assets[1]);
  }

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

const measureAssetValue = async (fill, asset) => {

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
      return 0;
    }

    if (tokenDecimals === undefined) {
      logError(
          `Could not determine decimals for base token: ${tokenAddress}`,
      );
      return 0;
    }

    const tokenAmount = formatTokenAmount(asset.amount, tokenDecimals);
    const normalizedSymbol = normalizeSymbol(tokenSymbol);
    const tokenPrice = await getConversionRate(
        tokenAddress,
        normalizedSymbol,
        'USD',
        fill.date,
    );

    if (tokenPrice === undefined) {
      logError(
          `Unable to fetch USD price of ${normalizedSymbol} on ${fill.date}`,
      );
      return 0;
    }

    const tokenAmountUSD = tokenAmount * tokenPrice;

    asset.set('price.USD', tokenPrice);
    asset.set('value.USD', tokenAmountUSD);

    return tokenAmountUSD
};

module.exports = measureFill;
