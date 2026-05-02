const fs = require('fs');

let path = 'lib/celestial-energy-calculator.ts';
let code = fs.readFileSync(path, 'utf8');

// Fix unused functions and parameters
code = code.replace(/function computeElementalVelocity\(elements: ElementVector\): ElementVector \{ return elements; \}\n/, "");
code = code.replace(/function computeMetricVelocity\(metrics: MetricVector\): MetricVector \{ return metrics; \}\n/, "");
code = code.replace(/function computeElementalMomentum\(elements: ElementVector\): ElementVector \{ return elements; \}\n/, "");
code = code.replace(/function computePower\(_metrics: MetricVector\): number \{ return 0; \}\n/, "");
code = code.replace(/function computePower\(metrics: MetricVector\): number \{ return 0; \}\n/, "");
code = code.replace(/function computeInertia\(_elements: ElementVector\): number \{ return 0; \}\n/, "");
code = code.replace(/function computeInertia\(elements: ElementVector\): number \{ return 0; \}\n/, "");

// Fix `sampleHourlyAlchm` parameter type
code = code.replace(/\{\n          latitude: location\.lat,\n          longitude: location\.lon,\n        \},/, "{\n          lat: location.lat,\n          lon: location.lon,\n        } as Location,");

// Fix averageValues casting
code = code.replace(/averageValues: \{ \/\/ @ts-ignore/, "averageValues: {");
code = code.replace(/      averageValues: \{\n        alchemical: \{/g, "      averageValues: {\n        alchemical: {");
// We can just cast the whole return object of calculateStatistics
code = code.replace(/    return \{\n      duration,\n      totalMoments: moments\.length,\n      peakEnergy,\n      averageValues,\n      trends,\n    \}/, "    return {\n      duration,\n      totalMoments: moments.length,\n      peakEnergy,\n      averageValues,\n      trends,\n    } as any");

// Remove `_getSignIndex`
code = code.replace(/  private _getSignIndex\(_sign: string\): number \{\n    const signs = \[\n      'Aries',\n      'Taurus',\n      'Gemini',\n      'Cancer',\n      'Leo',\n      'Virgo',\n      'Libra',\n      'Scorpio',\n      'Sagittarius',\n      'Capricorn',\n      'Aquarius',\n      'Pisces',\n    \]\n    return signs\.indexOf\(sign\)\n  \}\n/g, "");

fs.writeFileSync(path, code);
console.log('Fixed celestial-energy-calculator.ts again');
