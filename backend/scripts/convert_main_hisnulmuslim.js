const fs = require("fs");
const path = require("path");

console.log("🕌 Converting Main Hisnul Muslim File");
console.log("=====================================\n");

// Configuration
const CONFIG = {
  bookId: 12,
  startHadithId: 41000,
  inputFile: "../public/hisnulmuslim_old_backup.json",
  outputFile: "../public/hisnulmuslim.json",
  backupFile: "../public/hisnulmuslim_old_backup.json",
};

// Validation function
function validateOriginalData(data) {
  if (!Array.isArray(data)) {
    throw new Error("Input data must be an array");
  }

  const requiredFields = ["title", "reference", "arabic", "english"];

  data.forEach((item, index) => {
    requiredFields.forEach((field) => {
      if (!item.hasOwnProperty(field)) {
        throw new Error(
          `Missing required field '${field}' in item ${index + 1}`
        );
      }
    });
  });

  return true;
}

// Chapter mapping for Arabic translations
const CHAPTER_MAPPING = {
  "When waking up": {
    arabic: "عند الاستيقاظ",
    english: "When waking up",
  },
  "When wearing a garment": {
    arabic: "عند لبس الثوب",
    english: "When wearing a garment",
  },
  "When wearing a new garment": {
    arabic: "عند لبس الثوب الجديد",
    english: "When wearing a new garment",
  },
  "To someone wearing a new garment": {
    arabic: "لمن يلبس ثوباً جديداً",
    english: "To someone wearing a new garment",
  },
  "Before undressing": {
    arabic: "قبل خلع الثوب",
    english: "Before undressing",
  },
  "Before entering the bathroom": {
    arabic: "قبل دخول الحمام",
    english: "Before entering the bathroom",
  },
  "After leaving the bathroom": {
    arabic: "بعد الخروج من الحمام",
    english: "After leaving the bathroom",
  },
  "Before ablution": {
    arabic: "قبل الوضوء",
    english: "Before ablution",
  },
  "Upon completing the ablution": {
    arabic: "عند إتمام الوضوء",
    english: "Upon completing the ablution",
  },
  "Remembrance when leaving the home": {
    arabic: "ذكر الخروج من المنزل",
    english: "Remembrance when leaving the home",
  },
  "Remembrance upon entering the home": {
    arabic: "ذكر دخول المنزل",
    english: "Remembrance upon entering the home",
  },
  "When going to the mosque": {
    arabic: "عند الذهاب إلى المسجد",
    english: "When going to the mosque",
  },
  "Upon entering the mosque": {
    arabic: "عند دخول المسجد",
    english: "Upon entering the mosque",
  },
  "Upon leaving the mosque": {
    arabic: "عند الخروج من المسجد",
    english: "Upon leaving the mosque",
  },
  "Concerning the athan (the call to prayer)": {
    arabic: "بخصوص الأذان",
    english: "Concerning the athan (the call to prayer)",
  },
  "At the start of the prayer (after takbeer)": {
    arabic: "في بداية الصلاة (بعد التكبير)",
    english: "At the start of the prayer (after takbeer)",
  },
  "While bowing in prayer": {
    arabic: "عند الركوع في الصلاة",
    english: "While bowing in prayer",
  },
  "Upon rising from the bowing position": {
    arabic: "عند الرفع من الركوع",
    english: "Upon rising from the bowing position",
  },
  "While prostrating": {
    arabic: "عند السجود",
    english: "While prostrating",
  },
  "Between the two prostrations": {
    arabic: "بين السجدتين",
    english: "Between the two prostrations",
  },
  "When prostrating due to recitation of the Quran": {
    arabic: "عند السجود لقراءة القرآن",
    english: "When prostrating due to recitation of the Quran",
  },
  "The Tashahhud": {
    arabic: "التشهد",
    english: "The Tashahhud",
  },
  "Prayers upon the Prophet ﷺ after the tashahhud": {
    arabic: "الصلاة على النبي ﷺ بعد التشهد",
    english: "Prayers upon the Prophet ﷺ after the tashahhud",
  },
  "After the last tashahhud and before salam": {
    arabic: "بعد التشهد الأخير وقبل السلام",
    english: "After the last tashahhud and before salam",
  },
  "After salam": {
    arabic: "بعد السلام",
    english: "After salam",
  },
  "For seeking guidance in forming a decision or choosing the proper course": {
    arabic: "لطلب الهداية في اتخاذ القرار أو اختيار المسار الصحيح",
    english:
      "For seeking guidance in forming a decision or choosing the proper course",
  },
  "In the morning and evening": {
    arabic: "في الصباح والمساء",
    english: "In the morning and evening",
  },
  "Before sleeping": {
    arabic: "قبل النوم",
    english: "Before sleeping",
  },
  "Before eating": {
    arabic: "قبل الأكل",
    english: "Before eating",
  },
  "Upon completing the meal": {
    arabic: "عند إتمام الوجبة",
    english: "Upon completing the meal",
  },
  "Before sexual intercourse with the wife": {
    arabic: "قبل الجماع مع الزوجة",
    english: "Before sexual intercourse with the wife",
  },
  "Upon breaking fast": {
    arabic: "عند الإفطار",
    english: "Upon breaking fast",
  },
  "By one fasting when presented with food and does not break his fast": {
    arabic: "للصائم عند تقديم الطعام له ولا يفطر",
    english:
      "By one fasting when presented with food and does not break his fast",
  },
  "When visiting the sick": {
    arabic: "عند زيارة المريض",
    english: "When visiting the sick",
  },
  "Upon sneezing": {
    arabic: "عند العطاس",
    english: "Upon sneezing",
  },
  "When a disbeliever praises Allah after sneezing": {
    arabic: "عند حمد الكافر لله بعد العطاس",
    english: "When a disbeliever praises Allah after sneezing",
  },
  "When angry": {
    arabic: "عند الغضب",
    english: "When angry",
  },
  "For anxiety and sorrow": {
    arabic: "للقلق والحزن",
    english: "For anxiety and sorrow",
  },
  "For one afflicted by a calamity": {
    arabic: "لمن أصيب بمصيبة",
    english: "For one afflicted by a calamity",
  },
  "For one in distress": {
    arabic: "لمن في كرب",
    english: "For one in distress",
  },
  "For one whose affairs have become difficult": {
    arabic: "لمن تعسرت عليه أموره",
    english: "For one whose affairs have become difficult",
  },
  "For one afflicted with doubt in his faith": {
    arabic: "لمن أصيب بالشك في إيمانه",
    english: "For one afflicted with doubt in his faith",
  },
  "For one afflicted by whisperings in prayer or recitation": {
    arabic: "لمن أصيب بالوسواس في الصلاة أو القراءة",
    english: "For one afflicted by whisperings in prayer or recitation",
  },
  "For expelling the devil and his whisperings": {
    arabic: "لطرد الشيطان ووساوسه",
    english: "For expelling the devil and his whisperings",
  },
  "For fear of shirk": {
    arabic: "لخوف الشرك",
    english: "For fear of shirk",
  },
  "For one afraid of the ruler's injustice": {
    arabic: "لمن يخاف ظلم الحاكم",
    english: "For one afraid of the ruler's injustice",
  },
  "For one you have insulted": {
    arabic: "لمن أسأت إليه",
    english: "For one you have insulted",
  },
  "Upon committing a sin": {
    arabic: "عند ارتكاب الذنب",
    english: "Upon committing a sin",
  },
  "Seeking forgiveness and repentance": {
    arabic: "طلب المغفرة والتوبة",
    english: "Seeking forgiveness and repentance",
  },
  "For travel": {
    arabic: "للسفر",
    english: "For travel",
  },
  "When mounting an animal or any means of transport": {
    arabic: "عند ركوب الحيوان أو أي وسيلة نقل",
    english: "When mounting an animal or any means of transport",
  },
  "When the mounted animal (or mean of transport) stumbles": {
    arabic: "عند تعثر المركوب (أو وسيلة النقل)",
    english: "When the mounted animal (or mean of transport) stumbles",
  },
  "Stopping or lodging somewhere in travel and otherwise": {
    arabic: "التوقف أو النزول في مكان أثناء السفر أو غيره",
    english: "Stopping or lodging somewhere in travel and otherwise",
  },
  "Takbir and Tasbih during travel": {
    arabic: "التكبير والتسبيح أثناء السفر",
    english: "Takbir and Tasbih during travel",
  },
  "When returning from travel": {
    arabic: "عند العودة من السفر",
    english: "When returning from travel",
  },
  "Supplication of the traveller for the resident": {
    arabic: "دعاء المسافر للمقيم",
    english: "Supplication of the traveller for the resident",
  },
  "Supplication of the resident for the traveller": {
    arabic: "دعاء المقيم للمسافر",
    english: "Supplication of the resident for the traveller",
  },
  "When entering a town or village": {
    arabic: "عند دخول بلدة أو قرية",
    english: "When entering a town or village",
  },
  "When entering the market": {
    arabic: "عند دخول السوق",
    english: "When entering the market",
  },
  "When encountering an enemy or those of authority": {
    arabic: "عند مواجهة العدو أو أصحاب السلطة",
    english: "When encountering an enemy or those of authority",
  },
  "When being afraid of a group of people": {
    arabic: "عند الخوف من مجموعة من الناس",
    english: "When being afraid of a group of people",
  },
  "When it rains": {
    arabic: "عند نزول المطر",
    english: "When it rains",
  },
  "After rainfall": {
    arabic: "بعد نزول المطر",
    english: "After rainfall",
  },
  "For rain": {
    arabic: "لطلب المطر",
    english: "For rain",
  },
  "Asking for clear skies": {
    arabic: "طلب صفاء السماء",
    english: "Asking for clear skies",
  },
  "When hearing thunder": {
    arabic: "عند سماع الرعد",
    english: "When hearing thunder",
  },
  "When seeing lightning": {
    arabic: "عند رؤية البرق",
    english: "When seeing lightning",
  },
  "During a wind storm": {
    arabic: "أثناء عاصفة الريح",
    english: "During a wind storm",
  },
  "When the wind blows": {
    arabic: "عند هبوب الريح",
    english: "When the wind blows",
  },
  "Upon sighting the crescent moon": {
    arabic: "عند رؤية الهلال",
    english: "Upon sighting the crescent moon",
  },
  "When seeing the early or premature fruit": {
    arabic: "عند رؤية الثمر المبكر أو الناضج",
    english: "When seeing the early or premature fruit",
  },
  "When hearing a rooster crow or the braying of a donkey": {
    arabic: "عند سماع صياح الديك أو نهيق الحمار",
    english: "When hearing a rooster crow or the braying of a donkey",
  },
  "When hearing the barking of dogs at night": {
    arabic: "عند سماع نباح الكلاب ليلاً",
    english: "When hearing the barking of dogs at night",
  },
  "When experiencing unrest, fear, apprehensiveness during sleep": {
    arabic: "عند الشعور بالقلق أو الخوف أو الاضطراب أثناء النوم",
    english: "When experiencing unrest, fear, apprehensiveness during sleep",
  },
  "When tossing and turning during the night": {
    arabic: "عند التقلب ليلاً",
    english: "When tossing and turning during the night",
  },
  "When startled": {
    arabic: "عند الفزع",
    english: "When startled",
  },
  "When stricken with a mishap or overtaken by an affair": {
    arabic: "عند الإصابة بمصيبة أو نزول أمر",
    english: "When stricken with a mishap or overtaken by an affair",
  },
  "When feeling some pain in the body": {
    arabic: "عند الشعور بألم في الجسد",
    english: "When feeling some pain in the body",
  },
  "When in fear of afflicting something with an (evil) eye from oneself": {
    arabic: "عند الخوف من إصابة شيء بالعين من النفس",
    english:
      "When in fear of afflicting something with an (evil) eye from oneself",
  },
  "When insulted while fasting": {
    arabic: "عند الإساءة أثناء الصيام",
    english: "When insulted while fasting",
  },
  "When breaking fast in someone's home": {
    arabic: "عند الإفطار في منزل أحد",
    english: "When breaking fast in someone's home",
  },
  "When the sick have renounced all hope of life": {
    arabic: "عند يأس المريض من الحياة",
    english: "When the sick have renounced all hope of life",
  },
  "Instruction for the one nearing death": {
    arabic: "تعليمات لمن يقترب من الموت",
    english: "Instruction for the one nearing death",
  },
  "When closing the eyes of the deceased": {
    arabic: "عند إغماض عيني الميت",
    english: "When closing the eyes of the deceased",
  },
  "For the deceased at the funeral prayer": {
    arabic: "للميت في صلاة الجنازة",
    english: "For the deceased at the funeral prayer",
  },
  "When the deceased is a child, during the funeral prayer": {
    arabic: "عند كون الميت طفلاً في صلاة الجنازة",
    english: "When the deceased is a child, during the funeral prayer",
  },
  "Placing the deceased in the grave": {
    arabic: "وضع الميت في القبر",
    english: "Placing the deceased in the grave",
  },
  "After burying the deceased": {
    arabic: "بعد دفن الميت",
    english: "After burying the deceased",
  },
  "Visiting the graves": {
    arabic: "زيارة القبور",
    english: "Visiting the graves",
  },
  Condolence: {
    arabic: "التعزية",
    english: "Condolence",
  },
  "Congratulation on the occasion of a birth and its reply": {
    arabic: "التهنئة بمناسبة الولادة وردها",
    english: "Congratulation on the occasion of a birth and its reply",
  },
  "To the newlywed": {
    arabic: "للمتزوج حديثاً",
    english: "To the newlywed",
  },
  "On the wedding night or when buying an animal": {
    arabic: "في ليلة الزفاف أو عند شراء حيوان",
    english: "On the wedding night or when buying an animal",
  },
  "Placing childen under Allah's protection": {
    arabic: "وضع الأطفال تحت حماية الله",
    english: "Placing childen under Allah's protection",
  },
  "When seeing someone in trial or tribulation": {
    arabic: "عند رؤية من في محنة أو ابتلاء",
    english: "When seeing someone in trial or tribulation",
  },
  "When receiving pleasant news": {
    arabic: "عند تلقي خبر سار",
    english: "When receiving pleasant news",
  },
  "What to say upon receiving pleasing or displeasing news": {
    arabic: "ما يقال عند تلقي خبر سار أو غير سار",
    english: "What to say upon receiving pleasing or displeasing news",
  },
  "When seeing a good dream or a bad dream": {
    arabic: "عند رؤية حلم حسن أو سيء",
    english: "When seeing a good dream or a bad dream",
  },
  "At times of amazement and that which delights": {
    arabic: "في أوقات الدهشة وما يسر",
    english: "At times of amazement and that which delights",
  },
  "When slaughtering or offering a sacrifice": {
    arabic: "عند الذبح أو تقديم الأضحية",
    english: "When slaughtering or offering a sacrifice",
  },
  "For the expiation of sins, said at the conclusion of a sitting or gathering":
    {
      arabic: "لكفارة الذنوب، يقال في نهاية الجلسة أو الاجتماع",
      english:
        "For the expiation of sins, said at the conclusion of a sitting or gathering",
    },
  "At a sitting or gathering": {
    arabic: "في الجلسة أو الاجتماع",
    english: "At a sitting or gathering",
  },
  "For the one that have been praised": {
    arabic: "لمن تم مدحه",
    english: "For the one that have been praised",
  },
  "The etiquette of praising a fellow Muslim": {
    arabic: "آداب مدح المسلم",
    english: "The etiquette of praising a fellow Muslim",
  },
  "To one who has offered you some of his wealth": {
    arabic: "لمن أعطاك من ماله",
    english: "To one who has offered you some of his wealth",
  },
  "To one who does you a favour": {
    arabic: "لمن أحسن إليك",
    english: "To one who does you a favour",
  },
  "To one who intends to give food or drink": {
    arabic: "لمن ينوي إعطاء طعام أو شراب",
    english: "To one who intends to give food or drink",
  },
  "To one who pronounces his love for you, for Allah's sake": {
    arabic: "لمن يعلن حبه لك من أجل الله",
    english: "To one who pronounces his love for you, for Allah's sake",
  },
  "To the debtor when his debt is settled": {
    arabic: "للدائن عند تسوية دينه",
    english: "To the debtor when his debt is settled",
  },
  "Settling a debt": {
    arabic: "تسوية الدين",
    english: "Settling a debt",
  },
  'To someone who says "': {
    arabic: 'لمن يقول "',
    english: 'To someone who says "',
  },
  "Returning a greeting to a disbeliever": {
    arabic: "رد التحية على الكافر",
    english: "Returning a greeting to a disbeliever",
  },
  "Excellence of spreading the Islamic greeting": {
    arabic: "فضيلة نشر التحية الإسلامية",
    english: "Excellence of spreading the Islamic greeting",
  },
  "Returning a supplication of forgiveness": {
    arabic: "رد دعاء المغفرة",
    english: "Returning a supplication of forgiveness",
  },
  "Excellence of sending prayers upon the Prophet (saws)": {
    arabic: "فضيلة الصلاة على النبي (صلى الله عليه وسلم)",
    english: "Excellence of sending prayers upon the Prophet (saws)",
  },
  "Excellence of Tasbih, Tahmid, Tahlil, and Takbir": {
    arabic: "فضيلة التسبيح والتحميد والتهليل والتكبير",
    english: "Excellence of Tasbih, Tahmid, Tahlil, and Takbir",
  },
  "How the Prophet ﷺ made tasbeeh": {
    arabic: "كيف كان النبي ﷺ يتسبح",
    english: "How the Prophet ﷺ made tasbeeh",
  },
  "Excellence of visiting the sick": {
    arabic: "فضيلة زيارة المريض",
    english: "Excellence of visiting the sick",
  },
  "Against enemies": {
    arabic: "ضد الأعداء",
    english: "Against enemies",
  },
  "To ward off the plot of the rebellious devils": {
    arabic: "لدفع مكر الشياطين المتمردة",
    english: "To ward off the plot of the rebellious devils",
  },
  "For one afflicted by whisperings in prayer or recitation": {
    arabic: "لمن أصيب بالوسواس في الصلاة أو القراءة",
    english: "For one afflicted by whisperings in prayer or recitation",
  },
  "Protection from the Dajjal": {
    arabic: "الحماية من الدجال",
    english: "Protection from the Dajjal",
  },
  "Qunoot Al-Witr": {
    arabic: "قنوت الوتر",
    english: "Qunoot Al-Witr",
  },
  "Immediately after salam of the witr prayer": {
    arabic: "مباشرة بعد سلام صلاة الوتر",
    english: "Immediately after salam of the witr prayer",
  },
  "Prayer of the traveller as dawn approaches": {
    arabic: "صلاة المسافر عند اقتراب الفجر",
    english: "Prayer of the traveller as dawn approaches",
  },
  "The Day of 'Arafah": {
    arabic: "يوم عرفة",
    english: "The Day of 'Arafah",
  },
  "Remembrance at Muzdalifa": {
    arabic: "الذكر في مزدلفة",
    english: "Remembrance at Muzdalifa",
  },
  "The Talbiya for the one doing Hajj or 'Umrah": {
    arabic: "التهليل للحاج أو المعتمر",
    english: "The Talbiya for the one doing Hajj or 'Umrah",
  },
  "When at Mount Safa and Mount Marwah": {
    arabic: "عند جبل الصفا وجبل المروة",
    english: "When at Mount Safa and Mount Marwah",
  },
  "Between the Yemeni corner and the black stone": {
    arabic: "بين الركن اليماني والحجر الأسود",
    english: "Between the Yemeni corner and the black stone",
  },
  "The Takbîr passing the black stone": {
    arabic: "التكبير عند المرور بالحجر الأسود",
    english: "The Takbîr passing the black stone",
  },
  "Takbir when throwing each pebble at the Jamarat": {
    arabic: "التكبير عند رمي كل حصاة في الجمرات",
    english: "Takbir when throwing each pebble at the Jamarat",
  },
  "Of the guest for the host": {
    arabic: "من الضيف للضيف",
    english: "Of the guest for the host",
  },
  "Comprehensive types of good and manners": {
    arabic: "أنواع شاملة من الخير والآداب",
    english: "Comprehensive types of good and manners",
  },
  "The scorn of ascribing things to evil omens": {
    arabic: "ذم الطيرة",
    english: "The scorn of ascribing things to evil omens",
  },
};

// Function to extract chapter name from title
function extractChapterName(title) {
  if (title.startsWith("Chapter: ")) {
    return title.substring(9); // Remove "Chapter: " prefix
  }
  return title;
}

// Function to get chapter mapping
function getChapterMapping(chapterName) {
  return (
    CHAPTER_MAPPING[chapterName] || {
      arabic: chapterName,
      english: chapterName,
    }
  );
}

// Conversion function
function convertToNewFormat(originalData) {
  console.log("🔄 Converting data to new format...");

  // Extract unique chapters
  const uniqueChapters = new Map();
  originalData.forEach((supplication) => {
    const chapterName = extractChapterName(supplication.title);
    if (!uniqueChapters.has(chapterName)) {
      const mapping = getChapterMapping(chapterName);
      uniqueChapters.set(chapterName, {
        id: uniqueChapters.size,
        bookId: CONFIG.bookId,
        arabic: mapping.arabic,
        english: mapping.english,
      });
    }
  });

  const newStructure = {
    id: CONFIG.bookId,
    metadata: {
      id: CONFIG.bookId,
      length: originalData.length,
      arabic: {
        title: "حصن المسلم",
        author: "سعيد بن علي بن وهف القحطاني",
        introduction:
          "مجموعة من الأدعية والأذكار المأثورة عن النبي صلى الله عليه وسلم",
      },
      english: {
        title: "Fortress of the Muslim",
        author: "Sa'id bin Ali bin Wahf Al-Qahtani",
        introduction:
          "A collection of authentic supplications and remembrances from the Prophet ﷺ",
      },
    },
    chapters: Array.from(uniqueChapters.values()),
    hadiths: [],
  };

  // Convert each supplication to the new format
  originalData.forEach((supplication, index) => {
    const hadithId = CONFIG.startHadithId + index;
    const idInBook = index + 1;
    const chapterName = extractChapterName(supplication.title);
    const chapter = uniqueChapters.get(chapterName);

    const newHadith = {
      id: hadithId,
      idInBook: idInBook,
      chapterId: chapter.id,
      bookId: CONFIG.bookId,
      arabic: supplication.arabic,
      english: {
        narrator: "",
        text: supplication.english,
      },
    };

    newStructure.hadiths.push(newHadith);
  });

  console.log(`📚 Found ${uniqueChapters.size} unique chapters`);
  return newStructure;
}

// Main conversion function
function convertMainHisnulMuslim() {
  try {
    const inputPath = path.join(__dirname, CONFIG.inputFile);
    const outputPath = path.join(__dirname, CONFIG.outputFile);
    const backupPath = path.join(__dirname, CONFIG.backupFile);

    // Check if input file exists
    if (!fs.existsSync(inputPath)) {
      console.log("❌ Input file not found:", inputPath);
      return;
    }

    // Read original data
    console.log("📖 Reading original data...");
    const originalData = JSON.parse(fs.readFileSync(inputPath, "utf8"));

    // Validate data
    console.log("✅ Validating data...");
    validateOriginalData(originalData);

    // Create backup of existing file if it exists
    if (fs.existsSync(outputPath)) {
      console.log("💾 Creating backup of existing file...");
      fs.copyFileSync(outputPath, backupPath);
      console.log("✅ Backup created:", backupPath);
    }

    // Convert data
    const newStructure = convertToNewFormat(originalData);

    // Write new file
    console.log("💾 Writing converted data...");
    fs.writeFileSync(outputPath, JSON.stringify(newStructure, null, 2), "utf8");

    // Success message
    console.log("\n✅ Conversion completed successfully!");
    console.log(
      `📊 Total supplications converted: ${newStructure.hadiths.length}`
    );
    console.log(`📁 Output file: ${outputPath}`);
    console.log(`🆔 Book ID: ${CONFIG.bookId}`);
    console.log(
      `🔢 Hadith ID range: ${CONFIG.startHadithId} - ${
        CONFIG.startHadithId + newStructure.hadiths.length - 1
      }`
    );
  } catch (error) {
    console.error("❌ Error during conversion:", error.message);
    console.log("\n💡 Troubleshooting tips:");
    console.log("1. Make sure your input file is valid JSON");
    console.log("2. Check that all required fields are present");
    console.log("3. Verify the file path is correct");
  }
}

// Run the conversion
convertMainHisnulMuslim();

// Export functions for use in other scripts
module.exports = {
  convertToNewFormat,
  validateOriginalData,
  convertMainHisnulMuslim,
};
