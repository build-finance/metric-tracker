const ethers = require('ethers');

const bridge1logsInterface = new ethers.utils.Interface([
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: 'uint256',
        name: 'source',
        type: 'uint256',
      },
      {
        indexed: false,
        internalType: 'address',
        name: 'inputToken',
        type: 'address',
      },
      {
        indexed: false,
        internalType: 'address',
        name: 'outputToken',
        type: 'address',
      },
      {
        indexed: false,
        internalType: 'uint256',
        name: 'inputTokenAmount',
        type: 'uint256',
      },
      {
        indexed: false,
        internalType: 'uint256',
        name: 'outputTokenAmount',
        type: 'uint256',
      },
    ],
    name: 'BridgeFill',
    type: 'event',
  },
]);

const bridge2logsInterface = new ethers.utils.Interface([
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: 'string',
        name: 'source',
        type: 'string',
      },
      {
        indexed: false,
        internalType: 'address',
        name: 'inputToken',
        type: 'address',
      },
      {
        indexed: false,
        internalType: 'address',
        name: 'outputToken',
        type: 'address',
      },
      {
        indexed: false,
        internalType: 'uint256',
        name: 'inputTokenAmount',
        type: 'uint256',
      },
      {
        indexed: false,
        internalType: 'uint256',
        name: 'outputTokenAmount',
        type: 'uint256',
      },
    ],
    name: 'BridgeFill',
    type: 'event',
  },
]);

const getBridgeFillEvents = transactionReceipt => {
  const bridgeFillLogs = transactionReceipt.logs.filter(log =>
    log.topics.includes(
      '0xff3bc5e46464411f331d1b093e1587d2d1aa667f5618f98a95afc4132709d3a9',
    )
  );

  const events1 = bridgeFillLogs.map(log => {
    const { blockNumber, logIndex, transactionHash } = log;
    const parsedLog = bridge1logsInterface.parseLog(log);

    const {
      inputTokenAmount,
      inputToken,
      outputToken,
      outputTokenAmount,
      source,
    } = parsedLog.args;

    return {
      blockNumber,
      data: {
        inputToken,
        inputTokenAmount: inputTokenAmount.toString(),
        outputToken,
        outputTokenAmount: outputTokenAmount.toString(),
        source: source.toString(),
      },
      logIndex,
      transactionHash,
      type: 'BridgeFill',
      protocolVersion: 4,
    };
  });

  const bridgeFillLogs2 = transactionReceipt.logs.filter(log =>
      log.topics.includes(
          '0xe59e71a14fe90157eedc866c4f8c767d3943d6b6b2e8cd64dddcc92ab4c55af8'
      )
  );

  const events2 = bridgeFillLogs2.map(log => {
    const { blockNumber, logIndex, transactionHash } = log;
    const parsedLog = bridge2logsInterface.parseLog(log);

    const {
      inputTokenAmount,
      inputToken,
      outputToken,
      outputTokenAmount,
      source,
    } = parsedLog.args;

    return {
      blockNumber,
      data: {
        inputToken,
        inputTokenAmount: inputTokenAmount.toString(),
        outputToken,
        outputTokenAmount: outputTokenAmount.toString(),
        source: source.toString(),
      },
      logIndex,
      transactionHash,
      type: 'BridgeFill',
      protocolVersion: 4,
    };
  });

  return events1.concat(events2);
};

module.exports = getBridgeFillEvents;
