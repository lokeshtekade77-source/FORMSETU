// Field Mapping & Conflict Resolution Engine for FormSetu

const STOP_WORDS = new Set(['of', 'the', 'in', 'at', 'on', 'and', 'for', 'to', 'with', 'by', 'as', 'is', 'a', 'an']);

const SYNONYM_GROUPS: string[][] = [
  ['fullName', 'fullname', 'applicantname', 'candidatename', 'nameofapplicant', 'applicant', 'candidate', 'candidatenamefullname'],
  ['dateOfBirth', 'dateofbirth', 'dob', 'birthdate', 'date_of_birth', 'birth_date'],
  ['fatherName', 'fathername', 'fathersname', 'parentfathername', 'parent_father_name', 'father_name'],
  ['motherName', 'mothername', 'mothersname', 'parentmothername', 'parent_mother_name', 'mother_name'],
  ['address', 'residentialaddress', 'permanentaddress', 'correspondenceaddress', 'postaladdress', 'houseaddress', 'residential_address', 'permanent_address'],
  ['city', 'town', 'village', 'citytown', 'city_town'],
  ['district', 'districtname', 'district_name', 'taluka', 'tehsil'],
  ['state', 'domicilestate', 'statename', 'state_name', 'domicile_state'],
  ['pinCode', 'pincode', 'postalcode', 'zipcode', 'zip_code', 'postal_code'],
  ['category', 'castecategory', 'reservationcategory', 'caste_category', 'reservation_category'],
  ['college', 'college_name', 'institutionname', 'schoolcollege', 'institution', 'university', 'board', 'universityboard'],
  ['course', 'degree', 'programme', 'coursename', 'course_name'],
  ['branch', 'stream', 'specialization', 'discipline', 'branchstream'],
  ['currentYear', 'yearofstudy', 'grade', 'class', 'semester', 'currentsemester', 'currentyearsemester'],
  ['certificateNumber', 'certificateno', 'docserialno', 'serialno', 'certificate_no', 'certificate_number'],
  ['bankName', 'bankname', 'banknameofficial', 'bank_name'],
  ['ifsc', 'ifsc_code', 'ifsccode', 'bankifsc', 'bank_ifsc'],
  ['accountHolder', 'accountholder', 'accountholdername', 'holdername', 'accountowner', 'account_holder', 'account_holder_name'],
  ['accountNumber', 'accountno', 'accno', 'bankaccountnumber', 'account_number', 'bank_account_number']
];

export function normalizeString(str: string): string {
  if (!str) return '';
  return str
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function getTokens(str: string): string[] {
  const normalized = normalizeString(str);
  return normalized
    .split(' ')
    .filter(word => word.length > 0 && !STOP_WORDS.has(word));
}

export function getLevenshteinDistance(s1: string, s2: string): number {
  const m = s1.length;
  const n = s2.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));

  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (s1[i - 1] === s2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = Math.min(
          dp[i - 1][j] + 1,
          dp[i][j - 1] + 1,
          dp[i - 1][j - 1] + 1
        );
      }
    }
  }
  return dp[m][n];
}

export function getStringSimilarity(s1: string, s2: string): number {
  const norm1 = normalizeString(s1).replace(/\s/g, '');
  const norm2 = normalizeString(s2).replace(/\s/g, '');

  if (norm1 === norm2) return 1.0;
  if (!norm1 || !norm2) return 0.0;

  const maxLen = Math.max(norm1.length, norm2.length);
  const distance = getLevenshteinDistance(norm1, norm2);
  return (maxLen - distance) / maxLen;
}

export function areSynonyms(key1: string, key2: string): boolean {
  const n1 = normalizeString(key1).replace(/\s/g, '');
  const n2 = normalizeString(key2).replace(/\s/g, '');

  if (n1 === n2) return true;

  for (const group of SYNONYM_GROUPS) {
    const hasN1 = group.some(item => normalizeString(item).replace(/\s/g, '') === n1);
    const hasN2 = group.some(item => normalizeString(item).replace(/\s/g, '') === n2);
    if (hasN1 && hasN2) return true;
  }
  return false;
}

export interface SourceFieldPayload {
  key: string;
  label: string;
  value: string;
  sourceApplicationName: string;
  sourceApplicationId: string;
  updatedAt?: string;
}

export interface MappingResult {
  targetKey: string;
  targetLabel: string;
  bestMatch: SourceFieldPayload | null;
  confidence: number;
  matchType: 'Exact' | 'Synonym' | 'Fuzzy' | 'Token' | 'None';
  explanation: string;
  allMatches: {
    source: SourceFieldPayload;
    confidence: number;
    explanation: string;
  }[];
}

export class RuleBasedMapper {
  static mapField(targetKey: string, targetLabel: string, sources: SourceFieldPayload[]): MappingResult {
    let bestMatch: SourceFieldPayload | null = null;
    let confidence = 0;
    let matchType: MappingResult['matchType'] = 'None';
    let explanation = 'No match found';
    const allMatchesList: MappingResult['allMatches'] = [];

    const normTargetKey = normalizeString(targetKey).replace(/\s/g, '');
    const normTargetLabel = normalizeString(targetLabel).replace(/\s/g, '');

    for (const src of sources) {
      const normSrcKey = normalizeString(src.key).replace(/\s/g, '');
      const normSrcLabel = normalizeString(src.label).replace(/\s/g, '');

      let currentConf = 0;
      let currentType: MappingResult['matchType'] = 'None';
      let currentExplanation = '';

      if (normTargetKey === normSrcKey || normTargetLabel === normSrcLabel) {
        currentConf = 99;
        currentType = 'Exact';
        currentExplanation = `Exact key or label match: "${src.label}"`;
      } else if (areSynonyms(targetKey, src.key) || areSynonyms(targetLabel, src.label)) {
        currentConf = 87;
        currentType = 'Synonym';
        currentExplanation = `Recognized synonym: "${src.label}"`;
      }

      if (currentConf > 0) {
        allMatchesList.push({
          source: src,
          confidence: currentConf,
          explanation: currentExplanation
        });
      }

      if (currentConf > confidence) {
        confidence = currentConf;
        bestMatch = src;
        matchType = currentType;
        explanation = currentExplanation;
      }
    }

    return {
      targetKey,
      targetLabel,
      bestMatch,
      confidence,
      matchType,
      explanation,
      allMatches: allMatchesList.sort((a, b) => b.confidence - a.confidence)
    };
  }
}

export class SemanticMapper {
  static mapField(targetKey: string, targetLabel: string, sources: SourceFieldPayload[]): MappingResult {
    let bestMatch: SourceFieldPayload | null = null;
    let confidence = 0;
    let matchType: MappingResult['matchType'] = 'None';
    let explanation = 'No match found';
    const allMatchesList: MappingResult['allMatches'] = [];

    const targetTokens = getTokens(targetLabel);

    for (const src of sources) {
      const srcTokens = getTokens(src.label);
      const commonTokens = targetTokens.filter(t => srcTokens.includes(t));
      const tokenIntersectionRatio = targetTokens.length > 0 
        ? commonTokens.length / Math.max(targetTokens.length, srcTokens.length)
        : 0;

      const fuzzySimilarity = getStringSimilarity(targetLabel, src.label);
      
      let currentConf = 0;
      let currentType: MappingResult['matchType'] = 'None';
      let currentExplanation = '';

      if (fuzzySimilarity > 0.8) {
        currentConf = Math.round(fuzzySimilarity * 90);
        currentType = 'Fuzzy';
        currentExplanation = `High fuzzy text similarity (${currentConf}%) with "${src.label}"`;
      } else if (tokenIntersectionRatio > 0.5) {
        currentConf = Math.round(tokenIntersectionRatio * 85);
        currentType = 'Token';
        currentExplanation = `Shared keywords: ${commonTokens.join(', ')}`;
      } else if (fuzzySimilarity > 0.5) {
        currentConf = Math.round(fuzzySimilarity * 70);
        currentType = 'Fuzzy';
        currentExplanation = `Moderate fuzzy text similarity with "${src.label}"`;
      }

      if (currentConf > 30) {
        allMatchesList.push({
          source: src,
          confidence: currentConf,
          explanation: currentExplanation
        });
      }

      if (currentConf > confidence) {
        confidence = currentConf;
        bestMatch = src;
        matchType = currentType;
        explanation = currentExplanation;
      }
    }

    return {
      targetKey,
      targetLabel,
      bestMatch,
      confidence,
      matchType,
      explanation,
      allMatches: allMatchesList.sort((a, b) => b.confidence - a.confidence)
    };
  }
}

export class HybridMapper {
  static mapField(targetKey: string, targetLabel: string, sources: SourceFieldPayload[]): MappingResult {
    let bestMatch: SourceFieldPayload | null = null;
    let confidence = 0;
    let matchType: MappingResult['matchType'] = 'None';
    let explanation = 'No match found';
    const allMatchesList: MappingResult['allMatches'] = [];

    const targetTokens = getTokens(targetLabel);

    for (const src of sources) {
      let score = 0;
      let currentType: MappingResult['matchType'] = 'None';
      const scoreComponents: string[] = [];

      const normTargetKey = normalizeString(targetKey).replace(/\s/g, '');
      const normSrcKey = normalizeString(src.key).replace(/\s/g, '');
      const normTargetLabel = normalizeString(targetLabel).replace(/\s/g, '');
      const normSrcLabel = normalizeString(src.label).replace(/\s/g, '');

      if (normTargetKey === normSrcKey || normTargetLabel === normSrcLabel) {
        score += 55;
        scoreComponents.push('Exact key match (+55)');
        currentType = 'Exact';
      }

      if (score === 0 && (areSynonyms(targetKey, src.key) || areSynonyms(targetLabel, src.label))) {
        score += 65;
        scoreComponents.push('Synonym match (+65)');
        currentType = 'Synonym';
      }

      const srcTokens = getTokens(src.label);
      const commonTokens = targetTokens.filter(t => srcTokens.includes(t));
      if (commonTokens.length > 0) {
        const intersection = commonTokens.length / Math.max(targetTokens.length, srcTokens.length);
        const tokenBonus = Math.round(intersection * 15);
        score += tokenBonus;
        scoreComponents.push(`Token overlap: ${commonTokens.join(', ')} (+${tokenBonus})`);
        if (currentType === 'None') currentType = 'Token';
      }

      const fuzzySim = getStringSimilarity(targetLabel, src.label);
      if (fuzzySim > 0.4) {
        const fuzzyBonus = Math.round(fuzzySim * 15);
        score += fuzzyBonus;
        scoreComponents.push(`Fuzzy text similarity bonus (+${fuzzyBonus})`);
        if (currentType === 'None' || currentType === 'Token') currentType = 'Fuzzy';
      }

      const targetIsDate = /date|dob/i.test(targetKey) || /date/i.test(targetLabel);
      const srcIsDate = /date|dob/i.test(src.key) || /date/i.test(src.label);
      if (targetIsDate === srcIsDate) {
        score += 10;
        scoreComponents.push('Data-type compatibility match (+10)');
      }

      const finalConf = Math.min(score, 99);

      if (finalConf > 30) {
        allMatchesList.push({
          source: src,
          confidence: finalConf,
          explanation: scoreComponents.join(', ')
        });
      }

      if (finalConf > confidence) {
        confidence = finalConf;
        bestMatch = src;
        matchType = currentType;
        explanation = scoreComponents.join(', ');
      }
    }

    return {
      targetKey,
      targetLabel,
      bestMatch,
      confidence,
      matchType,
      explanation,
      allMatches: allMatchesList.sort((a, b) => b.confidence - a.confidence)
    };
  }
}

export class FieldMappingEngine {
  private mapperType: 'rule' | 'semantic' | 'hybrid' = 'hybrid';

  constructor(type: 'rule' | 'semantic' | 'hybrid' = 'hybrid') {
    this.mapperType = type;
  }

  public mapFields(targetFields: { key: string; label: string }[], sources: SourceFieldPayload[]): MappingResult[] {
    return targetFields.map(target => {
      if (this.mapperType === 'rule') {
        return RuleBasedMapper.mapField(target.key, target.label, sources);
      } else if (this.mapperType === 'semantic') {
        return SemanticMapper.mapField(target.key, target.label, sources);
      } else {
        return HybridMapper.mapField(target.key, target.label, sources);
      }
    });
  }

  public static detectConflicts(mappings: MappingResult[]): Record<string, SourceFieldPayload[]> {
    const conflicts: Record<string, SourceFieldPayload[]> = {};

    mappings.forEach(m => {
      if (m.allMatches.length > 1) {
        const uniqueValuesMap = new Map<string, SourceFieldPayload>();
        m.allMatches.forEach(match => {
          const cleanVal = match.source.value.trim().toLowerCase();
          if (!uniqueValuesMap.has(cleanVal)) {
            uniqueValuesMap.set(cleanVal, match.source);
          }
        });

        if (uniqueValuesMap.size > 1) {
          conflicts[m.targetKey] = Array.from(uniqueValuesMap.values());
        }
      }
    });

    return conflicts;
  }
}

export function parseExternalJsonPayload(
  jsonData: Record<string, unknown>,
  sourceName: string = "Uploaded External File"
): SourceFieldPayload[] {
  const result: SourceFieldPayload[] = [];
  
  const extract = (obj: Record<string, unknown>, prefix = "") => {
    for (const [k, v] of Object.entries(obj)) {
      if (v === null || v === undefined) continue;
      if (typeof v === "object" && !Array.isArray(v)) {
        extract(v as Record<string, unknown>, prefix ? `${prefix}.${k}` : k);
      } else if (typeof v !== "object") {
        const key = prefix ? `${prefix}.${k}` : k;
        const label = k.replace(/([a-z])([A-Z])/g, "$1 $2").replace(/_/g, " ");
        result.push({
          key,
          label: label.charAt(0).toUpperCase() + label.slice(1),
          value: String(v),
          sourceApplicationName: sourceName,
          sourceApplicationId: `external-${Date.now()}`
        });
      }
    }
  };

  extract(jsonData);
  return result;
}

