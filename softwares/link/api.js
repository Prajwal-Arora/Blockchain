const axios = require('axios');

module.exports.getTransactedAddresses = async (address) => {
    try {
        const response = await axios.get('https://api-testnet.bscscan.com/api', {
            params: {
                module: "account",
                action: "txlist",
                address: address,
                apiKey: "7QKSCKB2J1SPMTFKDX4C231994ZP4YT73N",
                startblock: 0,
                endblock: 99999999,
                sort: "asc"
            }
        });

        const array = [];
        
        response.data.result.forEach(i => {
            if(i.to !== '' && i.to !== address.toLowerCase()) {
                array.push(i.to);
            }
            if(i.from !== '' && i.from !== address.toLowerCase()) {
                array.push(i.from);
            }
        });

        return array;

    } catch (e) {
        console.error(e);
    }
}