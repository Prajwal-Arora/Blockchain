const ObjectsToCsv = require('objects-to-csv');
const Web3 = require('web3');
const chefContractABI = require('./chefabi.json');
const chefAddress = "0x4aA8DeF481d19564596754CD2108086Cf0bDc71B";

//const web = new Web3('http://10.209.224.139:8545');
//const web = new Web3('https://bsc-dataseed.binance.org/');
const web = new Web3('https://matic-mainnet.chainstacklabs.com');

async function getDepositDetails() {

  var contractInstance;

  try {
    contractInstance = new web.eth.Contract(chefContractABI, chefAddress);
  } catch (e) {
    console.log("ERROR");
  }

  var depositEvent;
  var array = [];

  var fb=17856766;
  var tb=17857765;

  do {

    try {

      depositEvent = await contractInstance.getPastEvents('Deposit', { fromBlock: fb, toBlock: tb })

      } catch(e) {
        console.log("ERROR IN FETCHING EVENTS >>>>>>>>>>>>>>>>>>>>>" + e);
        
        if(e){
          continue;
        }
      }

      for(i = 0; i < depositEvent.length; i++) {

        var receipt = await web.eth.getTransactionReceipt(depositEvent[i].transactionHash)

        console.log("Event number = " + i + " of " + depositEvent.length + "     Block range = " + fb + " -> " + tb);
        console.log("___________________________________________________________");

        //var pair = await contractInstance.methods.poolInfo(parseInt(depositEvent[i].returnValues[1])).call();

        var block = await web.eth.getBlock(depositEvent[i].blockNumber);

        var data = {
          "transactionHash":depositEvent[i].transactionHash,
          "timeStamp": block.timestamp,
          "blockNumber":depositEvent[i].blockNumber,
          "status":receipt.status,
          "event":"Deposit",
          "user":depositEvent[i].returnValues[0],
          "amount":depositEvent[i].returnValues[2],
          "pool":depositEvent[i].returnValues[1],
          "gasUsed": receipt.gasUsed
          }

          array.push(data);
          var csv = new ObjectsToCsv(array);
          await csv.toDisk('./hermes.csv', {append: true});
          array.pop(data);
        }

        fb = fb + 1000;
        tb = tb + 1000;
      }

      while(tb<18151835 || fb<18151835)
  }

  getDepositDetails()
