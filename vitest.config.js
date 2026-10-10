import os from 'os';
import path from 'path';

export default {
  test: {
    env: {
      // Keep test runs from appending to the tracked logs in server/data
      DATA_DIR: path.join(os.tmpdir(), 'khabo-kothay-test-data'),
      TZ: 'Asia/Dhaka',
      APP_CLIENT_TOKEN: 'gulshan_app_secret_token_2026'
    }
  }
};
