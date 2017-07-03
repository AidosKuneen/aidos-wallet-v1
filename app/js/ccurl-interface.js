var ffi = require('ffi');
var struct = require('ref-struct');
var ref = require('ref');

var isInitialized = false;

var result = struct({
    'corenum': 'int',
    'count': 'long long',
    'time': 'long long',
    'trytes': 'string'
});


var ccurlProvider = function (ccurlPath) {
    if (!ccurlPath) {
        console.log("ccurl-interface: no path supplied, returning");
        return false;
    }

    var fullPath = ccurlPath + '/libccurl';



    try {
        // Define libccurl to be used for finding the nonce
        var libccurl = ffi.Library(fullPath, {
            ccurl_pow: ['string', ['string', 'int', ref.refType(result)]],
            ccurl_pow_finalize: ['void', []],
            ccurl_pow_interrupt: ['void', []]
        });

        // Check to make sure the functions are available
        if (!libccurl.hasOwnProperty("ccurl_pow") || !libccurl.hasOwnProperty("ccurl_pow_finalize") || !libccurl.hasOwnProperty("ccurl_pow_interrupt")) {
            throw new Error("Could not load hashing library.");
        }

        return libccurl;
    } catch (err) {
        console.log(err);
        return false;
    }
}

var ccurlFinalize = function (libccurl) {
    if (isInitialized) {
        try {
            if (libccurl && libccurl.hasOwnProperty("ccurl_pow_finalize")) {
                libccurl.ccurl_pow_finalize();
            }
        } catch (err) {
            console.log(err);
        }
    }
}

var ccurlInterrupt = function (libccurl) {
    if (isInitialized) {
        try {
            if (libccurl && libccurl.hasOwnProperty("ccurl_pow_interrupt")) {
                libccurl.ccurl_pow_interrupt();
            }
        } catch (err) {
            console.log(err);
        }
    }
}

var ccurlInterruptAndFinalize = function (libccurl) {
    ccurlInterrupt(libccurl);
    ccurlFinalize(libccurl);
}

var ccurlHashing = function (libccurl, trunkTransaction, branchTransaction, minWeightMagnitude, trytes, callback) {
    if (!libccurl.hasOwnProperty("ccurl_pow")) {
        return callback(new Error("Hashing not available"));
    }

    // inputValidator: Check if correct hash
    if (!aidos.validate.isHash(trunkTransaction)) {

        return callback(new Error("Invalid trunkTransaction"));
    }

    // inputValidator: Check if correct hash
    if (!aidos.validate.isHash(branchTransaction)) {

        return callback(new Error("Invalid branchTransaction"));
    }

    // inputValidator: Check if int
    if (!aidos.validate.isInt(minWeightMagnitude)) {

        return callback(new Error("Invalid minWeightMagnitude"));
    }

    // inputValidator: Check if array of trytes
    // if (!aidos.validate.isArrayOfTrytes(trytes)) {
    //
    //     return callback(new Error("Invalid trytes supplied"));
    // }

    isInitialized = true;

    var finalBundleTrytes = [];
    var previousTxHash;
    var i = 0;

    function loopTrytes() {

        getBundleTrytes(trytes[i], function (error) {

            if (error) {

                return callback(error);

            } else {

                i++;

                if (i < trytes.length) {

                    loopTrytes();

                } else {

                    // reverse the order so that it's ascending from currentIndex
                    return callback(null, finalBundleTrytes.reverse());

                }
            }
        });
    }

    function getBundleTrytes(thisTrytes, callback) {
        // PROCESS LOGIC:
        // Start with last index transaction
        // Assign it the trunk / branch which the user has supplied
        // IF there is a bundle, chain  the bundle transactions via
        // trunkTransaction together


        var resultObj = new result();
        var buf = new Buffer(thisTrytes.length + 1);
        buf.fill(0);
        resultObj.trytes = buf;

        // If this is the first transaction, to be processed
        // Make sure that it's the last in the bundle and then
        // assign it the supplied trunk and branch transactions
        if (!previousTxHash) {

            var txObject = aidos.utils.transactionObject(thisTrytes);

            // Check if last transaction in the bundle
            if (txObject.lastIndex !== txObject.currentIndex) {
                return callback(new Error("Wrong bundle order. The bundle should be ordered in descending order from currentIndex"));
            }

            txObject.trunkTransaction = trunkTransaction;
            txObject.branchTransaction = branchTransaction;

            var newTrytes = aidos.utils.transactionTrytes(txObject);

            // cCurl updates the nonce as well as the transaction hash
            libccurl.ccurl_pow.async(newTrytes, minWeightMagnitude, resultObj.ref(), function (error, returnedTrytes) {

                if (error) {
                    return callback(error);
                } else if (returnedTrytes == null) {
                    return callback("Interrupted");
                }
                console.log("corenum:" + resultObj.corenum);
                console.log("count:" + resultObj.count);
                console.log("time:" + resultObj.time);
                var spd = (resultObj.count / 1e3) / resultObj.time;
                console.log(spd + " kH/sec");
                var newTxObject = aidos.utils.transactionObject(returnedTrytes);

                for (var i = 0; i < minWeightMagnitude / 3; i++) {
                    if (newTxObject.hash.charAt(newTxObject.hash.length - 1 - i) != '9') {
                        console.log(returnedTrytes);
                        console.log(newTrytes);
                        return callback("failed to PoW. Keep the wallet as it is and please consult with the developer in Aidos Slack!");
                    }
                }

                // Assign the previousTxHash to this tx
                var txHash = newTxObject.hash;
                previousTxHash = txHash;

                finalBundleTrytes.push(returnedTrytes);

                return callback(null);
            });

        } else {

            var txObject = aidos.utils.transactionObject(thisTrytes);

            // Chain the bundle together via the trunkTransaction (previous tx in the bundle)
            // Assign the supplied trunkTransaciton as branchTransaction
            txObject.trunkTransaction = previousTxHash;
            txObject.branchTransaction = trunkTransaction;

            var newTrytes = aidos.utils.transactionTrytes(txObject);

            // cCurl updates the nonce as well as the transaction hash
            libccurl.ccurl_pow.async(newTrytes, minWeightMagnitude, resultObj.ref(), function (error, returnedTrytes) {

                if (error) {
                    return callback(error);
                } else if (returnedTrytes == null) {
                    return callback("Interrupted");
                }
                console.log("corenum:" + resultObj.corenum);
                console.log("count:" + resultObj.count);
                console.log("time:" + resultObj.time);
                var spd = (resultObj.count / 1e3) / resultObj.time;
                console.log(spd + " kH/sec");
                var newTxObject = aidos.utils.transactionObject(returnedTrytes);

                for (var i = 0; i < minWeightMagnitude / 3; i++) {
                    if (newTxObject.hash.charAt(newTxObject.hash.length - 1 - i) != '9') {
                        console.log(returnedTrytes);
                        console.log(newTrytes);
                        return callback("failed to PoW. Keep the wallet as it is and please consult with the developer in Aidos Slack!");
                    }
                }

                // Assign the previousTxHash to this tx
                var txHash = newTxObject.hash;
                previousTxHash = txHash;

                finalBundleTrytes.push(returnedTrytes);

                return callback(null);
            });
        }
    }

    loopTrytes();
}

module.exports = {
    'ccurlProvider': ccurlProvider,
    'ccurlHashing': ccurlHashing,
    'ccurlInterrupt': ccurlInterrupt,
    'ccurlFinalize': ccurlFinalize,
    'ccurlInterruptAndFinalize': ccurlInterruptAndFinalize
}
