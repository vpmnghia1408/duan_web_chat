import axios from "axios";

const API_URL = "http://localhost:5001/api/friends";

export const friendService = {
  async getFriends() {
    const res = await axios.get(API_URL, { withCredentials: true });
    return res.data;
  },
};
