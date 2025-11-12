# AI-Travel-Planner

AI-Travel-Planner 是一个智能旅行规划助手，旨在简化旅行规划过程。通过AI技术了解用户需求，自动生成详细的旅行路线和建议，并提供实时旅行辅助功能，包括地图导航、景点搜索等服务。

## 项目特点

- **智能旅行规划**：基于用户需求自动生成个性化旅行路线
- **地图服务集成**：支持地点搜索、路线规划和实时导航
- **用户友好界面**：简洁直观的操作界面，易于使用
- **前后端分离架构**：采用现代前后端分离设计，确保系统灵活性和可维护性
- **数据持久化**：支持用户数据和旅行计划的保存与管理

## 技术栈

### 前端
- **框架**：React 18.3
- **构建工具**：Vite 4.5
- **路由**：React Router 6.23
- **地图API**：高德地图 JavaScript API 2.0
- **样式**：CSS

### 后端
- **运行环境**：Node.js
- **Web框架**：Express 4.18
- **数据库**：MongoDB 7.4
- **AI集成**：OpenAI API 3.3
- **数据校验**：express-validator 7.0
- **HTTP客户端**：axios 1.13
- **环境变量**：dotenv 16.3

## 环境要求

- **Node.js**：v14.0 或更高版本
- **npm**：v6.0 或更高版本
- **MongoDB**：v4.0 或更高版本
- **高德地图API Key**：需要注册高德开放平台账号获取

## 安装与启动

### 1. 克隆项目

```bash
git clone https://github.com/yourusername/AI-Travel-Planner.git
cd AI-Travel-Planner
```

### 2. 后端设置

#### 2.1 安装后端依赖

```bash
cd backend
npm install
```

#### 2.2 配置环境变量

复制环境变量示例文件并根据需要修改：

```bash
cp .env.example .env
```

编辑 `.env` 文件，填入必要的配置信息：

```
# 服务器配置
PORT=5000

# MongoDB配置
MONGO_URI=mongodb://localhost:27017/ai-travel-planner

# OpenAI API配置（可选）
OPENAI_API_KEY=your_openai_api_key

# CORS配置
CORS_ORIGIN=http://localhost:5173
```

#### 2.3 启动后端服务

**开发模式**（使用nodemon）：

```bash
npm run dev
```

**生产模式**：

```bash
npm start
```

后端服务默认在 `http://localhost:5000` 启动。

### 3. 前端设置

#### 3.1 安装前端依赖

```bash
cd ../frontend
npm install
```

#### 3.2 启动前端开发服务器

```bash
npm run dev
```

前端服务默认在 `http://localhost:5173` 启动。

### 4. 使用Docker启动（可选）

如果您使用Docker，可以利用项目中的docker-compose配置：

```bash
cd ..
docker-compose up -d
```

## 功能使用说明

### 1. 地图功能

1. **配置高德地图API Key**：
   - 访问高德开放平台（https://lbs.amap.com/）注册账号并申请Web端JavaScript API Key
   - 在应用的设置页面输入您的API Key和安全密钥![image-20251112124500760](E:\研一课程\大语言模型辅助软件工程\作业3\AI-Travel-Planner\image-20251112124500760.png)

2. **地点搜索**：
   - 在地图页面输入地点名称
   - 点击"搜索地点"按钮进行搜索
   - 搜索结果将显示在地图上和结果面板中

3. **路线规划**：
   - 搜索到目标地点后，点击"导航到该地点"按钮
   - 系统将规划从当前位置到目标地点的路线![image-20251112124531663](E:\研一课程\大语言模型辅助软件工程\作业3\AI-Travel-Planner\image-20251112124531663.png)

### 2. AI旅行规划

1. 在设置页面配置您的API Key
2. 在主页面选择您的旅行偏好![image-20251112124615682](E:\研一课程\大语言模型辅助软件工程\作业3\AI-Travel-Planner\image-20251112124615682.png)
3. 系统将根据您的偏好生成个性化旅行建议![](E:\研一课程\大语言模型辅助软件工程\作业3\AI-Travel-Planner\image-20251112124638773.png)![image-20251112124714277](E:\研一课程\大语言模型辅助软件工程\作业3\AI-Travel-Planner\image-20251112124714277.png)

## 项目结构

```
AI-Travel-Planner/
├── backend/                  # 后端代码
│   ├── src/                  # 源代码目录
│   │   ├── config/           # 配置文件
│   │   ├── controllers/      # 控制器
│   │   ├── middleware/       # 中间件
│   │   ├── models/           # 数据模型
│   │   ├── routes/           # 路由配置
│   │   ├── services/         # 业务逻辑服务
│   │   └── utils/            # 工具函数
│   ├── .env.example          # 环境变量示例
│   └── package.json          # 后端依赖配置
├── frontend/                 # 前端代码
│   ├── src/                  # 源代码目录
│   │   ├── assets/           # 静态资源
│   │   ├── components/       # React组件
│   │   ├── pages/            # 页面组件
│   │   ├── services/         # API服务
│   │   ├── styles/           # CSS样式
│   │   └── utils/            # 工具函数
│   ├── public/               # 公共资源
│   └── package.json          # 前端依赖配置
└── config/                   # 全局配置
```



## API文档

### 后端API

#### 旅行计划相关
- `GET /api/trips` - 获取所有旅行计划
- `POST /api/trips` - 创建新的旅行计划
- `GET /api/trips/:id` - 获取特定旅行计划
- `PUT /api/trips/:id` - 更新旅行计划
- `DELETE /api/trips/:id` - 删除旅行计划

#### 用户相关
- `POST /api/auth/login` - 用户登录
- `POST /api/auth/register` - 用户注册
- `GET /api/auth/profile` - 获取用户信息

#### AI服务
- `POST /api/ai/generate-plan` - 生成AI旅行计划

### 前端路由

- `/` - 首页
- `/map` - 地图页面
- `/settings` - 设置页面
- `/trips` - 旅行计划列表
- `/trips/:id` - 旅行计划详情

## 注意事项

1. **高德地图API Key**：必须配置有效的Web端JavaScript API Key才能使用地图功能
2. **API调用限制**：某些功能可能受到API调用次数限制
3. **位置权限**：使用定位功能需要浏览器位置权限
4. **环境变量安全**：请勿将包含敏感信息的环境变量提交到代码仓库
5. **Node.js版本**：确保使用推荐的Node.js版本以避免兼容性问题

## 常见问题

### 地图功能无法使用
1. 检查API Key是否正确配置
2. 确认API Key是否已启用Web端服务
3. 检查安全密钥(securityJsCode)是否与API Key匹配

### 后端服务无法启动
1. 检查MongoDB是否正在运行
2. 确认环境变量配置是否正确
3. 查看日志文件了解具体错误信息

## License

MIT License
