<p align="center">
  <img src="./public/og.png" alt="IELTS AI — 从真实场景，练到雅思 7.0" width="100%" />
</p>

<h1 align="center">IELTS Pass</h1>

<p align="center">
  一款以真实场景串联词汇、听力、口语和阅读的跨端雅思学习应用。
  <br />
  手机随时学，电脑深度练；每次错误都会回到下一次复习。
</p>

<p align="center">
  <img alt="React 19" src="https://img.shields.io/badge/React-19-6257DC?style=flat-square" />
  <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-strict-6257DC?style=flat-square" />
  <img alt="Responsive" src="https://img.shields.io/badge/Mobile%20%2B%20Desktop-responsive-23866C?style=flat-square" />
  <img alt="Status" src="https://img.shields.io/badge/MVP-testable-CF694C?style=flat-square" />
</p>

## 为什么做这个产品

多数雅思工具把词汇、听力、口语和阅读拆成四座孤岛。IELTS Pass 采用另一条路径：让同一个真实场景贯穿四项能力，并把练习结果统一进入进度与复习系统。

例如在「第一次在英国租房」场景中，用户会依次：

1. 先用 5 × 20 的节奏快速眼熟 100 个雅思高频词，再听写 `deposit`、`furnished`、`utilities` 等场景核心词。
2. 精听一段租房咨询并完成题目。
3. 进入 Speaking Part 3，与 AI 考官围绕住房与城市进行更抽象的双向讨论。
4. 阅读原创 Academic Passage，完成段落标题匹配、信息匹配、单选、判断与摘要填空。
5. 自动复习本次答错的单词和表达。

## 当前可以测试什么

- **场景学习路径**：词汇 → 听力 → 口语 → 阅读。
- **每日 100 词**：从 300 词高频核心库中按日期轮换，分成 5 组快速辨认，自动保存当日进度。
- **三档学习队列**：按“认识 / 模糊 / 不熟悉”判断；点击认识后先核对中文含义，可确认进入下一词，也可点“记错了”让它重新进入本轮和间隔复习。
- **自适应间隔复习**：需要强化的词按 1、3、7、14、30、60 天递增安排；复习时再次模糊或遗忘会缩短间隔并记录遗忘次数。
- **80 词场景听写**：8 × 10 词分组，覆盖住宿、出行、教育、健康、工作、环境、服务和活动场景。
- **盲听后揭晓**：场景听写检查前隐藏中文、拼写和例句，检查后揭晓；拼错内容自动进入复习。
- **自然语流加练**：24 个高频词组覆盖连读、弱读、合音、失爆和辅音群简化，并提供自然与慢速播放。
- **电脑打字记词**：听音拼写、Enter 检查、提示、例句发音。
- **Listening Section 1 套题**：原创双人生活场景对话，包含表格填空、多选、匹配和单选，共 10 题；真实音频播放器支持拖动定位、暂停、继续和从头重播。
- **口语 Part 3 模拟**：点击开始后考官才用语音提问，字幕默认隐藏，听不懂时可以显示字幕或重听当前问题；保留 4–5 分钟结构、短回答追问和展开提示。
- **Academic Reading 套题**：原创长文配段落标题匹配、信息匹配、单选、判断和摘要填空，共 11 题。
- **每周真题计划**：周二阅读、周四听力、周六 L/R/W 全真模考、周日口语与错题复盘；直接链接 IELTS 官方公开样题，也支持使用用户自己购买的 Cambridge IELTS 真题册并记录完成进度。
- **进度激励**：今日完成度、连续学习、本周时长、各项完成状态。
- **严格完成判定**：专项必须完成全部必做内容后才打勾；词汇需同时完成每日 100 词与 80 词听写。
- **记忆回流**：词汇错误自动进入复习，掌握后可以移出。
- **本地持久化**：刷新浏览器后保留学习记录。
- **响应式布局**：同一套功能适配手机与电脑，但使用不同信息布局。

> 当前考官回复和回答展开提示使用可替换的本地逻辑，目的是在没有 API 密钥时也能测试考试流程；它不会冒充官方 IELTS 评分。正式 AI 模型、账号和跨设备云同步属于下一阶段。
>
> 当前词库不是《雅思词汇真经》的电子化版本：该书只作为“3600+ 核心词、22 个主题”的产品规模参考，本项目没有其完整词表或再分发授权。APP 内每张卡片会标注来源层级；学术高频层依据 Academic Word List（AWL）的频率分层，中文释义与搭配由项目独立整理。
>
> 真题模块只链接 [IELTS 官方 Academic 样题](https://ielts.org/take-a-test/preparation-resources/sample-test-questions/academic-test) 并保存训练记录。Cambridge IELTS 等商业题库必须由用户自行购买；本项目不复制、托管或分发其题目正文、音频与答案。

词汇选取依据：

- [IELTS 官方词汇备考建议](https://ielts.org/news-and-insights/how-to-address-vocabulary-in-an-ielts-preparation-course)：建议雅思学术类考生结合 GSL、AWL、AVL 等频率词表学习。
- [Academic Word List 研究](https://ir.wgtn.ac.nz/items/8f852b22-3f82-427e-b0b3-8d9c954d8e61)：570 个词族来自 350 万词学术语料库，并按出现范围、频率和均匀度筛选。
- 《雅思词汇真经》ISBN `978-7-5213-0455-8`：仅参考公开的规模与主题信息，不复制书中词表、释义或例句。

## 本地运行

### 环境要求

- Node.js `>= 22.13.0`
- npm `>= 10`
- 推荐使用 Chrome 测试语音识别

### 启动开发版本

```bash
git clone git@github.com:shuhuihuang0704/IELTS-Pass.git
cd IELTS-Pass
npm install
npm run dev
```

打开 [http://localhost:3000](http://localhost:3000)。

### 验证质量

```bash
npm test
npm run lint
npm run build
```

## 推荐测试路线

1. 在首页点击「每日高频词」，翻开词义并分别标记“认识”和“还不熟”。
2. 确认首页显示今日词汇进度，标记为不熟的词进入「复习」。
3. 切换到「场景听写」，输入错误和正确单词，确认 Enter 可以提交。
4. 切换到听力，完成 4 道填空、选两项的多选、2 道匹配和 2 道单选，再打开原文复盘。
5. 切换到口语 Part 3，用文字或麦克风回答考官；先提交一个很短的回答，检查考官追问，再提交完整回答。
6. 完成阅读的 11 道混合题型，查看每题正误和总分。
7. 刷新页面，确认进度仍然存在。
8. 进入「专项练习」查看每周真题计划，打开官方样题并在完成后记录。
9. 缩小浏览器宽度，检查手机端底部导航和练习布局。

## 技术结构

```text
app/
├── IeltsApp.tsx        # 应用导航、四项练习与进度交互
├── learning-data.ts    # 场景语料、题目和词汇
├── learning-state.ts   # 学习状态、持久化合并与完成度计算
├── globals.css         # 跨端视觉系统与响应式布局
├── layout.tsx          # 产品元数据与分享卡片
└── page.tsx            # 应用入口

tests/
└── rendered-html.test.mjs
```

技术栈：React 19、TypeScript、vinext、Vite、Cloudflare Workers / Sites。

## 产品原则

- **真实进度，不制造虚假成长**：能力变化必须来自已完成的练习。
- **AI 服务学习闭环**：AI 用于互动、反馈和个性化，不替代可靠内容。
- **跨端但不简单放大**：手机强调随时学习，电脑强调键盘和完整做题。
- **错误是学习资产**：错词、错句和错题必须能够再次出现。
- **内容与模型解耦**：未来更换 AI 服务时，不重做学习流程和数据结构。

## Roadmap

- [x] 响应式应用外壳与品牌视觉
- [x] 租房场景的词汇、听力、口语、阅读闭环
- [x] 300 词高频核心库、每日轮换 100 词、5 × 20 分组进度和错词回流
- [x] Academic Reading 混合题型与 Speaking Part 3 考官式讨论
- [x] 80 词场景听写与 Listening Section 1 十题混合套题
- [ ] 将可核验词库扩展到 570 个 AWL 词族和更多雅思场景词
- [ ] 获得商业教材授权后再导入对应词表；未授权内容不得标注为教材来源
- [x] 进度激励和浏览器本地持久化
- [x] 自动构建测试与社交分享封面
- [x] IELTS 官方公开样题周计划与正版真题册训练记录
- [ ] 接入真实 AI 对话与结构化口语反馈
- [ ] 用户登录与手机、电脑进度同步
- [ ] 扩充雅思题型和人工审核场景语料
- [ ] 模考、写作与能力趋势报告
- [ ] 小范围真实用户测试和订阅体系

更完整的分阶段计划见 [PRODUCT_PLAN.md](./PRODUCT_PLAN.md)。

## 数据与隐私

当前 MVP 不上传录音或学习数据。进度存储在浏览器 `localStorage` 中，用户可以在「我的」页面随时重置。接入云端和真实 AI 前，需要补充明确的隐私政策、数据保留期限和删除机制。

---

<p align="center">
  <strong>IELTS Pass</strong><br />
  Learn one scene. Build four skills.
</p>
