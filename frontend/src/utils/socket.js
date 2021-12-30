import io from "socket.io-client";
import { BASE_URL } from "./consts";

export default io(BASE_URL);
