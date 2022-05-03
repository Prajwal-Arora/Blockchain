module.exports.getUnique = (arr) => {
    let uniqueArr = [];
    for(let i of arr) {
        if(uniqueArr.indexOf(i) === -1) {
            uniqueArr.push(i);
        }
    }
    return uniqueArr;
}

// getTransactedAddresses("0xaa25aa7a19f9c426e07dee59b12f944f4d9f1dd3")
// .then((a) => {
    
//     var counter = 0;
//     var i = setInterval(() => {
//         getTransactedAddresses(a[counter])
//         .then(b => console.log(b))
//         counter++;
//         if(counter === a.length - 1) {
//             clearInterval(i);
//         }
//     }, 1000);
// })
