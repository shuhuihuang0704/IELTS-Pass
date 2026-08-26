export type Skill = "vocabulary" | "listening" | "speaking" | "reading";

export const skills: Array<{
  id: Skill;
  short: string;
  label: string;
  description: string;
  duration: string;
}> = [
  { id: "vocabulary", short: "词", label: "场景词汇", description: "听音拼写与例句理解", duration: "6 分钟" },
  { id: "listening", short: "听", label: "听力精练", description: "Section 1 租房咨询", duration: "8 分钟" },
  { id: "speaking", short: "说", label: "AI 口语", description: "与房东完成真实沟通", duration: "6 分钟" },
  { id: "reading", short: "读", label: "阅读做题", description: "租房广告定位信息", duration: "7 分钟" },
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
  title: "和房东确认租房细节",
  opening: "Hello, thanks for calling about the room. What would you like to know?",
  goals: ["询问每月房租", "确认押金金额", "询问入住日期"],
};

export const readingExercise = {
  title: "Riverside Studio",
  passage:
    "A bright, fully furnished studio is available in Riverside from 15 September. The monthly rent is £680 and includes water and high-speed internet. Electricity is paid separately. The property is a five-minute walk from Green Park Station. A refundable deposit equal to one month's rent is required. The minimum stay is six months. Students are welcome, but pets are not permitted.",
  questions: [
    {
      id: "r1",
      prompt: "The tenant must pay separately for electricity.",
      options: ["True", "False", "Not Given"],
      answer: "True",
    },
    {
      id: "r2",
      prompt: "The property is ten minutes from Green Park Station.",
      options: ["True", "False", "Not Given"],
      answer: "False",
    },
    {
      id: "r3",
      prompt: "What is the minimum rental period?",
      options: ["One month", "Six months", "Twelve months"],
      answer: "Six months",
    },
  ],
};

