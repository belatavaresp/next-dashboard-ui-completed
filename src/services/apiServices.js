import axios from "axios";

const tleLogin = axios.create({
       baseURL: "https://localhost:3001/api",
});

export default tleLogin;