import Echo from 'laravel-echo';
import Pusher from 'pusher-js';

import axiosServices from './axios';

// ==============================|| REALTIME (LARAVEL REVERB) ||============================== //
// Lớp tăng cường real-time (tiến độ/thời gian/mất kết nối) — KHÔNG phải nguồn dữ liệu chính, mọi
// nơi dùng getEcho() phải tự chịu được trường hợp trả về null (chưa cấu hình REACT_APP_REVERB_*)
// hoặc kết nối/join lỗi, và im lặng bỏ qua — polling/cơ chế hiện có vẫn phải hoạt động đúng độc lập.

let echoInstance = null;

export const getEcho = () => {
  if (!process.env.REACT_APP_REVERB_APP_KEY) return null;
  if (echoInstance) return echoInstance;

  echoInstance = new Echo({
    broadcaster: 'reverb',
    client: new Pusher(process.env.REACT_APP_REVERB_APP_KEY, {
      wsHost: process.env.REACT_APP_REVERB_HOST,
      wsPort: process.env.REACT_APP_REVERB_PORT || 80,
      wssPort: process.env.REACT_APP_REVERB_PORT || 443,
      forceTLS: (process.env.REACT_APP_REVERB_SCHEME || 'https') === 'https',
      enabledTransports: ['ws', 'wss'],
      cluster: '',
      // authorizer tuỳ chỉnh (thay vì header tĩnh lúc khởi tạo) để luôn dùng axiosServices hiện có
      // — token mới nhất tự lấy qua interceptor sẵn có, không cần tự đọc lại localStorage ở đây.
      authorizer: (channel) => ({
        authorize: (socketId, callback) => {
          axiosServices
            .post('api/broadcasting/auth', { socket_id: socketId, channel_name: channel.name })
            .then((res) => callback(false, res.data))
            .catch((err) => callback(true, err));
        }
      })
    })
  });

  return echoInstance;
};

export const disconnectEcho = () => {
  echoInstance?.disconnect();
  echoInstance = null;
};

// Laravel không cho placeholder trong tên kênh broadcast chứa dấu chấm (regex nội bộ tách theo
// "."), nhưng council_turn_code/room_code ở hệ thống này luôn có dấu chấm (vd "HCMUE.C.201") — phải
// thay "." bằng "-" khi dựng tên kênh, khớp đúng App\Support\RoomChannel::encode() phía backend.
// Dùng "-" (không phải ký tự khác) vì pusher-php-server tự giới hạn tên kênh theo /^[-a-zA-Z0-9_=@,.;]+$/.
export const roomChannelName = (turnCode, roomCode) =>
  `room.${String(turnCode).replace(/\./g, '-')}.${String(roomCode).replace(/\./g, '-')}`;
