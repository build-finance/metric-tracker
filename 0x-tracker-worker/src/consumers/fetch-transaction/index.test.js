const { fn: fetchTransaction } = require('.');
const { getModel } = require('../../model');
const {
  setupDb,
  tearDownDb,
  resetDb,
  mockLogger,
} = require('../../test-utils');
const { publishJob } = require('../../queues');
const checkTransactionExists = require('../../transactions/check-transaction-exists');
const persistTransaction = require('./persist-transaction');

jest.mock('../../queues');
jest.mock('../../transactions/check-transaction-exists');
jest.mock('./persist-transaction');

const mockOptions = {
  logger: mockLogger,
};

beforeAll(async () => {
  await setupDb();
}, 30000);

beforeEach(() => {
  checkTransactionExists.mockResolvedValue(false);
  persistTransaction.mockResolvedValue(undefined);
});

afterEach(async () => {
  jest.clearAllMocks();
  await resetDb();
}, 30000);

afterAll(async () => {
  await tearDownDb();
}, 30000);

const simpleJob = {
  data: {
    transactionHash:
      '0xa707981a012761007df2c9099ed1580221d2bdbc4b37f689cb8d35eedd0d505e',
    blockNumber: 10439179,
  },
};

describe('consumers/fetch-transaction', () => {
  it('should throw error if transactionHash is null', async () => {
    await expect(
      fetchTransaction({ data: { transactionHash: null } }, mockOptions),
    ).rejects.toThrow(new Error('Invalid transactionHash: null'));
  });

  it('should throw error if transactionHash is undefined', async () => {
    await expect(
      fetchTransaction({ data: { transactionHash: undefined } }, mockOptions),
    ).rejects.toThrow(new Error('Invalid transactionHash: undefined'));
  });

  it('should throw error if transactionHash is empty string', async () => {
    await expect(
      fetchTransaction({ data: { transactionHash: '' } }, mockOptions),
    ).rejects.toThrow(new Error('Invalid transactionHash: '));
  });

  it('should bail early when transaction already exists', async () => {
    checkTransactionExists.mockResolvedValue(true);
    await fetchTransaction(simpleJob, mockOptions);
    expect(persistTransaction).toHaveBeenCalledTimes(0);
  });

  it('should throw an error when block does not exist', async () => {
    await expect(
      fetchTransaction(
        { ...simpleJob, data: { ...simpleJob.data, blockNumber: 114844840 } },
        mockOptions,
      ),
    ).rejects.toThrow(new Error('Block not found: 114844840'));
  });

  it('should throw an error when transaction does not exist', async () => {
    await expect(
      fetchTransaction(
        {
          ...simpleJob,
          data: {
            ...simpleJob.data,
            transactionHash:
              '0xa707981a012761007df2c9099ed1580221d2bdbc4b37f689cb8d35eedd0d505f',
          },
        },
        mockOptions,
      ),
    ).rejects.toThrow(
      new Error(
        'Transaction not found: 0xa707981a012761007df2c9099ed1580221d2bdbc4b37f689cb8d35eedd0d505f',
      ),
    );
  });

  it('should fetch and persist transaction when valid', async () => {
    await fetchTransaction(simpleJob, mockOptions);

    expect(persistTransaction).toHaveBeenCalledTimes(1);
    expect(persistTransaction).toHaveBeenCalledWith(
      {
        affiliateAddress: '0x86003b044f70dac0abc80ac8957305b6370893ed',
        blockHash:
          '0x4f7a07cf2810701a0a4aa64f1f041cff65523989b1cf51a8d091320228ce4ab9',
        blockNumber: 10439179,
        data:
          '0x2280c910000000000000000000000000000000000000000000000000000000000000004000000000000000000000000000000000000000000000000000000000000009c0a9570d20e4a2ea695228c2ed28173726071de6457842a9ee0ae34300c34130ab000000000000000000000000000000000000000000000000000000005f09e2b100000000000000000000000000000000000000000000000000000007aef40a00000000000000000000000000a0bb038a8981fc526fecf3fcea8701312d932e8600000000000000000000000000000000000000000000000000000000000000a000000000000000000000000000000000000000000000000000000000000008a4a6c3bf33000000000000000000000000000000000000000000000000000000000000006000000000000000000000000000000000000000000000003d41e67500df68000000000000000000000000000000000000000000000000000000000000000007800000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000004000000000000000000000000000000000000000000000000000000000000002600000000000000000000000006924a03bb710eaf199ab6ac9f2bb148215ae9b5d00000000000000000000000000000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000011000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001338aca3e000000000000000000000000000000000000000000000111d0b4caa7b20c000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000005f09e09d000000000000000000000000000000000000000000000000000001733e9390b700000000000000000000000000000000000000000000000000000000000001c0000000000000000000000000000000000000000000000000000000000000064000000000000000000000000000000000000000000000000000000000000006a000000000000000000000000000000000000000000000000000000000000006a00000000000000000000000000000000000000000000000000000000000000024f47261b0000000000000000000000000a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48000000000000000000000000000000000000000000000000000000000000000000000000000000005591360f8c7640fea5771c9682d6b5ecb776e1f80000000000000000000000000000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000001100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000044683fdc00000000000000000000000000000000000000000000003d41e67500df68000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000005f09fc78200659a45d2a2b071283b87c9028f959c2d1398a30cb582912ddb60fa748330e00000000000000000000000000000000000000000000000000000000000001c00000000000000000000000000000000000000000000000000000000000000420000000000000000000000000000000000000000000000000000000000000048000000000000000000000000000000000000000000000000000000000000004800000000000000000000000000000000000000000000000000000000000000224dc1600f3000000000000000000000000a0b86991c6218b36c1d19d4a2e9eb0ce3606eb480000000000000000000000005591360f8c7640fea5771c9682d6b5ecb776e1f8000000000000000000000000000000000000000000000000000000000000006000000000000000000000000000000000000000000000000000000000000001a00000000000000000000000006b175474e89094c44da98b954eedeac495271d0f0000000000000000000000000000000000000000000000000000000000000040000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000000200000000000000000000000006dc7950423ada9f56fb2c93a23edb787f1e2908800000000000000000000000000000000000000000000003d41e67500df6800000000000000000000000000000000000000000000000000000000000044683fdc0000000000000000000000000000000000000000000000000000000000000080000000000000000000000000000000000000000000000000000000000000008000000000000000000000000079a8c46dea5ada233abaffd40f3a0a2b1e5a4f27000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000024f47261b00000000000000000000000006b175474e89094c44da98b954eedeac495271d0f0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000004000000000000000000000000000000000000000000000000000000000000000c000000000000000000000000000000000000000000000000000000000000000421c2636dda1dd9025dbb802c04485c2f7c0b806355c9c42523a47a649feb27cdd682555c20ed7b678334a362ae67b9c5c40a25809a01f0d716b15f998bb218faf5003000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000104000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000421c299e9322556e5f16ec15950258ac9b2e5c2c09ad5661d19ebb70a881a7e37e0d5394854c28e6774ce452eea103080bec1bac32e356471b17e7c950697535b1bf03000000000000000000000000000000000000000000000000000000000000869584cd00000000000000000000000086003b044f70dac0abc80ac8957305b6370893ed000000000000000000000000000000000000000000000000000000005f09e073',
        date: new Date('2020-07-11T15:53:24.000Z'),
        from: '0x00000055a65c7b71f171659b8838e1a139b0e518',
        gasLimit: 345059,
        gasPrice: '33000000000',
        gasUsed: 262540,
        hash:
          '0xa707981a012761007df2c9099ed1580221d2bdbc4b37f689cb8d35eedd0d505e',
        index: 141,
        nonce: 559,
        quoteDate: new Date('2020-07-11T15:53:23.000Z'),
        to: '0x61935cbdd02287b511119ddb11aeb42f1593b7ef',
        value: '9900000000000000',
      },
      { session: expect.anything() }, // asserting over an actual session is a fools game
    );
  });

  it('should not persist bridge transfer events for transaction which has none', async () => {
    await fetchTransaction(simpleJob, mockOptions);

    const events = await getModel('Event')
      .find()
      .lean();

    expect(events).toHaveLength(0);
  });

  it('should persist bridge transfer events for event which has them', async () => {
    await fetchTransaction(
      {
        data: {
          transactionHash:
            '0x29579558fecfef00a960a27f314c3e36003b0bbc7b95c462100e83b8836f718a',
          blockNumber: 10141741,
        },
      },
      mockOptions,
    );

    const events = await getModel('Event')
      .find()
      .lean();

    expect(events).toEqual([
      expect.objectContaining({
        blockNumber: 10141741,
        data: {
          from: '0x36691C4F426Eb8F42f150ebdE43069A31cB080AD',
          fromToken: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
          fromTokenAmount: '25204118430346391',
          to: '0x6958F5e95332D93D21af0D7B9Ca85B8212fEE0A5',
          toToken: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
          toTokenAmount: '5049999',
        },
        logIndex: 81,
        transactionHash:
          '0x29579558fecfef00a960a27f314c3e36003b0bbc7b95c462100e83b8836f718a',
        type: 'ERC20BridgeTransfer',
        protocolVersion: 3,
      }),
    ]);
  });

  it('should schedule fetch of sender address type', async () => {
    await fetchTransaction(simpleJob, mockOptions);

    expect(publishJob).toHaveBeenCalledTimes(1);
    expect(publishJob).toHaveBeenCalledWith(
      'address-processing',
      'fetch-address-type',
      { address: '0x00000055a65c7b71f171659b8838e1a139b0e518' },
      {
        jobId: 'fetch-address-type-0x00000055a65c7b71f171659b8838e1a139b0e518',
      },
    );
  });

  it('should schedule fetch of sender address if AddressMetadata document exists but type is unknown', async () => {
    await getModel('AddressMetadata').create({
      address: '0x00000055a65c7b71f171659b8838e1a139b0e518',
    });

    await fetchTransaction(simpleJob, mockOptions);

    expect(publishJob).toHaveBeenCalledTimes(1);
    expect(publishJob).toHaveBeenCalledWith(
      'address-processing',
      'fetch-address-type',
      { address: '0x00000055a65c7b71f171659b8838e1a139b0e518' },
      {
        jobId: 'fetch-address-type-0x00000055a65c7b71f171659b8838e1a139b0e518',
      },
    );
  });

  it('should not schedule fetch of sender address type if already known', async () => {
    await getModel('AddressMetadata').create({
      address: '0x00000055a65c7b71f171659b8838e1a139b0e518',
      isContract: true,
    });

    await fetchTransaction(simpleJob, mockOptions);

    expect(publishJob).toHaveBeenCalledTimes(0);
  });
});