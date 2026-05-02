const fs = require('fs');
const path = 'components/charts/alchemical-metrics-chart.tsx';
let code = fs.readFileSync(path, 'utf8');

code = code.replace(/  RadialBarChart,\n  RadialBar,\n  Cell,\n  PieChart,\n  Pie,\n/, "");
code = code.replace(/  Settings,\n  Eye,\n  EyeOff,\n  Layers,\n/, "");
code = code.replace("Tabs, TabsContent, TabsList, TabsTrigger", "Tabs, TabsList, TabsTrigger");

code = code.replace(
  "onTimeSelect,\n  onAgentActivation,\n  height = 500,\n  enableComparison = false,\n  comparisonData,",
  "_onTimeSelect,\n  _onAgentActivation,\n  height = 500,\n  _enableComparison = false,\n  _comparisonData,"
);

code = code.replace("const [hoveredPoint, setHoveredPoint] = useState<CelestialMoment | null>(null)\n", "");

code = code.replace(
  "const CustomTooltip = ({ active, payload, label }: any) => {",
  "const CustomTooltip = ({ active, payload, _label }: any) => {"
);

code = code.replace(
  "onValueChange={setSelectedTimeRange}",
  "onValueChange={(val: number[]) => setSelectedTimeRange(val as [number, number])}"
);

fs.writeFileSync(path, code);
console.log('Fixed alchemical-metrics-chart.tsx');
