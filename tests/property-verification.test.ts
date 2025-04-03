import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock the blockchain environment
const mockBlockchain = {
  currentBlockHeight: 100,
  accounts: {
    deployer: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM',
    verifier1: 'ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG',
    verifier2: 'ST3AMFNNS7PJ75BQBMJ7JJHJD0XJMZSD4KSMY8YS',
    propertyOwner1: 'ST2JHG361ZXG51QTHN86ICQE9SQB3SMNTX5JCHPD',
    propertyOwner2: 'ST2REHHS5J3CERCRBEPMGH7921Q6PYKAADT7JP2VB'
  }
};

// Mock the property verification contract
const mockPropertyVerificationContract = {
  // Contract functions
  initializeContract: vi.fn(() => ({ type: 'ok', value: true })),
  addVerifier: vi.fn(() => ({ type: 'ok', value: true })),
  removeVerifier: vi.fn(() => ({ type: 'ok', value: true })),
  registerProperty: vi.fn(() => ({ type: 'ok', value: true })),
  verifyProperty: vi.fn(() => ({ type: 'ok', value: true })),
  rejectProperty: vi.fn(() => ({ type: 'ok', value: true })),
  
  // Read-only functions
  getPropertyDetails: vi.fn(() => ({
    type: 'ok',
    value: {
      status: 1,
      'legal-owner': mockBlockchain.accounts.propertyOwner1,
      address: '123 Main St, New York, NY 10001',
      'last-inspection-date': 100,
      'verified-by': mockBlockchain.accounts.verifier1
    }
  })),
  isPropertyVerified: vi.fn(() => ({ type: 'ok', value: true })),
  
  // Error responses
  errorUnauthorized: vi.fn(() => ({ type: 'err', value: 101 })),
  errorAlreadyExists: vi.fn(() => ({ type: 'err', value: 102 })),
  errorNotFound: vi.fn(() => ({ type: 'err', value: 104 }))
};

// Mock the contract call context
const mockContractContext = {
  caller: mockBlockchain.accounts.deployer,
  setCaller: function(caller) {
    this.caller = caller;
    return this;
  }
};

describe('Property Verification Contract Tests', () => {
  beforeEach(() => {
    // Reset all mocks before each test
    vi.clearAllMocks();
    
    // Reset the caller to deployer
    mockContractContext.setCaller(mockBlockchain.accounts.deployer);
  });
  
  describe('Contract Initialization', () => {
    it('should successfully initialize the contract', () => {
      const result = mockPropertyVerificationContract.initializeContract();
      
      expect(result.type).toBe('ok');
      expect(result.value).toBe(true);
      expect(mockPropertyVerificationContract.initializeContract).toHaveBeenCalledTimes(1);
    });
  });
  
  describe('Verifier Management', () => {
    it('should add a verifier when called by the contract owner', () => {
      const result = mockPropertyVerificationContract.addVerifier(mockBlockchain.accounts.verifier1);
      
      expect(result.type).toBe('ok');
      expect(result.value).toBe(true);
      expect(mockPropertyVerificationContract.addVerifier).toHaveBeenCalledWith(mockBlockchain.accounts.verifier1);
    });
    
    it('should fail to add a verifier when called by non-owner', () => {
      // Set caller to non-owner
      mockContractContext.setCaller(mockBlockchain.accounts.verifier1);
      mockPropertyVerificationContract.addVerifier.mockReturnValueOnce(
          mockPropertyVerificationContract.errorUnauthorized()
      );
      
      const result = mockPropertyVerificationContract.addVerifier(mockBlockchain.accounts.verifier2);
      
      expect(result.type).toBe('err');
      expect(result.value).toBe(101); // Unauthorized error
    });
    
    it('should remove a verifier when called by the contract owner', () => {
      const result = mockPropertyVerificationContract.removeVerifier(mockBlockchain.accounts.verifier1);
      
      expect(result.type).toBe('ok');
      expect(result.value).toBe(true);
      expect(mockPropertyVerificationContract.removeVerifier).toHaveBeenCalledWith(mockBlockchain.accounts.verifier1);
    });
    
    it('should fail to remove a verifier when called by non-owner', () => {
      // Set caller to non-owner
      mockContractContext.setCaller(mockBlockchain.accounts.verifier1);
      mockPropertyVerificationContract.removeVerifier.mockReturnValueOnce(
          mockPropertyVerificationContract.errorUnauthorized()
      );
      
      const result = mockPropertyVerificationContract.removeVerifier(mockBlockchain.accounts.verifier2);
      
      expect(result.type).toBe('err');
      expect(result.value).toBe(101); // Unauthorized error
    });
  });
  
  describe('Property Registration', () => {
    const propertyId = '123e4567-e89b-12d3-a456-426614174000';
    const propertyAddress = '123 Main St, New York, NY 10001';
    
    it('should register a new property successfully', () => {
      mockContractContext.setCaller(mockBlockchain.accounts.propertyOwner1);
      
      const result = mockPropertyVerificationContract.registerProperty(propertyId, propertyAddress);
      
      expect(result.type).toBe('ok');
      expect(result.value).toBe(true);
      expect(mockPropertyVerificationContract.registerProperty).toHaveBeenCalledWith(propertyId, propertyAddress);
    });
    
    it('should fail to register a property that already exists', () => {
      mockContractContext.setCaller(mockBlockchain.accounts.propertyOwner1);
      mockPropertyVerificationContract.registerProperty.mockReturnValueOnce(
          mockPropertyVerificationContract.errorAlreadyExists()
      );
      
      const result = mockPropertyVerificationContract.registerProperty(propertyId, propertyAddress);
      
      expect(result.type).toBe('err');
      expect(result.value).toBe(102); // Already exists error
    });
  });
  
  describe('Property Verification', () => {
    const propertyId = '123e4567-e89b-12d3-a456-426614174000';
    const rejectionReason = 'Property documents are incomplete';
    
    it('should verify a property when called by an authorized verifier', () => {
      mockContractContext.setCaller(mockBlockchain.accounts.verifier1);
      
      const result = mockPropertyVerificationContract.verifyProperty(propertyId);
      
      expect(result.type).toBe('ok');
      expect(result.value).toBe(true);
      expect(mockPropertyVerificationContract.verifyProperty).toHaveBeenCalledWith(propertyId);
    });
    
    it('should fail to verify a property when called by an unauthorized user', () => {
      mockContractContext.setCaller(mockBlockchain.accounts.propertyOwner1);
      mockPropertyVerificationContract.verifyProperty.mockReturnValueOnce(
          mockPropertyVerificationContract.errorUnauthorized()
      );
      
      const result = mockPropertyVerificationContract.verifyProperty(propertyId);
      
      expect(result.type).toBe('err');
      expect(result.value).toBe(101); // Unauthorized error
    });
    
    it('should fail to verify a property that does not exist', () => {
      mockContractContext.setCaller(mockBlockchain.accounts.verifier1);
      mockPropertyVerificationContract.verifyProperty.mockReturnValueOnce(
          mockPropertyVerificationContract.errorNotFound()
      );
      
      const result = mockPropertyVerificationContract.verifyProperty('non-existent-property');
      
      expect(result.type).toBe('err');
      expect(result.value).toBe(104); // Not found error
    });
    
    it('should reject a property when called by an authorized verifier', () => {
      mockContractContext.setCaller(mockBlockchain.accounts.verifier1);
      
      const result = mockPropertyVerificationContract.rejectProperty(propertyId, rejectionReason);
      
      expect(result.type).toBe('ok');
      expect(result.value).toBe(true);
      expect(mockPropertyVerificationContract.rejectProperty).toHaveBeenCalledWith(propertyId, rejectionReason);
    });
  });
  
  describe('Property Information Retrieval', () => {
    const propertyId = '123e4567-e89b-12d3-a456-426614174000';
    
    it('should get property details', () => {
      const result = mockPropertyVerificationContract.getPropertyDetails(propertyId);
      
      expect(result.type).toBe('ok');
      expect(result.value).toHaveProperty('status');
      expect(result.value).toHaveProperty('legal-owner');
      expect(result.value).toHaveProperty('address');
      expect(result.value).toHaveProperty('last-inspection-date');
      expect(result.value).toHaveProperty('verified-by');
      expect(mockPropertyVerificationContract.getPropertyDetails).toHaveBeenCalledWith(propertyId);
    });
    
    it('should check if a property is verified', () => {
      const result = mockPropertyVerificationContract.isPropertyVerified(propertyId);
      
      expect(result.type).toBe('ok');
      expect(result.value).toBe(true);
      expect(mockPropertyVerificationContract.isPropertyVerified).toHaveBeenCalledWith(propertyId);
    });
    
    it('should return false for non-existent property verification check', () => {
      mockPropertyVerificationContract.isPropertyVerified.mockReturnValueOnce({ type: 'ok', value: false });
      
      const result = mockPropertyVerificationContract.isPropertyVerified('non-existent-property');
      
      expect(result.type).toBe('ok');
      expect(result.value).toBe(false);
    });
  });
  
  describe('Integration Scenarios', () => {
    const propertyId = '123e4567-e89b-12d3-a456-426614174000';
    const propertyAddress = '123 Main St, New York, NY 10001';
    
    it('should follow the complete property verification flow', () => {
      // 1. Register a property
      mockContractContext.setCaller(mockBlockchain.accounts.propertyOwner1);
      let result = mockPropertyVerificationContract.registerProperty(propertyId, propertyAddress);
      expect(result.type).toBe('ok');
      
      // 2. Add a verifier
      mockContractContext.setCaller(mockBlockchain.accounts.deployer);
      result = mockPropertyVerificationContract.addVerifier(mockBlockchain.accounts.verifier1);
      expect(result.type).toBe('ok');
      
      // 3. Verify the property
      mockContractContext.setCaller(mockBlockchain.accounts.verifier1);
      result = mockPropertyVerificationContract.verifyProperty(propertyId);
      expect(result.type).toBe('ok');
      
      // 4. Check if property is verified
      result = mockPropertyVerificationContract.isPropertyVerified(propertyId);
      expect(result.type).toBe('ok');
      expect(result.value).toBe(true);
      
      // 5. Get property details
      result = mockPropertyVerificationContract.getPropertyDetails(propertyId);
      expect(result.type).toBe('ok');
      expect(result.value.status).toBe(1); // Verified status
      expect(result.value['verified-by']).toBe(mockBlockchain.accounts.verifier1);
    });
    
    it('should follow the property rejection flow', () => {
      // 1. Register a property
      mockContractContext.setCaller(mockBlockchain.accounts.propertyOwner2);
      const propertyId2 = '223e4567-e89b-12d3-a456-426614174001';
      const propertyAddress2 = '456 Oak St, San Francisco, CA 94102';
      let result = mockPropertyVerificationContract.registerProperty(propertyId2, propertyAddress2);
      expect(result.type).toBe('ok');
      
      // 2. Reject the property
      mockContractContext.setCaller(mockBlockchain.accounts.verifier1);
      const rejectionReason = 'Property documents are incomplete';
      result = mockPropertyVerificationContract.rejectProperty(propertyId2, rejectionReason);
      expect(result.type).toBe('ok');
      
      // 3. Check property details after rejection
      mockPropertyVerificationContract.getPropertyDetails.mockReturnValueOnce({
        type: 'ok',
        value: {
          status: 2, // Rejected status
          'legal-owner': mockBlockchain.accounts.propertyOwner2,
          address: propertyAddress2,
          'last-inspection-date': 100,
          'verified-by': mockBlockchain.accounts.verifier1
        }
      });
      
      result = mockPropertyVerificationContract.getPropertyDetails(propertyId2);
      expect(result.type).toBe('ok');
      expect(result.value.status).toBe(2); // Rejected status
    });
  });
});
