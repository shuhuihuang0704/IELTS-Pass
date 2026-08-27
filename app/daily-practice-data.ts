import {
  listeningExercise,
  listeningReviewEvidence,
  readingExercise,
  readingReviewEvidence,
  speakingScenario,
} from "./learning-data";

export type ListeningEvidenceKey = "l1" | "l2" | "l3" | "l4" | "facilities" | "l7" | "l8" | "l9" | "l10";
type ListeningExercise = {
  title: string;
  subtitle: string;
  script: string;
  formCompletion: { id: string; label: string; answers: string[] }[];
  multipleSelect: { prompt: string; options: string[]; answers: string[] };
  matching: {
    prompt: string;
    options: { id: string; label: string }[];
    questions: { id: string; label: string; answer: string }[];
  };
  multipleChoice: { id: string; prompt: string; options: string[]; answer: string }[];
};
type ListeningReviewEvidence = Record<ListeningEvidenceKey, { quote: string; trap: string; improvement: string }>;
type DailyListeningSet = {
  code: string;
  exercise: ListeningExercise;
  evidence: ListeningReviewEvidence;
  audioSrc: string;
  captionsSrc: string;
  voiceLabel: string;
  audioCues: Record<ListeningEvidenceKey, { startSeconds: number; endSeconds: number }>;
};

type ReadingExercise = {
  title: string;
  subtitle: string;
  paragraphs: { label: string; text: string }[];
  headings: { id: string; text: string }[];
  matchingHeadings: { id: string; paragraph: string; answer: string }[];
  matchingInformation: { id: string; prompt: string; answer: string }[];
  multipleChoice: { id: string; prompt: string; options: string[]; answer: string }[];
  trueFalseNotGiven: { id: string; prompt: string; options: string[]; answer: string }[];
  summary: {
    instruction: string;
    wordBank: string[];
    textBeforeFirstGap: string;
    textBetweenGaps: string;
    textAfterSecondGap: string;
    questions: { id: string; answer: string }[];
  };
};
type ReadingReviewEvidence = Record<string, {
  location: string;
  quotes: readonly { readonly paragraph: string; readonly text: string }[];
  explanation: string;
  method: string;
}>;
type DailyReadingSet = { code: string; exercise: ReadingExercise; evidence: ReadingReviewEvidence };

type SpeakingScenario = {
  title: string;
  part: string;
  duration: string;
  opening: string;
  questions: string[];
  goals: string[];
};

export type DailyPracticeBand = 6 | 7 | 8;

function dailyRotationIndex(dayKey: string, length: number) {
  const dayNumber = Math.floor(new Date(`${dayKey}T00:00:00Z`).getTime() / 86_400_000);
  return ((dayNumber % length) + length) % length;
}

function difficultyRotationIndex(dayKey: string, length: number, band: DailyPracticeBand) {
  return (dailyRotationIndex(dayKey, length) + band - 6) % length;
}

const artsCentreListening: DailyListeningSet = {
  code: "Daily Set B",
  audioSrc: "/listening-arts-centre.wav",
  captionsSrc: "/listening-arts-centre.vtt",
  voiceLabel: "英国女课程顾问 × 英国男学员",
  audioCues: {
    l1: { startSeconds: 8, endSeconds: 12 }, l2: { startSeconds: 14, endSeconds: 18 },
    l3: { startSeconds: 18, endSeconds: 25 }, l4: { startSeconds: 27, endSeconds: 34 },
    facilities: { startSeconds: 37, endSeconds: 48 }, l7: { startSeconds: 51, endSeconds: 57 },
    l8: { startSeconds: 51, endSeconds: 57 }, l9: { startSeconds: 60, endSeconds: 66 },
    l10: { startSeconds: 66, endSeconds: 73 },
  },
  exercise: {
    title: "Community Arts Centre Course Booking",
    subtitle: "Listening Section 1 · Daily Set B",
    script: "Coordinator: Good afternoon, Riverside Arts Centre. Caller: Hello. I'd like to book an evening course. Coordinator: Of course. Can I take your surname? Caller: Patel, P A T E L. Coordinator: Which course interests you? Caller: I first considered photography, but I'd prefer pottery. Coordinator: The pottery course starts on the sixth of November, not the fourth as shown in the old leaflet. Caller: That's fine. Coordinator: The full fee is eighty-five pounds. The ninety-five-pound figure includes an optional exhibition ticket. Caller: What is included? Coordinator: All basic materials are included, and students may use the evening studio without extra charge. Tools can be hired, refreshments are sold downstairs, and parking costs four pounds. Caller: How will I receive the timetable? Coordinator: We'll email it this afternoon. Your membership card must be collected at reception. Caller: What time does the class begin? Coordinator: At six thirty. The building opens at six and the tutor arrives at six fifteen. Caller: Perfect. I chose this centre because the classes are small, so I should receive more feedback. Coordinator: I'll reserve your place now.",
    formCompletion: [
      { id: "l1", label: "Surname", answers: ["patel"] },
      { id: "l2", label: "Course chosen", answers: ["pottery"] },
      { id: "l3", label: "Starting date", answers: ["6 november", "6th november", "november 6", "november 6th"] },
      { id: "l4", label: "Course fee", answers: ["85 pounds", "£85", "85"] },
    ],
    multipleSelect: {
      prompt: "Which TWO things are included without an extra charge?",
      options: ["Tools", "Refreshments", "Basic materials", "Parking", "Evening studio access"],
      answers: ["Basic materials", "Evening studio access"],
    },
    matching: {
      prompt: "How will the learner receive each item?",
      options: [{ id: "A", label: "through the online portal" }, { id: "B", label: "at reception" }, { id: "C", label: "by email" }],
      questions: [{ id: "l7", label: "course timetable", answer: "C" }, { id: "l8", label: "membership card", answer: "B" }],
    },
    multipleChoice: [
      { id: "l9", prompt: "What time does the pottery class begin?", options: ["6:00 p.m.", "6:15 p.m.", "6:30 p.m."], answer: "6:30 p.m." },
      { id: "l10", prompt: "Why did the caller choose Riverside Arts Centre?", options: ["Its classes are small.", "It offers free parking.", "Its building is new."], answer: "Its classes are small." },
    ],
  },
  evidence: {
    l1: { quote: "Caller: Patel, P A T E L.", trap: "姓氏只出现一次，并立刻逐字母拼写。", improvement: "听到 surname 后马上记录字母组 P-A-T-E-L，再整体检查一次。" },
    l2: { quote: "I first considered photography, but I'd prefer pottery.", trap: "photography 是最初考虑的课程，but 后的 pottery 才是最终选择。", improvement: "课程选择题要等 prefer、decide、actually 等最终决定信号。" },
    l3: { quote: "starts on the sixth of November, not the fourth as shown in the old leaflet.", trap: "fourth 是旧传单中的错误日期，并被 not 明确否定。", improvement: "日期题给两个数字分别加标签，保留被确认的 sixth，划掉被否定的 fourth。" },
    l4: { quote: "The full fee is eighty-five pounds. The ninety-five-pound figure includes an optional exhibition ticket.", trap: "95 英镑包含可选门票，题目问的是课程本身费用。", improvement: "金额题要把 base fee 与 optional extra 分开记录。" },
    facilities: { quote: "All basic materials are included, and students may use the evening studio without extra charge.", trap: "tools、refreshments 和 parking 都被提到，但需要另付费。", improvement: "只选择与 included 或 without extra charge 直接对应的项目。" },
    l7: { quote: "We'll email it this afternoon.", trap: "it 指代前一句的 timetable。", improvement: "匹配题要追踪代词指代，把 timetable 与 email 绑定。" },
    l8: { quote: "Your membership card must be collected at reception.", trap: "membership card 的领取地点由 must be collected 明确给出。", improvement: "记录名词与动作搭配：card—collected—reception。" },
    l9: { quote: "At six thirty. The building opens at six and the tutor arrives at six fifteen.", trap: "6:00 是开门时间，6:15 是老师到达时间，6:30 才是上课时间。", improvement: "为每个时间写上事件标签后，再按 begin 选择。" },
    l10: { quote: "I chose this centre because the classes are small, so I should receive more feedback.", trap: "原因由 because 直接引出，与停车或建筑新旧无关。", improvement: "原因题优先追踪 because 后面的完整信息。" },
  },
};

const wildlifeListening: DailyListeningSet = {
  code: "Daily Set C",
  audioSrc: "/listening-wildlife-volunteer.wav",
  captionsSrc: "/listening-wildlife-volunteer.vtt",
  voiceLabel: "英国女志愿者主管 × 英国男申请者",
  audioCues: {
    l1: { startSeconds: 8, endSeconds: 12 }, l2: { startSeconds: 14, endSeconds: 21 },
    l3: { startSeconds: 23, endSeconds: 26 }, l4: { startSeconds: 28, endSeconds: 31 },
    facilities: { startSeconds: 31, endSeconds: 43 }, l7: { startSeconds: 45, endSeconds: 49 },
    l8: { startSeconds: 49, endSeconds: 54 }, l9: { startSeconds: 56, endSeconds: 62 },
    l10: { startSeconds: 63, endSeconds: 71 },
  },
  exercise: {
    title: "Wildlife Park Volunteer Registration",
    subtitle: "Listening Section 1 · Daily Set C",
    script: "Supervisor: Good morning, Northwood Wildlife Park. Applicant: Hello. I'm calling about the volunteer programme. Supervisor: May I have your surname? Applicant: Morgan, M O R G A N. Supervisor: When can you start? Applicant: The twenty-second of March. I had planned the twentieth, but I have an exam that day. Supervisor: Which area would you prefer? Applicant: The visitor centre, rather than the cafe. Supervisor: Do you have any relevant training? Applicant: Yes, a first-aid certificate. Supervisor: Volunteers receive free lunch and a bus pass for each working day. A uniform is provided after the trial month. Accommodation and bicycle hire aren't available. Applicant: How should I send my photograph? Supervisor: Upload it through the online form. Please ask your two referees to email their references directly. Applicant: What is the earliest morning shift? Supervisor: It begins at seven thirty. Staff meet at seven, but volunteers arrive half an hour later. Applicant: Great. I'm especially interested in the bird survey because I want practical field experience before university. Supervisor: I'll send the details today.",
    formCompletion: [
      { id: "l1", label: "Surname", answers: ["morgan"] },
      { id: "l2", label: "Starting date", answers: ["22 march", "22nd march", "march 22", "march 22nd"] },
      { id: "l3", label: "Preferred work area", answers: ["visitor centre", "visitor center"] },
      { id: "l4", label: "Certificate held", answers: ["first aid", "first-aid"] },
    ],
    multipleSelect: {
      prompt: "Which TWO benefits does every volunteer receive?",
      options: ["Accommodation", "Free lunch", "Uniform", "Bus pass", "Bicycle hire"],
      answers: ["Free lunch", "Bus pass"],
    },
    matching: {
      prompt: "How should each document be provided?",
      options: [{ id: "A", label: "through the online form" }, { id: "B", label: "in person" }, { id: "C", label: "by email" }],
      questions: [{ id: "l7", label: "photograph", answer: "A" }, { id: "l8", label: "references", answer: "C" }],
    },
    multipleChoice: [
      { id: "l9", prompt: "What is the earliest volunteer start time?", options: ["7:00 a.m.", "7:30 a.m.", "8:00 a.m."], answer: "7:30 a.m." },
      { id: "l10", prompt: "Why is the applicant interested in the bird survey?", options: ["He wants field experience.", "He studies bird photography.", "He knows the survey leader."], answer: "He wants field experience." },
    ],
  },
  evidence: {
    l1: { quote: "Applicant: Morgan, M O R G A N.", trap: "姓氏通过逐字母拼写确认。", improvement: "按 M-O-R-G-A-N 分组记录，并留意中间的 G。" },
    l2: { quote: "The twenty-second of March. I had planned the twentieth, but I have an exam that day.", trap: "20 March 是原计划，22 March 才是最终开始日期。", improvement: "听到 had planned 与 but 时，等待后续最终安排。" },
    l3: { quote: "The visitor centre, rather than the cafe.", trap: "cafe 被 rather than 排除。", improvement: "把 rather than 前后的选择分别标为保留与排除。" },
    l4: { quote: "Yes, a first-aid certificate.", trap: "题干问 training，录音用 certificate 给出具体内容。", improvement: "预测空格需要培训或证书名称，并检查 first-aid 的拼写。" },
    facilities: { quote: "Volunteers receive free lunch and a bus pass for each working day.", trap: "uniform 要试用期后才提供，住宿与自行车租赁不提供。", improvement: "多选题要核对 every volunteer 这一限定范围。" },
    l7: { quote: "Upload it through the online form.", trap: "it 指 photograph，而不是后面的 references。", improvement: "先锁定对象 photograph，再记录动作 upload online。" },
    l8: { quote: "ask your two referees to email their references directly.", trap: "references 由推荐人直接邮件发送。", improvement: "听清动作执行者和文件对象，避免与 photograph 的方式互换。" },
    l9: { quote: "It begins at seven thirty. Staff meet at seven, but volunteers arrive half an hour later.", trap: "7:00 是员工集合时间，不是志愿者开始时间。", improvement: "区分 staff 与 volunteers 两个主体，再选择对应时间。" },
    l10: { quote: "because I want practical field experience before university.", trap: "真正原因是获得实地经验，其他选项未被提到。", improvement: "抓住 because 后的目标 practical field experience。" },
  },
};

const listeningSets: DailyListeningSet[] = [
  {
    code: "Daily Set A",
    exercise: listeningExercise,
    evidence: listeningReviewEvidence,
    audioSrc: "/listening-section-1-v2.wav?voices=uk-female-male-v3",
    captionsSrc: "/listening-section-1.vtt?voices=uk-female-male-v3",
    voiceLabel: "英国女接待员 × 英国男学生",
    audioCues: {
      l1: { startSeconds: 12, endSeconds: 16 }, l2: { startSeconds: 18, endSeconds: 24 },
      l3: { startSeconds: 24, endSeconds: 32 }, l4: { startSeconds: 32, endSeconds: 39 },
      facilities: { startSeconds: 39, endSeconds: 56 }, l7: { startSeconds: 59, endSeconds: 65 },
      l8: { startSeconds: 65, endSeconds: 70 }, l9: { startSeconds: 73, endSeconds: 81 },
      l10: { startSeconds: 80, endSeconds: 89 },
    },
  },
  artsCentreListening,
  wildlifeListening,
];

const librariesReading: DailyReadingSet = {
  code: "Daily Set B",
  exercise: {
    title: "Why Libraries Are Lending More Than Books",
    subtitle: "Academic Reading · Daily Set B",
    paragraphs: [
      { label: "A", text: "Public libraries were once defined mainly by the books stored on their shelves. Digital media has not made those buildings irrelevant, but it has changed what many residents expect from them. Some branches now describe their purpose as providing access to useful knowledge and resources, whether those resources are printed, digital or physical. This broader interpretation has encouraged a growing number of libraries to lend objects as well as books." },
      { label: "B", text: "The collections vary with local demand. One library may offer sewing machines and repair tools, while another lends musical instruments, telescopes or kits for measuring household energy use. These services allow people to try an activity before buying expensive equipment and help neighbours avoid purchasing items they will rarely use. Workshops often accompany the loans, so a drill or camera becomes a starting point for learning rather than simply a free object." },
      { label: "C", text: "Object lending creates practical difficulties. Staff must inspect every item when it is returned, replace missing parts and decide when damaged equipment is no longer safe. Storage requires more space than a row of books, and unusual objects are expensive to catalogue. Demand can also be uneven: a popular carpet cleaner may have a long waiting list while another tool remains untouched. Libraries therefore need reliable maintenance budgets and clear borrowing rules." },
      { label: "D", text: "Supporters say success should be judged by more than the number of loans. They ask whether the collection reaches residents who could not otherwise afford the equipment and whether workshops build useful skills. Several systems now consult community groups before buying new objects and place smaller collections in neighbourhood branches rather than only in a central building. The aim is to make practical resources available to a wider range of people." },
    ],
    headings: [
      { id: "i", text: "Why printed books will disappear" }, { id: "ii", text: "Different objects serving practical purposes" },
      { id: "iii", text: "A wider definition of a familiar institution" }, { id: "iv", text: "The operational demands of object lending" },
      { id: "v", text: "Commercial competition between libraries" }, { id: "vi", text: "Measuring and widening community benefit" },
    ],
    matchingHeadings: [{ id: "hA", paragraph: "A", answer: "iii" }, { id: "hB", paragraph: "B", answer: "ii" }, { id: "hC", paragraph: "C", answer: "iv" }, { id: "hD", paragraph: "D", answer: "vi" }],
    matchingInformation: [{ id: "m1", prompt: "a way for users to avoid buying rarely used equipment", answer: "B" }, { id: "m2", prompt: "a safety check carried out after a loan", answer: "C" }],
    multipleChoice: [{ id: "mc1", prompt: "What is the main purpose of the passage?", options: ["To argue that libraries should stop buying books", "To describe the value, challenges and fair distribution of object lending", "To compare the prices of household tools", "To promote one particular library system"], answer: "To describe the value, challenges and fair distribution of object lending" }],
    trueFalseNotGiven: [
      { id: "tf1", prompt: "Every library lends the same types of objects.", options: ["True", "False", "Not Given"], answer: "False" },
      { id: "tf2", prompt: "Research has proved that object lending improves long-term employment rates.", options: ["True", "False", "Not Given"], answer: "Not Given" },
    ],
    summary: { instruction: "Choose ONE WORD from the box for each answer.", wordBank: ["equipment", "maintenance", "employment", "advertising"], textBeforeFirstGap: "Object libraries help people access expensive ", textBetweenGaps: " without buying it. However, returned items require inspection and reliable ", textAfterSecondGap: " budgets.", questions: [{ id: "s1", answer: "equipment" }, { id: "s2", answer: "maintenance" }] },
  },
  evidence: {
    hA: { location: "A 段第 3–4 句", quotes: [{ paragraph: "A", text: "Some branches now describe their purpose as providing access to useful knowledge and resources, whether those resources are printed, digital or physical." }], explanation: "A 段把图书馆从藏书场所扩展为提供多种资源的机构，对应 iii。", method: "匹配标题时抓定义变化，而不是只看 digital media。" },
    hB: { location: "B 段第 1–3 句", quotes: [{ paragraph: "B", text: "The collections vary with local demand." }, { paragraph: "B", text: "These services allow people to try an activity before buying expensive equipment and help neighbours avoid purchasing items they will rarely use." }], explanation: "本段列举多种物品及其用途，对应 ii。", method: "把例子归纳为上位概念：different objects and practical purposes。" },
    hC: { location: "C 段第 1、5 句", quotes: [{ paragraph: "C", text: "Object lending creates practical difficulties." }, { paragraph: "C", text: "Libraries therefore need reliable maintenance budgets and clear borrowing rules." }], explanation: "首句提出困难，后文讨论检查、存储、编目和维护，对应 iv。", method: "用段首主题句统领后续多个操作细节。" },
    hD: { location: "D 段第 1、4 句", quotes: [{ paragraph: "D", text: "Supporters say success should be judged by more than the number of loans." }, { paragraph: "D", text: "The aim is to make practical resources available to a wider range of people." }], explanation: "本段讨论衡量成效并扩大受益人群，对应 vi。", method: "识别 judged 与 wider range 两条主线。" },
    m1: { location: "B 段第 3 句", quotes: [{ paragraph: "B", text: "These services allow people to try an activity before buying expensive equipment and help neighbours avoid purchasing items they will rarely use." }], explanation: "avoid purchasing items they will rarely use 与题干完全对应。", method: "用 rarely used equipment 定位并核对 avoid buying 的同义表达。" },
    m2: { location: "C 段第 2 句", quotes: [{ paragraph: "C", text: "Staff must inspect every item when it is returned, replace missing parts and decide when damaged equipment is no longer safe." }], explanation: "returned、inspect 和 safe 同时对应题干。", method: "匹配信息需同时满足时间、动作和目的。" },
    mc1: { location: "全文结构：B 价值、C 挑战、D 公平分配", quotes: [{ paragraph: "B", text: "These services allow people to try an activity before buying expensive equipment and help neighbours avoid purchasing items they will rarely use." }, { paragraph: "C", text: "Object lending creates practical difficulties." }, { paragraph: "D", text: "The aim is to make practical resources available to a wider range of people." }], explanation: "选项 B 覆盖全文三个核心部分。", method: "主旨选项必须覆盖所有主体段落。" },
    tf1: { location: "B 段第 1–2 句", quotes: [{ paragraph: "B", text: "The collections vary with local demand." }], explanation: "vary 与 Every ... same 直接矛盾，所以是 False。", method: "绝对词 every 遇到明确差异即可判 False。" },
    tf2: { location: "全文未提供就业率研究", quotes: [{ paragraph: "D", text: "They ask whether the collection reaches residents who could not otherwise afford the equipment and whether workshops build useful skills." }], explanation: "原文只讨论技能和可负担性，没有就业率结论，因此 Not Given。", method: "不要把 skills 自行推断为 employment。" },
    s1: { location: "B 段第 3 句", quotes: [{ paragraph: "B", text: "These services allow people to try an activity before buying expensive equipment" }], explanation: "access expensive equipment 对应原文，且空格需名词。", method: "先预测词性，再找原文复现词。" },
    s2: { location: "C 段第 5 句", quotes: [{ paragraph: "C", text: "Libraries therefore need reliable maintenance budgets and clear borrowing rules." }], explanation: "reliable 与 budgets 之间原词为 maintenance。", method: "利用 reliable ... budgets 的词组框架定位。" },
  },
};

const riversReading: DailyReadingSet = {
  code: "Daily Set C",
  exercise: {
    title: "Bringing Urban Rivers Back to the Surface",
    subtitle: "Academic Reading · Daily Set C",
    paragraphs: [
      { label: "A", text: "During the nineteenth and twentieth centuries, many growing cities forced small rivers into pipes beneath roads and buildings. The channels carried waste and were considered obstacles to development. Today, some planners are reversing that decision through a process often called daylighting: removing the concrete cover so that water can flow at the surface again. What was once treated as hidden infrastructure is increasingly viewed as part of the public landscape." },
      { label: "B", text: "An open river can provide several benefits. A wider, planted channel may hold storm water and release it more slowly, reducing pressure on underground drains. Trees beside the water create shade during hot weather, while varied banks provide habitat for insects, fish and birds. Walking routes can connect neighbourhoods that were previously divided by roads or industrial land. These gains are strongest when water quality and surrounding vegetation are managed together." },
      { label: "C", text: "Daylighting is rarely simple. Engineers must map buried pipes and cables before excavation begins, and old river sediment may contain pollutants that require specialist treatment. Buildings sometimes stand directly above the former channel, leaving little room for a natural curve. Construction can disrupt traffic for months, and the restored waterway still requires regular monitoring. As a result, projects often proceed in short sections rather than uncovering an entire river at once." },
      { label: "D", text: "There is also a question of who shapes the restored space. A river park can raise nearby property prices, which may place pressure on long-term renters. To reduce that risk, several cities have involved residents early, protected affordable housing and designed paths for everyday local use rather than only for visitors. Supporters argue that ecological repair should improve the lives of existing communities as well as the appearance of a district." },
    ],
    headings: [{ id: "i", text: "Replacing all underground drainage" }, { id: "ii", text: "Environmental and social gains from an open channel" }, { id: "iii", text: "A past engineering choice is being reversed" }, { id: "iv", text: "Technical obstacles to uncovering a river" }, { id: "v", text: "Tourism as the only measure of success" }, { id: "vi", text: "Protecting the people already living nearby" }],
    matchingHeadings: [{ id: "hA", paragraph: "A", answer: "iii" }, { id: "hB", paragraph: "B", answer: "ii" }, { id: "hC", paragraph: "C", answer: "iv" }, { id: "hD", paragraph: "D", answer: "vi" }],
    matchingInformation: [{ id: "m1", prompt: "a reduction in pressure on underground drainage", answer: "B" }, { id: "m2", prompt: "a survey that must occur before digging starts", answer: "C" }],
    multipleChoice: [{ id: "mc1", prompt: "What is the main purpose of the passage?", options: ["To show that every buried river should be uncovered", "To explain the benefits, difficulties and social choices involved in river daylighting", "To compare water quality in four countries", "To argue that river parks should charge visitors"], answer: "To explain the benefits, difficulties and social choices involved in river daylighting" }],
    trueFalseNotGiven: [{ id: "tf1", prompt: "Every restored urban river is suitable for swimming.", options: ["True", "False", "Not Given"], answer: "Not Given" }, { id: "tf2", prompt: "Some daylighting projects are completed in separate stages.", options: ["True", "False", "Not Given"], answer: "True" }],
    summary: { instruction: "Choose ONE WORD from the box for each answer.", wordBank: ["drains", "monitoring", "tourism", "concrete"], textBeforeFirstGap: "A planted channel can reduce pressure on underground ", textBetweenGaps: ". Even after construction, the river needs regular ", textAfterSecondGap: ".", questions: [{ id: "s1", answer: "drains" }, { id: "s2", answer: "monitoring" }] },
  },
  evidence: {
    hA: { location: "A 段第 1、3 句", quotes: [{ paragraph: "A", text: "Today, some planners are reversing that decision through a process often called daylighting: removing the concrete cover so that water can flow at the surface again." }], explanation: "本段从过去埋河转向今天重新开放，对应 iii。", method: "抓住 reversing that decision 的时间与方向变化。" },
    hB: { location: "B 段第 1–5 句", quotes: [{ paragraph: "B", text: "An open river can provide several benefits." }, { paragraph: "B", text: "Walking routes can connect neighbourhoods that were previously divided by roads or industrial land." }], explanation: "本段同时列举防洪、降温、生态和社区连接等收益，对应 ii。", method: "将多个例子归纳为 environmental and social gains。" },
    hC: { location: "C 段第 1–5 句", quotes: [{ paragraph: "C", text: "Daylighting is rarely simple." }, { paragraph: "C", text: "Engineers must map buried pipes and cables before excavation begins" }], explanation: "本段集中讲地下设施、污染、空间和施工限制，对应 iv。", method: "用 rarely simple 识别问题型段落。" },
    hD: { location: "D 段第 1、4 句", quotes: [{ paragraph: "D", text: "There is also a question of who shapes the restored space." }, { paragraph: "D", text: "Supporters argue that ecological repair should improve the lives of existing communities as well as the appearance of a district." }], explanation: "核心是保障现有居民受益，对应 vi。", method: "who 与 existing communities 构成主旨同义链。" },
    m1: { location: "B 段第 2 句", quotes: [{ paragraph: "B", text: "A wider, planted channel may hold storm water and release it more slowly, reducing pressure on underground drains." }], explanation: "reducing pressure on underground drains 与题干直接对应。", method: "用 underground drainage 定位，再核对 reduction。" },
    m2: { location: "C 段第 2 句", quotes: [{ paragraph: "C", text: "Engineers must map buried pipes and cables before excavation begins" }], explanation: "map 对应 survey，before excavation 对应 before digging。", method: "同时核对动作和时间关系。" },
    mc1: { location: "全文结构：B 收益、C 困难、D 社会选择", quotes: [{ paragraph: "B", text: "An open river can provide several benefits." }, { paragraph: "C", text: "Daylighting is rarely simple." }, { paragraph: "D", text: "There is also a question of who shapes the restored space." }], explanation: "选项 B 完整覆盖三部分。", method: "排除只覆盖单段或使用 every 等绝对措辞的选项。" },
    tf1: { location: "全文未讨论游泳适用性", quotes: [{ paragraph: "B", text: "These gains are strongest when water quality and surrounding vegetation are managed together." }], explanation: "提到水质管理不等于说明能否游泳，因此 Not Given。", method: "不能用常识补足原文未给出的结论。" },
    tf2: { location: "C 段第 5 句", quotes: [{ paragraph: "C", text: "As a result, projects often proceed in short sections rather than uncovering an entire river at once." }], explanation: "short sections 与 separate stages 含义一致，所以 True。", method: "识别 sections 与 stages 的同义改写。" },
    s1: { location: "B 段第 2 句", quotes: [{ paragraph: "B", text: "reducing pressure on underground drains" }], explanation: "空格需要复数名词，原词 drains 符合。", method: "用 pressure on underground 定位原词。" },
    s2: { location: "C 段第 4 句", quotes: [{ paragraph: "C", text: "the restored waterway still requires regular monitoring" }], explanation: "needs regular 对应 requires regular，答案是 monitoring。", method: "利用语法与同义替换共同确认。" },
  },
};

const readingSets: DailyReadingSet[] = [
  { code: "Daily Set A", exercise: readingExercise, evidence: readingReviewEvidence },
  librariesReading,
  riversReading,
];

const speakingSets: SpeakingScenario[] = [
  speakingScenario,
  {
    title: "Education and digital learning",
    part: "Speaking · Daily Set B",
    duration: "官方考试约 4–5 分钟",
    opening: "Now I'd like to discuss education and technology.",
    questions: [
      "How has technology changed the way people learn new skills?",
      "Do online courses offer the same benefits as classroom teaching? Why or why not?",
      "What qualities make someone an effective teacher?",
      "Should schools limit students' use of artificial intelligence?",
      "How can adults remain motivated when learning after work?",
      "What do you think education will look like in twenty years?",
    ],
    goals: ["清楚比较两种方式", "说明原因并举例", "讨论未来影响"],
  },
  {
    title: "Transport and public space",
    part: "Speaking · Daily Set C",
    duration: "官方考试约 4–5 分钟",
    opening: "Now I'd like to discuss transport and public space.",
    questions: [
      "Why do many people still prefer driving to using public transport?",
      "What makes a public transport system convenient?",
      "Should city centres contain fewer private cars? Why or why not?",
      "How can better transport improve opportunities for young people?",
      "Do shared bicycles and scooters create more benefits or more problems?",
      "How might people travel differently in the future?",
    ],
    goals: ["给出直接观点", "讨论利弊", "用具体城市例子展开"],
  },
];

export function getDailyListeningExercise(dayKey: string, band: DailyPracticeBand = 7) {
  const set = listeningSets[difficultyRotationIndex(dayKey, listeningSets.length, band)];
  return { ...set, code: `${set.code} · Band ${band}.0` };
}

export function getDailyReadingExercise(dayKey: string, band: DailyPracticeBand = 7) {
  const set = readingSets[difficultyRotationIndex(dayKey, readingSets.length, band)];
  return { ...set, code: `${set.code} · Band ${band}.0` };
}

export function getDailySpeakingScenario(dayKey: string, band: DailyPracticeBand = 7) {
  return speakingSets[difficultyRotationIndex(dayKey, speakingSets.length, band)];
}
