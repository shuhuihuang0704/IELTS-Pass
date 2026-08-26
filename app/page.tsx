const todaySteps = [
  { label: "词汇", detail: "12 个场景词", state: "current" },
  { label: "听力", detail: "Section 1 精听", state: "next" },
  { label: "口语", detail: "AI 房东对话", state: "next" },
  { label: "阅读", detail: "租房广告 · 5 题", state: "next" },
];

export default function Home() {
  return (
    <main className="app-shell">
      <aside className="side-rail">
        <div className="brand-lockup">
          <span className="brand-mark">IA</span>
          <span><strong>IELTS AI</strong><small>Your daily English flow</small></span>
        </div>

        <nav className="desktop-nav" aria-label="主导航">
          <a className="is-active" href="#today"><span>01</span>今天</a>
          <a href="#practice"><span>02</span>专项练习</a>
          <a href="#scene"><span>03</span>AI 场景</a>
          <a href="#review"><span>04</span>复习</a>
          <a href="#profile"><span>05</span>我的</a>
        </nav>

        <div className="weekly-rail-progress">
          <span>本周目标</span><strong>162 / 260 分钟</strong><div><i /></div>
        </div>
      </aside>

      <section className="workspace" id="today">
        <header className="topbar">
          <div><p>DAY 06 · 距离考试还有 86 天</p><h1>把今天，练成一句<span>流利的英语。</span></h1></div>
          <button className="profile-button" aria-label="打开个人中心">LI</button>
        </header>

        <div className="dashboard-grid">
          <section className="scene-stage" id="scene">
            <div className="scene-watermark" aria-hidden="true">RENT<br />LIFE</div>
            <div className="scene-heading"><span>SCENE 04 · LONDON</span><span>约 15 分钟</span></div>
            <h2>第一次<br />在英国租房</h2>
            <p>一段真实场景，串联四项能力</p>
            <div className="voice-orb" aria-hidden="true"><i /><b>AI</b></div>

            <div className="learning-path" aria-label="今日场景学习路径">
              {todaySteps.map((step, index) => (
                <div className={step.state === "current" ? "path-step is-current" : "path-step"} key={step.label}>
                  <span>{index + 1}</span><strong>{step.label}</strong><small>{step.detail}</small>
                </div>
              ))}
            </div>

            <button className="primary-action">从词汇开始 <span>→</span></button>
          </section>

          <aside className="progress-panel" aria-label="学习进度">
            <div className="progress-intro">
              <span>今日完成度</span><strong>42<small>%</small></strong>
              <div className="progress-track"><i /></div><p>再完成 3 项，就达成今天的计划。</p>
            </div>
            <div className="streak-row">
              <span className="streak-mark">6</span><span><strong>连续学习 6 天</strong><small>本周已学习 162 分钟</small></span>
            </div>
            <div className="memory-row" id="review">
              <span><strong>记忆回流</strong><small>18 个词 · 3 个听错句</small></span><button>7 分钟 →</button>
            </div>
          </aside>
        </div>
      </section>

      <nav className="mobile-nav" aria-label="移动端主导航">
        <a className="is-active" href="#today">今天</a><a href="#practice">专项</a><a className="mobile-ai" href="#scene">AI</a><a href="#review">复习</a><a href="#profile">我的</a>
      </nav>
    </main>
  );
}
