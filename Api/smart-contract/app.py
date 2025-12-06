import os
import re
import json
import tempfile
import subprocess
from datetime import datetime

import requests
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv

# optional LLM client (used for Solidity analysis if configured)
try:
    from openai import OpenAI
except Exception:
    OpenAI = None

load_dotenv()

app = Flask(__name__)
CORS(app)

OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")
OPENROUTER_MODEL = os.getenv("OPENROUTER_MODEL", "openrouter/openai/gpt-4o-mini")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
OPENAI_MODEL = os.getenv("OPENAI_MODEL", "gpt-4o-mini")

llm_client = None
LLM_MODEL = None
if OPENROUTER_API_KEY and OpenAI:
    llm_client = OpenAI(
        base_url="https://openrouter.ai/api/v1",
        api_key=OPENROUTER_API_KEY,
    )
    LLM_MODEL = OPENROUTER_MODEL
elif OPENAI_API_KEY and OpenAI:
    llm_client = OpenAI(api_key=OPENAI_API_KEY)
    LLM_MODEL = OPENAI_MODEL


class SmartContractAuditor:
    def __init__(self):
        pass

    # -------------------------
    # Solidity / EVM analysis
    # -------------------------
    def analyze_syntax(self, code, timeout=30):
        try:
            with tempfile.NamedTemporaryFile(mode="w", suffix=".sol", delete=False) as f:
                f.write(code)
                temp_file = f.name
            result = subprocess.run(
                ["solc", "--ast-json", temp_file],
                capture_output=True,
                text=True,
                timeout=timeout,
            )
        except FileNotFoundError:
            return {
                "valid": False,
                "errors": [
                    {
                        "type": "EnvironmentError",
                        "message": "Solidity compiler (solc) not found in PATH. Install solc to enable full grammar / type analysis.",
                        "source_location": None,
                    }
                ],
                "warnings": [],
            }
        except subprocess.TimeoutExpired:
            return {
                "valid": False,
                "errors": [
                    {"type": "Timeout", "message": "Solidity compiler (solc) timed out while analyzing the contract.", "source_location": None}
                ],
                "warnings": [],
            }
        except Exception as e:
            return {
                "valid": False,
                "errors": [{"type": "UnknownError", "message": str(e), "source_location": None}],
                "warnings": [],
            }
        finally:
            try:
                if "temp_file" in locals() and os.path.exists(temp_file):
                    os.unlink(temp_file)
            except Exception:
                pass

        def _parse_solc_messages(stderr: str):
            errors = []
            warnings = []
            for line in (stderr or "").splitlines():
                line = line.strip()
                if not line:
                    continue
                entry = {"type": "CompilerMessage", "message": line, "source_location": None}
                lower = line.lower()
                if "error" in lower:
                    entry["type"] = "Error"
                    errors.append(entry)
                elif "warning" in lower:
                    entry["type"] = "Warning"
                    warnings.append(entry)
                else:
                    warnings.append(entry)
            return errors, warnings

        errors, warnings = _parse_solc_messages(result.stderr or "")
        if result.returncode != 0:
            return {
                "valid": False,
                "errors": errors if errors else [{"type": "CompilationFailed", "message": result.stderr or "Unknown compiler error", "source_location": None}],
                "warnings": warnings,
            }
        return {"valid": True, "errors": [], "warnings": warnings}

    def run_slither_analysis(self, code, timeout=30):
        try:
            with tempfile.NamedTemporaryFile(mode="w", suffix=".sol", delete=False) as f:
                f.write(code)
                temp_file = f.name
            result = subprocess.run(['slither', temp_file, '--json', '-'], capture_output=True, text=True, timeout=timeout)
            os.unlink(temp_file)
            if result.returncode == 0:
                try:
                    slither_output = json.loads(result.stdout or "{}")
                    return self.parse_slither_results(slither_output)
                except json.JSONDecodeError:
                    return {'issues': [], 'error': 'Failed to parse Slither output'}
            else:
                return {'issues': [], 'error': result.stderr}
        except FileNotFoundError:
            return {'issues': [], 'error': 'Slither not found in PATH'}
        except subprocess.TimeoutExpired:
            return {'issues': [], 'error': 'Slither analysis timed out'}
        except Exception as e:
            return {'issues': [], 'error': str(e)}

    def parse_slither_results(self, slither_output):
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
        fixes = {
            'reentrancy': 'Use ReentrancyGuard modifier and follow checks-effects-interactions pattern',
            'unchecked-transfer': 'Check return values of external calls',
            'unchecked-low-level-call': 'Check return values of low-level calls',
            'unchecked-send': 'Check return values of send operations',
            'uninitialized-state': 'Initialize state variables in constructor',
            'uninitialized-local': 'Initialize local variables before use',
            'unused-return': 'Use return values or remove unused returns',
            'unused-state': 'Remove unused state variables',
            'costly-loop': 'Optimize loops to reduce gas costs',
            'dead-code': 'Remove dead code to reduce contract size'
        }
        return fixes.get(issue_type.lower(), 'Review and fix according to best practices')

    def analyze_with_gpt4(self, code):
        if not llm_client:
            return {"vulnerabilities": [], "gas_optimizations": [], "best_practices": [], "note": "LLM client not configured"}
        prompt = f"""Analyze this Solidity smart contract for security vulnerabilities and best practices. Provide a detailed analysis including:
1. Security vulnerabilities (critical, high, medium, low)
2. Gas optimization opportunities
3. Best practices violations
4. Specific line numbers and fixes

Contract code:
{code}

Return JSON with fields: vulnerabilities, gas_optimizations, best_practices
"""
        try:
            response = llm_client.chat.completions.create(
                model=LLM_MODEL,
                messages=[
                    {"role": "system", "content": "You are a smart contract security expert."},
                    {"role": "user", "content": prompt}
                ],
                max_tokens=2000,
                temperature=0.1,
            )
            try:
                content = response.choices[0].message.content
                gpt_analysis = json.loads(content)
                return gpt_analysis
            except Exception:
                return {"vulnerabilities": [], "gas_optimizations": [], "best_practices": [], "raw_response": getattr(response.choices[0].message, "content", str(response))}
        except Exception as e:
            return {"vulnerabilities": [], "gas_optimizations": [], "best_practices": [], "error": str(e)}

    # -------------------------
    # Hedera HTS token analysis
    # -------------------------
    def analyze_hts_token(self, token_id, mirror_node_url=None, timeout=10):
        mirror_node = mirror_node_url or os.getenv("HEDERA_MIRROR_NODE_URL", "https://testnet.mirrornode.hedera.com/api/v1")
        base_url = mirror_node.rstrip('/')
        token_url = f"{base_url}/tokens/{token_id}"
        try:
            r = requests.get(token_url, timeout=timeout)
        except Exception as e:
            return {"error": f"Failed to contact mirror node: {e}"}

        if r.status_code != 200:
            return {"error": f"Mirror node returned status {r.status_code}", "mirror_response": r.text}

        token = r.json()
        issues = []

        # Basic properties
        ttype = token.get('type') or token.get('token_type') or token.get('tokenType')
        total_supply = token.get('total_supply') or token.get('initial_supply') or token.get('totalSupply') or 0
        treasury = token.get('treasury_account_id') or token.get('treasuryAccountId')
        decimals = token.get('decimals')
        admin_key = token.get('admin_key')
        kyc_key = token.get('kyc_key')
        freeze_key = token.get('freeze_key')
        wipe_key = token.get('wipe_key')
        pause_key = token.get('pause_key')
        supply_key = token.get('supply_key')
        custom_fees = token.get('custom_fees') or token.get('fee_schedule_key') or token.get('feeScheduleKey')

        # Heuristics
        if ttype and 'NON_FUNGIBLE' in str(ttype).upper():
            issues.append({"severity": "low", "title": "NFT token type detected", "description": "Non-fungible token—review uniqueness and metadata storage."})

        if not treasury:
            issues.append({"severity": "high", "title": "No treasury account", "description": "Token does not list a treasury account; this is unusual and should be verified."})

        if not kyc_key:
            issues.append({"severity": "medium", "title": "No KYC key", "description": "Token has no KYC enforcement configured; transfers may not be controllable for compliance."})
        else:
            issues.append({"severity": "low", "title": "KYC key present", "description": "KYC enforcement is available; verify KYC governance."})

        if not freeze_key:
            issues.append({"severity": "low", "title": "No freeze key", "description": "Cannot freeze user balances. If freeze control is required, consider adding a freeze key."})

        if wipe_key:
            issues.append({"severity": "high", "title": "Wipe key present", "description": "Token can be wiped by authorized key. This allows removing user balances and poses custodial risk."})
        else:
            issues.append({"severity": "low", "title": "No wipe key", "description": "Wipe ability not present."})

        if not pause_key:
            issues.append({"severity": "low", "title": "No pause key", "description": "No ability to globally pause the token."})
        else:
            issues.append({"severity": "medium", "title": "Pause key present", "description": "Token can be paused; ensure pause governance is defined."})

        if not supply_key:
            issues.append({"severity": "low", "title": "Supply key absent or immutable supply", "description": "Token supply may be fixed; this can be desirable but confirm design."})
        else:
            issues.append({"severity": "medium", "title": "Supply key present", "description": "Authorized parties can mint/burn tokens. Verify keys and procedures."})

        if custom_fees:
            issues.append({"severity": "medium", "title": "Custom fees defined", "description": "Token defines custom fees. Review fee logic to ensure it does not create unexpected flows or denial-of-service via fees."})

        if isinstance(total_supply, int) and total_supply > 1_000_000_000:
            issues.append({"severity": "medium", "title": "Very high supply", "description": "Total supply is large; confirm tokenomics and potential inflation concerns."})

        # optional: fetch recent transactions summary for token transfers
        try:
            tx_url = f"{base_url}/tokens/{token_id}/transactions?limit=1"
            tr = requests.get(tx_url, timeout=timeout)
            if tr.status_code == 200:
                tx_payload = tr.json()
                if tx_payload.get("transactions") and len(tx_payload["transactions"]) > 0:
                    last_tx = tx_payload["transactions"][0]
                    issues.append({"severity": "info", "title": "Recent activity detected", "description": f"Last transaction: {last_tx.get('transaction_id')}"})
        except Exception:
            pass

        severity_map = {"critical": 10, "high": 7, "medium": 4, "low": 1, "info": 0}
        score = 100
        for i in issues:
            weight = severity_map.get(i.get("severity", "low"), 1)
            score -= weight
        score = max(0, score)

        rules = self.analyze_compliance_rules_for_hts(token)

        return {
            "token_id": token_id,
            "token": token,
            "issues": issues,
            "rules": rules,
            "security_score": score,
            "summary": {"total_issues": len(issues)}
        }

    def analyze_compliance_rules_for_hts(self, token):
        rules = []
        normalized = json.dumps(token).lower()
        if '"kyc_key": null' in normalized or '"kyc_key":' not in normalized:
            rules.append({
                "category": "kyc_aml",
                "severity": "medium",
                "title": "No KYC enforcement detected",
                "description": "Token lacks a KYC key; transfers cannot be restricted based on KYC."
            })
        else:
            rules.append({
                "category": "kyc_aml",
                "severity": "low",
                "title": "KYC key present",
                "description": "KYC key found; ensure processes to manage KYC are secure."
            })
        if '"wipe_key": null' in normalized or '"wipe_key":' not in normalized:
            rules.append({
                "category": "custody",
                "severity": "low",
                "title": "No wipe key",
                "description": "No wipe key—user balances cannot be arbitrarily removed."
            })
        else:
            rules.append({
                "category": "custody",
                "severity": "high",
                "title": "Wipe key present",
                "description": "A wipe key exists; this allows custodial removal of balances and may have privacy/operational impacts."
            })
        return rules

    # -------------------------
    # Report generation (unified)
    # -------------------------
    def generate_report(self, code=None, slither_results=None, gpt_results=None, hts_report=None):
        if hts_report:
            return hts_report

        all_vulnerabilities = []
        if slither_results and 'issues' in slither_results:
            for issue in slither_results['issues']:
                all_vulnerabilities.append({
                    'source': 'Slither',
                    'severity': issue.get('severity', 'medium'),
                    'title': issue.get('title'),
                    'description': issue.get('description'),
                    'line': issue.get('line'),
                    'fix': issue.get('fix'),
                })

        if gpt_results and 'vulnerabilities' in gpt_results:
            for vuln in gpt_results['vulnerabilities']:
                all_vulnerabilities.append({
                    'source': 'GPT-4',
                    'severity': vuln.get('severity', 'low'),
                    'title': vuln.get('title'),
                    'description': vuln.get('description'),
                    'line': vuln.get('line'),
                    'fix': vuln.get('fix'),
                })

        severity_weights = {'critical': 10, 'high': 7, 'medium': 4, 'low': 1}
        total_score = 100
        for vuln in all_vulnerabilities:
            weight = severity_weights.get(vuln.get('severity', 'low'), 1)
            total_score -= weight
        security_score = max(0, total_score)

        rules = []
        try:
            rules = self.analyze_compliance_rules(code or "")
        except Exception:
            rules = []

        return {
            'security_score': security_score,
            'vulnerabilities': all_vulnerabilities,
            'gas_optimizations': (gpt_results.get('gas_optimizations') if gpt_results else []),
            'best_practices': (gpt_results.get('best_practices') if gpt_results else []),
            'rules': rules,
            'summary': {
                'total_issues': len(all_vulnerabilities),
                'critical_issues': len([v for v in all_vulnerabilities if v['severity'] == 'critical']),
                'high_issues': len([v for v in all_vulnerabilities if v['severity'] == 'high']),
                'medium_issues': len([v for v in all_vulnerabilities if v['severity'] == 'medium']),
                'low_issues': len([v for v in all_vulnerabilities if v['severity'] == 'low']),
            }
        }

    # Reuse earlier ERC/compliance function from user's original flow with small tweaks
    def analyze_compliance_rules(self, code: str):
        rules = []
        normalized = code.lower()
        erc20_signatures = [
            "function totalsupply(", "function balanceof(", "function transfer(", "function transferfrom(",
            "function approve(", "function allowance(", "event transfer(", "event approval(",
        ]
        erc20_hits = [sig for sig in erc20_signatures if sig in normalized]
        if erc20_hits:
            missing = [sig for sig in erc20_signatures if sig not in normalized]
            if missing:
                rules.append({
                    "category": "erc_standard",
                    "standard": "ERC20",
                    "severity": "medium",
                    "title": "Partial ERC20 interface detected",
                    "description": "Some ERC20 functions detected but others are missing.",
                    "details": {"present": erc20_hits, "missing": missing},
                })
            else:
                rules.append({
                    "category": "erc_standard",
                    "standard": "ERC20",
                    "severity": "low",
                    "title": "ERC20 interface detected",
                    "description": "Contract exposes core ERC20 interface elements.",
                })
        erc721_signatures = ["function ownerof(", "function safetransferfrom(", "function transferfrom(", "event transfer(", "event approval("]
        erc721_hits = [sig for sig in erc721_signatures if sig in normalized]
        if erc721_hits:
            rules.append({
                "category": "erc_standard",
                "standard": "ERC721",
                "severity": "low",
                "title": "ERC721-like interface detected",
                "description": "The contract exposes ERC721-like functions/events.",
                "details": {"present": erc721_hits},
            })
        sensitive_patterns = [r"function\s+mint\s*\(", r"function\s+burn\s*\(", r"function\s+pause\s*\("]
        uses_oz_access = "@openzeppelin" in normalized or "openzeppelin/contracts/access" in normalized
        has_only_owner = "onlyowner" in normalized
        has_access_control = "accesscontrol" in normalized
        for pattern in sensitive_patterns:
            for match in re.finditer(pattern, code, flags=re.IGNORECASE):
                line_no = code[: match.start()].count("\n") + 1
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
                        "description": "Sensitive function is not obviously protected by an access-control modifier.",
                        "line": line_no,
                        "details": {"signature": signature_line.strip(), "hint": "Consider OpenZeppelin Ownable / AccessControl."},
                    })
        if uses_oz_access or has_only_owner or has_access_control:
            rules.append({
                "category": "access_control",
                "standard": "OpenZeppelin",
                "severity": "low",
                "title": "Access control pattern detected",
                "description": "Contract appears to use OpenZeppelin-style access control.",
            })
        has_blacklist = "blacklist" in normalized or "blocked" in normalized
        has_whitelist = "whitelist" in normalized or "kyc" in normalized
        has_pause = "pause" in normalized or "paused" in normalized
        if not (has_blacklist or has_whitelist or has_pause):
            rules.append({
                "category": "kyc_aml",
                "severity": "medium",
                "title": "No explicit transfer restrictions detected",
                "description": "No blacklist/whitelist/pausable mechanics detected.",
            })
        else:
            rules.append({
                "category": "kyc_aml",
                "severity": "low",
                "title": "Basic restriction mechanics detected",
                "description": "Blacklists/whitelists/pausable logic found; ensure consistent enforcement.",
                "details": {"blacklist": has_blacklist, "whitelist": has_whitelist, "pause": has_pause},
            })
        return rules


auditor = SmartContractAuditor()


@app.route('/api/audit', methods=['POST'])
def audit_contract_or_token():
    try:
        data = request.get_json() or {}
        # If user passed Solidity code
        code = data.get('code', '') or data.get('solidity_code', '')
        token_id = data.get('token_id') or data.get('hedera_token') or data.get('hts_token')
        address = data.get('address')  # ethereum address for etherscan flow

        if code and code.strip():
            syntax_result = auditor.analyze_syntax(code)
            slither_result = auditor.run_slither_analysis(code)
            gpt_result = auditor.analyze_with_gpt4(code)
            report = auditor.generate_report(code, slither_result, gpt_result, hts_report=None)
            return jsonify({'success': True, 'report': report, 'syntax': syntax_result}), 200

        if token_id:
            hts_report = auditor.analyze_hts_token(token_id)
            return jsonify({'success': True, 'report': hts_report}), 200

        if address:
            # fallback: use the Ethereum address Etherscan flow from previous app
            etherscan_key = os.getenv('ETHERSCAN_API_KEY')
            if not etherscan_key:
                return jsonify({'error': 'ETHERSCAN_API_KEY not configured in backend environment'}), 500
            url = ('https://api.etherscan.io/v2/api'
                   f'?chainid=1&module=contract&action=getsourcecode&address={address}&apikey={etherscan_key}')
            r = requests.get(url, timeout=15)
            if r.status_code != 200:
                return jsonify({'error': 'Failed to fetch contract source from Etherscan'}), 502
            payload = r.json()
            result_list = payload.get('result', [])
            if not result_list:
                return jsonify({'error': 'Contract source not found or not verified on Etherscan', 'etherscan_raw_response': payload}), 404
            result = result_list[0]
            source_code = result.get('SourceCode', '') or result.get('sourceCode', '')
            if not source_code:
                return jsonify({'error': 'Contract source empty or not verified on Etherscan'}), 404
            if source_code.strip().startswith('{'):
                try:
                    parsed = json.loads(source_code)
                    parts = []
                    for filename, meta in parsed.get('sources', {}).items():
                        content = meta.get('content') if isinstance(meta, dict) else ''
                        if content:
                            parts.append(content)
                    source_code = '\n\n'.join(parts)
                except Exception:
                    pass
            syntax_result = auditor.analyze_syntax(source_code)
            slither_result = auditor.run_slither_analysis(source_code)
            gpt_result = auditor.analyze_with_gpt4(source_code)
            report = auditor.generate_report(source_code, slither_result, gpt_result, hts_report=None)
            return jsonify({'success': True, 'report': report, 'syntax': syntax_result, 'source': source_code}), 200

        return jsonify({'error': 'No input provided. Send either "code" (Solidity) or "token_id" (Hedera HTS) or "address" (Ethereum)'}), 400
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/audit-hts', methods=['POST'])
def audit_hts_endpoint():
    try:
        data = request.get_json() or {}
        token_id = data.get('token_id') or data.get('hedera_token') or data.get('hts_token')
        if not token_id:
            return jsonify({'error': 'No token_id provided'}), 400
        report = auditor.analyze_hts_token(token_id)
        return jsonify({'success': True, 'report': report}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({'status': 'healthy', 'timestamp': datetime.utcnow().isoformat() + 'Z'})


if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=int(os.getenv('PORT', 5000)))
