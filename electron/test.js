const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');
const axios = require('axios');

// Replace these with your actual values
const privateKeyPath = path.join(__dirname, 'AuthKey_W3259GRPML.p8'); // Path to your .p8 file
const keyId = 'W3259GRPML'; // Your 10-character Key ID
const teamId = 'SRJJDF6WDH'; // Your Apple Developer Team ID
const issuerId = 'a0594958-e05d-4abe-8df8-9a4fad11c86a'

// Read the private key from the .p8 file
const privateKey = fs.readFileSync(privateKeyPath, 'utf8');

// Define the JWT payload
const payload = {
    iss: issuerId,
    exp: Math.floor(Date.now() / 1000) + (60 * 10), // Token valid for 10 minutes
    aud: 'appstoreconnect-v1'
};

// Sign the token
const token = jwt.sign(payload, privateKey, {
    algorithm: 'ES256',
    header: {
        alg: 'ES256',
        kid: keyId,
        typ: 'JWT'
    }
});

// console.log('JWT Token:', token);


const jwtToken = token
const submissionId = '8d3a1aa9-ab4a-4c98-925a-96a308a03197' // '337eea1e-24d7-4b6b-8556-ba50e0714dd9' // '9f95561a-4177-4ca9-9674-4b8bb51bc8f1'; // Your notarization submission ID


// Define the API endpoint for checking the notarization status
let url = `https://appstoreconnect.apple.com/notary/v2/submissions/${submissionId}`;

// Make the GET request to check the notarization status
axios.get(url, {
    headers: {
        'Authorization': `Bearer ${jwtToken}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    }
})
    .then(response => {
        console.log('Notarization Status:', response.data.data.attributes.status);

        if (response.data.data.attributes.status !== 'In Progress') {
            url = `https://appstoreconnect.apple.com/notary/v2/submissions/${submissionId}/logs`;

            axios.get(url, {
                headers: {
                    'Authorization': `Bearer ${jwtToken}`,
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                }
            })
                .then(response => {
                    url = response.data.data.attributes.developerLogUrl;
                    axios.get(url).then(response => {

                        console.log(response.data, 'NOT pending logs')
                    });
                });
        }
        // console.log(response.data)
    })
    .catch(error => {
        console.error('Error checking notarization status:', error.response ? error.response.data : error.message);
    });
