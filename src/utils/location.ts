/**
 * User location utilities — detect the visitor's city via browser geolocation
 * and reverse-geocoding, so the homepage can show loads from their own city.
 */

const CITY_KEY = 'pkcl_user_city';
const DISMISS_KEY = 'pkcl_location_dismissed';

/** English (reverse-geocode) -> Urdu (website) city names */
export const CITY_EN_TO_UR: Record<string, string> = {
  'arifwala': 'عارف والا', 'bagh chowk': 'باغ چوک', 'bahawalnagar': 'بہاولنگر',
  'bahawalpur': 'بہاولپور', 'begpur': 'بیگ پور', 'bhakkar': 'بھکر',
  'bonga hayat': 'بونگا حیات', 'bulle shah': 'بلے شاہ', 'burewala': 'بورے والا',
  'chak jhumra': 'چک جھمرہ', 'chakwal': 'چکوال', 'chichawatni': 'چیچہ وطنی',
  'chiniot': 'چنیوٹ', 'chowk azam': 'چوک اعظم', 'dera ghazi khan': 'ڈیرہ غازی خان',
  'faisalabad': 'فیصل آباد', 'faqirwala': 'فقیر والا', 'farooqabad': 'فاروق آباد',
  'fazilpur': 'فاضل پور', 'feroz wattwan': 'فروز وٹواں', 'fort abbas': 'فورٹ عباس',
  'ghakhar mandi': 'گکھڑ منڈی', 'gujranwala': 'گوجرانوالہ', 'gujrat': 'گجرات',
  'haripur': 'ہری پور', 'haroonabad': 'ہارون آباد', 'havelian': 'حویلیاں',
  'hyderabad': 'حیدرآباد', 'islamabad': 'اسلام آباد', 'jhang': 'جھنگ',
  'jhelum': 'جہلم', 'kabirwala': 'کبیروالا', 'kalurkot': 'کلورکوٹ',
  'kamalia': 'کمالیہ', 'karachi': 'کراچی', 'kasur': 'قصور',
  'khanewal': 'خانیوال', 'khanqah sirajia': 'خانقاہ سراجیہ', 'kot sultan': 'کوٹ سلطان',
  'lahore': 'لاہور', 'layyah': 'لیہ', 'marot': 'مروٹ', 'mian channu': 'میاں چنوں',
  'mianwali': 'میانوالی', 'multan': 'ملتان', 'muzaffargarh': 'مظفرگڑھ',
  'nankana sahib': 'ننکانہ صاحب', 'nowshera virkan': 'نوشہرہ ورکاں',
  'okara': 'اوکاڑہ', 'peshawar': 'پشاور', 'pindi bhattian': 'پنڈی بھٹیاں',
  'punjab': 'پنجاب', 'quetta': 'کوئٹہ', 'raiwind': 'رائیونڈ', 'rajana': 'رجانہ',
  'rawalpindi': 'راولپنڈی', 'sahianwala': 'ساہیانوالا', 'sahiwal': 'ساہیوال',
  'sargodha': 'سرگودھا', 'shahkot': 'شاہ کوٹ', 'sialkot': 'سیالکوٹ',
  'sindh': 'سندھ', 'sukkur': 'سکھر', 'toba tek singh': 'ٹوبہ ٹیک سنگھ',
  'vehari': 'وہاڑی', 'wah cantt': 'واہ کینٹ', 'wan bhachran': 'واں بھچراں',
  // Extended transport-corridor cities (WhatsApp import coverage)
  'dipalpur': 'دیپالپور', 'kot momin': 'کوٹ مومن', 'phalia': 'پھالیہ',
  'bhalwal': 'بھلوال', 'shorkot': 'شورکوٹ', 'jaranwala': 'جڑانوالہ',
  'tandlianwala': 'تاندلیانوالہ', 'samundri': 'سمندری', 'gojra': 'گوجرہ',
  'hafizabad': 'حافظ آباد', 'wazirabad': 'وزیر آباد', 'daska': 'ڈسکہ',
  'pasrur': 'پسرور', 'narowal': 'نارووال', 'shakargarh': 'شکرگڑھ',
  'renala khurd': 'رینالہ خورد', 'haveli lakha': 'حویلی لکھا',
  'basirpur': 'بصیرپور', 'pakpattan': 'پاکپتن', 'mailsi': 'میلسی',
  'dunyapur': 'دنیا پور', 'lodhran': 'لودھراں', 'shujabad': 'شجاع آباد',
  'jalalpur pirwala': 'جلالپور پیروالہ', 'khushab': 'خوشاب',
  'quaidabad': 'قائد آباد', 'dera ismail khan': 'ڈیرہ اسماعیل خان',
  'tank': 'ٹانک', 'lakki marwat': 'لکی مروت', 'bannu': 'بنوں',
  'kohat': 'کوہاٹ', 'hangu': 'ہنگو', 'swat': 'سوات', 'mingora': 'مینگورہ',
  'mansehra': 'مانسہرہ', 'abbottabad': 'ایبٹ آباد', 'talagang': 'تلہ گنگ',
  'pind dadan khan': 'پنڈ دادن خان', 'kharian': 'کھاریاں',
  'lalamusa': 'لالہ موسیٰ', 'dina': 'دینہ', 'gujar khan': 'گوجر خان',
  'kahuta': 'کہوٹہ', 'murree': 'مری', 'taxila': 'ٹیکسلا',
  'fateh jang': 'فتح جنگ', 'attock': 'اٹک', 'hazro': 'حضرو',
  'swabi': 'صوابی', 'mardan': 'مردان', 'charsadda': 'چارسدہ',
  'nowshera': 'نوشہرہ', 'jamrud': 'جمرود', 'landikotal': 'لنڈی کوتل',
  'sibi': 'سبی', 'jacobabad': 'جیکب آباد', 'shikarpur': 'شکارپور',
  'khairpur': 'خیرپور', 'nawabshah': 'نوابشاہ', 'dadu': 'دادو',
  'sehwan': 'سیہون', 'thatta': 'ٹھٹھہ', 'badin': 'بدین',
  'mirpur khas': 'میرپور خاص', 'sanghar': 'سانگھڑ',
  'tando adam': 'ٹنڈو آدم', 'tando allahyar': 'ٹنڈو الہ یار',  // Punjab complete: cities, towns & villages (GeoNames map data; Urdu verified vs Google Maps/Wikipedia sample)
  'chunian': 'چونیاں', 'jhang sadr': 'جھنگ', 'shekhupura': 'شیخوپورہ',
  'rahim yar khan': 'رحیم یار خان', 'bhawana': 'بھوانہ', 'kamoke': 'کامونکی',
  'saddiqabad': 'صادق آباد', 'muridke': 'مریدکے', 'qadirpur ran': 'قادرپور راں',
  'dajal': 'داجل', 'ahmadpur east': 'احمد پور شرقیہ', 'hasilpur': 'حاصل پور',
  'jampur': 'جام پور', 'shujaabad': 'شجاع آباد', 'eminabad': 'ایمن آباد',
  'chishtian': 'چشتیاں', 'harunabad': 'ہارون آباد', 'jalalpur jattan': 'جلالپور جٹاں',
  'khanpur': 'خان پور', 'attock city': 'اٹک', 'mian channun': 'میاں چنوں',
  'mandi bahauddin': 'منڈی بہاؤالدین', 'daska kalan': 'ڈسکہ کلاں', 'sambrial': 'سمبڑیال',
  'taunsa': 'تونسہ', 'phool nagar': 'پھول نگر', 'pattoki': 'پتوکی',
  'jauharabad': 'جوہر آباد', 'vihari': 'وہاڑی', 'kot addu': 'کوٹ ادو',
  'sangla hill': 'سانگلہ ہل', 'khushāb': 'خوشاب', 'kot radha kishan': 'کوٹ رادھا کشن',
  'raja jang': 'راجہ جنگ', 'dijkot': 'ڈجکوٹ', 'khurarianwala': 'کھرڑیانوالا',
  'kunjah': 'کنجاہ', 'dinga': 'ڈنگہ', 'alahabad': 'الہ آباد',
  'khewra': 'کھیوڑہ', 'kahna nau': 'کاہنہ نو', 'zahir pir': 'ظاہر پیر',
  'hujra shah muqim': 'حجرہ شاہ مقیم', 'sarai alamgir': 'سرائے عالمگیر', 'rabwah': 'ربوہ',
  'kahror pakka': 'کہروڑ پکا', 'chuhar kana': 'چوہڑکانہ', 'darya khan': 'دریا خان',
  'minchinabad': 'منچن آباد', 'pindi gheb': 'پنڈی گھیب', 'faqirwali': 'فقیر والی',
  'yazman': 'یزمان', 'faruka': 'فاروقہ', 'sharifabad': 'شریف آباد',
  'dullewala': 'دولےوالا', 'lalian': 'لالیاں', 'qabula': 'قبولہ',
  'pir mahal': 'پیر محل', 'kot mumin': 'کوٹ مومن', 'rajanpur': 'راجن پور',
  'jahanian': 'جہانیاں', 'hadali': 'ہڈالی', 'sillanwali': 'سلانوالی',
  'jatoi shimali': 'جتوئی شمالی', 'mustafabad': 'مصطفی آباد', 'kamra': 'کامرہ',
  'chak thirty-one -eleven left': 'چک 31-11 لیفٹ', 'kanganpur': 'کنگن پور', 'fatehpur': 'فتح پور',
  'kundian': 'کنڈیاں', 'sukheke mandi': 'سکھیکے منڈی', 'naushahra virkan': 'نوشہرہ ورکاں',
  'choa saidan shah': 'چوآ سیدن شاہ', 'ladhewala waraich': 'لدھےوالا ورائچ', 'kamar mushani': 'کمر مشانی',
  'chak azam sahu': 'چک اعظم ساہو', 'malakwal city': 'ملکوال', 'khangah dogran': 'خانگاہ ڈوگراں',
  'narang mandi': 'نارنگ منڈی', 'malakwal': 'ملکوال', 'alipur': 'علی پور',
  'mamu kanjan': 'ماموں کنجن', 'sharqpur sharif': 'شرق پور شریف', 'bhera': 'بھیرہ',
  'khairpur tamewah': 'خیرپور ٹامیوالہ', 'chak five hundred seventy-five': 'چک 575', 'garh maharaja': 'گڑھ مہاراجہ',
  'jahanian shah': 'جہانیاں شاہ', 'manhala': 'منہالہ', 'mananwala': 'مانانوالہ',
  'talamba': 'تلمبہ', 'jhawarian': 'جھاوریاں', 'chawinda': 'چونڈہ',
  'daud khel': 'داؤد خیل', 'mitha tiwana': 'مٹھہ ٹوانہ', 'hazro city': 'حضرو',
  'dunga bunga': 'ڈونگہ بونگہ', 'karor': 'کروڑ', 'ahmadpur sial': 'احمد پور سیال',
  'chak one hundred twenty nine left': 'چک 129 لیفٹ', 'harappa': 'ہڑپہ', 'zafarwal': 'ظفروال',
  'kot samaba': 'کوٹ سمابہ', 'kuri dulal': 'کوڑی دولال', 'bhaun': 'بھون',
  'kotli loharan': 'کوٹلی لوہاراں', 'kot ghulam muhammad': 'کوٹ غلام محمد', 'lawa': 'لاوہ',
  'surkhpur': 'سرخ پور', 'sook kalan': 'سوک کلاں', 'dhaunkal': 'دھونکل',
  'khangarh': 'خانگڑھ', 'baddomalhi': 'بڈوملہی', 'haji shah': 'حاجی شاہ',
  'jand': 'جنڈ', 'bhopalwala': 'بھوپالوالا', 'kaleke mandi': 'کلیکے منڈی',
  'mangla': 'منگلا', 'shahr sultan': 'شہر سلطان', 'sodhri': 'سودھری',
  'kalabagh': 'کالا باغ', 'kallar kahar': 'کلر کہار', 'dhanot': 'دھنوٹ',
  'harnoli': 'ہرنولی', 'sarai sidhu': 'سرائے سدھو', 'daira din panah': 'دائرہ دین پناہ',
  'rojhan': 'روجن', 'rasulnagar': 'رسول نگر', 'mankera': 'منکیرہ',
  'shahpur': 'شاہپور', 'muhammad pur': 'محمد پور', 'chak one hundred thirty-eight nine left': 'چک 138-9 لیفٹ',
  'kalaswala': 'کلسوالا', 'liliani': 'للیانی', 'bhagowal': 'بھگووال',
  'daultala': 'دولتالہ', 'jandiala sher khan': 'جنڈیالہ شیر خان', 'bhagwal': 'بھگوال',
  'sanjwal': 'سنجوال', 'jamgah': 'جمگہ', 'mirdad muafi': 'مرداد معافی',
  'tibbi jay singh': 'ٹبی جے سنگھ', 'chak ninety-eight -nine left': 'چک 98-9 لیفٹ', 'chak one hundred twelve -nine left': 'چک 112-9 لیفٹ',
  'chak sixty-five a gugera distributary': 'چک 65 گوجرہ ڈسٹریبیوٹری', 'begowala': 'بیگووالا', 'kaure shah zerin': 'کوری شاہ زیریں',
  'chak one hundred ninety nine a left': 'چک 199 لیفٹ', 'chak ninety-nine -nine left': 'چک 99-9 لیفٹ', 'chak one hundred eighty-six nine left': 'چک 186-9 لیفٹ',
  'chak one hundred eighty-five a nine left': 'چک 185-9 لیفٹ', 'dinan bashnoian wala': 'دینن بشنوین والا', 'thamewali': 'تھمیوالی',
  'chak one hundred eighty-seven nine left': 'چک 187-9 لیفٹ', 'chak one hundred twenty-nine -nine left': 'چک 129-9 لیفٹ', 'nazir town': 'نذیر ٹاؤن',
  'chak one hundred eight -nine left': 'چک 108-9 لیفٹ', 'chak one hundred three seven right': 'چک 103-7 رائٹ', 'chak one hundred forty-two nine left': 'چک 142-9 لیفٹ',
  'chak one hundred thirty-nine nine left': 'چک 139-9 لیفٹ', 'chak one hundred eighteen nine left': 'چک 118-9 لیفٹ', 'chak one hundred -nine left': 'چک 109 لیفٹ',
  'narwanwala': 'نرونوالا', 'chak one hundred ten -nine left': 'چک 110-9 لیفٹ', 'chak one hundred forty nine left': 'چک 149 لیفٹ',
  'chak three ten left': 'چک 3-10 لیفٹ', 'chak sixty-eight-four right': 'چک 68-4 رائٹ', 'chak fifty-six -four right': 'چک 56-4 رائٹ',
  'chak hundred one': 'چک 100-1', 'chak one hundred four -nine left': 'چک 104-9 لیفٹ', 'chak one hundred twenty-one nine left': 'چک 121-9 لیفٹ',
  'chak one hundred fifty-three -nine left': 'چک 153-9 لیفٹ', 'chak eighty-eight -six right': 'چک 88-6 رائٹ', 'chak one hundred seventeen nine left': 'چک 117-9 لیفٹ',
  'chak one hundred forty-three nine left': 'چک 143-9 لیفٹ', 'chak one hundred thirty-two -nine left': 'چک 132-9 لیفٹ', 'chak one hundred eighty-eight nine a left': 'چک 188-9 لیفٹ',
  'chak one hundred forty-one nine left': 'چک 141-9 لیفٹ', 'chak ninety-nine -six right': 'چک 99-6 رائٹ', 'chak one hundred six -nine left': 'چک 106-9 لیفٹ',
  'chak pindi': 'چک پنڈی', 'mehmand chak': 'مہمند چک', 'mughalabad': 'مغل آباد',
  'chak one hundred four seven right': 'چک 104-7 رائٹ', 'bhata': 'بھٹہ', 'lollianwala': 'لولیاںوالا',
  'dittewal': 'دیتتیول', 'chak eighty three twelve l': 'چک 83-12 L', 'chak seventy-five - five right': 'چک 75-5 رائٹ',
  'banian': 'بنیاں', 'bakhri ahmad khan': 'بکھری احمد خان', 'dandot rs': 'ڈنڈوٹ آر ایس',
  'basti imam din nagar': 'بستی امام دین نگر', 'basti dosa': 'بستی دوس', 'kot rajkour': 'کوٹ رجکوور',
  'keshupur': 'کیشوپور', 'khandowa': 'کھندوو', 'moza shahwala': 'موضع شاہوالا',
  'basra': 'بصرہ', 'basti aukharvand': 'بستی اوکھروند', 'dajjal wala': 'دجال والا',
  'jhang city': 'جھنگ', 'vaddawala': 'وڈاوالا', 'waddan': 'وڈاں',
  'tibbi waddan': 'ٹبی وڈاں', 'mandi ahmadabad': 'منڈی احمد آباد', 'sadr bazar colony': 'صدر بازار کالونی',
  'sadr bazar': 'صدر بازار', 'sadda kamboh': 'سدا کمبوہ', 'sadda kamal': 'سدا کمال',
  'rukhla mandi': 'روکھل منڈی', 'ra bazar': 'را بازار', 'qila sadda singh': 'قلعہ سدا سنگھ',
  'qasba karial': 'قصبہ کریل', 'qasba janoobi': 'قصبہ جنوبی', 'chak pir saddar din': 'چک پیر صدر دین',
  'jhaik mandi': 'جھیک منڈی', 'mandi marh balochan': 'منڈی مڑھ بلوچاں', 'adda mangtanwala': 'اڈا منگتنوالا',
  'mandi sadiqganj': 'منڈی صادق گنج', 'mandir': 'مندر', 'mandi burewala': 'منڈی بورےوالا',
  'mandianwala': 'منڈیانوالہ', 'mandiala khurd': 'منڈیالہ خورد', 'mandiala kalan': 'منڈیالہ کلاں',
  'mandiala waraich': 'منڈیالہ ورائچ', 'mandiala': 'منڈیالہ', 'kotli madda': 'کوٹلی مدہ',
  'lalkurti bazar': 'لال کرتی بازار', 'lakar mandi': 'لکر منڈی', 'adda kudwala': 'اڈا کودوالا',
  'haft maddar': 'ہفت مددر', 'hadda': 'ہڈا', 'gawalmandi': 'گوالمنڈی',
  'qasba gujrat': 'قصبہ گجرات', 'basti gaddani': 'بستی گددنی', 'baddar': 'بددر',
  'dhobi mandi': 'دھوبی منڈی', 'chak daddan zerin': 'چک دددن زیریں', 'mauza chaddar': 'موضع چددر',
  'adda chabiana': 'اڈا چبین', 'bhaddar': 'بھددر', 'mandi': 'منڈی',
  'mandi sultanan': 'منڈی سولتنن', 'chah laddawala': 'چاہ لددوالا', 'mandiala virkan': 'منڈیالہ ورکاں',
  'manga mandi': 'مانگا منڈی', 'navin mandi': 'نوین منڈی', 'mandi faruqabad': 'منڈی فاروق آباد',
  'daddanwala': 'دددنوالا', 'marmandi': 'مرمندی', 'amandi khelwala': 'امندی خیلوالا',
  'saddarwala': 'صدروالا', 'samandiwala': 'سمندیوالا', 'dhok phaddawali': 'ڈھوک پھددوالی',
  'laddan shah': 'لددن شاہ', 'gaddan khori': 'گددن کھوری', 'basti mandi lar': 'بستی منڈی لر',
  'gaddan': 'گددن', 'gaddanwala': 'گددنوالا', 'mandiwala salt chauki': 'منڈیوالا سالٹ چوکی',
  'dhok baddar': 'ڈھوک بددر', 'mandi jattan': 'منڈی جٹاں', 'mandial mohra': 'منڈیال موہر',
  'paharay chowk': 'پہاڑے چوک', 'chah wadda': 'چاہ وڈا', 'yazmān mandi': 'یزمان منڈی',
  'adda bidder': 'اڈا بیددیر', 'laddar': 'لددر', 'warsalke adda': 'ورسلکی اڈا',
  'thadda thim': 'تھدد تھیم', 'mandiala tegha': 'منڈیالہ تیگھ', 'mandi chamrangan': 'منڈی چمرنگن',
  'ghalla mandi': 'غلہ منڈی', 'mandiala chatha': 'منڈیالہ چٹھہ', 'mian pakhi adda': 'میاں پکھی اڈا',
  'jamlera adda': 'جملیر اڈا', 'dhaoke mandi': 'ڈھوکے منڈی', 'basti umar wadda': 'بستی عمر وڈا',
  'guvjyal mandi': 'گووجیل منڈی', 'mad dadda': 'مد ددد', 'daddarwala': 'دددروالا',
  'chaddal': 'چددل', 'kumhar mandi': 'کمہار منڈی', 'mandiala mehr shakaran': 'منڈیالہ مہر شکران',
  'wadda pind': 'وڈا پنڈ', 'saijid adda': 'ساجد اڈا', 'kotla more': 'کوٹلہ موڑ',
  'tibbi sadda singh': 'ٹبی سدا سنگھ', 'kamandiwale': 'کمندیولی', 'sadda utar': 'سدا اتر',
  'gadda jattawala': 'گڈا جٹاوالا', 'new ghalla mandi': 'نیو غلہ منڈی', 'ganj mandi': 'گنج منڈی',
  'bakra mandi': 'بکرا منڈی', 'bakar mandi': 'بکر منڈی', 'lohari mandi': 'لوہاری منڈی',
  'chuna mandi': 'چونا منڈی', 'mandi siddiqpura': 'منڈی صدیق پورہ', 'qaddafi colony': 'قذافی کالونی',
  'boharwala chowk': 'بوہڑوالا چوک', 'dalgaran chowk': 'دلگرن چوک', 'dhok mukaddam': 'ڈھوک مقدم',
  'bari mandi': 'بڑی منڈی', 'sawar mandi': 'سوار منڈی', 'dhulian chowk': 'دھولین چوک',
  'naragghi chowk': 'نرگگھی چوک', 'kahuti bazar': 'کہوتی بازار', 'bathal bazar': 'بتھل بازار',
  'trae hadda': 'تری ہڈا', 'adda joghi': 'اڈا جوگی', 'ladda bhai jhok': 'لڈا بھائی جھوک',
  'saidewala more': 'سیدیوالا موڑ', 'hira adda': 'ہیرا اڈا', 'lahori more': 'لہوری موڑ',
  'chowk sethar': 'چوک سیتھر', 'mandi shah jiwana': 'منڈی شاہ جیوانہ', 'ghumandi': 'گھومندی',
  'kot khatrian adda': 'کوٹ کھترین اڈا', 'saddana kalan': 'سدھانا کلاں', 'mandi sukheki': 'منڈی سکھیکے',
  'shaddadwala': 'شدددوالا', 'adda loharanwala': 'اڈا لوہاراںوالا', 'waddaywala': 'وڈےوالا',
  'adda basira': 'اڈا بسیر', 'adda chachran': 'اڈا چچرن', 'adda zahirabad': 'اڈا ظاہر آباد',
  'sanjar adda': 'سنجر اڈا', 'pul adda': 'پل اڈا', 'adda dawa': 'اڈا داوا',
  'hawai adda': 'ہوائی اڈا', 'adda shabirabad': 'اڈا شبیر آباد', 'garha more': 'گڑھا موڑ',
  'chowkiwala': 'چوکیوالا', 'taro mandi': 'ترو منڈی', 'bagh-o-bahar bazar': 'باغ و بہار بازار',
  'shaheed chowk': 'شہید چوک', 'jhakar mandi': 'جھکر منڈی', 'jawa mandi': 'جاوا منڈی',
  'adda balani': 'اڈا بلنی', 'mandi jollahian': 'منڈی جوللہین', 'maddan': 'مددن',
  'adda bustan': 'اڈا بوستن', 'mor adda chak forty-six': 'موڑ اڈا چک 46', 'adda pul murad': 'اڈا پل مراد',
  'bsti maqbul more': 'بستی مقبول موڑ', 'dairn more': 'دیرن موڑ', 'adda faridpur': 'اڈا فریدپور',
  'adda six terpai': 'اڈا 6 تیرپائی', 'adda nine kassi': 'اڈا 9 کسی', 'bahar adda': 'باہر اڈا',
  'aziz chowk': 'عزیز چوک', 'adda saidiwala': 'اڈا سیدیوالا', 'ghalo more': 'گھلو موڑ',
  'adda kamarwala': 'اڈا کمروالا', 'adda nasirabad': 'اڈا نصیر آباد', 'redman chowk': 'ریدمن چوک',
  'adda gholam aliwala': 'اڈا غلام علی والا', 'tray hadda': 'تری ہڈا', 'dera adda': 'ڈیرہ اڈا',
  'balliwala adda': 'بللیوالا اڈا', 'daras addah': 'درس اڈا', 'adda bara mil': 'اڈا بڑا میل',
  'sabil chowk': 'سبیل چوک', 'mianwala adda': 'میاںوالا اڈا', 'bengali adda': 'بنگالی اڈا',
  'dhurnal adda': 'دھورنل اڈا', 'haider chowk': 'حیدر چوک', 'rakh more': 'رکھ موڑ',
  'purana adda surgdhan': 'پرانا اڈا سورگدھن', 'dhok madda': 'ڈھوک مدہ', 'daddan bala': 'دددن بالا',
  'chadhwal chauk adda': 'چدھول چوک اڈا', 'allot bazar': 'اللوت بازار', 'adda begowali': 'اڈا بیگووالی',
  'sambrial mandi': 'سمبڑیال منڈی', 'basti adda dargai shah': 'بستی اڈا درگی شاہ', 'mandianwal': 'مندینول',
  'adda gunna kalan': 'اڈا گونن کلاں', 'giraj adda': 'گیرج اڈا', 'khanuana adda': 'کھنون اڈا',
  'tharoh mandi': 'تھروہ منڈی', 'adda kot shakir': 'اڈا کوٹ شاکر', 'dhola patta waddar': 'دھول پتت وددر',
  'kulla mandiala': 'کولل منڈیالہ', 'salher mandi': 'سلہیر منڈی', 'chak padda': 'چک پدد',
  'thanwadda': 'تھنودد', 'mandial': 'منڈیال', 'mandi buchiana': 'منڈی بوچین',
  'adda khui': 'اڈا کھوئی', 'khoti stop': 'کھوتی سٹاپ', 'adda aminpur': 'اڈا امینپور',
  'adda mochiwala': 'اڈا موچیوالا', 'gorja mor adda': 'گورج موڑ اڈا', 'adda chimranwali': 'اڈا چیمرنوالی',
  'adda hari chandwala': 'اڈا ہری چندوالا', 'busti bazar': 'بستی بازار', 'adda mahowala': 'اڈا مہووالا',
  'adda hajiabad': 'اڈا حاجی آباد', 'adda acharwal': 'اڈا اچرول', 'adda sherabat': 'اڈا شیربت',
  'nalka stop': 'نلکا سٹاپ', 'mandiabad': 'منڈی آباد', 'adda bashirabad': 'اڈا بشیر آباد',
  'wahgi adda': 'وہگی اڈا', 'qaddafi park': 'قذافی پارک', 'gwalmandi': 'گوالمنڈی',
  'adda karol ghati': 'اڈا کرول گھاٹی', 'adda fateh rihan': 'اڈا فتح ریحان', 'basti pir mandiala': 'بستی پیر منڈیالہ',
  'adda eight mile': 'اڈا 8 میل', 'adda bagharipul': 'اڈا بگھریپول', 'chhebed adda': 'چہیبید اڈا',
  'fedar adda': 'فیدر اڈا', 'adda double phatak': 'اڈا ڈبل پھاٹک', 'adda jhanib pul': 'اڈا جانب پل',
  'gaimbar adda': 'گیمبر اڈا', 'adda gudar puli': 'اڈا گودر پلی', 'sultan chaddar': 'سلطان چددر',
  'awananwala more': 'اوننوالا موڑ', 'golewala adda': 'گولیوالا اڈا', 'basti adda one-right': 'بستی اڈا ون-رائٹ',
  'adda naiwala': 'اڈا نئیوالا', 'adda two-right': 'اڈا ٹو-رائٹ', 'bosan adda': 'بوسن اڈا',
  'adda balochan': 'اڈا بلوچاں', 'adda sadiqabad': 'اڈا صادق آباد', 'saddam colony': 'صدام کالونی',
  'tahli adda': 'تہلی اڈا', 'adda sherazi nagar': 'اڈا شیرازی نگر', 'hafiz chowk': 'حافظ چوک',
  'adda chanddni': 'اڈا چاندنی', 'lundianwala adda': 'لوندینوالا اڈا', 'muzeh bazar': 'موزیہ بازار',
  'kazmi chowk': 'کاظمی چوک', 'adda pull jerala': 'اڈا پل جیرالہ', 'trikhni adda': 'تریکھنی اڈا',
  'adda muhammadnagar': 'اڈا محمد نگر', 'mandi warburton': 'منڈی واربرٹن', 'ghale mandi': 'گھلی منڈی',
  'mandi faizabad': 'منڈی فیض آباد', 'kot khaddanwala': 'کوٹ کھددنوالا', 'mandi shadman colony': 'منڈی شادمان کالونی',
  'dholan mandi': 'دھولن منڈی', 'tara garh chowk': 'تارا گڑھ چوک', 'chowk chhabar': 'چوک چہبر',
  'muhammdi chowk': 'محمدی چوک', 'adda ghaziabad': 'اڈا غازی آباد', 'bet mor jhan': 'بیت موڑ جھن',
  'basti allah bakhsh waddani': 'بستی اللہ بخش وڈانی', 'karim bakhsh waddani': 'کریم بخش وڈانی', 'basti waddani': 'بستی وڈانی',
  'basti mava khan waddani': 'بستی مو خان وڈانی', 'basti more': 'بستی موڑ', 'adda chak shahid': 'اڈا چک شہید',
  'basti saiyid jand wadda shah': 'بستی سید جنڈ وڈا شاہ', 'adda rashidabad': 'اڈا راشد آباد', 'adda chak eighty-seven': 'اڈا چک 87',
  'kachi mandi': 'کچی منڈی', 'chah gaddanwala': 'چاہ گددنوالا', 'bhel adda': 'بھیل اڈا',
  'damorewala': 'دموریوالا', 'adda hassu balel': 'اڈا ہسسو بلیل', 'adda jalal shah wala': 'اڈا جلال شاہ والا',
  'adda munirabad': 'اڈا منیر آباد', 'adda sial': 'اڈا سیال', 'betalis hazar adda': 'بیتالیس ہزار اڈا',
  'gharibabad mor colony': 'غریب آباد موڑ کالونی', 'adda pul faridabad': 'اڈا پل فرید آباد', 'mithial chowk': 'میتھیل چوک',
  'adda nurpur': 'اڈا نورپور', 'adda lundo': 'اڈا لوندو', 'abbas chowk': 'عباس چوک',
  'mandi ber': 'منڈی بیر', 'khui adda': 'کھوئی اڈا', 'china chowk': 'چین چوک',
  'mandiwala': 'منڈیوالا', 'madda': 'مدہ',

};

/**
 * Normalize Urdu text spelling variants to one canonical form so lookups
 * don't miss: Arabic yeh (ي U+064A) -> Urdu yeh (ی U+06CC),
 * Arabic kaf (ك U+0643) -> Urdu keheh (ک U+06A9).
 * WhatsApp messages typed on mixed keyboards often use the Arabic variants.
 */
export function normalizeUrduText(s: string): string {
  return s.replace(/ي/g, 'ی').replace(/ك/g, 'ک');
}

function normCity(c: string): string {
  return normalizeUrduText(c).trim().toLowerCase().replace(/[\s\-']/g, '');
}

export function mapToUrduCity(englishName: string): string | null {
  const key = normCity(englishName);
  for (const [en, ur] of Object.entries(CITY_EN_TO_UR)) {
    if (normCity(en) === key) return ur;
  }
  // Try partial match (e.g. "Lahore District" -> "Lahore")
  for (const [en, ur] of Object.entries(CITY_EN_TO_UR)) {
    const nEn = normCity(en);
    if (nEn.length > 3 && (key.includes(nEn) || nEn.includes(key))) return ur;
  }
  return null;
}

export function getStoredCity(): string | null {
  try {
    return localStorage.getItem(CITY_KEY);
  } catch {
    return null;
  }
}

export function saveCity(cityUrdu: string): void {
  try {
    localStorage.setItem(CITY_KEY, cityUrdu);
    localStorage.removeItem(DISMISS_KEY);
  } catch {}
}

export function clearCity(): void {
  try {
    localStorage.removeItem(CITY_KEY);
  } catch {}
}

export function isDismissed(): boolean {
  try {
    return localStorage.getItem(DISMISS_KEY) === '1';
  } catch {
    return false;
  }
}

export function dismissPrompt(): void {
  try {
    localStorage.setItem(DISMISS_KEY, '1');
  } catch {}
}

function getPosition(): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    if (!('geolocation' in navigator)) {
      reject(new Error('geolocation-unsupported'));
      return;
    }
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: false,
      timeout: 15000,
      maximumAge: 600000,
    });
  });
}

async function reverseGeocode(lat: number, lng: number): Promise<string | null> {
  try {
    const url = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();
    // Prefer city, then locality, then subdivision
    return data.city || data.locality || data.principalSubdivision || null;
  } catch {
    return null;
  }
}

/**
 * Full flow: ask browser for location, reverse-geocode to an English city name,
 * map it to the Urdu name used on the website. Returns null on any failure.
 */
export async function detectUserCity(): Promise<string | null> {
  try {
    const pos = await getPosition();
    const englishCity = await reverseGeocode(pos.coords.latitude, pos.coords.longitude);
    if (!englishCity) return null;
    return mapToUrduCity(englishCity);
  } catch {
    return null;
  }
}
