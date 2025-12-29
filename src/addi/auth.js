import axios from "axios";

export const getAddiToken = async () => {
  const res = await axios.post(
    "https://auth.addi.com/oauth/token",
    {
      grant_type: "client_credentials",
      client_id: process.env.ADDI_CLIENT_ID,
      client_secret: process.env.ADDI_CLIENT_SECRET,
      audience: "https://api.addi.com",
    },
    { headers: { "Content-Type": "application/json" } }
  );

  return res.data.access_token;
};
