# AI-Travel-Planner 后端

## 项目简介
AI-Travel-Planner 后端是一个基于Node.js和Express构建的RESTful API服务，为前端应用提供数据支持和业务逻辑处理。后端系统负责用户认证、旅行规划数据存储、AI模型集成以及与外部API的交互。

## 技术栈

- **运行环境**：Node.js
- **Web框架**：Express.js
- **数据库**：MongoDB（使用Mongoose ORM）
- **AI集成**：OpenAI API
- **认证授权**：JWT（JSON Web Tokens）
- **API文档**：Swagger/OpenAPI
- **测试框架**：Jest
- **开发工具**：Nodemon（开发热重载）

## 核心功能

1. **用户管理**：注册、登录、个人信息管理
2. **旅行规划**：创建、存储、更新和删除旅行计划
3. **AI分析引擎**：分析用户需求，生成智能旅行建议
4. **外部API集成**：与地图服务、天气服务、景点信息等第三方API交互
5. **数据持久化**：将用户数据、旅行计划等信息存储到MongoDB

## 环境要求

- Node.js 16.x 或更高版本
- npm 8.x 或更高版本 或 Yarn 1.22.x 或更高版本
- MongoDB 4.4 或更高版本（本地或MongoDB Atlas）
- 有效的OpenAI API密钥
- 有效的高德地图API密钥（用于地理位置相关功能）

## 快速开始

### 1. 安装依赖

```bash
# 使用npm
npm install

# 或使用yarn
yarn install
```

### 2. 配置环境变量

在项目根目录创建 `.env` 文件，并添加以下环境变量：

```dotenv
# 服务器配置
PORT=3000
NODE_ENV=development

# 数据库连接信息
MONGODB_URI=mongodb://localhost:27017/ai-travel-planner

# JWT配置
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRES_IN=24h

# OpenAI API配置
OPENAI_API_KEY=your_openai_api_key

# 高德地图API配置
AMAP_API_KEY=your_amap_api_key
AMAP_SECURITY_KEY=your_amap_security_key

# 其他必要的环境变量
```

### 3. 启动开发服务器

```bash
# 使用npm
npm run dev

# 或使用yarn
yarn dev
```

开发服务器默认运行在 http://localhost:3000，并启用热重载功能。

### 4. 启动生产服务器

```bash
# 使用npm
npm start

# 或使用yarn
yarn start
```

### 5. 运行测试

```bash
# 使用npm
npm test

# 或使用yarn
yarn test
```

## 项目结构

```
backend/
├── src/
│   ├── config/          # 配置文件
│   ├── controllers/     # 控制器（处理请求逻辑）
│   ├── middleware/      # 中间件（认证、错误处理等）
│   ├── models/          # 数据模型（Mongoose schemas）
│   ├── routes/          # 路由定义
│   ├── services/        # 业务逻辑层
│   ├── utils/           # 工具函数
│   ├── validators/      # 请求数据验证
│   └── app.js           # 应用主文件
├── tests/               # 测试文件
├── .env.example         # 环境变量示例
├── package.json         # 项目依赖和脚本
└── README.md            # 项目说明文档
```

## API文档

### 认证相关接口

#### 用户注册
- **URL**: `/api/auth/register`
- **方法**: `POST`
- **请求体**:
  ```json
  {
    "username": "string",
    "email": "string",
    "password": "string"
  }
  ```
- **成功响应**:
  ```json
  {
    "status": "success",
    "data": {
      "user": {
        "id": "string",
        "username": "string",
        "email": "string"
      },
      "token": "jwt_token"
    }
  }
  ```

#### 用户登录
- **URL**: `/api/auth/login`
- **方法**: `POST`
- **请求体**:
  ```json
  {
    "email": "string",
    "password": "string"
  }
  ```
- **成功响应**:
  ```json
  {
    "status": "success",
    "data": {
      "user": {
        "id": "string",
        "username": "string",
        "email": "string"
      },
      "token": "jwt_token"
    }
  }
  ```

### 旅行规划相关接口

#### 创建旅行计划
- **URL**: `/api/trips`
- **方法**: `POST`
- **认证**: 需要JWT令牌
- **请求体**:
  ```json
  {
    "destination": "string",
    "startDate": "date",
    "endDate": "date",
    "travelers": number,
    "preferences": {
      "budget": "string",
      "interests": ["string"],
      "accommodation": "string"
    }
  }
  ```
- **成功响应**:
  ```json
  {
    "status": "success",
    "data": {
      "trip": {
        "id": "string",
        "destination": "string",
        "startDate": "date",
        "endDate": "date",
        "travelers": number,
        "preferences": { /* preferences data */ },
        "createdAt": "date"
      }
    }
  }
  ```

#### 获取用户的所有旅行计划
- **URL**: `/api/trips`
- **方法**: `GET`
- **认证**: 需要JWT令牌
- **成功响应**:
  ```json
  {
    "status": "success",
    "data": {
      "trips": [
        {
          "id": "string",
          "destination": "string",
          "startDate": "date",
          "endDate": "date",
          "createdAt": "date"
        }
        // 更多旅行计划...
      ]
    }
  }
  ```

#### 获取单个旅行计划详情
- **URL**: `/api/trips/:id`
- **方法**: `GET`
- **认证**: 需要JWT令牌
- **成功响应**:
  ```json
  {
    "status": "success",
    "data": {
      "trip": {
        "id": "string",
        "destination": "string",
        "startDate": "date",
        "endDate": "date",
        "travelers": number,
        "preferences": { /* preferences data */ },
        "itinerary": [ /* itinerary data */ ],
        "createdAt": "date",
        "updatedAt": "date"
      }
    }
  }
  ```

### AI建议生成接口

#### 生成旅行建议
- **URL**: `/api/ai/generate-suggestions`
- **方法**: `POST`
- **认证**: 需要JWT令牌
- **请求体**:
  ```json
  {
    "tripId": "string",
    "requirements": "string"
  }
  ```
- **成功响应**:
  ```json
  {
    "status": "success",
    "data": {
      "suggestions": {
        "attractions": ["string"],
        "accommodation": ["string"],
        "transportation": ["string"],
        "dailyActivities": [/* activities data */]
      }
    }
  }
  ```

## 数据库模型

### 用户模型 (User)
```javascript
{
  username: String,
  email: String,
  password: String, // 加密存储
  createdAt: Date,
  updatedAt: Date
}
```

### 旅行计划模型 (Trip)
```javascript
{
  userId: ObjectId, // 关联到用户
  destination: String,
  startDate: Date,
  endDate: Date,
  travelers: Number,
  preferences: {
    budget: String,
    interests: [String],
    accommodation: String
  },
  itinerary: [{
    day: Number,
    activities: [{
      time: String,
      activity: String,
      location: String,
      description: String
    }]
  }],
  createdAt: Date,
  updatedAt: Date
}
```

## 开发指南

### 代码规范
- 使用ESLint进行代码质量检查
- 遵循RESTful API设计最佳实践
- 错误处理统一使用错误处理中间件
- 为所有异步操作使用try-catch块或Promise链式调用

### 中间件使用
- 认证中间件：验证用户身份，保护需要认证的路由
- 错误处理中间件：捕获并格式化API错误响应
- 日志中间件：记录请求信息和响应状态

### 数据库操作
- 使用Mongoose进行数据库操作
- 定义明确的Schema和模型关系
- 实现数据验证和默认值

### 安全考虑
- 密码使用bcrypt或Argon2加密存储
- 使用JWT进行无状态认证
- 实现输入验证，防止注入攻击
- 设置适当的CORS策略

## 常见问题

### 数据库连接失败
- 确认MongoDB服务正在运行
- 检查MONGODB_URI环境变量配置是否正确
- 验证MongoDB用户权限

### API密钥错误
- 确认OpenAI和高德地图API密钥配置正确
- 检查API密钥是否过期或被禁用
- 查看API使用配额是否充足

### JWT相关错误
- 确认JWT_SECRET环境变量已设置且不为空
- 验证请求中的Bearer令牌格式是否正确
- 检查令牌是否过期

## 部署说明

### 传统部署
1. 确保服务器上安装了Node.js和MongoDB
2. 上传项目文件到服务器
3. 安装依赖：`npm install --production`
4. 配置环境变量（生产模式）
5. 使用PM2或类似工具启动应用：`pm2 start src/app.js`

### Docker部署

Dockerfile示例：
```dockerfile
FROM node:16-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --production

COPY . .

EXPOSE 3000

CMD ["node", "src/app.js"]
```

Docker Compose示例（docker-compose.yml）：
```yaml
version: '3'

services:
  backend:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - MONGODB_URI=mongodb://mongo:27017/ai-travel-planner
      - JWT_SECRET=your_production_jwt_secret
      - OPENAI_API_KEY=your_production_openai_api_key
      - AMAP_API_KEY=your_production_amap_api_key
    depends_on:
      - mongo

  mongo:
    image: mongo:4.4
    volumes:
      - mongo-data:/data/db

volumes:
  mongo-data:
```

## 贡献指南

1. Fork项目仓库
2. 创建功能分支（`git checkout -b feature/amazing-feature`）
3. 提交更改（`git commit -m 'Add some amazing feature'`）
4. 推送到分支（`git push origin feature/amazing-feature`）
5. 打开Pull Request

## 许可证

本项目采用MIT许可证。