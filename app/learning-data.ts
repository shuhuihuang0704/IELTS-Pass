export type Skill = "vocabulary" | "listening" | "speaking" | "reading";

export const skills: Array<{
  id: Skill;
  short: string;
  label: string;
  description: string;
  duration: string;
}> = [
  { id: "vocabulary", short: "词", label: "每日 100 词", description: "5 × 20 高频词速刷 + 80 词场景听写", duration: "15 分钟" },
  { id: "listening", short: "听", label: "听力精练", description: "Section 1 填空、多选、匹配与单选", duration: "12 分钟" },
  { id: "speaking", short: "说", label: "口语 Part 3", description: "真人考官式抽象讨论与追问", duration: "5 分钟" },
  { id: "reading", short: "读", label: "阅读套题", description: "匹配、单选、判断与摘要填空", duration: "18 分钟" },
];

const listeningVocabularySource = `
deposit|押金；保证金|A refundable deposit is required.
furnished|配有家具的|The room is fully furnished.
landlord|房东|Please contact the landlord.
utilities|水电燃气等费用|Utilities are included in the rent.
tenant|租户|The tenant signed the agreement.
balcony|阳台|The flat has a small balcony.
garage|车库|A garage is available behind the house.
heating|暖气；供暖|Central heating is included.
lease|租约|The lease lasts for twelve months.
apartment|公寓|The apartment is near the station.
departure|出发；离开|The departure time is eight thirty.
arrival|到达|Please confirm your arrival date.
itinerary|行程安排|Your itinerary will arrive by email.
luggage|行李|Large luggage must be labelled.
platform|站台|The train leaves from platform six.
terminal|航站楼；终点站|Meet us outside the main terminal.
passenger|乘客|Each passenger needs a ticket.
reservation|预订|I would like to change my reservation.
journey|旅程|The journey takes about two hours.
vehicle|车辆|No private vehicle is required.
assignment|作业；任务|The assignment is due on Friday.
lecture|讲座；课程|The lecture begins at nine.
tutorial|辅导课；研讨课|Our tutorial meets every Tuesday.
library|图书馆|The library closes at midnight.
campus|校园|The residence is on the north campus.
scholarship|奖学金|She applied for a scholarship.
semester|学期|The first semester starts in September.
certificate|证书|You will receive a certificate.
laboratory|实验室|Safety glasses are required in the laboratory.
curriculum|课程体系|The new curriculum includes fieldwork.
appointment|预约|I need to book an appointment.
pharmacy|药房|The pharmacy is beside the clinic.
treatment|治疗|The treatment takes six weeks.
insurance|保险|Travel insurance is strongly recommended.
allergy|过敏|Please tell us about any allergy.
exercise|锻炼|Regular exercise can reduce stress.
nutrition|营养|The course focuses on child nutrition.
symptom|症状|Describe each symptom carefully.
clinic|诊所|The campus clinic opens at eight.
surgery|手术；诊所|The surgery is closed on Sunday.
employer|雇主|Your employer must sign the form.
interview|面试；访谈|The interview lasts thirty minutes.
experience|经验|Previous experience is not necessary.
qualification|资格；学历|A teaching qualification is preferred.
reference|推荐信；参考|Please provide one academic reference.
salary|薪水|The starting salary is competitive.
training|培训|All staff receive safety training.
uniform|制服|A uniform is provided at work.
vacancy|空缺职位|The vacancy is for a receptionist.
volunteer|志愿者|Each volunteer works one morning.
recycling|回收利用|Recycling bins are near the entrance.
pollution|污染|Traffic pollution affects the city centre.
conservation|保护|The project supports forest conservation.
climate|气候|The lecture examines climate change.
habitat|栖息地|The wetland provides a natural habitat.
energy|能源|The building uses solar energy.
agriculture|农业|Modern agriculture needs less water.
wildlife|野生动物|Visitors must not feed the wildlife.
forest|森林|The path continues through the forest.
drought|干旱|The region experienced a severe drought.
reception|接待处|Collect your key from reception.
restaurant|餐厅|The restaurant opens at six.
laundry|洗衣房；洗衣|The laundry is on the ground floor.
membership|会员资格|Annual membership costs forty pounds.
facility|设施|The sports facility opens daily.
entrance|入口|Use the side entrance after six.
parking|停车场；停车|Free parking is available nearby.
delivery|递送|The delivery will arrive on Monday.
discount|折扣|Students receive a ten percent discount.
receipt|收据|Keep the receipt for your records.
museum|博物馆|The museum tour starts at eleven.
theatre|剧院|The theatre is opposite the library.
festival|节日；庆典|The festival takes place in June.
exhibition|展览|The photography exhibition is free.
competition|比赛|Entries for the competition close tomorrow.
conference|会议|The conference lasts for three days.
workshop|工作坊|Book the afternoon workshop online.
photography|摄影|Photography is not allowed inside.
swimming|游泳|Swimming lessons are held on Saturdays.
gardening|园艺|The gardening club meets every month.
`.trim();

export const vocabulary = listeningVocabularySource.split("\n").map((line) => {
  const [word, meaning, example] = line.split("|");
  return {
    word,
    meaning,
    example,
    phonetic: "",
    hint: `${word.length} 个字母，以 ${word.slice(0, Math.min(3, word.length))} 开头`,
  };
});

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
  title: "University Residence Enquiry",
  subtitle: "Listening Section 1 · 原创考试型迷你套题",
  script:
    "Receptionist: Good morning, Westbridge University Residence. How can I help? Student: Hello. I'm calling to complete my accommodation application. Receptionist: Certainly. First, can I take your family name? Student: It's Chen, C H E N. Receptionist: Thank you. And when will you arrive? Student: On the fourteenth of October. I originally wrote the twelfth, but my flight changed. Receptionist: Right, the fourteenth of October. Do you want a shared room? Student: No, a single room, please. I need somewhere quiet to study. Receptionist: Any dietary requirement? Student: Yes, vegetarian. I eat dairy products, but no meat or fish. Receptionist: Now, several facilities are included in the weekly fee. Every room has Wi-Fi, and residents can use the bicycle storage without charge. The laundry is available, but each wash costs three pounds. Breakfast is optional, and I'm afraid there is no gym in this building. Student: That's fine. What documents do you need? Receptionist: Please send a copy of your passport by email. You can show the original at reception when you arrive. The deposit must be paid by bank transfer; we cannot accept cash for that. Student: I understand. What time can I collect my key? Receptionist: Check-in begins at three p.m. You said your flight lands at two, so arriving around half past four should be comfortable. Student: Great. I chose Westbridge because it is close to the science building. The city centre residence was newer, but it was much farther from my classes. Receptionist: That makes sense. I'll email your confirmation today.",
  formCompletion: [
    { id: "l1", label: "Family name", answers: ["chen"] },
    { id: "l2", label: "Arrival date", answers: ["14 october", "14th october", "october 14", "october 14th"] },
    { id: "l3", label: "Room requested", answers: ["single room"] },
    { id: "l4", label: "Dietary requirement", answers: ["vegetarian"] },
  ],
  multipleSelect: {
    prompt: "Which TWO facilities are included in the weekly fee?",
    options: ["Laundry", "Gym", "Wi-Fi", "Breakfast", "Bicycle storage"],
    answers: ["Wi-Fi", "Bicycle storage"],
  },
  matching: {
    prompt: "How should the student provide each item?",
    options: [
      { id: "A", label: "by email" },
      { id: "B", label: "at reception" },
      { id: "C", label: "by bank transfer" },
    ],
    questions: [
      { id: "l7", label: "copy of passport", answer: "A" },
      { id: "l8", label: "deposit", answer: "C" },
    ],
  },
  multipleChoice: [
    {
      id: "l9",
      prompt: "What is the earliest check-in time?",
      options: ["2:00 p.m.", "3:00 p.m.", "4:30 p.m."],
      answer: "3:00 p.m.",
    },
    {
      id: "l10",
      prompt: "Why did the student choose Westbridge Residence?",
      options: ["It is the newest residence.", "It is near the science building.", "It is in the city centre."],
      answer: "It is near the science building.",
    },
  ],
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
