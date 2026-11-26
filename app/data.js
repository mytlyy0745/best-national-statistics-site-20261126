// NationStat data — World Bank World Development Indicators.
// Fetched 2026-11-26 from api.worldbank.org (no key needed). All latest
// values are for 2024; series cover 2015-2024. GDP series are in billions
// of current US dollars; population series are in millions of people.
// Values here are rounded from the API (2 decimals for rates, whole
// dollars for GDP per capita, whole people for population).

const YEARS = [2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024];

const INDICATORS = [
  { id: "population", label: "Population", code: "SP.POP.TOTL", unit: "people", kind: "count", decimals: 0, higherIsBetter: null, blurb: "People living in the country, mid-year estimate." },
  { id: "gdp", label: "GDP", code: "NY.GDP.MKTP.CD", unit: "US$", kind: "money", decimals: 0, higherIsBetter: true, blurb: "Gross domestic product in current US dollars." },
  { id: "gdpPerCapita", label: "GDP per capita", code: "NY.GDP.PCAP.CD", unit: "US$", kind: "money", decimals: 0, higherIsBetter: true, blurb: "GDP divided by mid-year population, current US dollars." },
  { id: "lifeExpectancy", label: "Life expectancy", code: "SP.DYN.LE00.IN", unit: "years", kind: "number", decimals: 1, higherIsBetter: true, blurb: "Years a newborn would live if current mortality rates held." },
  { id: "gdpGrowth", label: "GDP growth", code: "NY.GDP.MKTP.KD.ZG", unit: "% / yr", kind: "percent", decimals: 2, higherIsBetter: true, blurb: "Annual percentage growth of GDP at constant prices." },
  { id: "inflation", label: "Inflation", code: "FP.CPI.TOTL.ZG", unit: "% / yr", kind: "percent", decimals: 2, higherIsBetter: false, blurb: "Annual change in consumer prices, CPI." },
  { id: "unemployment", label: "Unemployment", code: "SL.UEM.TOTL.ZS", unit: "% of labour force", kind: "percent", decimals: 2, higherIsBetter: false, blurb: "Modelled ILO estimate, share of the labour force without work." },
  { id: "internetUsers", label: "Internet users", code: "IT.NET.USER.ZS", unit: "% of population", kind: "percent", decimals: 1, higherIsBetter: true, blurb: "People who used the internet in the last 3 months." },
  { id: "urbanPopulation", label: "Urban population", code: "SP.URB.TOTL.IN.ZS", unit: "% of population", kind: "percent", decimals: 1, higherIsBetter: null, blurb: "Share of people living in urban areas." },
];

const COUNTRIES = [
  {
    code: "US", name: "United States", flag: "🇺🇸", region: "North America",
    values: { population: 340003797, gdp: 29298013000000, gdpPerCapita: 86170, lifeExpectancy: 78.9, gdpGrowth: 2.79, inflation: 2.95, unemployment: 4.02, internetUsers: 94.7, urbanPopulation: 80.1 },
    gdp: [18295.02, 18804.91, 19612.10, 20656.52, 21539.98, 21375.28, 23725.65, 26054.61, 27811.52, 29298.01],
    pop: [321.82, 324.35, 326.61, 328.53, 330.23, 331.58, 332.10, 334.00, 336.76, 340.00],
  },
  {
    code: "CN", name: "China", flag: "🇨🇳", region: "Asia",
    values: { population: 1408975000, gdp: 18729668435848, gdpPerCapita: 13293, lifeExpectancy: 78.0, gdpGrowth: 4.96, inflation: 0.22, unemployment: 4.59, internetUsers: 92.0, urbanPopulation: 65.9 },
    gdp: [11280.81, 11456.02, 12537.56, 14147.77, 14560.17, 14996.41, 18201.70, 18316.77, 18270.36, 18729.67],
    pop: [1379.86, 1387.79, 1396.22, 1402.76, 1407.75, 1411.10, 1412.36, 1412.18, 1410.71, 1408.98],
  },
  {
    code: "IN", name: "India", flag: "🇮🇳", region: "Asia",
    values: { population: 1450935791, gdp: 3760813470501, gdpPerCapita: 2592, lifeExpectancy: 72.2, gdpGrowth: 7.10, inflation: 4.95, unemployment: 4.17, internetUsers: 64.9, urbanPopulation: 35.4 },
    gdp: [2103.59, 2294.80, 2651.47, 2702.93, 2835.61, 2674.85, 3167.27, 3249.94, 3500.91, 3760.81],
    pop: [1328.02, 1343.94, 1359.66, 1374.66, 1389.03, 1402.62, 1414.20, 1425.42, 1438.07, 1450.94],
  },
  {
    code: "JP", name: "Japan", flag: "🇯🇵", region: "Asia",
    values: { population: 123975371, gdp: 4190008188359, gdpPerCapita: 33797, lifeExpectancy: 84.0, gdpGrowth: -0.24, inflation: 2.74, unemployment: 2.50, internetUsers: 85.5, urbanPopulation: 92.2 },
    gdp: [4534.44, 5110.36, 5038.23, 5154.29, 5245.76, 5189.20, 5225.93, 4447.98, 4384.85, 4190.01],
    pop: [127.14, 127.08, 126.97, 126.81, 126.63, 126.26, 125.68, 125.12, 124.52, 123.98],
  },
  {
    code: "DE", name: "Germany", flag: "🇩🇪", region: "Europe",
    values: { population: 83516593, gdp: 4685592577805, gdpPerCapita: 56104, lifeExpectancy: 80.8, gdpGrowth: -0.50, inflation: 2.26, unemployment: 3.40, internetUsers: 93.5, urbanPopulation: 82.0 },
    gdp: [3425.10, 3536.79, 3765.35, 4055.43, 3959.89, 3941.40, 4355.25, 4201.02, 4562.21, 4685.59],
    pop: [81.69, 82.35, 82.66, 82.91, 83.09, 83.16, 83.20, 83.18, 83.29, 83.52],
  },
  {
    code: "GB", name: "United Kingdom", flag: "🇬🇧", region: "Europe",
    values: { population: 69281000, gdp: 3695539513534, gdpPerCapita: 53341, lifeExpectancy: 81.4, gdpGrowth: 1.08, inflation: 3.27, unemployment: 4.36, internetUsers: 95.5, urbanPopulation: 83.2 },
    gdp: [2945.58, 2706.81, 2699.12, 2897.03, 2875.71, 2724.00, 3194.56, 3181.24, 3420.80, 3695.54],
    pop: [65.09, 65.61, 65.96, 66.29, 66.63, 66.74, 66.98, 67.64, 68.53, 69.28],
  },
  {
    code: "FR", name: "France", flag: "🇫🇷", region: "Europe",
    values: { population: 68551653, gdp: 3160442622465, gdpPerCapita: 46103, lifeExpectancy: 83.0, gdpGrowth: 1.19, inflation: 2.00, unemployment: 7.40, internetUsers: 88.7, urbanPopulation: 78.8 },
    gdp: [2442.48, 2470.41, 2588.87, 2781.58, 2722.79, 2647.93, 2966.43, 2794.79, 3056.25, 3160.44],
    pop: [66.55, 66.72, 66.92, 67.16, 67.38, 67.60, 67.84, 68.18, 68.37, 68.55],
  },
  {
    code: "BR", name: "Brazil", flag: "🇧🇷", region: "South America",
    values: { population: 211998573, gdp: 2185821610689, gdpPerCapita: 10311, lifeExpectancy: 76.0, gdpGrowth: 3.42, inflation: 4.37, unemployment: 6.80, internetUsers: 84.5, urbanPopulation: 87.9 },
    gdp: [1802.21, 1795.69, 2063.51, 1916.93, 1873.29, 1476.11, 1670.65, 1951.92, 2191.13, 2185.82],
    pop: [201.68, 203.22, 204.70, 206.11, 207.46, 208.66, 209.55, 210.31, 211.14, 212.00],
  },
  {
    code: "ID", name: "Indonesia", flag: "🇮🇩", region: "Asia",
    values: { population: 283487931, gdp: 1396301788462, gdpPerCapita: 4925, lifeExpectancy: 71.3, gdpGrowth: 5.03, inflation: 2.18, unemployment: 3.30, internetUsers: 72.8, urbanPopulation: 58.8 },
    gdp: [860.85, 931.88, 1015.62, 1042.27, 1119.10, 1059.05, 1186.51, 1319.10, 1371.17, 1396.30],
    pop: [261.80, 264.63, 267.35, 269.95, 272.49, 274.81, 276.76, 278.83, 281.19, 283.49],
  },
  {
    code: "NG", name: "Nigeria", flag: "🇳🇬", region: "Africa",
    caveat: "Nigeria's GDP in current US dollars falls from $647bn in 2022 to $252bn in 2024 — mostly the naira's sharp depreciation, not a collapse in output. Its real GDP growth stayed positive. The Bank also revised Nigeria's GDP series in 2019, which is why the chart jumps that year.",
    values: { population: 232679478, gdp: 252261880140, gdpPerCapita: 1084, lifeExpectancy: 54.6, gdpGrowth: 4.07, inflation: 33.24, unemployment: 3.05, internetUsers: 41.2, urbanPopulation: 63.0 },
    gdp: [493.03, 404.65, 375.75, 421.74, 668.22, 598.59, 609.15, 646.95, 487.39, 252.26],
    pop: [190.67, 195.44, 200.25, 204.94, 209.49, 214.00, 218.53, 223.15, 227.88, 232.68],
  },
  {
    code: "KR", name: "South Korea", flag: "🇰🇷", region: "Asia",
    values: { population: 51751065, gdp: 1875388209407, gdpPerCapita: 36239, lifeExpectancy: 83.6, gdpGrowth: 2.00, inflation: 2.32, unemployment: 2.78, internetUsers: 97.9, urbanPopulation: 81.2 },
    gdp: [1539.21, 1579.15, 1710.20, 1824.25, 1751.05, 1744.07, 1942.31, 1799.36, 1844.80, 1875.39],
    pop: [51.01, 51.22, 51.36, 51.59, 51.76, 51.84, 51.77, 51.67, 51.71, 51.75],
  },
  {
    code: "CA", name: "Canada", flag: "🇨🇦", region: "North America",
    values: { population: 41262329, gdp: 2270076189683, gdpPerCapita: 55016, lifeExpectancy: 82.1, gdpGrowth: 2.05, inflation: 2.38, unemployment: 6.35, internetUsers: 94.4, urbanPopulation: 82.7 },
    gdp: [1556.51, 1528.00, 1649.27, 1725.33, 1743.73, 1655.69, 2022.38, 2200.56, 2196.59, 2270.08],
    pop: [35.70, 36.11, 36.55, 37.07, 37.62, 38.03, 38.24, 38.95, 40.05, 41.26],
  },
  {
    code: "AU", name: "Australia", flag: "🇦🇺", region: "Oceania",
    values: { population: 27194286, gdp: 1757022451653, gdpPerCapita: 64610, lifeExpectancy: 83.1, gdpGrowth: 1.37, inflation: 3.17, unemployment: 3.94, internetUsers: 96.1, urbanPopulation: 87.6 },
    gdp: [1356.81, 1211.59, 1330.89, 1433.14, 1398.35, 1333.34, 1560.62, 1695.63, 1734.45, 1757.02],
    pop: [23.82, 24.19, 24.59, 24.96, 25.33, 25.65, 25.69, 26.02, 26.66, 27.19],
  },
  {
    code: "MX", name: "Mexico", flag: "🇲🇽", region: "North America",
    values: { population: 130861007, gdp: 1830489311089, gdpPerCapita: 13988, lifeExpectancy: 75.3, gdpGrowth: 1.35, inflation: 4.72, unemployment: 2.68, internetUsers: 83.1, urbanPopulation: 79.8 },
    gdp: [1213.29, 1112.23, 1190.72, 1256.30, 1304.11, 1121.06, 1316.57, 1466.93, 1794.41, 1830.49],
    pop: [121.07, 122.25, 123.40, 124.57, 125.76, 126.80, 127.65, 128.61, 129.74, 130.86],
  },
  {
    code: "ZA", name: "South Africa", flag: "🇿🇦", region: "Africa",
    values: { population: 64007187, gdp: 401144998374, gdpPerCapita: 6267, lifeExpectancy: 66.3, gdpGrowth: 0.53, inflation: 4.36, unemployment: 32.28, internetUsers: 78.4, urbanPopulation: 63.7 },
    gdp: [346.71, 323.59, 381.45, 405.26, 389.33, 337.97, 419.99, 407.60, 381.44, 401.14],
    pop: [56.72, 57.26, 57.64, 58.61, 59.59, 60.56, 61.50, 62.38, 63.21, 64.01],
  },
];

const REGIONS = ["All", "Africa", "Asia", "Europe", "North America", "Oceania", "South America"];

const SOURCE_NOTE = "Source: World Bank, World Development Indicators (WDI), via api.worldbank.org. All figures are for 2024 unless a chart says otherwise.";
