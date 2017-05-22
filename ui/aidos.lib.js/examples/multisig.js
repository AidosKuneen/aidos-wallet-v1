var aidos = require('../lib/aidos');

var aidos = new aidos({
    'host': 'http://localhost',
    'port': 14265
});

var digestOne = aidos.multisig.getDigest('ABCDFG', 0);

var initiatedMultisigAddress = aidos.multisig.addAddressDigest(digestOne);

var digestTwo = aidos.multisig.getDigest('FDSAG', 0);

var finalMultisig = aidos.multisig.addAddressDigest(digestTwo, initiatedMultisigAddress);

var address = aidos.multisig.finalizeAddress(finalMultisig);

console.log("MULTISIG ADDRESS: ", address);

console.log("VALIDATED MULTISIG: ", aidos.multisig.validateAddress(address, [digestOne, digestTwo]));

aidos.multisig.initiateTransfer(address, 'ABCFYSUQFVBFGNHOJMLWBHMGASFGBPAUMRZRRCJFCCOJHJKZVUOCEYSCLXAGDABCEWSUXCILJCGQWI9SF', 2, [{'address': 'GWXMZADCDEWEAVRKTAIWOGE9RDX9QPKJHPPQ9IDDOINY9TUWJGKCWF9GSOW9QBPNRVSVFLBMLPAHWDNSB', 'value': 15}], function(e, unsignedBundle) {

    var firstKey = aidos.multisig.getKey('ABCDFG', 0);

    aidos.multisig.addSignature(unsignedBundle, 0, 'JUIFYSUQFVBFGNHOJMLWBHMGASFGBPAUMRZRRCJFCCOJHJKZVUOCEYSCLXAGDABCEWSUXCILJCGQWI9SF', firstKey, function(e, bundleWithOneSig) {

        var secondKey = aidos.multisig.getKey('FDSAG', 0);

        aidos.multisig.addSignature(bundleWithOneSig, 1, 'JUIFYSUQFVBFGNHOJMLWBHMGASFGBPAUMRZRRCJFCCOJHJKZVUOCEYSCLXAGDABCEWSUXCILJCGQWI9SF', secondKey, function(e, finalBundle) {

            console.log("FINAL BUNDLE", finalBundle);

            console.log(aidos.multisig.validateSignatures(finalBundle, address, 2))
        })
    })
})
