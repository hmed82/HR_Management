import { HashUtil } from './hash.util';

jest.mock('bcrypt', () => ({
  genSalt: jest.fn(),
  hash: jest.fn(),
  compare: jest.fn(),
}));

import * as bcrypt from 'bcrypt';

describe('HashUtil', () => {
  let hashUtil: HashUtil;

  const configService = {
    get: jest.fn().mockReturnValue(10),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    hashUtil = new HashUtil(configService as any);
  });

  it('hashes a password with the configured salt rounds', async () => {
    (bcrypt.genSalt as jest.Mock).mockResolvedValue('salt');
    (bcrypt.hash as jest.Mock).mockResolvedValue('hashed');

    const result = await hashUtil.hashPassword('Secret123');

    expect(configService.get).toHaveBeenCalledWith('BCRYPT_SALT_ROUNDS', 10);
    expect(bcrypt.genSalt).toHaveBeenCalledWith(10);
    expect(result).toBe('hashed');
  });

  it('compares a password against a hash', async () => {
    (bcrypt.compare as jest.Mock).mockResolvedValue(true);
    const result = await hashUtil.comparePassword('Secret123', 'hashed');
    expect(bcrypt.compare).toHaveBeenCalledWith('Secret123', 'hashed');
    expect(result).toBe(true);
  });
});
