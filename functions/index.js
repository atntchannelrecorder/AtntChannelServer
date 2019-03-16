const functions = require('firebase-functions');
const admin = require('firebase-admin');
var serviceAccount = require('./atnt-channel-recorder-firebase-adminsdk-jv1s9-dbe961ed32.json');
const express = require('express');


admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://atnt-channel-recorder.firebaseio.com"
});





const appGetChannels = express();
appGetChannels.get('', (req, res) => {
    res.send('Hello world from Firebase 2');
});


exports.helloWorld = functions.https.onRequest(appGetChannels);