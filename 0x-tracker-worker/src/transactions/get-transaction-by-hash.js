const { getModel } = require('../model');

const getTransactionByHash = async hash => {
  const tx = await getModel('Transaction').findOne({ hash });

  return tx || null;
};

const getTransactionByHashes = async hashes => {
  const txs = await getModel('Transaction').find({
    hash: { $in: hashes },
  });

  return txs || [];
};

module.exports = {
  getTransactionByHash: getTransactionByHash,
  getTransactionByHashes: getTransactionByHashes
};
