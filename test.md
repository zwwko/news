## 运行说明
```bash
export https_proxy=http://127.0.0.1:8118
export http_proxy=http://127.0.0.1:8118
npm run capture
# 只重跑指定站点
npm run capture -- --date 2026-07-01 --sites bbc,cnn
```