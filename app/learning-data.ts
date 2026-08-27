import { expandedVocabularyRows } from "./vocabulary-expanded";

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
area|领域；区域|AWL 高频 1|a research area|AWL 学术词族
authority|权威；职权|AWL 高频 1|local authorities|AWL 学术词族
available|可获得的；有空的|AWL 高频 1|readily available|AWL 学术词族
consist|由……组成|AWL 高频 1|consist of three parts|AWL 学术词族
contract|合同；合约|AWL 高频 1|sign a contract|AWL 学术词族
create|创造；造成|AWL 高频 1|create opportunities|AWL 学术词族
distribute|分配；分发|AWL 高频 1|distribute resources|AWL 学术词族
estimate|估计；估算|AWL 高频 1|estimate the cost|AWL 学术词族
evident|明显的|AWL 高频 1|become evident|AWL 学术词族
export|出口；出口产品|AWL 高频 1|export agricultural goods|AWL 学术词族
finance|资金；为……融资|AWL 高频 1|public finance|AWL 学术词族
formula|公式；方案|AWL 高频 1|a mathematical formula|AWL 学术词族
function|功能；运作|AWL 高频 1|perform a function|AWL 学术词族
identify|识别；确定|AWL 高频 1|identify the cause|AWL 学术词族
individual|个人；个体的|AWL 高频 1|individual differences|AWL 学术词族
involve|涉及；使参与|AWL 高频 1|involve local people|AWL 学术词族
issue|问题；议题|AWL 高频 1|address an issue|AWL 学术词族
legal|法律的；合法的|AWL 高频 1|legal protection|AWL 学术词族
legislate|制定法律|AWL 高频 1|legislate against pollution|AWL 学术词族
major|主要的；专业|AWL 高频 1|a major challenge|AWL 学术词族
occur|发生；出现|AWL 高频 1|occur naturally|AWL 学术词族
percent|百分之……|AWL 高频 1|twenty percent of|AWL 学术词族
period|时期；一段时间|AWL 高频 1|over a long period|AWL 学术词族
principle|原则；原理|AWL 高频 1|a basic principle|AWL 学术词族
proceed|继续进行|AWL 高频 1|proceed with the study|AWL 学术词族
process|过程；处理|AWL 高频 1|the learning process|AWL 学术词族
require|需要；要求|AWL 高频 1|require further research|AWL 学术词族
respond|回应；作出反应|AWL 高频 1|respond to change|AWL 学术词族
role|角色；作用|AWL 高频 1|play a vital role|AWL 学术词族
section|部分；章节|AWL 高频 1|the final section|AWL 学术词族
sector|部门；行业|AWL 高频 1|the public sector|AWL 学术词族
similar|相似的|AWL 高频 1|broadly similar|AWL 学术词族
source|来源；源头|AWL 高频 1|a reliable source|AWL 学术词族
specific|具体的；特定的|AWL 高频 1|a specific example|AWL 学术词族
structure|结构；构造|AWL 高频 1|sentence structure|AWL 学术词族
theory|理论；学说|AWL 高频 1|support a theory|AWL 学术词族
vary|变化；相异|AWL 高频 1|vary considerably|AWL 学术词族
achieve|实现；达到|AWL 高频 2|achieve a goal|AWL 学术词族
acquire|获得；习得|AWL 高频 2|acquire knowledge|AWL 学术词族
administrate|管理；实施|AWL 高频 2|administrate a programme|AWL 学术词族
affect|影响|AWL 高频 2|affect performance|AWL 学术词族
appropriate|合适的；恰当的|AWL 高频 2|an appropriate response|AWL 学术词族
aspect|方面；层面|AWL 高频 2|an important aspect|AWL 学术词族
assist|帮助；协助|AWL 高频 2|assist with research|AWL 学术词族
category|类别；范畴|AWL 高频 2|fall into a category|AWL 学术词族
chapter|章；章节|AWL 高频 2|the opening chapter|AWL 学术词族
commission|委员会；委托|AWL 高频 2|an independent commission|AWL 学术词族
complex|复杂的；综合体|AWL 高频 2|a complex problem|AWL 学术词族
compute|计算|AWL 高频 2|compute the average|AWL 学术词族
conclude|得出结论；结束|AWL 高频 2|conclude that|AWL 学术词族
consequent|随之发生的|AWL 高频 2|consequent changes|AWL 学术词族
construct|建造；构建|AWL 高频 2|construct an argument|AWL 学术词族
credit|学分；信用|AWL 高频 2|earn course credits|AWL 学术词族
design|设计；方案|AWL 高频 2|research design|AWL 学术词族
distinct|不同的；清楚的|AWL 高频 2|a distinct advantage|AWL 学术词族
element|要素；元素|AWL 高频 2|a key element|AWL 学术词族
equate|等同；使相等|AWL 高频 2|equate wealth with success|AWL 学术词族
feature|特征；以……为特色|AWL 高频 2|a common feature|AWL 学术词族
final|最终的；决赛|AWL 高频 2|the final outcome|AWL 学术词族
focus|焦点；集中|AWL 高频 2|focus on quality|AWL 学术词族
impact|影响；冲击|AWL 高频 2|have a major impact|AWL 学术词族
injure|使受伤；损害|AWL 高频 2|seriously injure|AWL 学术词族
institute|机构；建立|AWL 高频 2|a research institute|AWL 学术词族
invest|投资；投入|AWL 高频 2|invest in education|AWL 学术词族
item|项目；物品|AWL 高频 2|a questionnaire item|AWL 学术词族
journal|期刊；日志|AWL 高频 2|an academic journal|AWL 学术词族
maintain|维持；主张|AWL 高频 2|maintain standards|AWL 学术词族
normal|正常的；常态|AWL 高频 2|return to normal|AWL 学术词族
obtain|获得；取得|AWL 高频 2|obtain permission|AWL 学术词族
perceive|察觉；认为|AWL 高频 2|perceive a risk|AWL 学术词族
positive|积极的；正面的|AWL 高频 2|a positive effect|AWL 学术词族
potential|潜在的；潜力|AWL 高频 2|potential benefits|AWL 学术词族
previous|先前的|AWL 高频 2|previous research|AWL 学术词族
purchase|购买；购买物|AWL 高频 2|purchase equipment|AWL 学术词族
range|范围；一系列|AWL 高频 2|a wide range of|AWL 学术词族
region|地区；区域|AWL 高频 2|a rural region|AWL 学术词族
regulate|监管；调节|AWL 高频 2|regulate the industry|AWL 学术词族
relevant|相关的；切题的|AWL 高频 2|relevant evidence|AWL 学术词族
reside|居住；存在于|AWL 高频 2|reside in urban areas|AWL 学术词族
restrict|限制；约束|AWL 高频 2|restrict access|AWL 学术词族
secure|确保；安全的|AWL 高频 2|secure funding|AWL 学术词族
seek|寻求；试图|AWL 高频 2|seek a solution|AWL 学术词族
select|选择；精选的|AWL 高频 2|select participants|AWL 学术词族
site|地点；场所|AWL 高频 2|a construction site|AWL 学术词族
strategy|策略；战略|AWL 高频 2|an effective strategy|AWL 学术词族
survey|调查；测量|AWL 高频 2|conduct a survey|AWL 学术词族
text|文本；课文|AWL 高频 2|analyse a text|AWL 学术词族
tradition|传统|AWL 高频 2|a cultural tradition|AWL 学术词族
transfer|转移；转让|AWL 高频 2|transfer knowledge|AWL 学术词族
alternative|替代方案；另类的|AWL 高频 3|an alternative approach|AWL 学术词族
circumstance|情况；环境|AWL 高频 3|under certain circumstances|AWL 学术词族
comment|评论；评述|AWL 高频 3|comment on the findings|AWL 学术词族
compensate|补偿；弥补|AWL 高频 3|compensate for losses|AWL 学术词族
component|组成部分；部件|AWL 高频 3|a central component|AWL 学术词族
consent|同意；许可|AWL 高频 3|give informed consent|AWL 学术词族
considerable|相当大的|AWL 高频 3|considerable evidence|AWL 学术词族
constant|持续的；常量|AWL 高频 3|remain constant|AWL 学术词族
constrain|限制；约束|AWL 高频 3|constrain development|AWL 学术词族
contribute|贡献；促成|AWL 高频 3|contribute to growth|AWL 学术词族
convene|召集；集合|AWL 高频 3|convene a meeting|AWL 学术词族
coordinate|协调；坐标|AWL 高频 3|coordinate activities|AWL 学术词族
core|核心；核心的|AWL 高频 3|a core principle|AWL 学术词族
corporate|公司的；企业的|AWL 高频 3|corporate responsibility|AWL 学术词族
correspond|相符；通信|AWL 高频 3|correspond with the data|AWL 学术词族
criteria|标准；准则|AWL 高频 3|selection criteria|AWL 学术词族
deduce|推断；演绎|AWL 高频 3|deduce from evidence|AWL 学术词族
demonstrate|证明；展示|AWL 高频 3|demonstrate the effect|AWL 学术词族
document|文件；记录|AWL 高频 3|document the process|AWL 学术词族
dominate|支配；占主导|AWL 高频 3|dominate the market|AWL 学术词族
emphasis|强调；重点|AWL 高频 3|place emphasis on|AWL 学术词族
ensure|确保；保证|AWL 高频 3|ensure equal access|AWL 学术词族
exclude|排除；不包括|AWL 高频 3|exclude unreliable data|AWL 学术词族
framework|框架；体系|AWL 高频 3|a legal framework|AWL 学术词族
fund|资金；资助|AWL 高频 3|fund medical research|AWL 学术词族
illustrate|说明；图示|AWL 高频 3|illustrate a point|AWL 学术词族
imply|暗示；意味着|AWL 高频 3|the results imply that|AWL 学术词族
initial|最初的；首字母|AWL 高频 3|the initial stage|AWL 学术词族
instance|例子；情况|AWL 高频 3|for instance|AWL 学术词族
interact|互动；相互作用|AWL 高频 3|interact with others|AWL 学术词族
justify|证明……合理|AWL 高频 3|justify the decision|AWL 学术词族
layer|层；层次|AWL 高频 3|a protective layer|AWL 学术词族
link|联系；连接|AWL 高频 3|establish a link|AWL 学术词族
locate|定位；位于|AWL 高频 3|locate the source|AWL 学术词族
maximise|使最大化|AWL 高频 3|maximise efficiency|AWL 学术词族
minor|较小的；次要的|AWL 高频 3|a minor change|AWL 学术词族
negate|否定；抵消|AWL 高频 3|negate the benefits|AWL 学术词族
outcome|结果；成果|AWL 高频 3|a positive outcome|AWL 学术词族
partner|伙伴；合作|AWL 高频 3|a research partner|AWL 学术词族
philosophy|哲学；理念|AWL 高频 3|educational philosophy|AWL 学术词族
physical|身体的；物理的|AWL 高频 3|physical activity|AWL 学术词族
proportion|比例；部分|AWL 高频 3|a large proportion of|AWL 学术词族
publish|出版；发表|AWL 高频 3|publish the results|AWL 学术词族
react|反应；回应|AWL 高频 3|react to pressure|AWL 学术词族
register|登记；注册|AWL 高频 3|register for a course|AWL 学术词族
rely|依赖；依靠|AWL 高频 3|rely on evidence|AWL 学术词族
remove|移除；消除|AWL 高频 3|remove a barrier|AWL 学术词族
scheme|计划；方案|AWL 高频 3|a recycling scheme|AWL 学术词族
sequence|顺序；序列|AWL 高频 3|in chronological sequence|AWL 学术词族
sex|性别；性|AWL 高频 3|differences by sex|AWL 学术词族
shift|转变；轮班|AWL 高频 3|a shift in attitude|AWL 学术词族
specify|明确说明；指定|AWL 高频 3|specify the conditions|AWL 学术词族
sufficient|足够的|AWL 高频 3|sufficient evidence|AWL 学术词族
task|任务；工作|AWL 高频 3|complete a task|AWL 学术词族
technical|技术的；专业的|AWL 高频 3|technical knowledge|AWL 学术词族
technique|技巧；技术|AWL 高频 3|a research technique|AWL 学术词族
valid|有效的；合理的|AWL 高频 3|a valid argument|AWL 学术词族
volume|量；体积|AWL 高频 3|a large volume of data|AWL 学术词族
access|使用权；访问|AWL 高频 4|access to education|AWL 学术词族
adequate|足够的；合格的|AWL 高频 4|adequate funding|AWL 学术词族
annual|每年的；年度的|AWL 高频 4|annual income|AWL 学术词族
apparent|明显的；表面上的|AWL 高频 4|an apparent decline|AWL 学术词族
approximate|大约的；近似|AWL 高频 4|an approximate figure|AWL 学术词族
attitude|态度；看法|AWL 高频 4|public attitudes|AWL 学术词族
attribute|归因于；属性|AWL 高频 4|attribute the change to|AWL 学术词族
civil|公民的；民事的|AWL 高频 4|civil society|AWL 学术词族
code|代码；准则|AWL 高频 4|a code of conduct|AWL 学术词族
commit|承诺；投入|AWL 高频 4|commit resources to|AWL 学术词族
concentrate|集中；专注|AWL 高频 4|concentrate on the task|AWL 学术词族
confer|授予；商议|AWL 高频 4|confer a benefit|AWL 学术词族
cycle|循环；周期|AWL 高频 4|the economic cycle|AWL 学术词族
debate|辩论；讨论|AWL 高频 4|a public debate|AWL 学术词族
despite|尽管|AWL 高频 4|despite the evidence|AWL 学术词族
dimension|维度；方面|AWL 高频 4|a social dimension|AWL 学术词族
domestic|国内的；家庭的|AWL 高频 4|domestic demand|AWL 学术词族
emerge|出现；显现|AWL 高频 4|a pattern emerges|AWL 学术词族
error|错误；误差|AWL 高频 4|a measurement error|AWL 学术词族
ethnic|族群的；民族的|AWL 高频 4|ethnic diversity|AWL 学术词族
goal|目标；目的|AWL 高频 4|achieve a goal|AWL 学术词族
grant|拨款；授予|AWL 高频 4|a research grant|AWL 学术词族
hence|因此；从此|AWL 高频 4|hence the need for|AWL 学术词族
hypothesis|假设；假说|AWL 高频 4|test a hypothesis|AWL 学术词族
implement|实施；执行|AWL 高频 4|implement a policy|AWL 学术词族
implicate|牵涉；表明关联|AWL 高频 4|be implicated in|AWL 学术词族
impose|强加；施加|AWL 高频 4|impose a limit|AWL 学术词族
integrate|整合；融入|AWL 高频 4|integrate technology into|AWL 学术词族
internal|内部的；内在的|AWL 高频 4|internal factors|AWL 学术词族
investigate|调查；研究|AWL 高频 4|investigate the cause|AWL 学术词族
job|工作；职责|AWL 高频 4|job satisfaction|AWL 学术词族
label|标签；给……分类|AWL 高频 4|label the diagram|AWL 学术词族
mechanism|机制；装置|AWL 高频 4|a coping mechanism|AWL 学术词族
obvious|明显的|AWL 高频 4|an obvious difference|AWL 学术词族
occupy|占据；使用|AWL 高频 4|occupy a central position|AWL 学术词族
option|选择；选项|AWL 高频 4|a practical option|AWL 学术词族
output|产出；输出|AWL 高频 4|economic output|AWL 学术词族
overall|总体的；总的来说|AWL 高频 4|the overall trend|AWL 学术词族
parallel|平行的；相似之处|AWL 高频 4|draw a parallel between|AWL 学术词族
parameter|参数；界限|AWL 高频 4|within the parameters|AWL 学术词族
phase|阶段；时期|AWL 高频 4|the final phase|AWL 学术词族
predict|预测；预言|AWL 高频 4|predict future demand|AWL 学术词族
principal|主要的；负责人|AWL 高频 4|the principal reason|AWL 学术词族
prior|先前的；优先的|AWL 高频 4|prior knowledge|AWL 学术词族
professional|专业的；职业人士|AWL 高频 4|professional development|AWL 学术词族
project|项目；预测|AWL 高频 4|a research project|AWL 学术词族
promote|促进；推广|AWL 高频 4|promote social change|AWL 学术词族
regime|制度；管理体系|AWL 高频 4|a regulatory regime|AWL 学术词族
resolve|解决；下定决心|AWL 高频 4|resolve a conflict|AWL 学术词族
retain|保留；保持|AWL 高频 4|retain information|AWL 学术词族
series|系列；一连串|AWL 高频 4|a series of studies|AWL 学术词族
statistic|统计量；统计数据|AWL 高频 4|official statistics|AWL 学术词族
status|地位；状态|AWL 高频 4|social status|AWL 学术词族
`.trim();

function buildCuratedExample(word: string, collocation: string) {
  const specialExamples: Record<string, string> = {
    available: "Reliable data are readily available from the national statistics office.",
    category: "Each response can fall into a different category.",
    circumstance: "The policy may be justified under certain circumstances.",
    constant: "The unemployment rate remained constant throughout the final quarter.",
    context: "The behaviour has a different meaning in a social context.",
    contrast: "The second result stands in sharp contrast to the first.",
    define: "Researchers should clearly define each term before collecting data.",
    despite: "Despite the higher cost, most participants supported the new programme.",
    evident: "The difference became evident after the final set of interviews.",
    emerge: "A clear pattern emerges when the figures are compared by age.",
    hence: "The sample was too small, hence the need for further research.",
    imply: "The results imply that access to public transport affects employment.",
    implicate: "Several industries were implicated in the rise in carbon emissions.",
    indicate: "The results indicate that the policy reduced household waste.",
    instance: "For instance, cycling can reduce congestion in city centres.",
    injure: "Unsafe equipment can seriously injure workers on a construction site.",
    normal: "Public transport services returned to normal after the storm.",
    occur: "Small variations occur naturally in a sample of this size.",
    overall: "Overall, the trend shows a gradual rise in public transport use.",
    percent: "Twenty percent of participants preferred the second option.",
    period: "The figures rose steadily over a long period.",
    prior: "Participants received the instructions prior to the experiment.",
    proportion: "A large proportion of respondents supported the proposal.",
    range: "The survey included a wide range of age groups.",
    reside: "Most participants reside in urban areas near the university.",
    sequence: "The main events are presented in chronological sequence.",
    similar: "The results from the two regions were broadly similar.",
  };
  if (specialExamples[word]) return specialExamples[word];

  const verbStarters = new Set("achieve acquire adapt address administrate administer affect analyse assess assist assume automate calculate carry collect comment communicate compensate complete concentrate conclude conduct confer consist constitute constrain construct consume contaminate contribute convene coordinate create deduce demonstrate derive develop distribute document dominate earn educate eliminate ensure equate establish estimate evaluate exclude export fall focus fund give have identify illustrate implement impose improve increase integrate interact interpret investigate invest involve justify label legislate locate maintain manufacture maximise motivate negate obtain occupy participate perceive perform place proceed promote protect provide publish purchase react receive recycle reduce register regulate rely remain remove replace require reside resolve respond restrict retain return save secure seek select sign specify support test transfer vary".split(" "));
  const firstWord = collocation.toLowerCase().split(/\s+/)[0];
  if (verbStarters.has(firstWord)) {
    const completedCollocation = /\b(from|to|into)$/.test(collocation)
      ? `${collocation} the proposed programme`
      : /\bthat$/.test(collocation)
        ? `${collocation} the policy was effective`
        : collocation;
    return `The research team plans to ${completedCollocation} before publishing its final report.`;
  }
  return `The report highlights ${collocation} as an important point for further discussion.`;
}

const curatedDailyVocabulary = dailyVocabularySource.split("\n").map((line) => {
  const [word, meaning, category, collocation, source] = line.split("|");
  return { word, meaning, category, collocation, source: source ?? "IELTS 主题独立整理", partOfSpeech: "", example: buildCuratedExample(word, collocation) };
});

const expandedSourceMeta = {
  a: { category: "学术高频", source: "NAWL 1.2 · CC BY-SA 4.0" },
  n: { category: "通用高频", source: "NGSL 1.2 · CC BY-SA 4.0" },
  g: { category: "阅读拓展", source: "NGSL-GR 1.0 · CC BY-SA 4.0" },
} as const;

function stableExampleIndex(word: string, size: number) {
  return [...word].reduce((total, character) => total + character.charCodeAt(0), 0) % size;
}

function buildExpandedExample(word: string, partOfSpeech: string) {
  const templates = partOfSpeech.startsWith("v")
    ? [
        `The study explains why communities may ${word} when conditions change.`,
        `Researchers observed how people ${word} in response to the new policy.`,
        `The report considers whether organisations should ${word} in the future.`,
      ]
    : partOfSpeech.startsWith("adj")
      ? [
          `The researchers found a ${word} difference between the two groups.`,
          `This issue is particularly ${word} in rapidly growing cities.`,
          `A more ${word} approach could improve the final outcome.`,
        ]
      : partOfSpeech.startsWith("adv")
        ? [
            `The figures changed ${word} over the ten-year period.`,
            `The two groups responded ${word} to the same situation.`,
            `The report explains the final trend ${word}.`,
          ]
        : [
            `The report identifies ${word} as an important factor in the final outcome.`,
            `Public discussion about ${word} has increased in recent years.`,
            `The study examines the role of ${word} in modern society.`,
          ];
  return templates[stableExampleIndex(word, templates.length)];
}

const preparedExpandedVocabulary = expandedVocabularyRows.map(([word, meaning, partOfSpeech, definition, sourceCode]) => {
  void definition;
  const example = buildExpandedExample(word, partOfSpeech);
  return { word, meaning, partOfSpeech, example, collocation: example, ...expandedSourceMeta[sourceCode] };
});

export const dailyVocabulary = Array.from({ length: 36 }, (_, dayIndex) => {
  const curatedStart = Math.ceil(curatedDailyVocabulary.length * dayIndex / 36);
  const curatedEnd = Math.ceil(curatedDailyVocabulary.length * (dayIndex + 1) / 36);
  const curatedBatch = curatedDailyVocabulary.slice(curatedStart, curatedEnd);
  const expandedStart = dayIndex * 100 - curatedStart;
  const expandedCount = 100 - curatedBatch.length;
  const expandedBatch = preparedExpandedVocabulary.slice(expandedStart, expandedStart + expandedCount);
  return [...curatedBatch, ...expandedBatch];
}).flat();

export function getDailyVocabulary(dayKey: string, count = 100) {
  const dayNumber = Math.floor(new Date(`${dayKey}T00:00:00`).getTime() / 86_400_000);
  const start = ((dayNumber % dailyVocabulary.length) * count) % dailyVocabulary.length;
  return Array.from({ length: Math.min(count, dailyVocabulary.length) }, (_, index) =>
    dailyVocabulary[(start + index) % dailyVocabulary.length],
  );
}

export const connectedSpeechPhrases = [
  { phrase: "could you tell me", meaning: "你能告诉我吗", feature: "连读与合音", note: "could you 中 /d/ + /j/ 常合成接近 /dʒ/ 的声音" },
  { phrase: "would you like to", meaning: "你想要……吗", feature: "合音与弱读", note: "would you 连读；to 在句中常弱读为 /tə/" },
  { phrase: "did you receive it", meaning: "你收到它了吗", feature: "合音与连读", note: "did you 常听起来接近 /dɪdʒə/，receive it 元辅音连读" },
  { phrase: "do you need it", meaning: "你需要它吗", feature: "合音与连读", note: "do you 可能听起来接近 /dʒə/，need it 连读" },
  { phrase: "a couple of days", meaning: "几天；两三天", feature: "弱读", note: "of 通常弱读为 /əv/，与前后词连在一起" },
  { phrase: "a lot of people", meaning: "很多人", feature: "连读", note: "lot of 常连成一组，of 使用弱读形式" },
  { phrase: "one of the reasons", meaning: "原因之一", feature: "弱读", note: "of 和 the 都很轻，重音落在 one 与 reasons" },
  { phrase: "most of the students", meaning: "大多数学生", feature: "弱读与辅音群", note: "most of the 中间辅音密集，/t/ 可能不完全释放" },
  { phrase: "at the end of the week", meaning: "在本周末", feature: "连读与弱读", note: "end of 元辅音连读，两个 the 都使用弱读" },
  { phrase: "in front of the library", meaning: "在图书馆前面", feature: "失爆与弱读", note: "front of 中 /t/ 在后接元音时快速连接，of 弱读" },
  { phrase: "next door to the bank", meaning: "银行隔壁", feature: "辅音省略", note: "next door 的 /t/ 在辅音 /d/ 前常弱化或省略" },
  { phrase: "used to be", meaning: "过去曾经是", feature: "辅音群简化", note: "used to 常读作 /juːstə/，不要逐字分开" },
  { phrase: "have to submit it", meaning: "必须提交它", feature: "同化与弱读", note: "have to 中 have 常读成 /hæf/，to 弱读" },
  { phrase: "going to arrive", meaning: "将要到达", feature: "弱化", note: "自然语流中 going to 会明显压缩，但正式拼写仍是 going to" },
  { phrase: "want to change it", meaning: "想要更改它", feature: "辅音群简化", note: "want to 中两个 /t/ 不会完整重复，change it 连读" },
  { phrase: "as soon as possible", meaning: "尽快", feature: "连续连读", note: "as 的尾辅音会与后面的元音自然连接" },
  { phrase: "first of all", meaning: "首先", feature: "连读与弱读", note: "first of 连读，of 通常弱读为 /əv/" },
  { phrase: "for example", meaning: "例如", feature: "弱读", note: "for 在句中常弱读为 /fə/，重音落在 example" },
  { phrase: "there are several options", meaning: "有几个选项", feature: "弱读与连读", note: "there are 常紧密连读，are 不单独重读" },
  { phrase: "could have been", meaning: "本来可能已经", feature: "弱读与缩合", note: "could have 常听起来接近 /kʊdəv/，不是 could of" },
  { phrase: "should have checked", meaning: "本应该检查", feature: "弱读与失爆", note: "should have 常压缩为 /ʃʊdəv/，checked 的尾音轻" },
  { phrase: "might have changed", meaning: "可能已经改变", feature: "弱读与辅音群", note: "might have 中 have 弱读，词间不会明显停顿" },
  { phrase: "can you send it", meaning: "你能发送它吗", feature: "弱读与连读", note: "can 在疑问句中通常不重读，send it 连读" },
  { phrase: "the rest of the course", meaning: "课程剩余部分", feature: "失爆与弱读", note: "rest of 中 /t/ 快速连接，of 与 the 都弱读" },
];

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
