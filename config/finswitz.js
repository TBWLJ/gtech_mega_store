import axios from "axios";

const finswitz = axios.create({
  baseURL: "https://api.finswitz.com",
  headers: {
    Authorization: `Bearer ${process.env.FINSWITZ_API_KEY}`,
    "Content-Type": "application/json",
  },
});

export default finswitz;
