### Solidity + Web3

#### Contracts
1. Referral - When Alice sends money to Bob, the contracts checks if Bob was referred by someone, if so the referrer gets some share of the transfer depending on a few conditions.
2. Masterchef - Staking contract with per block reward reduction system.
3. NFT - Sample NFT with buy and sell inbuilt.

#### Softwares
1. LP Monitor - Monitoring tokens incoming / outgoing from a liquidity pair.
2. Data Extraction - Extrating data from blockchain for contract events, like transfer events of any ERC-20 or Deposit events of any staking contracts.
3. Link - Checks for a link (direct link, layer 1 link, layer 2 link) between 2 addresses.

Direct link = If Alice and Bob have a transaction with each other.

Alice -> Bob

Layer 1 link = If Alice and Bob have not transacted with each other but have transacted with a common address.

Alice -> common address -> Bob

Layer 2 link =

Alice -> random address -> random address -> Bob
