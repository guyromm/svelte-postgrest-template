import io from 'socket.io-client';
import { getCookie } from '../../../common/postgrest.js';

let _socket = null;
const getSocket = () => {
  if (!_socket) {
    _socket = io(import.meta.env.VITE_SITE_SOCKETIO_URI, {
      auth: {
        token: typeof document !== 'undefined' ? getCookie() : null
      }
    });
  }
  return _socket;
};

let subscribers = {};

getSocket().on('update', async (payload) => {
  const parsedPayload = JSON.parse(payload.message.payload);
  const payloadChannel = payload.message.channel;
  Object.entries(subscribers).forEach(([subscriber, { channels, callback }]) => {
    if (channels.includes(payloadChannel)) {
      callback(parsedPayload);
    }
  });
});

export const subscribe = async ({ subscriber, channels, callback }) => {
  subscribers[subscriber] = { channels, callback };
};
