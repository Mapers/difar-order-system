import {io} from "socket.io-client";

const SOCKET_URL = "https://backend-difar.backend-l23.click:3002";

const socket = io(SOCKET_URL, {
    transports: ['websocket', 'polling']
});

export default socket;