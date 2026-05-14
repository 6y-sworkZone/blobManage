# 博客管理系统

基于 React + Golang (Gin) + SQLite 的现代化博客系统。

## 功能特性

- ✅ **Markdown 编辑器** - 支持实时预览和语法高亮
- ✅ **草稿自动保存** - 每 3 秒自动保存，防止内容丢失
- ✅ **文章管理** - 发布、编辑、删除文章，支持草稿/发布状态
- ✅ **分类与标签** - 文章分类管理和标签系统
- ✅ **评论与回复** - 支持嵌套评论回复
- ✅ **搜索功能** - 全文搜索文章标题和内容
- ✅ **后台管理** - 统一管理文章、评论、用户、分类
- ✅ **SEO 友好** - 使用 slug 路由，支持自定义 URL
- ✅ **SQLite 数据库** - 无需额外配置，开箱即用

## 技术栈

### 后端
- **语言**: Go 1.21+
- **框架**: Gin Web Framework
- **数据库**: SQLite3
- **端口**: 57832

### 前端
- **框架**: React 18
- **路由**: React Router 6
- **Markdown**: React Markdown + Remark GFM
- **HTTP**: Axios
- **端口**: 49275

## 快速开始

### 方式一：分别启动

#### 1. 启动后端服务

```bash
cd backend
go mod download
go run .
```

服务将在 http://localhost:57832 启动

#### 2. 启动前端服务

```bash
cd frontend
npm install
npm start
```

服务将在 http://localhost:49275 启动

### 方式二：使用启动脚本（Windows）

```bash
# 后端
cd backend
start.bat

# 前端（新终端）
cd frontend
start.bat
```

## 项目结构

```
blobManage/
├── backend/                 # Go 后端服务
│   ├── main.go             # 主入口和 API 路由
│   ├── db.go               # 数据库初始化和表结构
│   ├── go.mod              # Go 依赖管理
│   └── blog.db             # SQLite 数据库文件（自动生成）
└── frontend/               # React 前端
    ├── src/
    │   ├── index.js        # 入口文件
    │   ├── index.css       # 全局样式
    │   ├── App.js          # 主应用组件
    │   └── pages/          # 页面组件
    │       ├── Home.js         # 首页
    │       ├── ArticleDetail.js # 文章详情
    │       ├── ArticleEditor.js # 文章编辑器
    │       ├── Search.js       # 搜索页面
    │       └── Admin.js        # 后台管理
    ├── public/
    └── package.json
```

## API 接口

### 文章 API
- `GET /api/articles` - 获取文章列表
- `GET /api/articles/:id` - 获取单篇文章
- `GET /api/articles/slug/:slug` - 通过 slug 获取文章
- `POST /api/articles` - 创建文章
- `PUT /api/articles/:id` - 更新文章
- `DELETE /api/articles/:id` - 删除文章

### 分类 API
- `GET /api/categories` - 获取分类列表
- `POST /api/categories` - 创建分类
- `PUT /api/categories/:id` - 更新分类
- `DELETE /api/categories/:id` - 删除分类

### 标签 API
- `GET /api/tags` - 获取标签列表
- `POST /api/tags` - 创建标签
- `DELETE /api/tags/:id` - 删除标签

### 评论 API
- `GET /api/comments` - 获取评论列表
- `POST /api/comments` - 创建评论
- `PUT /api/comments/:id` - 更新评论
- `DELETE /api/comments/:id` - 删除评论

### 用户 API
- `GET /api/users` - 获取用户列表
- `POST /api/users` - 创建用户
- `PUT /api/users/:id` - 更新用户
- `DELETE /api/users/:id` - 删除用户

### 草稿 API
- `GET /api/drafts/:user_id` - 获取用户草稿
- `POST /api/drafts` - 保存草稿
- `DELETE /api/drafts/:user_id` - 删除草稿

### 搜索 API
- `GET /api/search?q=xxx` - 搜索文章

## 默认数据

系统首次启动时会自动创建以下初始数据：

### 默认用户
- 用户名: admin
- 邮箱: a****@**********
- 密码: admin123
- 角色: admin

### 默认分类
- 技术 (tech)
- 生活 (life)
- 随笔 (essay)

### 默认标签
- Go
- React
- 编程

## 使用说明

### 写文章
1. 点击导航栏的「写文章」
2. 输入标题、选择分类、填写摘要
3. 使用 Markdown 编写文章内容
4. 点击「生成」自动创建 SEO 友好的 slug
5. 可以切换「编辑」/「预览」模式查看效果
6. 系统每 3 秒自动保存草稿，无需担心丢失
7. 点击「发布文章」正式发布

### 管理文章
1. 点击导航栏的「管理」
2. 在文章管理中可以查看所有文章
3. 支持编辑和删除操作
4. 可以查看文章状态（草稿/已发布）

### 搜索文章
1. 点击导航栏的「搜索」
2. 输入关键词进行搜索
3. 搜索结果显示匹配的文章

## 开发说明

### 数据库
- 使用 SQLite 嵌入式数据库，无需额外安装
- 数据库文件 `blog.db` 会在首次运行时自动创建
- 所有表结构和初始数据会自动初始化

### CORS
- 后端已配置 CORS 跨域支持
- 前端使用代理转发请求到后端

### 自动保存
- 草稿每 3 秒自动保存一次
- 保存时会显示保存状态提示
- 发布文章后会自动删除对应草稿

## 许可证

MIT
