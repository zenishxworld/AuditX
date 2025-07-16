export interface Vulnerability {
  id: string;
  title: string;
  severity: 'Critical' | 'High' | 'Medium' | 'Low' | 'Info';
  line: number;
  description: string;
  code: string;
  suggestions: string[];
}

export interface AuditScores {
  security: number;
  gasEfficiency: number;
  performance: number;
  codeQuality: number;
  documentation: number;
}

export interface AuditReport {
  overallScore: number;
  scores: AuditScores;
  vulnerabilities: Vulnerability[];
  suggestions: string[];
}

export class SolidityAnalyzer {
  private code: string;
  private lines: string[];

  constructor(code: string) {
    this.code = code;
    this.lines = code.split('\n');
  }

  analyze(): AuditReport {
    const vulnerabilities: Vulnerability[] = [];
    
    // Pattern-based detections
    vulnerabilities.push(...this.detectReentrancy());
    vulnerabilities.push(...this.detectOverflowUnderflow());
    vulnerabilities.push(...this.detectGasInefficiency());
    vulnerabilities.push(...this.detectAccessControl());
    vulnerabilities.push(...this.detectMissingNatSpec());

    // Calculate scores
    const scores = this.calculateScores(vulnerabilities);
    const overallScore = this.calculateOverallScore(scores);
    const suggestions = this.generateSuggestions(vulnerabilities);

    return {
      overallScore,
      scores,
      vulnerabilities,
      suggestions
    };
  }

  private detectReentrancy(): Vulnerability[] {
    const vulnerabilities: Vulnerability[] = [];
    const patterns = [
      /\.call\{value:\s*[^}]+\}/g,
      /\.call\.value\(/g,
      /\.send\(/g,
      /\.transfer\(/g
    ];

    this.lines.forEach((line, index) => {
      patterns.forEach(pattern => {
        if (pattern.test(line)) {
          // Check if state is modified after external call
          const hasStateModificationAfter = this.hasStateModificationAfterCall(index);
          
          vulnerabilities.push({
            id: `reentrancy-${index}`,
            title: 'Potential Reentrancy Vulnerability',
            severity: hasStateModificationAfter ? 'Critical' : 'High',
            line: index + 1,
            description: 'External call detected. Ensure state updates happen before external calls to prevent reentrancy attacks.',
            code: line.trim(),
            suggestions: [
              'Use the checks-effects-interactions pattern',
              'Apply ReentrancyGuard from OpenZeppelin',
              'Update state before external calls',
              'Consider using transfer() instead of call() for simple ether transfers'
            ]
          });
        }
      });
    });

    return vulnerabilities;
  }

  private detectOverflowUnderflow(): Vulnerability[] {
    const vulnerabilities: Vulnerability[] = [];
    const mathPattern = /(\w+)\s*[\+\-\*\/\%]\s*(\w+)/g;
    const safeMathPattern = /SafeMath|using\s+SafeMath/i;
    const solidityVersionPattern = /pragma\s+solidity\s+[\^>]?0\.([8-9]|\d{2,})/;

    const hasSafeMath = safeMathPattern.test(this.code);
    const hasModernSolidity = solidityVersionPattern.test(this.code);

    if (!hasSafeMath && !hasModernSolidity) {
      this.lines.forEach((line, index) => {
        if (mathPattern.test(line) && !line.includes('//') && !line.includes('*')) {
          vulnerabilities.push({
            id: `overflow-${index}`,
            title: 'Potential Integer Overflow/Underflow',
            severity: 'Medium',
            line: index + 1,
            description: 'Arithmetic operations without SafeMath or Solidity ^0.8.0 can cause overflow/underflow.',
            code: line.trim(),
            suggestions: [
              'Use OpenZeppelin\'s SafeMath library',
              'Upgrade to Solidity ^0.8.0 for built-in overflow protection',
              'Add explicit overflow/underflow checks',
              'Use checked{} blocks for arithmetic operations'
            ]
          });
        }
      });
    }

    return vulnerabilities;
  }

  private detectGasInefficiency(): Vulnerability[] {
    const vulnerabilities: Vulnerability[] = [];
    const forLoopPattern = /for\s*\(/;
    const storageAccessPattern = /\w+\[\w*\]\s*=/;

    this.lines.forEach((line, index) => {
      if (forLoopPattern.test(line)) {
        // Look for storage access in the next few lines
        for (let i = index; i < Math.min(index + 10, this.lines.length); i++) {
          if (storageAccessPattern.test(this.lines[i])) {
            vulnerabilities.push({
              id: `gas-loop-${index}`,
              title: 'Gas Inefficient Storage Access in Loop',
              severity: 'Low',
              line: i + 1,
              description: 'Storage operations inside loops can be expensive. Consider moving data to memory.',
              code: this.lines[i].trim(),
              suggestions: [
                'Move storage array to memory before the loop',
                'Cache storage variables in memory',
                'Use memory arrays for intermediate calculations',
                'Consider batch operations to reduce gas costs'
              ]
            });
            break;
          }
        }
      }
    });

    return vulnerabilities;
  }

  private detectAccessControl(): Vulnerability[] {
    const vulnerabilities: Vulnerability[] = [];
    const functionPattern = /function\s+\w+\s*\([^)]*\)\s*(public|external)/g;
    const modifierPattern = /(onlyOwner|require\s*\(\s*msg\.sender|modifier)/;

    this.lines.forEach((line, index) => {
      if (functionPattern.test(line) && !modifierPattern.test(line)) {
        // Check if the function has access control in the body
        const hasAccessControlInBody = this.hasAccessControlInFunction(index);
        
        if (!hasAccessControlInBody) {
          vulnerabilities.push({
            id: `access-${index}`,
            title: 'Missing Access Control',
            severity: 'High',
            line: index + 1,
            description: 'Public/external function without access control modifiers.',
            code: line.trim(),
            suggestions: [
              'Add onlyOwner modifier for administrative functions',
              'Use OpenZeppelin\'s AccessControl for role-based permissions',
              'Add require() statements to check msg.sender',
              'Consider making function internal if not needed externally'
            ]
          });
        }
      }
    });

    return vulnerabilities;
  }

  private detectMissingNatSpec(): Vulnerability[] {
    const vulnerabilities: Vulnerability[] = [];
    const functionPattern = /function\s+\w+/g;
    const natspecPattern = /\/\/\/|\/\*\*/;
    
    let totalFunctions = 0;
    let documentedFunctions = 0;

    this.lines.forEach((line, index) => {
      if (functionPattern.test(line)) {
        totalFunctions++;
        
        // Check previous lines for NatSpec comments
        const hasNatSpec = this.hasNatSpecAbove(index);
        
        if (hasNatSpec) {
          documentedFunctions++;
        } else {
          vulnerabilities.push({
            id: `natspec-${index}`,
            title: 'Missing NatSpec Documentation',
            severity: 'Info',
            line: index + 1,
            description: 'Function lacks NatSpec documentation for better code maintainability.',
            code: line.trim(),
            suggestions: [
              'Add @notice for function description',
              'Add @param for parameter descriptions',
              'Add @return for return value descriptions',
              'Use /// for single-line NatSpec comments'
            ]
          });
        }
      }
    });

    return vulnerabilities;
  }

  private hasStateModificationAfterCall(callLineIndex: number): boolean {
    // Look for state modifications in the next 5 lines
    for (let i = callLineIndex + 1; i < Math.min(callLineIndex + 5, this.lines.length); i++) {
      const line = this.lines[i];
      if (/\w+\s*=/.test(line) || /\w+\+\+/.test(line) || /\w+--/.test(line)) {
        return true;
      }
    }
    return false;
  }

  private hasAccessControlInFunction(functionLineIndex: number): boolean {
    // Look for access control in the next 10 lines
    for (let i = functionLineIndex; i < Math.min(functionLineIndex + 10, this.lines.length); i++) {
      const line = this.lines[i];
      if (/require\s*\(\s*msg\.sender|onlyOwner/.test(line)) {
        return true;
      }
      if (line.includes('}')) break; // End of function
    }
    return false;
  }

  private hasNatSpecAbove(functionLineIndex: number): boolean {
    // Check previous 3 lines for NatSpec
    for (let i = Math.max(0, functionLineIndex - 3); i < functionLineIndex; i++) {
      const line = this.lines[i];
      if (/\/\/\/|\/\*\*/.test(line)) {
        return true;
      }
    }
    return false;
  }

  private calculateScores(vulnerabilities: Vulnerability[]): AuditScores {
    const severityWeights = { Critical: 10, High: 7, Medium: 5, Low: 3, Info: 1 };
    const maxPenalty = 40; // Maximum penalty points
    
    let securityPenalty = 0;
    let gasPenalty = 0;
    let performancePenalty = 0;
    let qualityPenalty = 0;
    let docPenalty = 0;

    vulnerabilities.forEach(vuln => {
      const penalty = severityWeights[vuln.severity];
      
      if (vuln.title.includes('Reentrancy') || vuln.title.includes('Access Control') || vuln.title.includes('Overflow')) {
        securityPenalty += penalty;
      }
      if (vuln.title.includes('Gas')) {
        gasPenalty += penalty;
      }
      if (vuln.title.includes('Loop') || vuln.title.includes('Storage')) {
        performancePenalty += penalty;
      }
      if (vuln.title.includes('NatSpec')) {
        docPenalty += penalty;
      }
      
      qualityPenalty += penalty * 0.3; // All issues affect code quality
    });

    return {
      security: Math.max(1, 10 - Math.min(maxPenalty, securityPenalty) / 4),
      gasEfficiency: Math.max(1, 10 - Math.min(maxPenalty, gasPenalty) / 4),
      performance: Math.max(1, 10 - Math.min(maxPenalty, performancePenalty) / 4),
      codeQuality: Math.max(1, 10 - Math.min(maxPenalty, qualityPenalty) / 4),
      documentation: Math.max(1, 10 - Math.min(maxPenalty, docPenalty) / 4)
    };
  }

  private calculateOverallScore(scores: AuditScores): number {
    const weights = {
      security: 0.3,
      gasEfficiency: 0.2,
      performance: 0.2,
      codeQuality: 0.2,
      documentation: 0.1
    };

    const weighted = 
      scores.security * weights.security +
      scores.gasEfficiency * weights.gasEfficiency +
      scores.performance * weights.performance +
      scores.codeQuality * weights.codeQuality +
      scores.documentation * weights.documentation;

    return Math.round(weighted * 10) / 10;
  }

  private generateSuggestions(vulnerabilities: Vulnerability[]): string[] {
    const suggestions = new Set<string>();
    
    suggestions.add('Follow the checks-effects-interactions pattern for all external calls');
    suggestions.add('Use OpenZeppelin libraries for common security patterns');
    suggestions.add('Add comprehensive NatSpec documentation to all public functions');
    suggestions.add('Implement proper access control for administrative functions');
    suggestions.add('Consider gas optimization for frequently called functions');
    suggestions.add('Add event emissions for important state changes');
    suggestions.add('Use latest Solidity version with built-in overflow protection');
    
    return Array.from(suggestions);
  }
}