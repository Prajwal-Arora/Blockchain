const { getTransactedAddresses } = require("./api");
const { getUnique } = require("./removeDuplicates");
const address1 = "";
const address2 = "";

getTransactedAddresses(address1)
.then((arr) => {
    try {
        var layer1CommonAdd = "";
        var array2 = [];
        const array = getUnique(arr);
        if (array.includes(address2.toLowerCase())) {

            console.log("\n DIRECT LINK FOUND \n");

        } else {
            let flag = 0;
            
            console.log("\n ! NO DIRECT LINK FOUND ! \n");
            console.log("Searching for layer 1 link... \n");

            getTransactedAddresses(address2)
            .then((arr2) => {
                array2 = getUnique(arr2);
                array2.forEach(ele => {
                    if (array.includes(ele)) {
                        flag = 1;
                        layer1CommonAdd = ele;
                    }
                })
            })
            .then(() => {
                if (flag === 1) {
                    console.log("layer 1 link found\n");
                    console.log("Both addresses have interacted with => " + layer1CommonAdd + "\n");

                } else {
                    console.log("Searching for layer 2 link... \n");

                    var counter = 0;
                    var i = setInterval(() => {
                        getTransactedAddresses(array[counter])
                        .then((arr3) => {
                            const array3 = getUnique(arr3);
                            array3.forEach(ele => {
                                if (array2.includes(ele)) {
                                    console.log("layer 2 link found\n");
                                    console.log(address1 + "\n    =>\n" + array[counter - 1] + "\n    =>\n" + ele + "\n    =>\n" + address2 + "\n");
                                }
                            })
                        })
                        counter++;
                        if(counter === array.length) {
                            clearInterval(i);  
                        }
                    }, 5000);           
                }
            })
        }
    } catch (e) {
        console.log(e);
    }

})
