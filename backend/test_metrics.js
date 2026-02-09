
const fetch = require('node-fetch');

async function testMetrics() {
    try {
        const response = await fetch('http://localhost:5000/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                messages: [
                    { role: "user", content: "I received a lottery winning notification. How do I claim it?" }
                ],
                agent_type: "honeypot"
            })
        });

        const data = await response.json();
        console.log("Response Status:", response.status);
        if (data.engagement_metrics) {
            console.log("SUCCESS: engagement_metrics found!");
            console.log(JSON.stringify(data.engagement_metrics, null, 2));
            if (typeof data.engagement_metrics.turn_count === 'number') {
                console.log("SUCCESS: turn_count is a number");
            } else {
                console.log("FAILURE: turn_count is missing or not a number");
            }
        } else {
            console.log("FAILURE: engagement_metrics missing");
            console.log(JSON.stringify(data, null, 2));
        }

    } catch (error) {
        console.error("Error:", error);
    }
}

testMetrics();
