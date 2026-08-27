"use client";

import { useState } from "react";

export default function RecoveryCodesCard({ codes, title = "保存你的恢复码", description = "忘记密码时，可使用任意一个恢复码设置新密码。每个代码只能使用一次。", onDone }: { codes: string[]; title?: string; description?: string; onDone?: () => void }) {
  const [copyLabel, setCopyLabel] = useState("复制全部");
  const content = [`IELTS PASS 恢复码`, "", ...codes, "", "请勿分享给他人；每个恢复码只能使用一次。"].join("\n");

  const copyCodes = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopyLabel("已复制");
      window.setTimeout(() => setCopyLabel("复制全部"), 1800);
    } catch {
      setCopyLabel("复制失败，请手动保存");
    }
  };

  const downloadCodes = () => {
    const url = URL.createObjectURL(new Blob([content], { type: "text/plain;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "ielts-pass-recovery-codes.txt";
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <section className="recovery-codes-card">
      <header><span>ACCOUNT RECOVERY</span><h2>{title}</h2><p>{description}</p></header>
      <div className="recovery-code-grid" aria-label="一次性账号恢复码">{codes.map((code) => <code key={code}>{code}</code>)}</div>
      <div className="recovery-code-warning"><strong>重要</strong><p>恢复码不会再次完整显示。请下载或复制后存放在密码管理器等安全位置，不要发送给任何人。</p></div>
      <div className="recovery-code-actions"><button type="button" onClick={() => void copyCodes()}>{copyLabel}</button><button type="button" onClick={downloadCodes}>下载文本</button>{onDone && <button type="button" className="is-primary" onClick={onDone}>我已安全保存，继续 →</button>}</div>
    </section>
  );
}
