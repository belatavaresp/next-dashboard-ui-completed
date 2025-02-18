import axios from "axios";

const tleLogin = axios.create({
       baseURL: "http://localhost:3001/api",
});

export default tleLogin;