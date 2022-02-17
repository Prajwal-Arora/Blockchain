const ObjectsToCsv = require('objects-to-csv');
const Web3 = require('web3');
const tokenABI = require('./tokenabi.json');
const tokenAddress = "0x896eDE222D3f7f3414e136a2791BDB08AAa25Ce0";

const web = new Web3('http://10.209.224.139:8545');

async function getTransferDetails() {

  const contractInstance = new web.eth.Contract(tokenABI, tokenAddress);

  var TransferEvent;
  var array = [];

  var fb=5045821;
  var tb=5046820;

  do {

    try {

      TransferEvent = await contractInstance.getPastEvents('Transfer', { fromBlock: fb, toBlock: tb })

      } catch(e) {
        console.log("ERROR IN FETCHING EVENTS >>>>>>>>>>>>>>>>>>>>>" + e);
      }

      for(i = 0; i < TransferEvent.length; i++) {

        var receipt = await web.eth.getTransactionReceipt(TransferEvent[i].transactionHash)

        console.log("Event number = " + i + " of " + TransferEvent.length + "     Block range = " + fb + " -> " + tb);
        console.log("___________________________________________________________");

        var block = await web.eth.getBlock(TransferEvent[i].blockNumber);

        var data = {
          "transactionHash": TransferEvent[i].transactionHash,
          "timeStamp": block.timestamp,
          "blockNumber": TransferEvent[i].blockNumber,
          "status": receipt.status,
          "event": "Transfer",
          "from": TransferEvent[i].returnValues[0],
          "to": TransferEvent[i].returnValues[1],
          "amount": TransferEvent[i].returnValues[2],
          "gasUsed": receipt.gasUsed
          }

          array.push(data);
          var csv = new ObjectsToCsv(array);
          await csv.toDisk('./VikingTransfer.csv', {append: true});
          array.pop(data);
        }

        fb = fb + 1000;
        tb = tb + 1000;
      }

      while(tb<5345821 || fb<5345821)
  }

getTransferDetails()
