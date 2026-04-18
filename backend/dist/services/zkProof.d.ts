/**
 * MOCK ZK PROOF SERVICE FOR HACKATHON
 *
 * This service implements a mock ZK proof system that mirrors the API
 * of a real snarkjs-based zero-knowledge proof system. In production,
 * this would be replaced with actual circom circuits and snarkjs.
 *
 * WHAT THIS WOULD BE IN REAL CIRCOM:
 * - Circuit: RangeProof.circom
 * - Inputs: value (private), min/max bounds (public)
 * - Proof: Proves value is within range without revealing the actual value
 *
 * TRUSTED SETUP CEREMONY:
 * - Would require a multi-party ceremony with toxic waste generation
 * - Verification key would be published for public verification
 *
 * PRODUCTION UPGRADE:
 * 1. Install circom, snarkjs
 * 2. Write RangeProof.circom circuit
 * 3. Compile circuit: circom RangeProof.circom --r1cs --wasm
 * 4. Generate trusted setup: snarkjs powersoftau
 * 5. Export verification key: snarkjs zkey export verificationkey
 * 6. Replace mock functions with real snarkjs calls
 */
interface ZKProofRequest {
    credentialType: string;
    claim: {
        field: string;
        operator: 'gt' | 'lt' | 'eq';
        value: number;
    };
    privateInput: number;
}
interface ZKProof {
    proof: {
        pi_a: string[];
        pi_b: string[][];
        pi_c: string[];
    };
    publicSignals: string[];
    verificationKey: string;
    claimStatement: string;
    generatedAt: Date;
}
export declare class ZKProofService {
    /**
     * Generate a mock ZK proof
     * In production, this would call snarkjs.groth16.fullProve()
     */
    static generateProof(request: ZKProofRequest): Promise<ZKProof>;
    /**
     * Verify a mock ZK proof
     * In production, this would call snarkjs.groth16.verify()
     */
    static verifyProof(proof: ZKProof['proof'], publicSignals: string[], verificationKey: string): Promise<{
        valid: boolean;
        verifiedAt: Date;
    }>;
    private static evaluateClaim;
    private static generateClaimStatement;
}
export default ZKProofService;
//# sourceMappingURL=zkProof.d.ts.map