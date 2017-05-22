aidos.api.attachToMesh = function(trunkTransaction, branchTransaction, minWeightMagnitude, trytes, callback) {
    console.log("Light Wallet: aidos.api.attachToMesh");

    ccurl.ccurlHashing(connection.ccurlProvider, trunkTransaction, branchTransaction, minWeightMagnitude, trytes, function(error, success) {
        console.log("Light Wallet: ccurl.ccurlHashing finished:");
        if (error) {
            console.log(error);
        } else {
            console.log(success);
        }
        if (callback) {
            return callback(error, {"trytes": success})
        } else {
            return success;
        }
    })
}

aidos.api.interruptAttachingToMesh_ = aidos.api.interruptAttachingToMesh;

aidos.api.interruptAttachingToMesh = function(callback) {
    console.log("Light Wallet: aidos.api.interruptAttachingToMesh");

    aidos.api.interruptAttachingToMesh_(function(error) {
        if (!error) {
            ccurl.ccurlInterrupt(connection.ccurlProvider);
        }
        if (callback) {
            return callback(error);
        }
    });
}