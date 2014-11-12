// var frisby = require('frisby'),
// server = require('../app').server;

// frisby.create('Call redis post')
//     .post(
//         'http://localhost:3000/redis', {
//             id: 'testresid',
//             port: 6380
//         }
//     )
//     .expectStatus(200)
//     .expectBodyContains('receive ok!')
//     .after(function() {
//         server.close();
//     })
//     .toss();

// .expectHeaderContains('content-type', 'application/json')
// .expectJSON('0', {
//     place: function(val) {
//         expect(val).toMatchOrBeNull("Oklahoma City, OK");
//     }, // Custom matcher callback
//     user: {
//         verified: false,
//         location: "Oklahoma City, OK",
//         url: "http://brightb.it"
//     }
// })
// .expectJSONTypes('0', {
//     id_str: String,
//     retweeted: Boolean,
//     in_reply_to_screen_name: function(val) {
//         expect(val).toBeTypeOrNull(String);
//     }, // Custom matcher callback
//     user: {
//         verified: Boolean,
//         location: String,
//         url: String
//     }
// })
