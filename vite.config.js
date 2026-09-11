import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths';

// ==============================|| VITE CONFIG ||============================== //
// Thay cho CRA/react-scripts. `tsconfigPaths()` đọc baseUrl trong jsconfig.json để giữ nguyên kiểu
// import tuyệt đối (vd `import MainCard from 'components/MainCard'`) không cần alias thủ công.
// `PORT` giữ đúng convention cũ (start-all-services.bat set PORT trước khi gọi `npm start`).

export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  server: {
    host: '127.0.0.1',
    port: Number(process.env.PORT) || 3001,
    allowedHosts: ['ems.hcmue.edu.vn']
  },
  preview: {
    port: Number(process.env.PORT) || 3001
  },
  build: {
    outDir: 'build',
    sourcemap: false
  }
});
