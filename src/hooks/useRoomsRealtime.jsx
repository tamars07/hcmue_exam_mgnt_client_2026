import { useEffect, useRef, useState } from 'react';

import { getEcho, roomChannelName } from 'utils/echo';

// ==============================|| REALTIME - GIÁM SÁT CA THI (TIẾN ĐỘ + MẤT KẾT NỐI) ||============================== //
// Join/leave kênh presence-room.{turnCode}.{roomCode} cho từng phòng điểm trưởng đang chọn xem —
// KHÔNG phải nguồn dữ liệu chính, chỉ đẩy tức thời tiến độ + trạng thái kết nối khi có; polling hiện
// có ở pages/chairman/examinees/index.js vẫn là lưới an toàn, không bị đụng vào. Nếu getEcho() trả
// về null (Reverb chưa cấu hình) hoặc join lỗi, hook này im lặng không làm gì cả — connectivity luôn
// rỗng và echoConnected luôn true (không báo giả "mất kết nối" khi thực ra chỉ là chưa bật tính năng).

const useRoomsRealtime = (turnCode, roomCodes, { onProgress } = {}) => {
  const channelsRef = useRef({}); // { [channelName]: channelInstance }
  const onProgressRef = useRef(onProgress);
  onProgressRef.current = onProgress;

  // { [examinee_account]: 'online' | 'offline' } — không có key = chưa có dữ liệu realtime (không
  // phải "chắc chắn online" hay "chắc chắn offline"), ExamineeCard hiển thị "Không rõ" (xám) cho case đó.
  const [connectivity, setConnectivity] = useState({});
  // Trạng thái kết nối CỦA CHÍNH điểm trưởng (không phải của thí sinh) — dùng để phân biệt "mạng của
  // tôi rớt" (phải ẩn hết chấm đỏ, tránh báo giả toàn phòng mất kết nối) với "1 thí sinh cụ thể mất
  // kết nối" (echo của điểm trưởng vẫn sống, chỉ riêng người đó rớt).
  const [echoConnected, setEchoConnected] = useState(true);

  const setAccountStatus = (account, status) => {
    if (!account) return;
    setConnectivity((prev) => (prev[account] === status ? prev : { ...prev, [account]: status }));
  };

  useEffect(() => {
    const echo = getEcho();
    const connection = echo?.connector?.pusher?.connection;
    if (!connection) return undefined;

    const handleStateChange = (states) => setEchoConnected(states.current === 'connected');
    connection.bind('state_change', handleStateChange);
    setEchoConnected(connection.state === 'connected');

    return () => connection.unbind('state_change', handleStateChange);
  }, []);

  useEffect(() => {
    const echo = getEcho();
    if (!echo) return undefined;

    const wantedNames = turnCode ? roomCodes.map((roomCode) => roomChannelName(turnCode, roomCode)) : [];
    const channels = channelsRef.current;

    // Leave các phòng không còn được chọn nữa
    Object.keys(channels).forEach((name) => {
      if (!wantedNames.includes(name)) {
        echo.leave(name);
        delete channels[name];
      }
    });

    // Join các phòng mới được chọn
    wantedNames.forEach((name, index) => {
      if (channels[name]) return;
      const roomCode = roomCodes[index];
      try {
        const channel = echo.join(name);
        channel
          .listen('.progress.updated', (e) => onProgressRef.current?.(roomCode, e))
          .here((members) => {
            (members || []).filter((m) => m.type === 'examinee').forEach((m) => setAccountStatus(m.account, 'online'));
          })
          .joining((member) => {
            if (member?.type === 'examinee') setAccountStatus(member.account, 'online');
          })
          .leaving((member) => {
            // Presence "leaving" = socket vừa đóng (đóng tab, mất mạng, ...) — đây chính là tín hiệu
            // mất kết nối, không phải "không còn dữ liệu" (không xoá khỏi map).
            if (member?.type === 'examinee') setAccountStatus(member.account, 'offline');
          })
          .listenForWhisper('connectivity', (e) => {
            if (e?.account) setAccountStatus(e.account, e.status === 'connected' ? 'online' : 'offline');
          });
        channels[name] = channel;
      } catch (e) {
        // im lặng bỏ qua — polling vẫn là nguồn dữ liệu chính
      }
    });

    return undefined;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [turnCode, JSON.stringify(roomCodes)]);

  useEffect(
    () => () => {
      const echo = getEcho();
      const channels = channelsRef.current;
      if (echo) {
        Object.keys(channels).forEach((name) => echo.leave(name));
      }
      channelsRef.current = {};
    },
    []
  );

  return { connectivity, echoConnected };
};

export default useRoomsRealtime;
