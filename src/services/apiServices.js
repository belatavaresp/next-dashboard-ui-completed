import axios from "axios";

const tleLogin = axios.create({
       baseURL: "https://tle-api.vercel.app/api/",
});

export default tleLogin;