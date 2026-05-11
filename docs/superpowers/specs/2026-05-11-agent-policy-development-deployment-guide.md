# Agent Policy Center 开发与部署指导

本文用于在宿主机上启动、验证和继续开发 Agent Policy Center。当前方案已经确定为：

```text
React + Ant Design 前端
        |
        v
Java 21 + Spring Boot Policy Center
        |
        v
Rust Cedar PDP Sidecar
```

说明：CedarJava 在 Windows 上存在 native/JNI 兼容性风险，本项目第一版不再把 Cedar 嵌入 Java 进程，而是由 Rust PDP 使用官方 Cedar Rust crate 执行真实授权判断。Java 后端只负责策略管理、评估编排和审计。

## 1. 项目结构

项目目录：

```powershell
C:\projects\agent-policy
```

主要模块：

```text
backend   Java Policy Center，提供策略 CRUD 与评估 API
pdp       Rust Cedar PDP Sidecar，提供 /health 与 /evaluate
frontend  React + Vite + Ant Design 管理界面
docs      产品与技术方案文档
```

## 2. 环境检查

在宿主机 PowerShell 执行：

```powershell
cd C:\projects\agent-policy

git --version
java -version
mvn -version
rustc --version
cargo --version
node -v
npm -v
```

期望：

- Java 使用 JDK 21。
- Maven 可用。
- Rust/Cargo 可用。
- Node/npm 可用。

## 3. 一次性安装与构建

### 3.1 后端

```powershell
cd C:\projects\agent-policy\backend
mvn test
mvn package -DskipTests
```

成功标准：

```text
BUILD SUCCESS
```

### 3.2 Rust PDP

```powershell
cd C:\projects\agent-policy\pdp
cargo test
cargo build
```

成功标准：

```text
test result: ok
```

### 3.3 前端

```powershell
cd C:\projects\agent-policy\frontend
npm install
npm test
npm run build
```

说明：前端使用 Vite，开发时会把 `/api` 代理到 `http://localhost:8080`。

## 4. 本地开发启动顺序

建议开三个 PowerShell 窗口，按顺序启动。

### 4.1 启动 Rust PDP

窗口 1：

```powershell
cd C:\projects\agent-policy\pdp
cargo run
```

默认监听：

```text
http://127.0.0.1:8180
```

健康检查：

```powershell
Invoke-RestMethod -Uri http://127.0.0.1:8180/health
```

期望返回：

```text
ok
```

如果要改 PDP 端口：

```powershell
$env:PDP_BIND_ADDR = "127.0.0.1:8181"
cargo run
```

同时需要让 Java 后端指向新地址，见 4.2。

### 4.2 启动 Java 后端

窗口 2：

```powershell
cd C:\projects\agent-policy\backend
mvn spring-boot:run
```

默认后端地址：

```text
http://127.0.0.1:8080
```

后端默认调用 PDP：

```text
http://localhost:8180
```

如果 PDP 使用了非默认地址：

```powershell
mvn spring-boot:run "-Dspring-boot.run.arguments=--agent-policy.cedar.endpoint=http://localhost:8181"
```

后端健康式验证：

```powershell
Invoke-RestMethod -Uri http://127.0.0.1:8080/api/policies
```

期望返回 JSON 数组，首次启动通常是空数组：

```json
[]
```

### 4.3 启动前端

窗口 3：

```powershell
cd C:\projects\agent-policy\frontend
npm run dev
```

打开：

```text
http://127.0.0.1:5173
```

页面应显示：

- `Agent Policy Center`
- `策略管理与 Cedar 授权判断`
- `刷新`
- `新建策略`
- 策略列表表格

## 5. 快速 API 验证

### 5.1 创建策略

```powershell
$policy = @{
  name = "允许 Alice 查看照片"
  description = "本地验证策略"
  policyType = "ADMIN"
  cedarText = "permit(principal == User::`"Alice`", action == Action::`"view`", resource == Photo::`"alice_photo`");"
} | ConvertTo-Json

Invoke-RestMethod `
  -Method Post `
  -Uri http://127.0.0.1:8080/api/policies `
  -ContentType "application/json" `
  -Body $policy
```

### 5.2 查询策略

```powershell
Invoke-RestMethod -Uri http://127.0.0.1:8080/api/policies
```

记录返回结果里的 `id`，后续评估可以指定 `policyIds`。

### 5.3 启用策略

新建策略默认是 `DRAFT`，评估接口只使用已启用策略。把上一节返回的 `id` 替换到命令中：

```powershell
$policyId = "替换为策略ID"
Invoke-RestMethod -Method Post -Uri "http://127.0.0.1:8080/api/policies/$policyId/enable"
```

### 5.4 通过 Java 后端发起授权判断

```powershell
$request = @{
  principal = "User::`"Alice`""
  action = "Action::`"view`""
  resource = "Photo::`"alice_photo`""
  context = @{}
  entities = @()
  policyIds = @($policyId)
} | ConvertTo-Json -Depth 10

Invoke-RestMethod `
  -Method Post `
  -Uri http://127.0.0.1:8080/api/evaluations `
  -ContentType "application/json" `
  -Body $request
```

期望核心结果：

```json
{
  "decision": "ALLOW",
  "matchedPolicies": ["policy0"],
  "errors": []
}
```

### 5.5 直接验证 PDP

如果怀疑 Java 后端到 PDP 的链路有问题，可以直接调用 PDP：

```powershell
$pdpBody = @{
  policies = @("permit(principal == User::`"Alice`", action == Action::`"view`", resource == Photo::`"alice_photo`");")
  principal = "User::`"Alice`""
  action = "Action::`"view`""
  resource = "Photo::`"alice_photo`""
  context = @{}
  entities = @()
} | ConvertTo-Json -Depth 10

Invoke-RestMethod `
  -Method Post `
  -Uri http://127.0.0.1:8180/evaluate `
  -ContentType "application/json" `
  -Body $pdpBody
```

期望：

```json
{
  "decision": "Allow",
  "matched_policies": ["policy0"],
  "errors": []
}
```

## 6. 常见问题排查

### 6.1 端口被占用

```powershell
Get-NetTCPConnection -LocalPort 8080 -ErrorAction SilentlyContinue
Get-NetTCPConnection -LocalPort 8180 -ErrorAction SilentlyContinue
Get-NetTCPConnection -LocalPort 5173 -ErrorAction SilentlyContinue
```

如果端口被旧进程占用，可以在确认进程属于本项目后停止它：

```powershell
Stop-Process -Id <PID>
```

### 6.2 前端请求失败

先确认后端可访问：

```powershell
Invoke-RestMethod -Uri http://127.0.0.1:8080/api/policies
```

再确认 Vite 代理配置存在：

```powershell
Get-Content C:\projects\agent-policy\frontend\vite.config.ts
```

其中应包含：

```ts
proxy: {
  '/api': 'http://localhost:8080',
}
```

### 6.3 授权判断总是 DENY

重点检查：

- 策略是否已经 `enable`。
- `principal/action/resource` 字符串是否是 Cedar EntityUid 格式，例如 `User::"Alice"`。
- Cedar 策略里的实体类型和请求里的实体类型是否一致。
- `policyIds` 是否指定了正确的策略 ID。
- PDP 是否已启动并监听 `8180`。

### 6.4 后端启动慢

在 Codex 沙箱内，Spring Boot 启动和健康检查可能明显慢于宿主机。建议以宿主机 PowerShell 的实际结果为准。

如果只是快速开发前端，可以先确认：

```powershell
Invoke-RestMethod -Uri http://127.0.0.1:8080/api/policies
```

该命令能返回结果后，再打开前端页面验证。

## 7. 当前已实现能力

后端：

- 策略创建、查询、更新、删除。
- 策略启用、停用。
- 通过 HTTP 调用 Rust PDP 做 Cedar 授权判断。
- 评估结果审计查询。

PDP：

- `GET /health`
- `POST /evaluate`
- 使用官方 `cedar-policy` Rust crate 执行真实 Cedar 判断。

前端：

- 策略列表。
- 新建策略抽屉。
- 通过 Vite 代理调用后端 API。

下一步开发重点：

- 前端补齐策略编辑、启停、删除。
- 前端增加策略判断页面。
- 后端增加更完整的策略版本和错误提示。
- 补 Agent 使用 MCP 工具、Skill、子 Agent 的示例策略模板。

## 8. 推荐反馈给开发的信息

如果你在宿主机验证失败，请把以下信息贴回来：

```powershell
java -version
mvn -version
rustc --version
cargo --version
node -v
npm -v
```

以及失败命令对应的完整错误输出，尤其是：

- PDP 启动失败日志。
- 后端启动失败日志。
- `/api/evaluations` 返回的 `errors` 字段。
- 浏览器 Network 面板里失败请求的响应体。
