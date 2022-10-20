# About

Scripts taken from https://github.com/hsjoberg/blixt-wallet/blob/master/contrib/service-image/ for creating images to be used as payment method icons.

# How to use

1. Run `cd Icons` and `./gen-webp.sh` to generate the WebP files to used
2. Run `cd Icons` and `./gen-code.sh` to generate code to either be used in react js source files
3. Copy/Paste and replace the dict from `frontend/src/components/PaymentMethods/Icons/code/code.js` to `frontend/src/components/PaymentMethods/Icons/index.js`
4. Add the new entry to `paymentMethods` or `swapMethods` array in `frontend/src/components/PaymentMethods/MethodList.js`

# Trademarks belong to their respective owners

All services names, trademarks and registered trademarks / copyrights are properties of their respective owners. All company, product and service names used in the Robotic Satoshis Open Source Project are for identification purposes only. Use of these names, trademarks / copyrights and brands does not imply endorsement or association. If you own any of the trademarks and want to remove it from the Robotic Satoshis Open Source Project you can file a claim and it will be promptly processed.
