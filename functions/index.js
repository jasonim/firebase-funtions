const functions = require('firebase-functions');

// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions
//
// exports.helloWorld = functions.https.onRequest((request, response) => {
//  response.send("Hello from Firebase!");
// });

// The Firebase Admin SDK to access the Firebase Realtime Database.
const admin = require('firebase-admin');
admin.initializeApp();


// Take the text parameter passed to this HTTP endpoint and insert it into the
// Realtime Database under the path /messages/:pushId/original
exports.addMessage = functions.https.onRequest((req, res) => {
    // Grab the text parameter.
    const original = req.query.text;
    // Push the new message into the Realtime Database using the Firebase Admin SDK.
    return admin.database().ref('/messages').push({original: original}).then((snapshot) => {
        // Redirect with 303 SEE OTHER to the URL of the pushed object in the Firebase console.
        return res.redirect(303, snapshot.ref);
    });
});

// Listens for new messages added to /messages/:pushId/original and creates an
// uppercase version of the message to /messages/:pushId/uppercase
exports.makeUppercase = functions.database.ref('/messages/{pushId}/original').onWrite((event) => {
    // Grab the current value of what was written to the Realtime Database.
    const original = event.data.val();
    console.log('Uppercasing', event.params.pushId, original);
    const uppercase = original.toUpperCase();
    // You must return a Promise when performing asynchronous tasks inside a Functions such as
    // writing to the Firebase Realtime Database.
    // Setting an "uppercase" sibling in the Realtime Database returns a Promise.
    return event.data.ref.parent.child('uppercase').set(uppercase);
});

function updateReffered(admin, uid, level) {
    return admin.database().ref(`users/${uid}/referredBy`)
        .once('value').then(function (data) {
            console.warn("data " + JSON.stringify(data) + " + begin");
            if (!data || level > 3) {
                return data
            }
            var referred_by_somebody = data.val();
            console.log("referred " + referred_by_somebody);



            if (referred_by_somebody) {
                    var moneyRef = admin.database()
                        .ref(`/users/${referred_by_somebody}/score`);

                    return moneyRef.once('value').then(function (data) {
                        console.log("user: " + JSON.stringify(data) + " dl by: " + referred_by_somebody + " level: " + level)

                        if (data) {
                            updateReffered(admin, referred_by_somebody, level + 1)
                            moneyRef.set(data.val() + 1)
                            return (data.val() || 0) + 1
                           //  var scoreRef = admin.database()
                           //      .ref(`/users/${referred_by_somebody}/score`);
                           // return scoreRef.transaction(function (current_value) {
                           //      console.log("score: " + current_value + " by " + referred_by_somebody)
                           //
                           //          updateReffered(admin, referred_by_somebody, level + 1)
                           //
                           //      return (current_value || 0) + 1
                           //  });
                        }

                        return 1;

                    });
            }

            console.log(" updateReffered end " + JSON.stringify(data))
            return data;
        });
}

exports.grantSignupReward = functions.database.ref('/users/{uid}/last_signin_at').onCreate((snap, context) => {
    var uid = context.params.uid;
    console.warn(" context: " + uid);

    return updateReffered(admin, uid, 0)
});