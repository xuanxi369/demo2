// 变量绑定
const fileInput = document.getElementById("file-input");
const dropZone = document.getElementById("drag-drop-zone");
const contractText = document.getElementById("contract-text");
const riskCards = document.getElementById("risk-cards");
const chatInput = document.getElementById("chat-input");
const sendChatBtn = document.getElementById("send-chat");
const chatLog = document.getElementById("chat-log");
const statusArea = document.getElementById("status-area");
const togglePreviewBtn = document.getElementById("toggle-preview");
const toggleChatLogBtn = document.getElementById("toggle-chat-log");

let fullContractText = "";
let riskKeywords = [];

// DOM 加载完成后执行
document.addEventListener("DOMContentLoaded", function () {
  // 文件处理
  function handleFile(file) {
    const fileType = file.name.split(".").pop().toLowerCase();

    if (fileType === "txt") {
      const reader = new FileReader();
      reader.onload = function (e) {
        fullContractText = e.target.result;
        showRiskAnalysis(fullContractText);
        updatePreview(fullContractText);
        statusArea.textContent = "✅ 合同已上传（TXT）";
      };
      reader.readAsText(file);
    } else if (fileType === "pdf") {
      const reader = new FileReader();
      reader.onload = async function (e) {
        const typedArray = new Uint8Array(e.target.result);
        const pdf = await pdfjsLib.getDocument({ data: typedArray }).promise;
        let text = "";
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const content = await page.getTextContent();
          text += content.items.map(item => item.str).join(" ") + "\n";
        }
        fullContractText = text;
        showRiskAnalysis(fullContractText);
        updatePreview(fullContractText);
        statusArea.textContent = "✅ 合同已上传（PDF）";
      };
      reader.readAsArrayBuffer(file);
    } else if (fileType === "docx") {
      const reader = new FileReader();
      reader.onload = function (e) {
        mammoth.extractRawText({ arrayBuffer: e.target.result })
          .then(result => {
            fullContractText = result.value;
            showRiskAnalysis(fullContractText);
            updatePreview(fullContractText);
            statusArea.textContent = "✅ 合同已上传（DOCX）";
          })
          .catch(err => {
            statusArea.textContent = "❌ 解析 DOCX 文件失败：" + err.message;
          });
      };
      reader.readAsArrayBuffer(file);
    } else {
      alert("❌ 不支持的文件类型，请上传 .txt、.pdf 或 .docx 格式的合同。");
      statusArea.textContent = "❌ 上传失败：不支持的文件类型";
    }
  }

  // 高亮关键词
  function highlightKeywords(text, keywords) {
    if (!keywords.length) return text;
    const escapedKeywords = keywords.map(k => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
    const pattern = new RegExp(`(${escapedKeywords.join("|")})`, "gi");
    return text.replace(pattern, '<mark>$1</mark>');
  }

  // 预览更新（带高亮）
  function updatePreview(text) {
    const highlighted = highlightKeywords(text, riskKeywords);
    contractText.innerHTML = highlighted || "尚未上传合同";
    contractText.style.maxHeight = "200px";
    togglePreviewBtn.textContent = "展开";
  }

  // 风险提示并提取关键词
  function showRiskAnalysis(text) {
    riskCards.innerHTML = "";
    riskKeywords = [];

    const risks = [
      { keywords: ["试用期"], message: "⚠️ 检测到“试用期”条款，请注意试用期长度、薪资及解除合同条件是否合理。" },
      { keywords: ["赔偿"], message: "⚠️ 检测到“赔偿”条款，请注意赔偿责任是否公平，金额是否过高。" },
      { keywords: ["竞业限制"], message: "⚠️ 检测到“竞业限制”条款，可能限制你离职后的工作自由，请确认范围和补偿。" },
      { keywords: ["保密协议"], message: "⚠️ 检测到“保密协议”条款，请注意保密义务的范围和期限是否合理。" },
      { keywords: ["知识产权"], message: "⚠️ 检测到“知识产权”条款，请确认个人创作的知识产权归属是否被无偿转让。" },
      { keywords: ["违约金"], message: "⚠️ 检测到“违约金”条款，请注意金额是否过高，是否符合法律规定。" },
      { keywords: ["劳动合同期限"], message: "⚠️ 检测到“劳动合同期限”条款，请注意合同期限是否合理，是否存在强制续签。" },
      { keywords: ["工作地点"], message: "⚠️ 检测到“工作地点”条款，请确认工作地点是否明确，是否存在随意调岗风险。" },
      { keywords: ["工作内容"], message: "⚠️ 检测到“工作内容”条款，请注意职责范围是否清晰，避免超负荷工作。" },
      { keywords: ["薪资待遇"], message: "⚠️ 检测到“薪资待遇”条款，请注意薪资构成、支付时间及扣款条款是否透明。" },
      { keywords: ["加班"], message: "⚠️ 检测到“加班”条款，请确认加班费标准及是否强制无偿加班。" },
      { keywords: ["福利待遇"], message: "⚠️ 检测到“福利待遇”条款，请注意社保、公积金等福利是否明确落实。" },
      { keywords: ["解除合同"], message: "⚠️ 检测到“解除合同”条款，请确认解除条件和程序是否公平，是否存在单方解除权。" },
      { keywords: ["争议解决"], message: "⚠️ 检测到“争议解决”条款，请注意争议解决方式和地点是否对你不利。" },
      { keywords: ["不可抗力"], message: "⚠️ 检测到“不可抗力”条款，请确认不可抗力定义及处理方式是否清晰。" },
      { keywords: ["自动续期", "自动续签"], message: "⚠️ 检测到“自动续期”条款，请注意是否明确告知及是否存在单方面续约的风险。" },
      { keywords: ["试用期不合格", "试用期解除"], message: "⚠️ 检测到“试用期解除”条款，请确认解除条件是否模糊或易被滥用。" },
      { keywords: ["调岗", "岗位调整"], message: "⚠️ 检测到“调岗”条款，请注意是否赋予用人单位过大的调岗权利，是否影响薪酬待遇。" },
      { keywords: ["未签订书面合同"], message: "⚠️ 检测到“未签订书面合同”相关表述，请注意入职后应尽快签署书面合同以保障权益。" },
      { keywords: ["培训服务期", "服务期违约金"], message: "⚠️ 检测到“培训服务期”条款，请确认服务期时长与违约责任是否合理。" },
      { keywords: ["工伤责任"], message: "⚠️ 检测到“工伤责任”条款，请注意是否存在推卸法定工伤赔偿责任的表述。" },
      { keywords: ["试用期工资低于标准"], message: "⚠️ 检测到“试用期工资”相关条款，请确认是否低于最低工资标准或未明确工资水平。" },
      { keywords: ["单方变更", "公司有权随时变更"], message: "⚠️ 检测到“单方变更”条款，请注意是否允许公司随意变更合同条款或工作条件。" },
      { keywords: ["劳动关系认定"], message: "⚠️ 检测到“劳动关系认定”相关表述，请警惕是否规避正式劳动关系、转为外包或劳务派遣。" },
      { keywords: ["外包", "派遣"], message: "⚠️ 检测到“外包/派遣”相关条款，请确认你与谁建立劳动关系及其合法性。" },
      { keywords: ["未缴纳社保"], message: "⚠️ 检测到“未缴纳社保”表述，请注意是否违反法律规定，影响未来福利待遇。" },
      { keywords: ["试用期延长", "重新计算试用期"], message: "⚠️ 检测到“试用期延长”条款，请确认是否违反《劳动合同法》规定的最长期限。" },
      { keywords: ["试用期延长", "转正时间延期"], message: "⚠️ 检测到“试用期延长”条款，请确认是否存在无正当理由延长转正时间的情形。" },
      { keywords: ["社保自愿", "自行缴纳社保"], message: "⚠️ 检测到“自行缴纳社保”表述，请注意企业是否违反法定义务转嫁社保责任。" },
      { keywords: ["兼职限制", "不得从事其他工作"], message: "⚠️ 检测到“兼职限制”条款，请确认是否合理限制你的业余时间自由权利。" },
      { keywords: ["试用期不缴社保"], message: "⚠️ 检测到“试用期不缴社保”表述，请注意该行为违反法律规定，影响权益。" },
      { keywords: ["岗位职责以公司安排为准"], message: "⚠️ 检测到“职责以安排为准”类表述，可能导致职责范围不明确，存在临时安排风险。" },
      { keywords: ["保底工资", "绩效工资不达标"], message: "⚠️ 检测到“保底工资”条款，请确认绩效考核标准是否明确，是否以此规避工资义务。" },
      { keywords: ["离职提前通知", "通知期"], message: "⚠️ 检测到“离职通知期”条款，请确认是否超过《劳动合同法》规定的提前30天。" },
      { keywords: ["经济性裁员", "结构调整"], message: "⚠️ 检测到“裁员”相关条款，请注意是否赋予公司单方裁员的自由权利，违反法律程序。" },
      { keywords: ["自愿放弃", "权利放弃声明"], message: "⚠️ 检测到“自愿放弃权利”类条款，请注意是否存在强迫员工放弃法定权利的情况。" },
      { keywords: ["口头通知为准", "公司内部规定优先"], message: "⚠️ 检测到“以口头或内部制度为准”的条款，可能削弱正式合同效力，请谨慎处理。" },
      { keywords: ["公司拥有最终解释权"], message: "⚠️ 检测到“最终解释权归公司所有”条款，可能导致合同不对等，应引起警惕。" },
      { keywords: ["默认同意", "视为同意"], message: "⚠️ 检测到“默认同意”类条款，请注意是否存在未充分告知即推定你同意的风险。" },
      { keywords: ["试用期不合格不予赔偿"], message: "⚠️ 检测到“试用期解除不赔偿”条款，请确认是否依法说明不合格的具体标准。" },
      { keywords: ["绩效考核标准未定", "绩效由公司决定"], message: "⚠️ 检测到“绩效考核不透明”条款，绩效不明确可能影响收入和考核公平性。" },
      { keywords: ["视同自动离职", "视为离职"], message: "⚠️ 检测到“视为自动离职”表述，容易被滥用规避解除程序，请谨慎评估。" },
      { keywords: ["公司安排住宿", "住宿费用自理"], message: "⚠️ 检测到“住宿安排”相关条款，请确认是否存在强制住宿或隐性扣费风险。" },
      { keywords: ["员工须服从安排", "一切解释权归公司"], message: "⚠️ 检测到“绝对服从”或“解释权归公司”表述，可能侵犯员工的平等协商权利。" },
      { keywords: ["协议优先", "补充协议为准"], message: "⚠️ 检测到“协议优先”类条款，请确认是否存在对主合同不利的补充协议内容。" },
      { keywords: ["工资延期", "项目结束后支付"], message: "⚠️ 检测到“工资延期发放”条款，请确认工资发放时间是否违反按月支付规定。" },
      { keywords: ["不属工伤", "自行负责"], message: "⚠️ 检测到“责任自行承担”类表述，存在规避法定工伤赔偿的风险。" },
      { keywords: ["工时由公司决定", "工作时间灵活调整"], message: "⚠️ 检测到“工时由公司安排”条款，请注意是否掩盖无偿加班风险。" },
      { keywords: ["隐私监控", "邮件检查"], message: "⚠️ 检测到“隐私监控”条款，请注意是否侵犯个人通讯及隐私权。" },
      { keywords: ["提前离职须赔偿"], message: "⚠️ 检测到“提前离职需赔偿”表述，请确认是否与实际损失挂钩，是否过度惩罚。" },
      { keywords: ["保底任务", "未完成任务需赔偿"], message: "⚠️ 检测到“保底任务”类条款，请确认任务量是否合理，违约责任是否对等。" },
      { keywords: ["合同解释权归属", "公司解释为准"], message: "⚠️ 检测到“解释权归公司”条款，可能在产生争议时对你不利。" },
      { keywords: ["劳动关系不成立", "合作关系"], message: "⚠️ 检测到“非劳动关系”表述，警惕将正式劳动关系伪装为合作或承揽关系。" },
      { keywords: ["先试岗", "先实习后签约"], message: "⚠️ 检测到“先试岗/实习”类条款，请确认试岗是否存在工资报酬及合法流程。" },
      {
    keywords: ["报价确认单为准", "以甲方签字盖章的报价确认单为准"],
    message: "⚠️ 检测到“单方确认价格”为准的条款，乙方在议价和履约中处于被动地位，存在价格不对等风险。"
  },
  {
    keywords: ["如有不符合的情况，应予以整改或更换，并承担由此产生的相关费用"],
    message: "⚠️ 检测到甲方单方面要求整改并承担费用的条款，建议明确‘不符合’的判定标准和费用责任边界。"
  },
  {
    keywords: ["检测工作应在报价确认单约定期限内完成", "具体进场时间以甲方通知为准"],
    message: "⚠️ 检测到“乙方进场时间完全由甲方通知决定”的条款，乙方履约计划可能受制于甲方临时安排，存在调度及违约风险。"
  },
  {
    keywords: ["甲方委托超出乙方检测范围", "乙方应提前告知甲方分包相关事宜"],
    message: "⚠️ 检测到分包条款未明确分包上限及责任划分，可能引发检测质量争议或责任推诿问题。"
  },
  {
    keywords: ["甲方应在收到乙方发票后7个工作日内一次性结算支付"],
    message: "⚠️ 检测到结算付款期限依赖于甲方签字确认，建议防范甲方拖延付款或拒签风险。"
  },
  {
    keywords: ["检测过程中任何变更，甲方应支付实际工作量费用"],
    message: "⚠️ 检测到“实际工作量”作为结算依据但缺乏具体量化标准，建议防范甲乙双方对‘变更’理解不一致的纠纷。"
  },
  {
    keywords: ["乙方有权停止服务并留置样品、报告及资料"],
    message: "⚠️ 检测到乙方可“留置样品、报告”的表述，建议明确留置范围及归还条件，防止资料流失或纠纷。"
  },
  {
    keywords: ["按应付金额千分之一的标准收取违约金"],
    message: "⚠️ 检测到对甲方逾期付款违约金条款，缺少对乙方延迟履约的对等约束，违约责任不对等。"
  },
  {
    keywords: ["争议提交原告所在地法院"],
    message: "⚠️ 检测到“争议提交原告所在地”条款，容易造成地域管辖不公，建议明确仲裁机构或中立法院。"
  },
  {
    keywords: ["附件为合同一部分", "具有同等法律效力"],
    message: "⚠️ 检测到附件文件具法律效力的表述，建议防范附件信息随意修改未同步更新主合同的法律风险。"
  },
  {
    keywords: ["廉政合同", "纪检监察员负责监督"],
    message: "⚠️ 检测到“保廉合同”类内容，建议确认其对合同履约流程是否构成额外审批或延误。"
  },
  {
    keywords: ["报价确认单为准", "签字盖章的报价单为准"],
    message: "⚠️ 检测到“报价确认单为合同依据”的条款，请确认该附件是否明确、是否存在甲方单方面变更风险。"
  },
  {
    keywords: ["检测工作应在报价确认单约定期限内完成", "以甲方通知为准"],
    message: "⚠️ 检测到“履约时间由甲方通知决定”的条款，请注意是否存在进场时间不确定、影响履约计划的风险。"
  },
  {
    keywords: ["甲方发现不符合要求应整改", "整改费用由乙方承担"],
    message: "⚠️ 检测到“整改费用由乙方承担”的条款，请确认不符合判定标准是否明确，避免承担无责任风险。"
  },
  {
    keywords: ["分包需甲方同意", "分包检测项目须提前报备"],
    message: "⚠️ 检测到“分包须经批准”条款，请注意是否限制乙方灵活履约能力，并注意分包责任划分是否清晰。"
  },
  {
    keywords: ["付款条件为甲方签字确认", "结算需发票和确认单"],
    message: "⚠️ 检测到“付款依赖甲方签字”条款，请注意是否存在甲方拖延签字从而延迟付款的风险。"
  },
  {
    keywords: ["如检测项目调整，应补差价", "额外工作另行计费"],
    message: "⚠️ 检测到“调整另计费用”条款，请注意费用核算标准是否具体，是否存在收费争议空间。"
  },
  {
    keywords: ["乙方可留置报告", "停止服务并留置资料"],
    message: "⚠️ 检测到“乙方可留置报告”类条款，请确认其合法性及是否说明返还机制，避免资料被滞留影响项目交付。"
  },
  {
    keywords: ["违约金为应付款千分之一", "逾期付款每日加收千分之一"],
    message: "⚠️ 检测到“逾期付款违约金”条款，请注意是否与《合同法》规定相符，以及是否缺乏对乙方违约的对等约束。"
  },
  {
    keywords: ["争议由原告所在地法院处理"],
    message: "⚠️ 检测到“争议按原告所在地管辖”条款，请注意是否可能导致一方诉讼成本不合理增加，存在地域不公正。"
  },
  {
    keywords: ["附件具有同等法律效力", "以附件为准"],
    message: "⚠️ 检测到“附件为合同组成部分”条款，请注意附件是否内容完整、是否存在模糊性或未经确认即生效的风险。"
  },
  {
    keywords: ["保密协议另行签署", "签署廉政合同"],
    message: "⚠️ 检测到“需签署额外协议”条款，请确认是否存在附加义务未在主合同明确，可能单方解释执行。"
  },
  {
    keywords: ["如发生不可抗力，双方应协商解决"],
    message: "⚠️ 检测到“不可抗力”条款，请确认不可抗力的定义、流程和免责范围是否清晰，避免后续履约争议。"
  }
    ];

    const detectedRisks = risks.filter(risk =>
      risk.keywords.some(keyword => text.toLowerCase().includes(keyword.toLowerCase()))
    );

    riskKeywords = detectedRisks.flatMap(r => r.keywords);

    if (detectedRisks.length > 0) {
      const box = document.createElement("div");
      box.className = "risk-box";
      const list = document.createElement("ul");
      detectedRisks.forEach(r => {
        const item = document.createElement("li");
        item.textContent = r.message;
        list.appendChild(item);
      });
      box.appendChild(list);
      riskCards.appendChild(box);
    } else {
      const noRisk = document.createElement("p");
      noRisk.className = "no-risk";
      noRisk.textContent = "未发现明显风险条款";
      riskCards.appendChild(noRisk);
    }
  }

  // 拖拽上传
  dropZone.addEventListener("dragover", e => {
    e.preventDefault();
    dropZone.style.borderColor = "#005a9e";
  });
  dropZone.addEventListener("dragleave", () => {
    dropZone.style.borderColor = "#999";
  });
  dropZone.addEventListener("drop", e => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
    dropZone.style.borderColor = "#999";
  });

  // 文件选择上传
  fileInput.addEventListener("change", e => {
    const file = e.target.files[0];
    if (file) handleFile(file);
  });

  // 展开/收起合同预览区
  togglePreviewBtn.addEventListener("click", () => {
    if (contractText.style.maxHeight === "200px" || contractText.style.maxHeight === "") {
      contractText.style.maxHeight = "none";
      togglePreviewBtn.textContent = "收起";
    } else {
      contractText.style.maxHeight = "200px";
      togglePreviewBtn.textContent = "展开";
    }
  });

  // AI对话功能（核心逻辑）
  sendChatBtn.addEventListener("click", async () => {
    const userMessage = chatInput.value.trim();
    if (!userMessage || !fullContractText) {
      alert("请输入问题并上传合同文本");
      return;
    }

    const userBubble = document.createElement("p");
    userBubble.textContent = "🧑 你：" + userMessage;
    chatLog.appendChild(userBubble);

    chatInput.value = "";
    statusArea.textContent = "🤖 AI 正在思考中...";

    try {
      const response = await fetch("https://contractgpt-worker.millychck-033.workers.dev", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contract: fullContractText, question: userMessage })
      });

      const data = await response.json();
      const answer = data.choices?.[0]?.message?.content || "未返回任何内容";

      // ✅ 分段显示 AI 回答
      const aiBubble = document.createElement("div");
      aiBubble.classList.add("ai-response");

      const segments = answer.split(/\n\s*\n|(?=^\s*[①②③\d]+\.)|(?=^\s*[-·•])/gm);
      segments.forEach(seg => {
        if (seg.trim()) {
          const para = document.createElement("p");
          para.textContent = seg.trim();
          aiBubble.appendChild(para);
        }
      });

      chatLog.appendChild(aiBubble);
      chatLog.scrollTop = chatLog.scrollHeight;
      statusArea.textContent = "✅ 分析完成，欢迎继续提问";
    } catch (err) {
      const errorBubble = document.createElement("p");
      errorBubble.textContent = "❌ 出错了：" + err.message;
      chatLog.appendChild(errorBubble);
      statusArea.textContent = "❌ 请求失败，请检查网络或后端服务状态";
    }
  });

  // 展开/收起 AI 对话区（注释掉）
  // toggleChatLogBtn.addEventListener("click", () => {
  //   const currentMax = chatLog.style.maxHeight;
  //   if (!currentMax || currentMax === "250px") {
  //     chatLog.style.maxHeight = "none";
  //     toggleChatLogBtn.textContent = "收起";
  //   } else {
  //     chatLog.style.maxHeight = "250px";
  //     toggleChatLogBtn.textContent = "展开";
  //   }
  // });

  // 实时更新时间
  function updateCurrentTime() {
    const now = new Date();
    const options = {
      year: "numeric", month: "long", day: "numeric",
      hour: "2-digit", minute: "2-digit", second: "2-digit",
      timeZoneName: "short"
    };
    document.getElementById("current-time").textContent =
      `当前时间：${now.toLocaleString("zh-CN", options)}`;
  }
  setInterval(updateCurrentTime, 1000);
  updateCurrentTime();
});
