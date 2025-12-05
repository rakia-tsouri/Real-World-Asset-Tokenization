from flask import Flask, request, jsonify
from flask_cors import CORS
from openai import OpenAI
import subprocess
import tempfile
import os
import json
import re
from datetime import datetime
import requests
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
CORS(app)

# Configure LLM client (OpenRouter or OpenAI)
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")
OPENROUTER_MODEL = os.getenv("OPENROUTER_MODEL", "openrouter/openai/gpt-4o-mini")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
OPENAI_MODEL = os.getenv("OPENAI_MODEL", "gpt-4o-mini")

if OPENROUTER_API_KEY:
    # Use OpenRouter as drop-in replacement
    llm_client = OpenAI(
        base_url="https://openrouter.ai/api/v1",
        api_key=OPENROUTER_API_KEY,
    )
    LLM_MODEL = OPENROUTER_MODEL

class SmartContractAuditor:
    def __init__(self):
        self.analysis_results = {}
    
    def analyze_syntax(self, code):
        """
        Full Solidity syntax / semantic validation using `solc`.

        This is no longer a couple of regex checks – we actually invoke the Solidity
        compiler so that:
        - the full grammar is parsed,
        - the structure of the code is validated,
        - types / identifiers are checked,
        - and precise syntax / type errors are returned.

        The return shape is:
        {
            "valid": bool,
            "errors": [ { "type", "message", "source_location" } ],
            "warnings": [ ... ],
        }
        """
        try:
            # Write the contract to a temporary .sol file
            with tempfile.NamedTemporaryFile(mode="w", suffix=".sol", delete=False) as f:
                f.write(code)
                temp_file = f.name

            # Ask solc to fully parse / type-check the file.
            # --ast-json forces a full parse; any syntax / type errors will be emitted on stderr.
            result = subprocess.run(
                ["solc", "--ast-json", temp_file],
                capture_output=True,
                text=True,
                timeout=30,
            )
        except FileNotFoundError:
            # solc not installed or not in PATH – fall back to very basic checks
            return {
                "valid": False,
                "errors": [
                    {
                        "type": "EnvironmentError",
                        "message": (
                            "Solidity compiler (solc) not found in PATH. "
                            "Install solc to enable full grammar / type analysis."
                        ),
                        "source_location": None,
                    }
                ],
                "warnings": [],
            }
        except subprocess.TimeoutExpired:
            return {
                "valid": False,
                "errors": [
                    {
                        "type": "Timeout",
                        "message": "Solidity compiler (solc) timed out while analyzing the contract.",
                        "source_location": None,
                    }
                ],
                "warnings": [],
            }
        except Exception as e:
            return {
                "valid": False,
                "errors": [
                    {
                        "type": "UnknownError",
                        "message": str(e),
                        "source_location": None,
                    }
                ],
                "warnings": [],
            }
        finally:
            # Clean up temporary file
            try:
                if "temp_file" in locals() and os.path.exists(temp_file):
                    os.unlink(temp_file)
            except Exception:
                pass

        # At this point, solc has run successfully (no exceptions). We now interpret its result.
        def _parse_solc_messages(stderr: str):
            """
            Very lightweight parser for solc stderr to extract error / warning objects.
            We don't depend on any external library here, just string processing.
            """
            errors = []
            warnings = []

            for line in stderr.splitlines():
                line = line.strip()
                if not line:
                    continue

                entry = {
                    "type": "CompilerMessage",
                    "message": line,
                    "source_location": None,
                }

                # Classify error vs warning using common solc prefixes
                lower = line.lower()
                if "error" in lower:
                    entry["type"] = "Error"
                    errors.append(entry)
                elif "warning" in lower:
                    entry["type"] = "Warning"
                    warnings.append(entry)
                else:
                    # If we cannot classify, treat as warning-level diagnostic
                    warnings.append(entry)

            return errors, warnings

        errors, warnings = _parse_solc_messages(result.stderr or "")

        if result.returncode != 0:
            # Compilation failed – syntax / type issues present
            return {
                "valid": False,
                "errors": errors if errors else [
                    {
                        "type": "CompilationFailed",
                        "message": result.stderr or "Unknown compiler error",
                        "source_location": None,
                    }
                ],
                "warnings": warnings,
            }

        # Compilation succeeded – grammar / structure / types are all valid
        return {
            "valid": True,
            "errors": [],
            "warnings": warnings,
        }
    
    def run_slither_analysis(self, code):
        """Run Slither static analysis"""
        try:
            # Create temporary file
            with tempfile.NamedTemporaryFile(mode='w', suffix='.sol', delete=False) as f:
                f.write(code)
                temp_file = f.name
            
            # Run Slither
            result = subprocess.run(
                ['slither', temp_file, '--json', '-'],
                capture_output=True,
                text=True,
                timeout=30
            )
            
            # Clean up
            os.unlink(temp_file)
            
            if result.returncode == 0:
                try:
                    slither_output = json.loads(result.stdout)
                    return self.parse_slither_results(slither_output)
                except json.JSONDecodeError:
                    return {'issues': [], 'error': 'Failed to parse Slither output'}
            else:
                return {'issues': [], 'error': result.stderr}
                
        except subprocess.TimeoutExpired:
            return {'issues': [], 'error': 'Slither analysis timed out'}
        except Exception as e:
            return {'issues': [], 'error': str(e)}
    
    def parse_slither_results(self, slither_output):
        """Parse Slither analysis results"""
        issues = []
        
        if 'results' in slither_output:
            for detector in slither_output['results'].get('detectors', []):
                issue = {
                    'severity': detector.get('impact', 'medium'),
                    'title': detector.get('check', 'Unknown'),
                    'description': detector.get('description', ''),
                    'line': detector.get('line', 0),
                    'fix': self.generate_fix_suggestion(detector.get('check', ''))
                }
                issues.append(issue)
        
        return {'issues': issues}
    
    def generate_fix_suggestion(self, issue_type):
        """Generate fix suggestions based on issue type"""
        fixes = {
            'reentrancy': 'Use ReentrancyGuard modifier and follow checks-effects-interactions pattern',
            'unchecked-transfer': 'Check return values of external calls',
            'unchecked-low-level-call': 'Check return values of low-level calls',
            'unchecked-send': 'Check return values of send operations',
            'uninitialized-state': 'Initialize state variables in constructor',
            'uninitialized-local': 'Initialize local variables before use',
            'unused-return': 'Check return values of external calls',
            'unused-state': 'Remove unused state variables',
            'unused-return': 'Use return values or remove unused returns',
            'costly-loop': 'Optimize loops to reduce gas costs',
            'dead-code': 'Remove dead code to reduce contract size'
        }
        return fixes.get(issue_type.lower(), 'Review and fix according to best practices')
    
    def analyze_with_gpt4(self, code):
        """Analyze contract with LLM (OpenRouter/OpenAI)"""
        try:
            prompt = f"""
            Analyze this Solidity smart contract for security vulnerabilities and best practices.
            Provide a detailed analysis including:
            1. Security vulnerabilities (critical, high, medium, low)
            2. Gas optimization opportunities
            3. Best practices violations
            4. Specific line numbers and fixes
            
            Contract code:
            {code}
            
            Format your response as JSON with the following structure:
            {{
                "vulnerabilities": [
                    {{
                        "severity": "critical|high|medium|low",
                        "title": "Vulnerability title",
                        "description": "Detailed description",
                        "line": line_number,
                        "fix": "Suggested fix"
                    }}
                ],
                "gas_optimizations": [
                    {{
                        "title": "Optimization title",
                        "description": "Description",
                        "line": line_number,
                        "savings": "Estimated gas savings"
                    }}
                ],
                "best_practices": [
                    {{
                        "title": "Practice title",
                        "description": "Description",
                        "line": line_number
                    }}
                ]
            }}
            """
            
            response = llm_client.chat.completions.create(
                model=LLM_MODEL,
                messages=[
                    {
                        "role": "system",
                        "content": "You are a smart contract security expert. Analyze Solidity contracts for vulnerabilities, gas usage, and regulatory/compliance risks, and provide specific, actionable recommendations."
                    },
                    {"role": "user", "content": prompt}
                ],
                max_tokens=2000,
                temperature=0.1,
            )
            
            # Parse GPT response
            try:
                gpt_analysis = json.loads(response.choices[0].message.content)
                return gpt_analysis
            except json.JSONDecodeError:
                # Fallback if JSON parsing fails
                return {
                    "vulnerabilities": [],
                    "gas_optimizations": [],
                    "best_practices": [],
                    "raw_response": response.choices[0].message.content
                }
                
        except Exception as e:
            return {
                "vulnerabilities": [],
                "gas_optimizations": [],
                "best_practices": [],
                "error": str(e)
            }
    
    def analyze_compliance_rules(self, code: str):
        """
        Heuristic checks for:
        - ERC standard compliance (ERC20 / ERC721-like APIs)
        - Access control on sensitive functions (mint / transfer / pause)
        - Basic KYC/AML-style restrictions (presence of blacklist/whitelist/pausable logic)

        This is not as strong as MythX/Certora, but gives quick guidance that can be
        surfaced in a dedicated "Règles" panel in the UI.
        """
        rules = []

        normalized = code.lower()

        # --- Detect ERC20-like interface presence ---
        erc20_signatures = [
            "function totalsupply(",
            "function balanceof(",
            "function transfer(",
            "function transferfrom(",
            "function approve(",
            "function allowance(",
            "event transfer(",
            "event approval(",
        ]
        erc20_hits = [sig for sig in erc20_signatures if sig in normalized]

        if erc20_hits:
            # If some but not all mandatory pieces are there, flag partial compliance
            missing = [sig for sig in erc20_signatures if sig not in normalized]
            if missing:
                rules.append({
                    "category": "erc_standard",
                    "standard": "ERC20",
                    "severity": "medium",
                    "title": "Partial ERC20 interface detected",
                    "description": (
                        "The contract exposes some ERC20-like functions, but appears to be missing "
                        "others (e.g. events or mandatory methods). This may break tooling or wallets "
                        "that expect full ERC20 compliance."
                    ),
                    "details": {
                        "present": erc20_hits,
                        "missing": missing,
                    },
                })
            else:
                rules.append({
                    "category": "erc_standard",
                    "standard": "ERC20",
                    "severity": "low",
                    "title": "ERC20 interface detected",
                    "description": (
                        "The contract exposes all core ERC20 interface elements. "
                        "Consider validating behavior against the full ERC20 specification."
                    ),
                })

        # --- Detect ERC721-like interface presence ---
        erc721_signatures = [
            "function ownerof(",
            "function safetransferfrom(",
            "function transferfrom(",
            "event transfer(",
            "event approval(",
        ]
        erc721_hits = [sig for sig in erc721_signatures if sig in normalized]
        if erc721_hits:
            rules.append({
                "category": "erc_standard",
                "standard": "ERC721",
                "severity": "low",
                "title": "ERC721-like interface detected",
                "description": (
                    "The contract exposes ERC721-like functions/events. Verify full ERC721 compliance "
                    "including safe transfer semantics and approval flows."
                ),
                "details": {"present": erc721_hits},
            })

        # --- Access control on sensitive functions (mint / transfer / pause) ---
        # Simple heuristic: look for mint/transfer functions that do not use onlyOwner / AccessControl modifiers.
        sensitive_patterns = [
            r"function\s+mint\s*\(",
            r"function\s+burn\s*\(",
            r"function\s+pause\s*\(",
        ]

        uses_oz_access = "import \"@openzeppelin" in normalized or "openzeppelin/contracts/access" in normalized
        has_only_owner = "onlyowner" in normalized
        has_access_control = "accesscontrol" in normalized

        for pattern in sensitive_patterns:
            for match in re.finditer(pattern, code, flags=re.IGNORECASE):
                line_no = code[: match.start()].count("\n") + 1
                # Grab the function signature line
                line_start = code.rfind("\n", 0, match.start()) + 1
                line_end = code.find("\n", match.start())
                if line_end == -1:
                    line_end = len(code)
                signature_line = code[line_start:line_end].lower()

                if "onlyowner" not in signature_line and "only_role" not in signature_line:
                    rules.append({
                        "category": "access_control",
                        "standard": "AccessControl / Ownable",
                        "severity": "high",
                        "title": "Sensitive function without explicit access control",
                        "description": (
                            "Sensitive function (e.g. mint/burn/pause) is not obviously protected by "
                            "an access-control modifier such as onlyOwner or onlyRole. "
                            "For compliance (e.g. KYC/AML constraints), ensure that only authorized "
                            "roles can call this function."
                        ),
                        "line": line_no,
                        "details": {
                            "signature": signature_line.strip(),
                            "hint": "Consider using OpenZeppelin Ownable / AccessControl or Defender."
                        },
                    })

        # If the contract uses OpenZeppelin access control, add an informational rule
        if uses_oz_access or has_only_owner or has_access_control:
            rules.append({
                "category": "access_control",
                "standard": "OpenZeppelin",
                "severity": "low",
                "title": "Access control pattern detected",
                "description": (
                    "The contract appears to use OpenZeppelin-style access control (Ownable/AccessControl). "
                    "Review role assignments to ensure they match your governance and compliance policies."
                ),
            })

        # --- Basic KYC/AML-style checks (very high-level) ---
        has_blacklist = "blacklist" in normalized or "blocked" in normalized
        has_whitelist = "whitelist" in normalized or "kyc" in normalized
        has_pause = "pause" in normalized or "paused" in normalized

        if not (has_blacklist or has_whitelist or has_pause):
            rules.append({
                "category": "kyc_aml",
                "severity": "medium",
                "title": "No explicit transfer restrictions detected",
                "description": (
                    "The contract does not appear to implement explicit transfer restrictions "
                    "(blacklist/whitelist/pausable mechanics). If the token must comply with KYC/AML "
                    "requirements or jurisdictional restrictions, consider adding proper controls."
                ),
            })
        else:
            rules.append({
                "category": "kyc_aml",
                "severity": "low",
                "title": "Basic restriction mechanics detected",
                "description": (
                    "The contract includes constructs related to blacklists/whitelists/pausable logic. "
                    "Ensure that these mechanisms are enforced consistently in all transfer/mint paths."
                ),
                "details": {
                    "blacklist": has_blacklist,
                    "whitelist": has_whitelist,
                    "pause": has_pause,
                },
            })

        return rules

    def analyze_with_mythx(self, code: str):
        """
        Optional integration with MythX (external SaaS / CLI).

        We use the `mythx` CLI if it is available in PATH and, optionally,
        a `MYTHX_API_KEY` environment variable is configured.

        The output is normalized to a list of "rule-like" entries so that the UI
        can display them in the same "Règles" tab.
        """
        mythx_api_key = os.getenv("MYTHX_API_KEY")
        rules = []

        # If the CLI is not configured, just return an informational rule
        try:
            with tempfile.NamedTemporaryFile(mode="w", suffix=".sol", delete=False) as f:
                f.write(code)
                temp_file = f.name

            # Basic command; the user can fine‑tune MythX via environment variables
            cmd = ["mythx", "analyze", temp_file, "--mode", "quick", "--format", "json"]
            result = subprocess.run(
                cmd,
                capture_output=True,
                text=True,
                timeout=300,
            )
        except FileNotFoundError:
            rules.append({
                "category": "external_tool",
                "standard": "MythX",
                "severity": "low",
                "title": "MythX not available",
                "description": (
                    "The MythX CLI was not found in PATH. "
                    "Install `mythx-cli` and configure MYTHX_API_KEY to enable MythX analysis."
                ),
            })
            return rules
        except subprocess.TimeoutExpired:
            rules.append({
                "category": "external_tool",
                "standard": "MythX",
                "severity": "medium",
                "title": "MythX analysis timed out",
                "description": "MythX analysis did not finish within the configured timeout.",
            })
            return rules
        finally:
            try:
                if "temp_file" in locals() and os.path.exists(temp_file):
                    os.unlink(temp_file)
            except Exception:
                pass

        if result.returncode != 0:
            rules.append({
                "category": "external_tool",
                "standard": "MythX",
                "severity": "medium",
                "title": "MythX analysis failed",
                "description": result.stderr or "Unknown MythX error",
            })
            return rules

        # Try to parse MythX JSON output (if available)
        try:
            payload = json.loads(result.stdout or "{}")
        except json.JSONDecodeError:
            rules.append({
                "category": "external_tool",
                "standard": "MythX",
                "severity": "low",
                "title": "MythX output could not be parsed",
                "description": "MythX returned a non‑JSON result. See raw CLI output for details.",
            })
            return rules

        # MythX structure can vary; we only surface high‑level findings.
        issues = payload.get("issues") or payload.get("analysis") or []
        if not isinstance(issues, list):
            issues = []

        for issue in issues:
            msg = issue.get("description") or issue.get("title") or "MythX issue"
            severity = (issue.get("severity") or "medium").lower()
            loc = None
            try:
                loc = issue.get("locations", [{}])[0].get("sourceMap")
            except Exception:
                loc = None

            rules.append({
                "category": "external_tool",
                "standard": "MythX",
                "severity": severity,
                "title": "MythX finding",
                "description": msg,
                "details": issue,
            })

        # If we have an API key configured but no issues, still add an info rule
        if mythx_api_key and not issues:
            rules.append({
                "category": "external_tool",
                "standard": "MythX",
                "severity": "low",
                "title": "MythX analysis completed",
                "description": "MythX did not report additional issues for this contract.",
            })

        return rules

    def analyze_with_certora(self, code: str):
        """
        Optional integration with Certora Prover.

        This assumes:
        - `certoraRun` is available in PATH
        - the user has prepared a specification (.spec) file
        - environment variables:
            CERTORA_SPEC_PATH=/path/to/spec.spec
            CERTORA_CONTRACT_NAME=MyContract

        We run a lightweight `certoraRun` command and surface its status as rule entries.
        """
        spec_path = os.getenv("CERTORA_SPEC_PATH")
        contract_name = os.getenv("CERTORA_CONTRACT_NAME", "Contract")

        rules = []

        if not spec_path:
            rules.append({
                "category": "external_tool",
                "standard": "Certora",
                "severity": "low",
                "title": "Certora configuration missing",
                "description": (
                    "To enable Certora, set CERTORA_SPEC_PATH and CERTORA_CONTRACT_NAME environment "
                    "variables and ensure `certoraRun` is installed."
                ),
            })
            return rules

        # Write code to temp file for certoraRun
        try:
            with tempfile.NamedTemporaryFile(mode="w", suffix=".sol", delete=False) as f:
                f.write(code)
                temp_file = f.name

            cmd = [
                "certoraRun",
                temp_file,
                "--verify",
                f"{contract_name}:{spec_path}",
            ]
            result = subprocess.run(
                cmd,
                capture_output=True,
                text=True,
                timeout=900,  # Certora proofs can be slow; keep modest but safe timeout
            )
        except FileNotFoundError:
            rules.append({
                "category": "external_tool",
                "standard": "Certora",
                "severity": "low",
                "title": "Certora not available",
                "description": (
                    "`certoraRun` was not found in PATH. Install Certora Prover and configure it "
                    "to enable formal verification."
                ),
            })
            return rules
        except subprocess.TimeoutExpired:
            rules.append({
                "category": "external_tool",
                "standard": "Certora",
                "severity": "medium",
                "title": "Certora run timed out",
                "description": "Certora Prover did not finish within the configured timeout.",
            })
            return rules
        finally:
            try:
                if "temp_file" in locals() and os.path.exists(temp_file):
                    os.unlink(temp_file)
            except Exception:
                pass

        # Interpret exit code: 0 usually means proofs succeeded, non‑zero means failure / violations.
        if result.returncode == 0:
            rules.append({
                "category": "external_tool",
                "standard": "Certora",
                "severity": "low",
                "title": "Certora verification completed",
                "description": (
                    "Certora Prover ran successfully for the configured specification. "
                    "Review the Certora report/logs for detailed properties and proofs."
                ),
                "details": {"stdout": result.stdout[-2000:]},  # tail to avoid huge payloads
            })
        else:
            rules.append({
                "category": "external_tool",
                "standard": "Certora",
                "severity": "high",
                "title": "Certora reported potential property violations",
                "description": (
                    "Certora Prover returned a non‑zero exit code. This usually indicates that "
                    "one or more specified properties could not be proven or were violated."
                ),
                "details": {
                    "exit_code": result.returncode,
                    "stdout": result.stdout[-2000:],
                    "stderr": result.stderr[-2000:],
                },
            })

        return rules

    def generate_report(self, code, slither_results, gpt_results):
        """Generate comprehensive audit report"""
        all_vulnerabilities = []
        
        # Add Slither results
        if 'issues' in slither_results:
            for issue in slither_results['issues']:
                all_vulnerabilities.append({
                    'source': 'Slither',
                    'severity': issue['severity'],
                    'title': issue['title'],
                    'description': issue['description'],
                    'line': issue['line'],
                    'fix': issue['fix']
                })
        
        # Add GPT results
        if 'vulnerabilities' in gpt_results:
            for vuln in gpt_results['vulnerabilities']:
                all_vulnerabilities.append({
                    'source': 'GPT-4',
                    'severity': vuln['severity'],
                    'title': vuln['title'],
                    'description': vuln['description'],
                    'line': vuln['line'],
                    'fix': vuln['fix']
                })
        
        # Calculate security score
        severity_weights = {'critical': 10, 'high': 7, 'medium': 4, 'low': 1}
        total_score = 100
        
        for vuln in all_vulnerabilities:
            weight = severity_weights.get(vuln['severity'], 1)
            total_score -= weight
        
        security_score = max(0, total_score)

        # Compliance / rules analysis (ERC standards + access control + KYC/AML heuristics)
        rules = self.analyze_compliance_rules(code)
        # Optional external tools (MythX, Certora) – append their findings if configured/available.
        try:
            rules.extend(self.analyze_with_mythx(code))
        except Exception:
            # Fail-soft: never break the whole audit because an external tool failed.
            rules.append({
                "category": "external_tool",
                "standard": "MythX",
                "severity": "low",
                "title": "MythX integration error",
                "description": "An unexpected error occurred while running MythX.",
            })
        try:
            rules.extend(self.analyze_with_certora(code))
        except Exception:
            rules.append({
                "category": "external_tool",
                "standard": "Certora",
                "severity": "low",
                "title": "Certora integration error",
                "description": "An unexpected error occurred while running Certora Prover.",
            })
        
        return {
            'security_score': security_score,
            'vulnerabilities': all_vulnerabilities,
            'gas_optimizations': gpt_results.get('gas_optimizations', []),
            'best_practices': gpt_results.get('best_practices', []),
            'rules': rules,
            'summary': {
                'total_issues': len(all_vulnerabilities),
                'critical_issues': len([v for v in all_vulnerabilities if v['severity'] == 'critical']),
                'high_issues': len([v for v in all_vulnerabilities if v['severity'] == 'high']),
                'medium_issues': len([v for v in all_vulnerabilities if v['severity'] == 'medium']),
                'low_issues': len([v for v in all_vulnerabilities if v['severity'] == 'low'])
            }
        }

auditor = SmartContractAuditor()

@app.route('/api/audit', methods=['POST'])
def audit_contract():
    try:
        data = request.get_json()
        code = data.get('code', '')
        
        if not code.strip():
            return jsonify({'error': 'No contract code provided'}), 400
        
        # Step 1: Syntax Analysis
        syntax_result = auditor.analyze_syntax(code)
        
        # Step 2: Slither Analysis
        slither_result = auditor.run_slither_analysis(code)
        
        # Step 3: GPT-4 Analysis
        gpt_result = auditor.analyze_with_gpt4(code)
        
        # Step 4: Generate Report
        report = auditor.generate_report(code, slither_result, gpt_result)
        
        return jsonify({
            'success': True,
            'report': report,
            'syntax': syntax_result,
            'processing_time': 1.8,  # Mock processing time
            'confidence': 92  # Mock confidence score
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({'status': 'healthy', 'timestamp': datetime.now().isoformat()})


@app.route('/api/audit-by-address', methods=['POST'])
def audit_by_address():
    try:
        data = request.get_json()
        address = data.get('address', '').strip()

        if not address:
            return jsonify({'error': 'No contract address provided'}), 400

        # Use Etherscan API to fetch verified source code
        etherscan_key = os.getenv('ETHERSCAN_API_KEY')
        if not etherscan_key or etherscan_key == 'your_etherscan_api_key_here':
            return jsonify({
                'error': 'ETHERSCAN_API_KEY not configured in backend environment',
                'message': 'To analyze contracts by address, you need to add ETHERSCAN_API_KEY to your backend/.env file. Get a free API key at https://etherscan.io/apis'
            }), 500

        # Fetch source from Etherscan (API V2 – V1 is deprecated)
        # Docs: https://docs.etherscan.io/v2-migration
        # We default to Ethereum mainnet (chainid=1)
        url = (
            'https://api.etherscan.io/v2/api'
            f'?chainid=1&module=contract&action=getsourcecode&address={address}&apikey={etherscan_key}'
        )
        r = requests.get(url, timeout=15)
        if r.status_code != 200:
            return jsonify({'error': 'Failed to fetch contract source from Etherscan'}), 502

        payload = r.json()

        # Etherscan V2 may not use the same "status" semantics as V1.
        # We primarily rely on the presence of a non-empty "result" array.
        result_list = payload.get('result')
        if not result_list or not isinstance(result_list, list):
            return jsonify({
                'error': 'Contract source not found or not verified on Etherscan',
                'message': f'The contract at address {address} is not verified on Etherscan or the Etherscan API did not return source code.',
                'etherscan_raw_response': payload,
                'suggestions': [
                    'Verify the contract on https://etherscan.io/verifyContract',
                    'Use a verified contract address (check on https://etherscan.io)',
                    'Or paste the Solidity code directly in the code editor instead'
                ]
            }), 404

        # Etherscan returns a list; take first result
        result = result_list[0]
        source_code = result.get('SourceCode', '')

        if not source_code:
            return jsonify({
                'error': 'Contract source empty or not verified on Etherscan',
                'message': f'The contract at address {address} exists but has no verified source code. Please use a verified contract or paste the code directly.',
                'suggestions': [
                    'Only verified contracts on Etherscan can be analyzed by address',
                    'You can paste the Solidity code directly in the code editor',
                    'Check if the contract is verified: https://etherscan.io/address/' + address
                ]
            }), 404

        # If SourceCode is wrapped (e.g., starts with '{'), try to extract plausible solidity text
        if source_code.strip().startswith('{'):
            try:
                parsed = json.loads(source_code)
                if 'sources' in parsed and isinstance(parsed['sources'], dict):
                    parts = []
                    for filename, meta in parsed['sources'].items():
                        content = meta.get('content') if isinstance(meta, dict) else ''
                        if content:
                            parts.append(content)
                    source_code = '\n\n'.join(parts)
            except Exception:
                pass

        # Now run the same audit pipeline as audit_contract
        syntax_result = auditor.analyze_syntax(source_code)
        slither_result = auditor.run_slither_analysis(source_code)
        gpt_result = auditor.analyze_with_gpt4(source_code)
        report = auditor.generate_report(source_code, slither_result, gpt_result)

        return jsonify({
            'success': True,
            'report': report,
            'syntax': syntax_result,
            'source': source_code
        }), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000) 