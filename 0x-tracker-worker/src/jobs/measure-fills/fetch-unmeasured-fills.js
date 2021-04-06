const _ = require('lodash');

const { getModel } = require('../../model');

const fetchUnmeasuredFills = async batchSize => {
  return await getModel('Fill')
    .find({
      hasValue: false,
      immeasurable: { $in: [null, false] },
    })
    .limit(batchSize)
    .populate([{ path: 'relayer' }, { path: 'assets.token' }]);
};

module.exports = fetchUnmeasuredFills;
