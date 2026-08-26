export type Skill = "vocabulary" | "listening" | "speaking" | "reading";

export const skills: Array<{
  id: Skill;
  short: string;
  label: string;
  description: string;
  duration: string;
}> = [
  { id: "vocabulary", short: "词", label: "每日 100 词", description: "5 × 20 高频词速刷 + 场景听写", duration: "15 分钟" },
  { id: "listening", short: "听", label: "听力精练", description: "Section 1 租房咨询", duration: "8 分钟" },
  { id: "speaking", short: "说", label: "口语 Part 3", description: "真人考官式抽象讨论与追问", duration: "5 分钟" },
  { id: "reading", short: "读", label: "阅读套题", description: "匹配、单选、判断与摘要填空", duration: "18 分钟" },
];

export const vocabulary = [
  {
    word: "deposit",
    meaning: "押金；保证金",
    phonetic: "/dɪˈpɒzɪt/",
    example: "A refundable deposit is required before you move in.",
    hint: "7 个字母，以 de 开头",
  },
  {
    word: "furnished",
    meaning: "配有家具的",
    phonetic: "/ˈfɜːnɪʃt/",
    example: "The flat is fully furnished and ready to move into.",
    hint: "9 个字母，以 fur 开头",
  },
  {
    word: "landlord",
    meaning: "房东",
    phonetic: "/ˈlændlɔːd/",
    example: "You should contact the landlord about the broken heater.",
    hint: "8 个字母，由 land 和 lord 组成",
  },
  {
    word: "utilities",
    meaning: "水、电、燃气等公共费用",
    phonetic: "/juːˈtɪlətiz/",
    example: "Utilities are not included in the monthly rent.",
    hint: "9 个字母，以 uti 开头",
  },
];

const dailyVocabularySource = `
analyse|分析；剖析|学术核心|analyse the results
assess|评估；评价|学术核心|assess the impact
assume|假定；认为|学术核心|assume responsibility
benefit|益处；使受益|学术核心|provide long-term benefits
concept|概念；观念|学术核心|a difficult concept
conduct|实施；进行|学术核心|conduct research
consequence|结果；后果|学术核心|a serious consequence
constitute|构成；组成|学术核心|constitute a majority
context|背景；语境|学术核心|in a social context
contrast|对比；差异|学术核心|in sharp contrast
data|数据；资料|学术核心|collect reliable data
define|定义；界定|学术核心|clearly define
derive|获得；源自|学术核心|derive benefit from
establish|建立；证实|学术核心|establish a link
evidence|证据；根据|学术核心|strong evidence
factor|因素；要素|学术核心|a key factor
indicate|表明；显示|学术核心|results indicate that
interpret|解释；理解|学术核心|interpret the findings
method|方法；方式|学术核心|an effective method
significant|重要的；显著的|学术核心|a significant increase
biodiversity|生物多样性|环境生态|protect biodiversity
climate|气候|环境生态|climate change
conservation|保护；保存|环境生态|wildlife conservation
consume|消耗；消费|环境生态|consume less energy
contaminate|污染；弄脏|环境生态|contaminate water
deforestation|森林砍伐|环境生态|reduce deforestation
ecosystem|生态系统|环境生态|a fragile ecosystem
emission|排放物；排放|环境生态|carbon emissions
energy|能源；能量|环境生态|save energy
environment|环境|环境生态|protect the environment
fossil|化石的|环境生态|fossil fuels
habitat|栖息地|环境生态|natural habitat
pollution|污染|环境生态|air pollution
recycle|回收利用|环境生态|recycle household waste
renewable|可再生的|环境生态|renewable energy
resource|资源|环境生态|natural resources
sustainable|可持续的|环境生态|sustainable development
waste|废物；浪费|环境生态|reduce food waste
wildlife|野生动物|环境生态|protect wildlife
drought|干旱|环境生态|a severe drought
academic|学术的；学业的|教育学习|academic performance
curriculum|课程体系|教育学习|the school curriculum
discipline|学科；纪律|教育学习|academic discipline
educate|教育；培养|教育学习|educate young people
evaluate|评估；评价|教育学习|evaluate progress
graduate|毕业；毕业生|教育学习|university graduate
literacy|读写能力|教育学习|improve literacy
motivate|激励；促进|教育学习|motivate students
participate|参加；参与|教育学习|participate in class
practical|实际的；实用的|教育学习|practical skills
primary|初级的；主要的|教育学习|primary education
qualification|资格；学历|教育学习|professional qualification
research|研究；调查|教育学习|carry out research
scholarship|奖学金；学术研究|教育学习|receive a scholarship
secondary|中等的；次要的|教育学习|secondary school
skill|技能；技巧|教育学习|develop a skill
student|学生|教育学习|international student
tuition|学费；教学|教育学习|tuition fees
vocational|职业的|教育学习|vocational training
compulsory|强制的；必修的|教育学习|compulsory education
community|社区；群体|社会生活|local community
culture|文化|社会生活|cultural differences
demographic|人口统计的|社会生活|demographic change
discrimination|歧视|社会生活|workplace discrimination
diversity|多样性；差异|社会生活|cultural diversity
economy|经济|社会生活|the global economy
equality|平等|社会生活|gender equality
government|政府|社会生活|government policy
healthcare|医疗保健|社会生活|public healthcare
immigration|移民；移居|社会生活|immigration policy
income|收入|社会生活|household income
inequality|不平等|社会生活|income inequality
infrastructure|基础设施|社会生活|transport infrastructure
population|人口；群体|社会生活|an ageing population
poverty|贫困|社会生活|reduce poverty
policy|政策；方针|社会生活|public policy
public|公众的；公共的|社会生活|public services
resident|居民；居住者|社会生活|local residents
urban|城市的|社会生活|urban areas
welfare|福利；幸福|社会生活|social welfare
artificial|人工的；人造的|科技工作|artificial intelligence
automate|使自动化|科技工作|automate routine tasks
career|职业；生涯|科技工作|career development
communicate|交流；传达|科技工作|communicate effectively
digital|数字的|科技工作|digital technology
employment|就业；雇用|科技工作|employment opportunities
innovation|创新；革新|科技工作|technological innovation
internet|互联网|科技工作|internet access
labour|劳动；劳动力|科技工作|the labour market
manufacture|制造；生产|科技工作|manufacture products
occupation|职业；工作|科技工作|a skilled occupation
productivity|生产力；效率|科技工作|increase productivity
remote|远程的；偏远的|科技工作|remote working
replace|替代；更换|科技工作|replace manual labour
salary|薪水|科技工作|annual salary
technology|技术；科技|科技工作|modern technology
training|培训；训练|科技工作|staff training
transport|交通；运输|科技工作|public transport
unemployment|失业|科技工作|youth unemployment
workforce|劳动力；全体员工|科技工作|a skilled workforce
`.trim();

export const dailyVocabulary = dailyVocabularySource.split("\n").map((line) => {
  const [word, meaning, category, collocation] = line.split("|");
  return { word, meaning, category, collocation };
});

export const listeningExercise = {
  title: "询问出租房信息",
  script:
    "Good morning. I'm calling about the room advertised near Green Park. The rent is six hundred and eighty pounds per month, and that includes water, but electricity is separate. A deposit of one month's rent is required. The room is available from the fifteenth of September.",
  question: "房租中包含哪一项费用？",
  options: ["电费", "水费", "网费"],
  answer: "水费",
  explanation: "录音中说：the rent ... includes water, but electricity is separate。",
};

export const speakingScenario = {
  title: "Housing and the future of cities",
  part: "Speaking Part 3 · Two-way discussion",
  duration: "官方考试约 4–5 分钟",
  opening:
    "Now I'd like to discuss some more general questions related to housing and cities.",
  questions: [
    "Why do some people prefer renting a home rather than buying one?",
    "How has the cost of housing affected young people in recent years?",
    "Do you think governments should provide more affordable housing? Why or why not?",
    "In what ways can the design of a neighbourhood influence people's quality of life?",
    "How might remote working change where people choose to live in the future?",
    "What do you think cities will look like in thirty years' time?",
  ],
  goals: ["直接表达观点", "用原因或例子展开", "讨论更抽象的社会问题"],
};

export const readingExercise = {
  title: "The Quiet Rise of Urban Green Roofs",
  subtitle: "Academic Reading · 原创考试型迷你套题",
  paragraphs: [
    {
      label: "A",
      text: "Covering buildings with vegetation is not a new idea. Turf roofs kept homes warm in parts of northern Europe centuries ago, while roof gardens appeared in several ancient cities. What has changed is the reason for adopting them. Rapid urban growth has left many modern cities with less absorbent ground and higher summer temperatures. In response, planners in cities such as Toronto, Singapore and Basel have introduced policies that encourage, or sometimes require, vegetation on suitable new roofs. A practice once associated with local building traditions has therefore become part of mainstream urban policy.",
    },
    {
      label: "B",
      text: "A well-designed green roof can perform several functions at the same time. Its soil and plants retain a proportion of rainfall, releasing water slowly instead of sending it immediately into crowded drainage systems. Vegetation also shades the roof surface and cools the surrounding air through evaporation. Researchers have recorded lower indoor temperatures on hot days, which can reduce demand for air conditioning. Even a relatively shallow layer of planting can provide feeding places for insects and birds. The exact gains depend on climate, depth and plant choice, but the combined effect is difficult for a conventional roof to reproduce.",
    },
    {
      label: "C",
      text: "However, success is not achieved simply by placing soil on top of a building. Engineers must first check whether the structure can carry the additional weight, particularly when the soil is wet. Waterproof layers, drainage channels and safe access for workers are also essential. Plants that flourish at ground level may fail on a roof because of stronger wind and limited shade. Although some systems need little attention, none is entirely maintenance-free: drains must be cleared and unwanted plants removed. Installation costs are usually higher than for a standard roof, and the financial return may take years to become visible.",
    },
    {
      label: "D",
      text: "Supporters increasingly argue that the next question is not only how many green roofs a city has, but who benefits from them. Many roofs improve air quality or drainage without being open to residents, and highly visible projects are often concentrated in wealthy districts. Some councils now offer larger grants to schools, social housing providers and buildings in areas with little public green space. Others require developers to publish maintenance plans so that neglected roofs do not become a burden. These measures attempt to turn a useful building technology into a resource whose benefits are distributed more fairly.",
    },
  ],
  headings: [
    { id: "i", text: "The need to replace traditional public parks" },
    { id: "ii", text: "Several environmental gains from one surface" },
    { id: "iii", text: "An old idea receives modern policy support" },
    { id: "iv", text: "Practical barriers to a successful roof" },
    { id: "v", text: "Food production as the main purpose" },
    { id: "vi", text: "Extending the value to a wider population" },
  ],
  matchingHeadings: [
    { id: "hA", paragraph: "A", answer: "iii" },
    { id: "hB", paragraph: "B", answer: "ii" },
    { id: "hC", paragraph: "C", answer: "iv" },
    { id: "hD", paragraph: "D", answer: "vi" },
  ],
  matchingInformation: [
    { id: "m1", prompt: "a reference to reducing pressure on city drainage", answer: "B" },
    { id: "m2", prompt: "a check that must happen before construction begins", answer: "C" },
  ],
  multipleChoice: [
    {
      id: "mc1",
      prompt: "What is the main purpose of the passage?",
      options: [
        "To argue that every roof should grow food",
        "To explain the benefits, limits and social role of green roofs",
        "To compare roof designs in three ancient cities",
        "To show that green roofs are cheaper than conventional roofs",
      ],
      answer: "To explain the benefits, limits and social role of green roofs",
    },
  ],
  trueFalseNotGiven: [
    {
      id: "tf1",
      prompt: "All green roofs mentioned in the passage can be used as public spaces.",
      options: ["True", "False", "Not Given"],
      answer: "False",
    },
    {
      id: "tf2",
      prompt: "Green roofs are cheaper to install than conventional roofs.",
      options: ["True", "False", "Not Given"],
      answer: "False",
    },
  ],
  summary: {
    instruction: "Choose ONE WORD from the box for each answer.",
    wordBank: ["maintenance", "rainfall", "concrete", "wildlife"],
    textBeforeFirstGap: "Green roofs can hold back ",
    textBetweenGaps: " and may support urban animals. Before installation, a building must be checked, and every system still requires some ",
    textAfterSecondGap: ".",
    questions: [
      { id: "s1", answer: "rainfall" },
      { id: "s2", answer: "maintenance" },
    ],
  },
};
