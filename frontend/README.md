# AI-Travel-Planner 前端

## 项目简介
AI-Travel-Planner 前端是一个基于React和Vite构建的现代化Web应用，为用户提供智能旅行规划服务。本前端应用负责用户交互界面，包括旅行需求输入、路线展示、地图交互等核心功能。

## 技术栈

- **框架**：React 18.3.1
- **构建工具**：Vite 4.5.3
- **路由**：React Router DOM 6.23.0
- **HTTP客户端**：Axios（用于API请求）
- **地图服务**：高德地图API
- **样式方案**：CSS-in-JS（如styled-components）或CSS Modules
- **开发工具**：ESLint 9.36.0

## 核心功能

1. **智能旅行需求分析**：用户输入旅行需求，AI自动生成详细规划
2. **交互式地图**：集成高德地图，支持地点搜索和路径规划
3. **旅行路线展示**：可视化展示生成的旅行路线和景点信息
4. **实时旅行辅助**：提供天气、交通等实时信息
5. **响应式设计**：适配不同设备屏幕尺寸

## 环境要求

- Node.js 18.x 或更高版本
- npm 9.x 或更高版本 或 Yarn 1.22.x 或更高版本
- 现代浏览器（Chrome、Firefox、Safari、Edge）

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
# 后端API地址
VITE_API_BASE_URL=http://localhost:3000/api

# 高德地图API密钥
VITE_AMAP_API_KEY=your_amap_api_key
VITE_AMAP_SECURITY_KEY=your_amap_security_key

# 其他必要的环境变量
```

### 3. 启动开发服务器

```bash
# 使用npm
npm run dev

# 或使用yarn
yarn dev
```

开发服务器默认运行在 http://localhost:5173

### 4. 构建生产版本

```bash
# 使用npm
npm run build

# 或使用yarn
yarn build
```

构建产物将生成在 `dist` 目录中。

### 5. 预览生产版本

```bash
# 使用npm
npm run preview

# 或使用yarn
yarn preview
```

## 项目结构

```
frontend/
├── public/              # 静态资源文件
├── src/
│   ├── assets/          # 图片、图标等资源
│   ├── components/      # 可复用组件
│   ├── pages/           # 页面组件
│   ├── hooks/           # 自定义React hooks
│   ├── services/        # API服务和工具函数
│   ├── context/         # React Context（状态管理）
│   ├── utils/           # 通用工具函数
│   ├── styles/          # 全局样式
│   ├── App.jsx          # 应用入口组件
│   ├── main.jsx         # 应用渲染入口
│   └── routes.jsx       # 路由配置
├── .eslintrc.js         # ESLint配置
├── vite.config.js       # Vite配置
├── package.json         # 项目依赖和脚本
└── README.md            # 项目说明文档
```

## 主要组件和页面

### 页面组件
- **首页**：展示应用介绍和主要功能入口
- **旅行规划页**：用户输入旅行需求并查看规划结果
- **地图页**：交互式地图展示和路径规划
- **个人中心**：用户信息和历史规划管理

### 核心组件
- **MapPage**：集成高德地图的主要地图组件
- **PlaceSearch**：地点搜索组件
- **RoutePlanner**：路线规划组件
- **TravelCard**：旅行信息卡片组件
- **WeatherWidget**：天气信息组件

## 开发指南

### 代码规范
- 使用ESLint进行代码质量检查
- 遵循React最佳实践和组件化开发模式
- 组件命名使用PascalCase，工具函数使用camelCase
- 为重要组件和函数添加JSDoc注释

### 地图API使用
- 地图API密钥通过环境变量配置
- 使用`window.AMap.securityJsCode`传递安全密钥
- 地图插件加载和初始化需要考虑密钥加载的时序问题

### API调用
- 所有API调用通过`src/services/api.js`统一管理
- 使用Axios拦截器处理请求/响应和错误
- API调用时应添加适当的错误处理和加载状态

## 常见问题

### 地图不显示或API错误
- 确认环境变量中的API密钥配置正确
- 检查浏览器控制台是否有相关错误信息
- 确保网络连接正常，API可以正常访问

### 开发服务器启动失败
- 确保Node.js版本符合要求
- 尝试删除`node_modules`和`package-lock.json`后重新安装依赖
- 检查端口是否被占用，可以通过`npm run dev -- --port 其他端口`更改端口

## 部署说明

### 静态资源部署
1. 执行`npm run build`生成生产版本
2. 将`dist`目录中的文件部署到静态文件服务器（如Nginx、GitHub Pages等）
3. 配置服务器正确处理路由（特别是SPA应用的history模式路由）

### Docker部署
可以使用以下Dockerfile构建Docker镜像：

```dockerfile
# 构建阶段
FROM node:18-alpine as builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# 生产阶段
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

## 贡献指南

1. Fork项目仓库
2. 创建功能分支（`git checkout -b feature/amazing-feature`）
3. 提交更改（`git commit -m 'Add some amazing feature'`）
4. 推送到分支（`git push origin feature/amazing-feature`）
5. 打开Pull Request

## 许可证

本项目采用MIT许可证。
