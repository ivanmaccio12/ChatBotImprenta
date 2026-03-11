const axios = require('axios');

async function testSend() {
    try {
        console.log("Sending manual message to test webhook...");
        const res = await axios.post('http://31.97.31.53:3002/conversations/5493875545567/send', {
            message: 'Hola, esta es una prueba manual desde el sistema'
        });
        console.log("Success:", res.data);
    } catch (err) {
        console.error("Error:", err.response ? err.response.data : err.message);
    }
}
testSend();
