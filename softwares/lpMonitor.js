const Web3 = require("web3");
const token1ABI = require('./token1abi.json');
const token2ABI = require('./token2abi.json');
const token1Address = "0x0E09FaBB73Bd3Ade0a17ECC321fD13a19e81cE82";
const token2Address = "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c";
const pairAddress = "0x0eD7e52944161450477ee417DE9Cd3a859b14fD0";

const web3 = new Web3('https://bsc-dataseed.binance.org/');
//https://data-seed-prebsc-1-s1.binance.org:8545/

var block = 0;
var balance = 0;
const upperLimit = 50;
const lowerLimit = -50;

const contract1 = new web3.eth.Contract(token1ABI, token1Address);
const contract2 = new web3.eth.Contract(token2ABI, token2Address);

const events1 = setInterval(() => {
    contract1.getPastEvents('Transfer', { fromBlock: 'latest' })
    .then((events) => {

        //console.log(events);

        if(events.length != 0) {

            if(block == events[0].blockNumber) {
                console.log("waiting for new block...");
                return;
            }

            console.log(events[0].blockNumber);
            block = events[0].blockNumber;

            for(i = 0; i < events.length; i++) {

                if(events[i].returnValues[1] == pairAddress) {
                    var amount = (events[i].returnValues[2])/10**18;
                    balance += amount;
                }
        
                if(events[i].returnValues[0] == pairAddress) {
                    var amount = (events[i].returnValues[2])/10**18;
                    balance -= amount;
                }
            }
            console.log("Live count = " + balance);
            if(balance >= upperLimit || balance <= lowerLimit) {
                clearInterval(events1);
            }
        }
    })

},1000)