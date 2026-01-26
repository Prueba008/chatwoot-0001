const axios = require("axios");

function cwHeaders() {
  return { api_access_token: process.env.CW_API_TOKEN };
}

async function sendMessage({ accountId, conversationId, content, privateMsg = false }) {
  const url = `${process.env.CW_BASE_URL}/api/v1/accounts/${accountId}/conversations/${conversationId}/messages`;
  await axios.post(
    url,
    { content, message_type: "outgoing", private: !!privateMsg },
    { headers: { ...cwHeaders(), "Content-Type": "application/json" }, timeout: 10000 }
  );
}

module.exports = { sendMessage };
